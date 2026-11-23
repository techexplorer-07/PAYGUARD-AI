"""End-to-End Integration Tests for PAYGUARD AI Payment Protection Pipeline.

Validates the full multi-engine orchestration API:
POST /api/v1/payment-protection/evaluate

Covers:
- Scenario A: Ordinary payment (Matching communication, established beneficiary, normal history).
- Scenario B: Recipient diversion (Impostor VPA mismatch against communication intent).
- Scenario C: Behavioural anomaly (Surge amount deviation with first-time beneficiary).
- Scenario D: Suspicious recipient (SPEG evidence graph with multiple reported cases).
- Scenario E: Insufficient evidence (Cold-start customer and unobserved recipient).
- Security: Customer consent validation and disclaimer presence.
- Invariant & Trust verification across all combined engines.
"""

from datetime import datetime, timedelta, timezone
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.behavioural import HistoricalTransaction
from app.schemas.correlation import ComparisonStatus, SimulatedTransaction
from app.schemas.payment_protection import (
    InterventionSeverity,
    InterventionType,
    PaymentProtectionRequest,
    PaymentProtectionResponse,
)
from app.schemas.recipient import (
    EvidenceEdge,
    EvidenceNode,
    EvidenceNodeType,
    EvidenceRelationshipType,
    EvidenceStatus,
    SPEGGraphInput,
    TrustedVerificationAuthority,
)
from app.schemas.unified_risk import UnifiedRecommendedAction, UnifiedRiskLevel
from app.services.payment_protection_orchestrator import orchestrate_payment_protection
from app.services.speg_graph_builder import build_speg_graph, verify_evidence_edge

client = TestClient(app)

BASE_TIME = datetime(2026, 11, 23, 14, 0, tzinfo=timezone.utc)


def _make_sample_history(
    customer_id: str,
    beneficiary_id: str,
    amounts: list[float],
    base_time: datetime = BASE_TIME,
) -> list[HistoricalTransaction]:
    """Helper to generate valid historical transactions."""
    history = []
    for i, amt in enumerate(amounts):
        history.append(
            HistoricalTransaction(
                transaction_id=f"HIST-{customer_id}-{i+1:03d}",
                customer_id=customer_id,
                amount=Decimal(str(amt)),
                currency="INR",
                beneficiary_id=beneficiary_id,
                payment_method="UPI",
                transaction_timestamp=base_time - timedelta(days=len(amounts) - i, hours=i),
            )
        )
    return history


# =====================================================================
# 1. SCENARIO A — ORDINARY PAYMENT
# =====================================================================


def test_scenario_a_ordinary_payment():
    """Matching communication, known established beneficiary, and normal baseline history."""
    customer_id = "CUST-ALICE-1"
    recipient_id = "grocery@okaxis"
    history = _make_sample_history(
        customer_id=customer_id,
        beneficiary_id=recipient_id,
        amounts=[450.0, 500.0, 520.0, 480.0, 510.0, 490.0, 530.0, 470.0, 500.0, 515.0],
    )

    request = PaymentProtectionRequest(
        customer_consent=True,
        communication_text="Please pay Rs 500 to grocery@okaxis for weekly groceries.",
        simulated_transaction=SimulatedTransaction(
            amount=500.0,
            currency="INR",
            recipient_id=recipient_id,
            transaction_reference="TX-ORD-001",
        ),
        customer_id=customer_id,
        historical_transactions=history,
        as_of=BASE_TIME,
    )

    response = orchestrate_payment_protection(request)

    # 1. Engine outputs present
    assert response.intent_assessment is not None
    assert response.behavioural_assessment is not None
    assert response.intent_assessment.comparison.recipient_status == ComparisonStatus.MATCH
    assert response.intent_assessment.comparison.amount_status == ComparisonStatus.MATCH

    # 2. Risk level is LOW
    assert response.unified_risk_assessment.risk_level == UnifiedRiskLevel.LOW
    assert response.unified_risk_assessment.overall_risk_score < Decimal("0.3000")

    # 3. Intervention is ALLOW_WITH_CAUTION / PERMIT
    assert response.intervention_recommendation.action == UnifiedRecommendedAction.ALLOW_WITH_CAUTION
    assert response.intervention_recommendation.severity == InterventionSeverity.LOW
    assert response.intervention_recommendation.simulated_action_code == "PERMIT"
    assert response.intervention_recommendation.simulated_intervention_active is True

    # 4. Epistemic disclaimer present
    assert "simulation only" in response.disclaimer.lower()


