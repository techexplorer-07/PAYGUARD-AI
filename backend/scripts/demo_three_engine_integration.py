#!/usr/bin/env python3
"""PAYGUARD AI — Three-Engine Integration Demonstration Script.

Simultaneously evaluates:
1. Intent-to-Payment Correlation Engine (Phase 2.1)
2. Behavioural Risk Analysis Engine (Phase 2.2)
3. Recipient Risk Intelligence & SPEG Graph (Phase 2.3)
Unified into a holistic risk assessment (Phase 2.4) with truthful intervention recommendation.

Requirements:
- Synthetic customer history (>= 10 transactions)
- SPEG graph with REPORTED fraud case (strictly no VERIFIED evidence)
- All 3 engines populated
- Unified risk assessment with all streams
- Clear console output displaying risk levels, scores, evidence, and data sufficiency
"""

from datetime import datetime, timedelta, timezone
from decimal import Decimal
import json
from pathlib import Path
import sys

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.schemas.behavioural import HistoricalTransaction
from app.schemas.correlation import SimulatedTransaction
from app.schemas.payment_protection import (
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
)
from app.services.payment_protection_orchestrator import orchestrate_payment_protection
from app.services.speg_graph_builder import build_speg_graph


def run_three_engine_demo() -> PaymentProtectionResponse:
    base_time = datetime(2026, 11, 23, 14, 0, tzinfo=timezone.utc)
    customer_id = "CUST-DEMO-999"
    target_beneficiary = "scam_recipient@okhdfcbank"
    graph_id = "SPEG-DEMO-THREE-ENG-001"

    print("=" * 80)
    print("PAYGUARD AI — THREE-ENGINE INTEGRATION DEMONSTRATION")
    print("=" * 80)
    print("Initializing demonstration environment and synthetic data...\n")

    # -------------------------------------------------------------------------
    # STEP 1: Build Synthetic Customer History (>= 10 transactions)
    # -------------------------------------------------------------------------
    print("1. Constructing synthetic customer transaction history (10 transactions)...")
    baseline_amounts = [450.0, 520.0, 480.0, 500.0, 510.0, 490.0, 530.0, 475.0, 505.0, 495.0]
    historical_transactions = []
    for i, amt in enumerate(baseline_amounts):
        historical_transactions.append(
            HistoricalTransaction(
                transaction_id=f"HIST-DEMO-{i+1:03d}",
                customer_id=customer_id,
                amount=Decimal(str(amt)),
                currency="INR",
                beneficiary_id="legit_utility@okaxis",
                payment_method="UPI",
                transaction_timestamp=base_time - timedelta(days=len(baseline_amounts) - i, hours=i),
            )
        )
    print(f"   ✓ Built {len(historical_transactions)} transactions for customer {customer_id}")
    print(f"   ✓ Baseline amount: mean ~₹500.00, regular daily utility payments\n")

    # -------------------------------------------------------------------------
    # STEP 2: Build SPEG Evidence Graph (Beneficiary + REPORTED Fraud Cases)
    # Note: Strictly no VERIFIED evidence - public trust boundary enforcement
    # We include 3 REPORTED cases to achieve ADEQUATE data sufficiency (> 2 edges)
    # -------------------------------------------------------------------------
    print("2. Constructing SPEG graph with synthetic beneficiary and 3 REPORTED fraud cases...")
    nodes = [
        EvidenceNode(
            node_id=target_beneficiary,
            node_type=EvidenceNodeType.BENEFICIARY,
            display_label="Suspicious UPI Beneficiary",
            synthetic_identifier=target_beneficiary,
            created_at=base_time - timedelta(days=30),
        ),
        EvidenceNode(
            node_id="CASE-REP-9001",
            node_type=EvidenceNodeType.FRAUD_CASE,
            display_label="Cyber Crime Portal Reported Case 9001",
            synthetic_identifier="NCRB-REPORT-9001",
            created_at=base_time - timedelta(days=20),
        ),
        EvidenceNode(
            node_id="CASE-REP-9002",
            node_type=EvidenceNodeType.FRAUD_CASE,
            display_label="Police Station Phishing Complaint 9002",
            synthetic_identifier="FIR-REPORT-9002",
            created_at=base_time - timedelta(days=15),
        ),
        EvidenceNode(
            node_id="CASE-REP-9003",
            node_type=EvidenceNodeType.FRAUD_CASE,
            display_label="Consumer Fraud Grievance 9003",
            synthetic_identifier="CYBER-CELL-9003",
            created_at=base_time - timedelta(days=10),
        ),
    ]
    edges = [
        EvidenceEdge(
            edge_id="E-DEMO-REP-9001",
            source_node_id=target_beneficiary,
            target_node_id="CASE-REP-9001",
            relationship_type=EvidenceRelationshipType.REPORTED_IN_CASE,
            evidence_status=EvidenceStatus.REPORTED,  # STRICTLY REPORTED
            source_reference="PUBLIC_PORTAL_COMPLAINT_9001",
            observed_at=base_time - timedelta(days=18),
            description="UPI VPA reported by victim in phishing extortion incident.",
        ),
        EvidenceEdge(
            edge_id="E-DEMO-REP-9002",
            source_node_id=target_beneficiary,
            target_node_id="CASE-REP-9002",
            relationship_type=EvidenceRelationshipType.REPORTED_IN_CASE,
            evidence_status=EvidenceStatus.REPORTED,  # STRICTLY REPORTED
            source_reference="POLICE_FIR_RECORD_9002",
            observed_at=base_time - timedelta(days=12),
            description="UPI VPA cited in cyber-cell impersonation scam investigation.",
        ),
        EvidenceEdge(
            edge_id="E-DEMO-REP-9003",
            source_node_id=target_beneficiary,
            target_node_id="CASE-REP-9003",
            relationship_type=EvidenceRelationshipType.REPORTED_IN_CASE,
            evidence_status=EvidenceStatus.REPORTED,  # STRICTLY REPORTED
            source_reference="CYBER_CELL_GRIEVANCE_9003",
            observed_at=base_time - timedelta(days=5),
            description="UPI VPA reported for fraudulent billing notice distribution.",
        ),
    ]
    graph_input = SPEGGraphInput(nodes=nodes, edges=edges)
    _, build_resp = build_speg_graph(graph_input, graph_id=graph_id)
    actual_graph_id = build_resp.graph_id
    print(f"   ✓ Built SPEG graph with ID: '{actual_graph_id}'")
    print(f"   ✓ Beneficiary: {target_beneficiary}")
    print(f"   ✓ Evidence: 3 REPORTED fraud cases (NCRB, FIR, Cyber-cell)")
    print(f"   ✓ Verified status count: 0 (Security trust boundary preserved)\n")

    # -------------------------------------------------------------------------
    # STEP 3: Construct Payment Protection Request
    # -------------------------------------------------------------------------
    print("3. Submitting payment protection request with all 3 intelligence streams...")
    communication_text = (
        "URGENT NOTICE: Pay Rs 500 to scam_recipient@okhdfcbank immediately "
        "to avoid legal action regarding your outstanding dues."
    )
    simulated_tx = SimulatedTransaction(
        amount=500.0,
        currency="INR",
        recipient_id=target_beneficiary,
        transaction_reference="TX-LIVE-EVAL-3ENG",
    )

    request = PaymentProtectionRequest(
        customer_consent=True,
        communication_text=communication_text,
        simulated_transaction=simulated_tx,
        customer_id=customer_id,
        recipient_id=target_beneficiary,
        historical_transactions=historical_transactions,
        graph_id=actual_graph_id,
        as_of=base_time,
    )

    response = orchestrate_payment_protection(request)

    # -------------------------------------------------------------------------
    # STEP 4: Programmatic Verifications
    # -------------------------------------------------------------------------
    assert response.intent_assessment is not None, "Intent assessment must be populated"
    assert response.behavioural_assessment is not None, "Behavioural assessment must be populated"
    assert response.recipient_assessment is not None, "Recipient assessment must be populated"
    assert response.unified_risk_assessment.data_sufficiency == "ADEQUATE", "Data sufficiency must be ADEQUATE"
    assert len(response.unified_risk_assessment.contributing_assessments) == 3, "All 3 engines must contribute"

    # -------------------------------------------------------------------------
    # STEP 5: Display Comprehensive Engine Results
    # -------------------------------------------------------------------------
    print("\n" + "=" * 80)
    print("INTELLIGENCE ENGINE RESULTS SUMMARY")
    print("=" * 80)

    # Engine 1: Intent-to-Payment Correlation
    intent = response.intent_assessment
    print("\n[ENGINE 1] INTENT-TO-PAYMENT CORRELATION ENGINE")
    print(f"  • Risk Level        : {intent.risk_assessment.risk_level.value}")
    print(f"  • Heuristic Score   : {float(intent.risk_assessment.heuristic_score):.4f}")
    print(f"  • Score Type        : {intent.risk_assessment.score_type}")
    print(f"  • Extracted Amount  : {intent.extracted_intent.currency} {intent.extracted_intent.amount}")
    print(f"  • Extracted Recip   : {intent.extracted_intent.recipient_id}")
    print(f"  • Amount Match      : {intent.comparison.amount_status.value}")
    print(f"  • Recipient Match   : {intent.comparison.recipient_status.value}")
    print(f"  • Detected Urgency  : {intent.extracted_intent.urgency_detected}")
    print(f"  • Detected Threat   : {intent.extracted_intent.threat_detected}")
    print(f"  • Reasons           : {intent.risk_assessment.reasons}")
    print(f"  • Evidence Snippets : {intent.extracted_intent.evidence_snippets}")

    # Engine 2: Behavioural Risk Analysis
    behav = response.behavioural_assessment
    print("\n[ENGINE 2] BEHAVIOURAL RISK ANALYSIS ENGINE")
    print(f"  • Risk Level        : {behav.risk_level.value}")
    print(f"  • Anomaly Score     : {float(behav.anomaly_score):.4f}")
    print(f"  • Data Sufficiency  : {behav.data_sufficiency.value}")
    print(f"  • Model Type        : {behav.model_type}")
    print(f"  • Indicators        : {behav.detected_indicators}")
    print(f"  • Contributions     : {behav.feature_contributions}")
    print("  • Explanation:")
    for exp in behav.explanation:
        print(f"     - {exp}")

    # Engine 3: Recipient Intelligence (SPEG)
    recip = response.recipient_assessment
    print("\n[ENGINE 3] RECIPIENT RISK INTELLIGENCE ENGINE (SPEG)")
    print(f"  • Risk Level        : {recip.risk_level.value}")
    print(f"  • Recipient Score   : {float(recip.recipient_risk_score):.4f}")
    print(f"  • Data Sufficiency  : {recip.data_sufficiency.value}")
    print(f"  • Recip Action      : {recip.recommended_action.value}")
    print(f"  • Indicators        : {recip.detected_indicators}")
    print(f"  • Contributions     : {recip.feature_contributions}")
    print("  • Supporting Evidence:")
    for ev in recip.supporting_evidence:
        print(f"     - [{ev.evidence_status.value}] {ev.relationship_type.value}: {ev.source_reference}")
    print(f"  • Explanation       : {recip.explanation[:120]}...")

    # Unified Risk Assessment
    unified = response.unified_risk_assessment
    print("\n" + "-" * 80)
    print("[UNIFIED SYNTHESIS] MULTI-ENGINE FUSED RISK ASSESSMENT")
    print(f"  • Overall Risk Level: {unified.risk_level.value}")
    print(f"  • Composite Score   : {float(unified.overall_risk_score):.4f}")
    print(f"  • Data Sufficiency  : {unified.data_sufficiency}")
    print(f"  • Contributing (3/3): {list(unified.contributing_assessments.keys())}")
    print(f"  • Applied Invariants: {unified.detected_indicators}")

    # Intervention Recommendation
    interv = response.intervention_recommendation
    print("\n" + "-" * 80)
    print("[INTERVENTION] RECOMMENDED ACTION & SIMULATION ADVISORY")
    print(f"  • Recommended Action: {interv.action.value}")
    print(f"  • Severity Level    : {interv.severity.value}")
    print(f"  • Simulated Code    : {interv.simulated_action_code}")
    print(f"  • Guidance Message  : {interv.user_guidance_message}")
    print(f"  • Rationale Points  :")
    for r in interv.rationale:
        print(f"     * {r}")
    print("=" * 80)
    print("✓ SUCCESS: All 3 engines evaluated and integrated simultaneously.\n")

    return response


if __name__ == "__main__":
    try:
        run_three_engine_demo()
        sys.exit(0)
    except Exception as exc:
        print(f"ERROR: Demonstration failed with exception: {exc}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