# =====================================================================
# 2. SCENARIO B — RECIPIENT DIVERSION
# =====================================================================


def test_scenario_b_recipient_diversion():
    """Communication requests one recipient, but simulated payment directs funds to an impostor."""
    customer_id = "CUST-BOB-2"
    history = _make_sample_history(
        customer_id=customer_id,
        beneficiary_id="powercorp@billdesk",
        amounts=[1200.0, 1150.0, 1250.0, 1300.0, 1180.0],
    )

    request = PaymentProtectionRequest(
        customer_consent=True,
        communication_text="Urgent: Your electricity bill is due. Pay Rs 1200 to powercorp@billdesk immediately.",
        simulated_transaction=SimulatedTransaction(
            amount=1200.0,
            currency="INR",
            recipient_id="scam_collector@attacker",
            transaction_reference="TX-DIV-002",
        ),
        customer_id=customer_id,
        historical_transactions=history,
        as_of=BASE_TIME,
    )

    response = orchestrate_payment_protection(request)

    # 1. Intent engine identifies recipient mismatch
    assert response.intent_assessment is not None
    assert response.intent_assessment.comparison.recipient_status == ComparisonStatus.MISMATCH

    # 2. Invariant A triggers: destination diversion override enforces HIGH risk
    assert response.unified_risk_assessment.risk_level == UnifiedRiskLevel.HIGH
    assert response.unified_risk_assessment.overall_risk_score >= Decimal("0.7500")
    assert "DESTINATION_INTENT_DIVERGENCE_OVERRIDE" in response.unified_risk_assessment.detected_indicators

    # 3. Intervention recommends PAUSE_AND_VERIFY / SIMULATED_PAYMENT_HOLD
    assert response.intervention_recommendation.action == UnifiedRecommendedAction.PAUSE_AND_VERIFY
    assert response.intervention_recommendation.severity == InterventionSeverity.HIGH
    assert response.intervention_recommendation.intervention_type == InterventionType.SIMULATED_PAYMENT_HOLD
    assert response.intervention_recommendation.simulated_action_code == "PAUSE_HOLD_SIMULATION"
    assert any("Intent-Behavioural Contradiction" in c for c in response.unified_risk_assessment.conflicting_signals)


# =====================================================================
# 3. SCENARIO C — BEHAVIOURAL ANOMALY
# =====================================================================


def test_scenario_c_behavioural_anomaly():
    """Unusually large transaction combined with a first-time beneficiary."""
    customer_id = "CUST-CHARLIE-3"
    # Historical median is ~200 INR with regular beneficiaries
    history = _make_sample_history(
        customer_id=customer_id,
        beneficiary_id="tea_stall@upi",
        amounts=[180.0, 200.0, 220.0, 190.0, 210.0, 195.0, 205.0, 200.0, 215.0, 185.0],
    )

    # Attempting 50,000 INR to an unknown first-time recipient
    request = PaymentProtectionRequest(
        customer_consent=True,
        communication_text="Sending advance payment of Rs 50000 to new_contractor@axis.",
        simulated_transaction=SimulatedTransaction(
            amount=50000.0,
            currency="INR",
            recipient_id="new_contractor@axis",
            transaction_reference="TX-ANOM-003",
        ),
        customer_id=customer_id,
        historical_transactions=history,
        as_of=BASE_TIME,
    )

    response = orchestrate_payment_protection(request)

    # 1. Behavioural scorer identifies high amount deviation and new beneficiary
    assert response.behavioural_assessment is not None
    assert response.behavioural_assessment.risk_level.value == "HIGH"
    assert "NEW_BENEFICIARY" in response.behavioural_assessment.detected_indicators

    # 2. Risk score is elevated (score >= 0.3500)
    assert response.unified_risk_assessment.overall_risk_score >= Decimal("0.3500")
    assert response.unified_risk_assessment.risk_level in (UnifiedRiskLevel.MEDIUM, UnifiedRiskLevel.HIGH)

    # 3. Intervention is STEP_UP_VERIFICATION (CHALLENGE_BIOMETRIC), WARN_CUSTOMER, or PAUSE_AND_VERIFY
    assert response.intervention_recommendation.action in (
        UnifiedRecommendedAction.STEP_UP_VERIFICATION,
        UnifiedRecommendedAction.WARN_CUSTOMER,
        UnifiedRecommendedAction.PAUSE_AND_VERIFY,
    )
    assert response.intervention_recommendation.severity in (InterventionSeverity.MEDIUM, InterventionSeverity.HIGH)
    assert any("NEW_BENEFICIARY" in r or "baseline" in r.lower() or "intent" in r.lower() for r in response.intervention_recommendation.rationale)


# =====================================================================
# 4. SCENARIO D — SUSPICIOUS RECIPIENT IN SPEG
# =====================================================================


def test_scenario_d_suspicious_recipient_in_speg():
    """Recipient has multiple reported fraud complaint associations in the SPEG graph."""
    graph_id = "SPEG-SCENARIO-D"
    recipient_vpa = "mule_drop@paytm"

    # Seed SPEG graph with multiple reported fraud incidents
    nodes = [
        EvidenceNode(
            node_id=recipient_vpa,
            node_type=EvidenceNodeType.BENEFICIARY,
            display_label="Mule Drop Beneficiary",
            synthetic_identifier=recipient_vpa,
            created_at=BASE_TIME - timedelta(days=10),
        ),
        EvidenceNode(
            node_id="CASE-FRAUD-101",
            node_type=EvidenceNodeType.FRAUD_CASE,
            display_label="Fraud Incident 101",
            synthetic_identifier="CASE-101",
            created_at=BASE_TIME - timedelta(days=5),
        ),
        EvidenceNode(
            node_id="CASE-FRAUD-102",
            node_type=EvidenceNodeType.FRAUD_CASE,
            display_label="Fraud Incident 102",
            synthetic_identifier="CASE-102",
            created_at=BASE_TIME - timedelta(days=3),
        ),
    ]
    edges = [
        EvidenceEdge(
            edge_id="E-REP-101",
            source_node_id=recipient_vpa,
            target_node_id="CASE-FRAUD-101",
            relationship_type=EvidenceRelationshipType.REPORTED_IN_CASE,
            evidence_status=EvidenceStatus.REPORTED,
            source_reference="USER_PORTAL_COMPLAINT_101",
            observed_at=BASE_TIME - timedelta(days=3),
            description="Victim reported non-delivery after UPI transfer.",
        ),
        EvidenceEdge(
            edge_id="E-REP-102",
            source_node_id=recipient_vpa,
            target_node_id="CASE-FRAUD-102",
            relationship_type=EvidenceRelationshipType.REPORTED_IN_CASE,
            evidence_status=EvidenceStatus.REPORTED,
            source_reference="USER_PORTAL_COMPLAINT_102",
            observed_at=BASE_TIME - timedelta(days=1),
            description="Second victim reported impersonation scam.",
        ),
    ]

    build_speg_graph(SPEGGraphInput(nodes=nodes, edges=edges), graph_id=graph_id)

    customer_id = "CUST-DAVE-4"
    history = _make_sample_history(
        customer_id=customer_id,
        beneficiary_id="trusted_merchant@upi",
        amounts=[1000.0, 1050.0, 980.0],
    )

    request = PaymentProtectionRequest(
        customer_consent=True,
        communication_text="Please transfer Rs 1000 to mule_drop@paytm for processing fee.",
        simulated_transaction=SimulatedTransaction(
            amount=1000.0,
            currency="INR",
            recipient_id=recipient_vpa,
            transaction_reference="TX-SCAM-004",
        ),
        customer_id=customer_id,
        historical_transactions=history,
        graph_id=graph_id,
        as_of=BASE_TIME,
    )

    response = orchestrate_payment_protection(request)

    # 1. Recipient engine executes and finds reported evidence
    assert response.recipient_assessment is not None
    assert response.recipient_assessment.recipient_risk_score > Decimal("0.0000")
    assert any("REPORTED" in ind for ind in response.recipient_assessment.detected_indicators)

    # 2. Recipient evidence is preserved in unified supporting evidence
    recip_evidence = [e for e in response.unified_risk_assessment.supporting_evidence if e.engine_source == "RECIPIENT"]
    assert len(recip_evidence) >= 2

    # 3. Action is caution/warning or step-up
    assert response.intervention_recommendation.action in (
        UnifiedRecommendedAction.WARN_CUSTOMER,
        UnifiedRecommendedAction.STEP_UP_VERIFICATION,
        UnifiedRecommendedAction.PAUSE_AND_VERIFY,
    )
    assert response.intervention_recommendation.severity in (InterventionSeverity.MEDIUM, InterventionSeverity.HIGH)


# =====================================================================
# 5. SCENARIO E — INSUFFICIENT EVIDENCE
# =====================================================================


def test_scenario_e_insufficient_evidence():
    """Cold-start customer and unobserved recipient: missing data handled transparently without false safety claims."""
    request = PaymentProtectionRequest(
        customer_consent=True,
        communication_text=None,  # No communication text submitted
        simulated_transaction=SimulatedTransaction(
            amount=500.0,
            currency="INR",
            recipient_id="first_time_recipient@bank",
            transaction_reference="TX-COLD-005",
        ),
        customer_id="CUST-NEWBIE",
        historical_transactions=None,  # No history submitted
        as_of=BASE_TIME,
    )

    response = orchestrate_payment_protection(request)

    # 1. Intent and Behavioural are explicitly None / Not evaluated
    assert response.intent_assessment is None
    assert response.behavioural_assessment is None
    assert response.recipient_assessment is None

    # 2. Data sufficiency is INSUFFICIENT and risk is UNCERTAIN
    assert response.unified_risk_assessment.data_sufficiency == "INSUFFICIENT"
    assert response.unified_risk_assessment.risk_level == UnifiedRiskLevel.UNCERTAIN
    assert response.unified_risk_assessment.overall_risk_score == Decimal("0.0000")

    # 3. Action is INSUFFICIENT_DATA_REVIEW with PROMPT_MANUAL_CONFIRMATION
    assert response.intervention_recommendation.action == UnifiedRecommendedAction.INSUFFICIENT_DATA_REVIEW
    assert response.intervention_recommendation.severity == InterventionSeverity.UNCERTAIN
    assert response.intervention_recommendation.simulated_action_code == "PROMPT_MANUAL_CONFIRMATION"

    # 4. Missing streams are itemized
    assert len(response.unified_risk_assessment.missing_evidence) >= 2
    assert any("Customer behavioural history not evaluated" in m for m in response.unified_risk_assessment.missing_evidence)
    assert any("Recipient risk intelligence not evaluated" in m for m in response.unified_risk_assessment.missing_evidence)


# =====================================================================
# 6. SECURITY & API INTEGRATION TESTS
# =====================================================================


def test_security_mandatory_consent_enforcement():
    """Providing communication text without consent is strictly rejected with HTTP 400."""
    payload = {
        "customer_consent": False,
        "communication_text": "Pay Rs 500 to someone@upi",
        "simulated_transaction": {
            "amount": 500.0,
            "currency": "INR",
            "recipient_id": "someone@upi",
        },
    }

    res = client.post("/api/v1/payment-protection/evaluate", json=payload)
    assert res.status_code == 400
    assert "Explicit customer consent" in res.json()["detail"]


def test_api_payment_protection_evaluate_endpoint_success():
    """FastAPI TestClient verifies full JSON round-trip of the orchestration endpoint."""
    payload = {
        "customer_consent": True,
        "communication_text": "Please pay 2500 INR to merchant@hdfc for hotel booking.",
        "simulated_transaction": {
            "amount": 2500.0,
            "currency": "INR",
            "recipient_id": "merchant@hdfc",
            "transaction_reference": "TX-API-TEST",
        },
        "customer_id": "CUST-API-1",
        "payment_method": "UPI",
    }

    res = client.post("/api/v1/payment-protection/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["evaluation_id"].startswith("PPE-")
    assert data["transaction_id"] == "TX-API-TEST"
    assert data["customer_id"] == "CUST-API-1"
    assert data["recipient_id"] == "merchant@hdfc"
    assert data["intent_assessment"] is not None
    assert data["unified_risk_assessment"] is not None
    assert data["intervention_recommendation"] is not None
    assert "ALLOW_WITH_CAUTION" in data["intervention_recommendation"]["action"] or "WARN" in data["intervention_recommendation"]["action"] or "REVIEW" in data["intervention_recommendation"]["action"]
    assert data["disclaimer"] != ""


def test_verified_recipient_fraud_override_triggers_manual_review():
    """Recipient with VERIFIED court/police fraud finding triggers Invariant B override -> MANUAL_REVIEW."""
    graph_id = "SPEG-VERIFIED-OVERRIDE"
    target_vpa = "court_convicted_scammer@axis"

    # Construct internal graph with VERIFIED court judgment
    nodes = [
        EvidenceNode(
            node_id=target_vpa,
            node_type=EvidenceNodeType.BENEFICIARY,
            display_label="Convicted Beneficiary",
            synthetic_identifier=target_vpa,
            created_at=BASE_TIME - timedelta(days=20),
        ),
        EvidenceNode(
            node_id="JUDICIAL_CASE_888",
            node_type=EvidenceNodeType.FRAUD_CASE,
            display_label="Judicial Case 888",
            synthetic_identifier="CASE-888",
            created_at=BASE_TIME - timedelta(days=10),
        ),
    ]
    edges = [
        EvidenceEdge(
            edge_id="E-CASE-888",
            source_node_id=target_vpa,
            target_node_id="JUDICIAL_CASE_888",
            relationship_type=EvidenceRelationshipType.REPORTED_IN_CASE,
            evidence_status=EvidenceStatus.REPORTED,
            source_reference="POLICE_COMPLAINT_888",
            observed_at=BASE_TIME - timedelta(days=5),
            description="Reported complaint against fraudulent beneficiary.",
        ),
    ]

    G, _ = build_speg_graph(SPEGGraphInput(nodes=nodes, edges=edges), graph_id=graph_id)

    # Promote edge to VERIFIED via authorized internal compliance operation
    auth = TrustedVerificationAuthority(
        authority_id="LE_OFFICER_404",
        verification_rationale="Corroborated by certified judicial high court decree.",
    )
    verify_evidence_edge(G, "E-CASE-888", auth, "HIGH_COURT_DECREE_888")

    request = PaymentProtectionRequest(
        customer_consent=True,
        communication_text="Please pay 1000 to court_convicted_scammer@axis.",
        simulated_transaction=SimulatedTransaction(
            amount=1000.0,
            currency="INR",
            recipient_id=target_vpa,
        ),
        customer_id="CUST-VICTIM",
        graph_id=graph_id,
        as_of=BASE_TIME,
    )

    response = orchestrate_payment_protection(request)

    assert response.unified_risk_assessment.risk_level == UnifiedRiskLevel.HIGH
    assert response.unified_risk_assessment.overall_risk_score >= Decimal("0.8500")
    assert "VERIFIED_RECIPIENT_FRAUD_CASE_OVERRIDE" in response.unified_risk_assessment.detected_indicators
    assert response.intervention_recommendation.action == UnifiedRecommendedAction.MANUAL_REVIEW
    assert response.intervention_recommendation.simulated_action_code == "ROUTE_TO_ANALYST"


def test_reproduction_bug_recipient_diversion_accurate_explanation():
    """Verify Bug 1 & Bug 2: 8500 amount preserved and dynamic truthful explanation without velocity claims."""
    request = PaymentProtectionRequest(
        customer_consent=True,
        communication_text="Pay Rs 8500 to powerhelp@upi for your electricity bill before 5 PM.",
        simulated_transaction=SimulatedTransaction(
            amount=8500.0,
            currency="INR",
            recipient_id="scam_collector@attacker",
            transaction_reference="TX-ELEC-8500",
        ),
        customer_id="CUST-ELEC",
        historical_transactions=None,  # No behavioural history submitted
        graph_id=None,  # No SPEG graph submitted
        as_of=BASE_TIME,
    )

    response = orchestrate_payment_protection(request)

    # 1. Bug 1 Verification: Extracted amount is 8500.0, NOT 850.0
    assert response.intent_assessment is not None
    assert response.intent_assessment.extracted_intent.amount == 8500.0
    assert response.intent_assessment.extracted_intent.currency == "INR"
    assert response.intent_assessment.extracted_intent.recipient_id == "powerhelp@upi"

    # Amount comparison is MATCH (8500.0 == 8500.0)
    assert response.intent_assessment.comparison.amount_status == ComparisonStatus.MATCH
    # Recipient comparison is MISMATCH
    assert response.intent_assessment.comparison.recipient_status == ComparisonStatus.MISMATCH

    # 2. Bug 2 Verification: Behavioural and recipient streams are NOT_EVALUATED
    assert response.behavioural_assessment is None
    assert response.recipient_assessment is None

    # Intent risk remains HIGH due to recipient diversion
    assert response.intent_assessment.risk_assessment.risk_level.value == "HIGH"

    # Unified risk decision remains HIGH and PAUSE_AND_VERIFY
    assert response.unified_risk_assessment.risk_level == UnifiedRiskLevel.HIGH
    assert response.unified_risk_assessment.overall_risk_score >= Decimal("0.7500")
    assert response.intervention_recommendation.action == UnifiedRecommendedAction.PAUSE_AND_VERIFY
    assert response.intervention_recommendation.simulated_action_code == "PAUSE_HOLD_SIMULATION"

    # 3. Dynamic explanation accuracy: No unsupported velocity or payment mismatch claims
    guidance = response.intervention_recommendation.user_guidance_message
    assert "powerhelp@upi" in guidance
    assert "scam_collector@attacker" in guidance
    assert "velocity" not in guidance.lower()
    assert "payment mismatch" not in guidance.lower()
    assert "simulation; no actual bank or UPI payment has been paused" in guidance

    # 4. Rationale accuracy
    rationale = response.intervention_recommendation.rationale
    assert any("powerhelp@upi" in r and "scam_collector@attacker" in r for r in rationale)
    assert any("Behavioural baseline history was not submitted (not evaluated)" in r for r in rationale)
    assert any("Target recipient was not queried in SPEG evidence graph (not evaluated)" in r for r in rationale)
    assert not any("velocity" in r.lower() for r in rationale)


def test_three_engine_simultaneous_integration():
    """Verify simultaneous evaluation of all three engines: Intent, Behavioural, and Recipient."""
    customer_id = "CUST-SIMUL-01"
    target_vpa = "flagged_merchant@okaxis"
    graph_id = "SPEG-SIMUL-THREE-ENG"

    # 1. Baseline customer history (10 transactions)
    history = _make_sample_history(
        customer_id=customer_id,
        beneficiary_id="trusted_utility@okaxis",
        amounts=[500.0, 520.0, 480.0, 510.0, 490.0, 530.0, 470.0, 515.0, 505.0, 495.0],
    )

    # 2. SPEG graph with REPORTED fraud cases (strictly no VERIFIED status)
    nodes = [
        EvidenceNode(
            node_id=target_vpa,
            node_type=EvidenceNodeType.BENEFICIARY,
            display_label="Flagged Merchant",
            synthetic_identifier=target_vpa,
            created_at=BASE_TIME - timedelta(days=20),
        ),
        EvidenceNode(
            node_id="CASE-REP-777",
            node_type=EvidenceNodeType.FRAUD_CASE,
            display_label="Reported Phishing Case 777",
            synthetic_identifier="CASE-777",
            created_at=BASE_TIME - timedelta(days=15),
        ),
        EvidenceNode(
            node_id="CASE-REP-778",
            node_type=EvidenceNodeType.FRAUD_CASE,
            display_label="Reported Extortion Case 778",
            synthetic_identifier="CASE-778",
            created_at=BASE_TIME - timedelta(days=12),
        ),
        EvidenceNode(
            node_id="CASE-REP-779",
            node_type=EvidenceNodeType.FRAUD_CASE,
            display_label="Reported Billing Scam Case 779",
            synthetic_identifier="CASE-779",
            created_at=BASE_TIME - timedelta(days=10),
        ),
    ]
    edges = [
        EvidenceEdge(
            edge_id="E-REP-777",
            source_node_id=target_vpa,
            target_node_id="CASE-REP-777",
            relationship_type=EvidenceRelationshipType.REPORTED_IN_CASE,
            evidence_status=EvidenceStatus.REPORTED,
            source_reference="POLICE_FIR_REPORT_777",
            observed_at=BASE_TIME - timedelta(days=10),
            description="Beneficiary account flagged in unverified public fraud report.",
        ),
        EvidenceEdge(
            edge_id="E-REP-778",
            source_node_id=target_vpa,
            target_node_id="CASE-REP-778",
            relationship_type=EvidenceRelationshipType.REPORTED_IN_CASE,
            evidence_status=EvidenceStatus.REPORTED,
            source_reference="CYBER_CELL_REPORT_778",
            observed_at=BASE_TIME - timedelta(days=8),
            description="Beneficiary account cited in cyber-cell grievance complaint.",
        ),
        EvidenceEdge(
            edge_id="E-REP-779",
            source_node_id=target_vpa,
            target_node_id="CASE-REP-779",
            relationship_type=EvidenceRelationshipType.REPORTED_IN_CASE,
            evidence_status=EvidenceStatus.REPORTED,
            source_reference="PUBLIC_PORTAL_779",
            observed_at=BASE_TIME - timedelta(days=5),
            description="Beneficiary reported by customer on portal.",
        ),
    ]
    build_speg_graph(SPEGGraphInput(nodes=nodes, edges=edges), graph_id=graph_id)

    # 3. Protection request with all 3 streams
    request_payload = {
        "customer_consent": True,
        "communication_text": "Please transfer Rs 500 to flagged_merchant@okaxis for bill settlement.",
        "simulated_transaction": {
            "amount": 500.0,
            "currency": "INR",
            "recipient_id": target_vpa,
            "transaction_reference": "TX-3ENG-001",
        },
        "customer_id": customer_id,
        "recipient_id": target_vpa,
        "historical_transactions": [t.model_dump(mode="json") for t in history],
        "graph_id": graph_id,
        "as_of": BASE_TIME.isoformat(),
    }

    # Execute via HTTP endpoint TestClient
    resp = client.post("/api/v1/payment-protection/evaluate", json=request_payload)
    assert resp.status_code == 200
    data = resp.json()

    # 4. Verify all 3 engines populated
    assert data["intent_assessment"] is not None
    assert data["behavioural_assessment"] is not None
    assert data["recipient_assessment"] is not None

    # Intent verification
    intent = data["intent_assessment"]
    assert intent["extracted_intent"]["amount"] == 500.0
    assert intent["extracted_intent"]["recipient_id"] == target_vpa
    assert intent["comparison"]["amount_status"] == "MATCH"
    assert intent["comparison"]["recipient_status"] == "MATCH"

    # Behavioural verification
    behav = data["behavioural_assessment"]
    assert behav["customer_id"] == customer_id
    assert behav["data_sufficiency"] == "SUFFICIENT"
    assert "NEW_BENEFICIARY" in behav["detected_indicators"]

    # Recipient verification
    recip = data["recipient_assessment"]
    assert recip["recipient_id"] == target_vpa
    assert recip["data_sufficiency"] == "ADEQUATE"
    assert len(recip["supporting_evidence"]) == 3
    assert all(e["evidence_status"] == "REPORTED" for e in recip["supporting_evidence"])

    # 5. Unified assessment uses all 3 streams
    unified = data["unified_risk_assessment"]
    assert unified["data_sufficiency"] == "ADEQUATE"
    assert len(unified["contributing_assessments"]) == 3
    assert "intent_correlation" in unified["contributing_assessments"]
    assert "behavioural_risk" in unified["contributing_assessments"]
    assert "recipient_intelligence" in unified["contributing_assessments"]

    # Invariant F applied: REPORTED fraud case elevates risk
    assert "REPORTED_RECIPIENT_FRAUD_ELEVATION" in unified["detected_indicators"]
    assert unified["risk_level"] in ["MEDIUM", "HIGH"]
    assert float(unified["overall_risk_score"]) >= 0.35

    # 6. Intervention recommendation matches findings
    interv = data["intervention_recommendation"]
    assert interv["action"] in ["WARN_CUSTOMER", "PAUSE_AND_VERIFY"]
    assert len(interv["rationale"]) >= 1
    assert any("Recipient Intelligence" in r for r in interv["rationale"])
    assert "simulation; no actual bank or UPI payment has been paused" in interv["user_guidance_message"]
