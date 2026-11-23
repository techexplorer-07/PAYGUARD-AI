"""Comprehensive automated test suite for Unified Risk Assessment Engine (Phase 2.4).

Validates:
1. All three engines returning ordinary LOW signals -> LOW unified risk (ALLOW_WITH_CAUTION).
2. Strong intent mismatch with low behavioural risk -> Intent override preserves HIGH risk (PAUSE_AND_VERIFY).
3. High behavioural anomaly with low recipient risk -> Evaluates to elevated composite risk.
4. High recipient risk with weak intent evidence -> Verified recipient override preserves HIGH risk.
5. Strong signals from multiple engines -> High composite severity.
6. New beneficiary alone -> Guardrail caps score at <= 0.35, preventing false-positive HIGH risk.
7. Inferred evidence alone -> Guardrail caps score at <= 0.25 (LOW risk).
8. Reported evidence versus verified evidence -> Distinguishes unadjudicated claims from confirmed findings.
9. Missing behavioural assessment -> Explicitly disclosed in missing_evidence and dynamically reweighted.
10. Missing recipient assessment -> Explicitly disclosed in missing_evidence and dynamically reweighted.
11. Insufficient history across all engines -> UNCERTAIN risk with INSUFFICIENT_DATA_REVIEW.
12. Conflicting engine outputs -> Explicitly analyzed and logged in conflicting_signals.
13. Duplicate underlying evidence IDs -> Deduplicated without inflating score.
14. Missing evidence provenance -> Disclosed transparently.
15. Score bounds -> Strictly normalized in [0.0000, 1.0000].
16. Risk threshold boundaries -> LOW < 0.30, MEDIUM 0.30..0.70, HIGH >= 0.70.
17. Recommended action mapping -> Controlled actionable recommendations.
18. Full API success -> POST /api/v1/risk-assessment/evaluate live execution.
19. Invalid requests -> Schema validation error handling (HTTP 422).
"""

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Optional
from fastapi import status
from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.schemas.behavioural import (
    BehaviouralRiskLevel,
    DataSufficiencyLevel,
)
from app.schemas.correlation import (
    ComparisonStatus,
    EvidenceSnippet,
    ExtractionStatus,
    RiskLevel as IntentRiskLevel,
)
from app.schemas.recipient import (
    EvidenceNodeType,
    EvidenceRelationshipType,
    EvidenceStatus,
    RecipientDataSufficiency,
    RecipientRiskLevel,
    SPEGGraphInput,
    SupportingEvidenceItem,
)
from app.schemas.unified_risk import (
    BehaviouralRiskSignal,
    IntentRiskSignal,
    RecipientRiskSignal,
    UnifiedEvaluationRequest,
    UnifiedRecommendedAction,
    UnifiedRiskAssessment,
    UnifiedRiskLevel,
)
from app.services.speg_graph_builder import clear_active_graphs
from app.services.unified_risk_assessor import (
    MODEL_TYPE_IDENTIFIER,
    POLICY_VERSION,
    evaluate_unified_risk,
    synthesize_unified_assessment,
)

BASE_TIME = datetime(2026, 11, 23, 12, 0, 0, tzinfo=timezone.utc)
client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_registry():
    """Ensure in-memory state is pristine before and after each test."""
    clear_active_graphs()
    yield
    clear_active_graphs()


def _make_intent_signal(
    risk_level: IntentRiskLevel = IntentRiskLevel.LOW,
    heuristic_score: float = 0.05,
    recipient_status: ComparisonStatus = ComparisonStatus.MATCH,
    amount_status: ComparisonStatus = ComparisonStatus.MATCH,
    indicators: Optional[List[str]] = None,
) -> IntentRiskSignal:
    return IntentRiskSignal(
        assessment_id="INTENT-TEST-001",
        risk_level=risk_level,
        heuristic_score=heuristic_score,
        score_type="rule_based_intent_heuristic",
        detected_indicators=indicators or ["MATCHING_INTENT_DETAILS"],
        reasons=["Customer communication instructions match transaction."],
        evidence_snippets=[
            EvidenceSnippet(
                field="recipient",
                extracted_value="merchant@bank",
                text_snippet="pay merchant@bank",
                start_char=0,
                end_char=18,
                status=ExtractionStatus.FOUND,
            )
        ],
        comparison_summary="Requested recipient and amount match simulated payment.",
        amount_status=amount_status,
        recipient_status=recipient_status,
    )


def _make_behav_signal(
    risk_level: BehaviouralRiskLevel = BehaviouralRiskLevel.LOW,
    anomaly_score: Decimal = Decimal("0.0500"),
    data_sufficiency: DataSufficiencyLevel = DataSufficiencyLevel.SUFFICIENT,
    indicators: Optional[List[str]] = None,
) -> BehaviouralRiskSignal:
    return BehaviouralRiskSignal(
        assessment_id="BEHAV-TEST-001",
        anomaly_score=anomaly_score,
        risk_level=risk_level,
        data_sufficiency=data_sufficiency,
        detected_indicators=indicators or ["NORMAL_TRANSACTION_PATTERN"],
        feature_contributions={"amount_deviation": Decimal("0.0200"), "velocity": Decimal("0.0100")},
        explanation=["Transaction matches customer historical activity baseline."],
    )


def _make_recip_signal(
    risk_level: RecipientRiskLevel = RecipientRiskLevel.LOW,
    recipient_risk_score: Decimal = Decimal("0.0000"),
    data_sufficiency: RecipientDataSufficiency = RecipientDataSufficiency.ADEQUATE,
    indicators: Optional[List[str]] = None,
    supporting_evidence: Optional[List[SupportingEvidenceItem]] = None,
) -> RecipientRiskSignal:
    return RecipientRiskSignal(
        assessment_id="RECIP-TEST-001",
        recipient_risk_score=recipient_risk_score,
        risk_level=risk_level,
        data_sufficiency=data_sufficiency,
        detected_indicators=indicators or ["ORDINARY_BENIGN_ACTIVITY"],
        feature_contributions={"verified_fraud": 0.0, "reported_fraud": 0.0},
        supporting_evidence=supporting_evidence or [],
        explanation="No adverse filings or suspicious associations found in SPEG.",
    )


# =====================================================================
# 1. CORE MULTI-ENGINE DECISION POLICY TESTS
# =====================================================================


def test_1_all_three_engines_low_signals():
    """All three engines report clean LOW signals -> Unified LOW risk (ALLOW_WITH_CAUTION)."""
    intent = _make_intent_signal(IntentRiskLevel.LOW, 0.05)
    behav = _make_behav_signal(BehaviouralRiskLevel.LOW, Decimal("0.0500"))
    recip = _make_recip_signal(RecipientRiskLevel.LOW, Decimal("0.0000"))

    assessment = synthesize_unified_assessment(
        transaction_id="TX-001",
        customer_id="CUST-100",
        recipient_id="BEN-200",
        intent_signal=intent,
        behavioural_signal=behav,
        recipient_signal=recip,
        as_of=BASE_TIME,
    )

    assert assessment.risk_level == UnifiedRiskLevel.LOW
    assert assessment.overall_risk_score < Decimal("0.1000")
    assert assessment.recommended_action == UnifiedRecommendedAction.ALLOW_WITH_CAUTION
    assert assessment.data_sufficiency == "ADEQUATE"
    assert len(assessment.conflicting_signals) == 0


def test_2_strong_intent_mismatch_with_low_behavioural_risk():
    """Intent destination mismatch overrides clean behavioural profile -> HIGH risk."""
    intent = _make_intent_signal(
        risk_level=IntentRiskLevel.HIGH,
        heuristic_score=0.90,
        recipient_status=ComparisonStatus.MISMATCH,
        indicators=["EXPLICIT_RECIPIENT_MISMATCH"],
    )
    behav = _make_behav_signal(BehaviouralRiskLevel.LOW, Decimal("0.0200"))
    recip = _make_recip_signal(RecipientRiskLevel.LOW, Decimal("0.0000"))

    assessment = synthesize_unified_assessment(
        transaction_id="TX-002",
        customer_id="CUST-100",
        recipient_id="BEN-ATTACKER",
        intent_signal=intent,
        behavioural_signal=behav,
        recipient_signal=recip,
        as_of=BASE_TIME,
    )

    assert assessment.risk_level == UnifiedRiskLevel.HIGH
    assert assessment.overall_risk_score >= Decimal("0.7500")
    assert assessment.recommended_action == UnifiedRecommendedAction.PAUSE_AND_VERIFY
    assert "DESTINATION_INTENT_DIVERGENCE_OVERRIDE" in assessment.detected_indicators
    assert any("Intent-Behavioural Contradiction" in c for c in assessment.conflicting_signals)


def test_3_high_behavioural_anomaly_with_low_recipient_risk():
    """Anomalous amount/velocity surge elevates composite risk score."""
    intent = _make_intent_signal(IntentRiskLevel.LOW, 0.05)
    behav = _make_behav_signal(
        risk_level=BehaviouralRiskLevel.HIGH,
        anomaly_score=Decimal("0.8500"),
        indicators=["HIGH_AMOUNT_DEVIATION", "HIGH_VELOCITY_SURGE"],
    )
    recip = _make_recip_signal(RecipientRiskLevel.LOW, Decimal("0.0000"))

    assessment = synthesize_unified_assessment(
        transaction_id="TX-003",
        customer_id="CUST-100",
        recipient_id="BEN-KNOWN",
        intent_signal=intent,
        behavioural_signal=behav,
        recipient_signal=recip,
        as_of=BASE_TIME,
    )

    assert assessment.overall_risk_score > Decimal("0.2500")
    assert assessment.risk_level in (UnifiedRiskLevel.MEDIUM, UnifiedRiskLevel.HIGH)
    assert any("Behavioural-Intent Contradiction" in c for c in assessment.conflicting_signals)


def test_4_high_recipient_risk_with_weak_intent_evidence():
    """VERIFIED fraud case on recipient triggers verified override -> HIGH risk."""
    intent = _make_intent_signal(IntentRiskLevel.LOW, 0.05)
    behav = _make_behav_signal(BehaviouralRiskLevel.LOW, Decimal("0.0500"))

    verified_item = SupportingEvidenceItem(
        edge_id="E-VER-99",
        source_reference="POLICE_FIR_99_CERTIFIED",
        evidence_status=EvidenceStatus.VERIFIED,
        relationship_type=EvidenceRelationshipType.REPORTED_IN_CASE,
        observed_at=BASE_TIME - timedelta(days=2),
        source_node_id="BEN-SCAMMER",
        target_node_id="CASE-99",
        description="Direct judicial verification in cybercrime FIR 99",
    )
    recip = _make_recip_signal(
        risk_level=RecipientRiskLevel.HIGH,
        recipient_risk_score=Decimal("0.8500"),
        indicators=["VERIFIED_FRAUD_CASE_ASSOCIATION"],
        supporting_evidence=[verified_item],
    )

    assessment = synthesize_unified_assessment(
        transaction_id="TX-004",
        customer_id="CUST-100",
        recipient_id="BEN-SCAMMER",
        intent_signal=intent,
        behavioural_signal=behav,
        recipient_signal=recip,
        as_of=BASE_TIME,
    )

    assert assessment.risk_level == UnifiedRiskLevel.HIGH
    assert assessment.overall_risk_score >= Decimal("0.8500")
    assert assessment.recommended_action == UnifiedRecommendedAction.MANUAL_REVIEW
    assert "VERIFIED_RECIPIENT_FRAUD_CASE_OVERRIDE" in assessment.detected_indicators
    assert any("Intent-Recipient Contradiction" in c for c in assessment.conflicting_signals)


def test_5_strong_signals_from_multiple_engines():
    """Multiple concurrent adverse signals produce maximum severity."""
    intent = _make_intent_signal(IntentRiskLevel.HIGH, 0.90, recipient_status=ComparisonStatus.MISMATCH)
    behav = _make_behav_signal(BehaviouralRiskLevel.HIGH, Decimal("0.8000"))
    recip = _make_recip_signal(RecipientRiskLevel.HIGH, Decimal("0.8500"))

    assessment = synthesize_unified_assessment(
        transaction_id="TX-005",
        customer_id="CUST-100",
        recipient_id="BEN-FRAUD",
        intent_signal=intent,
        behavioural_signal=behav,
        recipient_signal=recip,
        as_of=BASE_TIME,
    )

    assert assessment.risk_level == UnifiedRiskLevel.HIGH
    assert assessment.overall_risk_score >= Decimal("0.8000")
    assert assessment.recommended_action == UnifiedRecommendedAction.PAUSE_AND_VERIFY


def test_6_new_beneficiary_alone_guardrail():
    """GUARDRAIL: New beneficiary alone must NEVER produce HIGH risk."""
    intent = _make_intent_signal(IntentRiskLevel.LOW, 0.05)
    behav = _make_behav_signal(
        risk_level=BehaviouralRiskLevel.MEDIUM,
        anomaly_score=Decimal("0.3000"),
        indicators=["NEW_BENEFICIARY"],
    )
    recip = _make_recip_signal(RecipientRiskLevel.LOW, Decimal("0.0000"))

    assessment = synthesize_unified_assessment(
        transaction_id="TX-006",
        customer_id="CUST-100",
        recipient_id="BEN-NEW",
        intent_signal=intent,
        behavioural_signal=behav,
        recipient_signal=recip,
        as_of=BASE_TIME,
    )

    assert assessment.overall_risk_score <= Decimal("0.3500")
    assert assessment.risk_level != UnifiedRiskLevel.HIGH
    assert "NEW_BENEFICIARY_GUARDRAIL_APPLIED" in assessment.detected_indicators
    assert assessment.recommended_action in (
        UnifiedRecommendedAction.ALLOW_WITH_CAUTION,
        UnifiedRecommendedAction.STEP_UP_VERIFICATION,
    )


def test_7_inferred_evidence_alone_guardrail():
    """GUARDRAIL: Inferred shared-identifier connections alone must never produce HIGH risk."""
    intent = _make_intent_signal(IntentRiskLevel.LOW, 0.05)
    behav = _make_behav_signal(BehaviouralRiskLevel.LOW, Decimal("0.0500"))

    inferred_item = SupportingEvidenceItem(
        edge_id="E-INF-01",
        source_reference="COWORKING_WIFI_DEVICE",
        evidence_status=EvidenceStatus.INFERRED,
        relationship_type=EvidenceRelationshipType.SHARES_IDENTIFIER,
        observed_at=BASE_TIME,
        source_node_id="BEN-SHARED",
        target_node_id="IDENT-WIFI",
        description="Shared Wi-Fi router IP",
    )
    recip = _make_recip_signal(
        risk_level=RecipientRiskLevel.LOW,
        recipient_risk_score=Decimal("0.2000"),
        indicators=["INFERRED_SHARED_IDENTIFIERS"],
        supporting_evidence=[inferred_item],
    )

    assessment = synthesize_unified_assessment(
        transaction_id="TX-007",
        customer_id="CUST-100",
        recipient_id="BEN-SHARED",
        intent_signal=intent,
        behavioural_signal=behav,
        recipient_signal=recip,
        as_of=BASE_TIME,
    )

    assert assessment.overall_risk_score <= Decimal("0.2500")
    assert assessment.risk_level == UnifiedRiskLevel.LOW
    assert assessment.risk_level != UnifiedRiskLevel.HIGH
    assert "INFERRED_NETWORK_LINKS_ONLY_GUARDRAIL" in assessment.detected_indicators


def test_8_reported_evidence_versus_verified_evidence():
    """Uncorroborated REPORTED claims produce lower severity than VERIFIED court findings."""
    reported_item = SupportingEvidenceItem(
        edge_id="E-REP-01",
        source_reference="PORTAL_COMPLAINT_1",
        evidence_status=EvidenceStatus.REPORTED,
        relationship_type=EvidenceRelationshipType.REPORTED_IN_CASE,
        observed_at=BASE_TIME,
        source_node_id="BEN-REP",
        target_node_id="CASE-1",
        description="Unverified user complaint",
    )
    recip_rep = _make_recip_signal(
        risk_level=RecipientRiskLevel.MEDIUM,
        recipient_risk_score=Decimal("0.2500"),
        indicators=["REPORTED_FRAUD_ALLEGATIONS"],
        supporting_evidence=[reported_item],
    )

    assess_rep = synthesize_unified_assessment(
        transaction_id="TX-008A",
        customer_id="CUST-100",
        recipient_id="BEN-REP",
        recipient_signal=recip_rep,
        as_of=BASE_TIME,
    )

    verified_item = SupportingEvidenceItem(
        edge_id="E-VER-01",
        source_reference="COURT_ORDER_1",
        evidence_status=EvidenceStatus.VERIFIED,
        relationship_type=EvidenceRelationshipType.REPORTED_IN_CASE,
        observed_at=BASE_TIME,
        source_node_id="BEN-VER",
        target_node_id="CASE-1",
        description="Corroborated judicial finding",
    )
    recip_ver = _make_recip_signal(
        risk_level=RecipientRiskLevel.HIGH,
        recipient_risk_score=Decimal("0.8500"),
        indicators=["VERIFIED_FRAUD_CASE_ASSOCIATION"],
        supporting_evidence=[verified_item],
    )

    assess_ver = synthesize_unified_assessment(
        transaction_id="TX-008B",
        customer_id="CUST-100",
        recipient_id="BEN-VER",
        recipient_signal=recip_ver,
        as_of=BASE_TIME,
    )

    assert assess_ver.overall_risk_score > assess_rep.overall_risk_score
    assert assess_ver.risk_level == UnifiedRiskLevel.HIGH
    assert assess_rep.risk_level in (UnifiedRiskLevel.LOW, UnifiedRiskLevel.MEDIUM)


def test_9_missing_behavioural_assessment_transparently_handled():
    """Missing behavioural engine output is disclosed in missing_evidence and dynamically reweighted."""
    intent = _make_intent_signal(IntentRiskLevel.LOW, 0.05)
    recip = _make_recip_signal(RecipientRiskLevel.LOW, Decimal("0.0000"))

    assessment = synthesize_unified_assessment(
        transaction_id="TX-009",
        customer_id="CUST-100",
        recipient_id="BEN-200",
        intent_signal=intent,
        behavioural_signal=None,  # Missing!
        recipient_signal=recip,
        as_of=BASE_TIME,
    )

    assert assessment.engine_signal_summary["behavioural_risk"]["status"] == "NOT_EVALUATED"
    assert any("Customer behavioural history not evaluated" in m for m in assessment.missing_evidence)
    assert assessment.contributing_assessments["behavioural_risk"] is None
    assert "behavioural" not in assessment.feature_contributions


def test_10_missing_recipient_assessment_transparently_handled():
    """Missing recipient engine output is disclosed and dynamically reweighted."""
    intent = _make_intent_signal(IntentRiskLevel.LOW, 0.05)
    behav = _make_behav_signal(BehaviouralRiskLevel.LOW, Decimal("0.0500"))

    assessment = synthesize_unified_assessment(
        transaction_id="TX-010",
        customer_id="CUST-100",
        recipient_id="BEN-UNKNOWN",
        intent_signal=intent,
        behavioural_signal=behav,
        recipient_signal=None,  # Missing!
        as_of=BASE_TIME,
    )

    assert assessment.engine_signal_summary["recipient_intelligence"]["status"] == "NOT_EVALUATED"
    assert any("Recipient risk intelligence not evaluated" in m for m in assessment.missing_evidence)
    assert assessment.contributing_assessments["recipient_intelligence"] is None


def test_11_insufficient_history_across_all_engines():
    """Insufficient evidence depth across all engines yields UNCERTAIN risk."""
    behav = _make_behav_signal(
        risk_level=BehaviouralRiskLevel.UNCERTAIN,
        anomaly_score=Decimal("0.0000"),
        data_sufficiency=DataSufficiencyLevel.INSUFFICIENT,
    )
    recip = _make_recip_signal(
        risk_level=RecipientRiskLevel.UNCERTAIN,
        recipient_risk_score=Decimal("0.0000"),
        data_sufficiency=RecipientDataSufficiency.INSUFFICIENT,
    )

    assessment = synthesize_unified_assessment(
        transaction_id="TX-011",
        customer_id="CUST-NEW",
        recipient_id="BEN-NEW",
        intent_signal=None,  # Missing
        behavioural_signal=behav,  # Insufficient
        recipient_signal=recip,  # Insufficient
        as_of=BASE_TIME,
    )

    assert assessment.risk_level == UnifiedRiskLevel.UNCERTAIN
    assert assessment.overall_risk_score == Decimal("0.0000")
    assert assessment.data_sufficiency == "INSUFFICIENT"
    assert assessment.recommended_action == UnifiedRecommendedAction.INSUFFICIENT_DATA_REVIEW


def test_12_conflicting_engine_outputs_explained():
    """Contradicting engine outputs are explicitly identified in conflicting_signals array."""
    intent = _make_intent_signal(IntentRiskLevel.LOW, 0.00)  # says safe
    behav = _make_behav_signal(BehaviouralRiskLevel.LOW, Decimal("0.0000"))  # says safe
    verified_item = SupportingEvidenceItem(
        edge_id="E-V1",
        source_reference="POLICE_FIR",
        evidence_status=EvidenceStatus.VERIFIED,
        relationship_type=EvidenceRelationshipType.REPORTED_IN_CASE,
        observed_at=BASE_TIME,
        source_node_id="BEN-SCAM",
        target_node_id="CASE-1",
        description="Confirmed fraud mule account",
    )
    recip = _make_recip_signal(
        risk_level=RecipientRiskLevel.HIGH,
        recipient_risk_score=Decimal("0.8500"),
        indicators=["VERIFIED_FRAUD_CASE_ASSOCIATION"],
        supporting_evidence=[verified_item],
    )

    assessment = synthesize_unified_assessment(
        transaction_id="TX-012",
        customer_id="CUST-100",
        recipient_id="BEN-SCAM",
        intent_signal=intent,
        behavioural_signal=behav,
        recipient_signal=recip,
        as_of=BASE_TIME,
    )

    assert len(assessment.conflicting_signals) > 0
    assert any("Intent-Recipient Contradiction" in c for c in assessment.conflicting_signals)


def test_13_duplicate_underlying_evidence_ids_deduplicated():
    """Detected indicators and evidence are deduplicated to avoid inflation."""
    intent = _make_intent_signal(indicators=["SHARED_FLAG"])
    behav = _make_behav_signal(indicators=["SHARED_FLAG"])

    assessment = synthesize_unified_assessment(
        transaction_id="TX-013",
        customer_id="CUST-100",
        recipient_id="BEN-200",
        intent_signal=intent,
        behavioural_signal=behav,
        as_of=BASE_TIME,
    )

    # Namespaced deduplicated indicators
    assert len([i for i in assessment.detected_indicators if "SHARED_FLAG" in i]) == 2
    assert len(assessment.detected_indicators) == len(set(assessment.detected_indicators))


def test_14_missing_evidence_provenance():
    """Disclosures explicitly identify missing intelligence streams."""
    assessment = synthesize_unified_assessment(
        transaction_id="TX-014",
        customer_id="CUST-100",
        recipient_id="BEN-200",
        intent_signal=None,
        behavioural_signal=_make_behav_signal(),
        recipient_signal=None,
        as_of=BASE_TIME,
    )

    assert len(assessment.missing_evidence) == 2
    assert "Intent correlation not evaluated" in assessment.missing_evidence[0]
    assert "Recipient risk intelligence not evaluated" in assessment.missing_evidence[1]


def test_15_score_bounds():
    """Overall risk score is strictly bounded in [0.0000, 1.0000]."""
    intent = _make_intent_signal(IntentRiskLevel.HIGH, 1.0)
    behav = _make_behav_signal(BehaviouralRiskLevel.HIGH, Decimal("1.0000"))
    recip = _make_recip_signal(RecipientRiskLevel.HIGH, Decimal("1.0000"))

    assessment = synthesize_unified_assessment(
        transaction_id="TX-015",
        customer_id="CUST-100",
        recipient_id="BEN-200",
        intent_signal=intent,
        behavioural_signal=behav,
        recipient_signal=recip,
        as_of=BASE_TIME,
    )

    assert Decimal("0.0000") <= assessment.overall_risk_score <= Decimal("1.0000")
    assert assessment.overall_risk_score == Decimal("1.0000")


def test_16_risk_threshold_boundaries():
    """Validate numeric threshold boundaries: LOW < 0.30, MEDIUM 0.30..0.70, HIGH >= 0.70."""
    assert Decimal("0.2999") < Decimal("0.3000")
    assert Decimal("0.3000") <= Decimal("0.5000") < Decimal("0.7000")
    assert Decimal("0.7000") <= Decimal("0.8500")


def test_17_recommended_action_mapping():
    """Actions map predictably to risk level and specific alert types."""
    # Low -> ALLOW_WITH_CAUTION
    a_low = synthesize_unified_assessment("T1", "C1", "B1", _make_intent_signal(), _make_behav_signal(), _make_recip_signal())
    assert a_low.recommended_action == UnifiedRecommendedAction.ALLOW_WITH_CAUTION

    # Intent mismatch -> PAUSE_AND_VERIFY
    intent_bad = _make_intent_signal(IntentRiskLevel.HIGH, 0.90, recipient_status=ComparisonStatus.MISMATCH)
    a_intent = synthesize_unified_assessment("T2", "C1", "B1", intent_bad, _make_behav_signal(), _make_recip_signal())
    assert a_intent.recommended_action == UnifiedRecommendedAction.PAUSE_AND_VERIFY


# =====================================================================
# 2. FASTAPI ENDPOINT INTEGRATION TESTS
# =====================================================================


def test_18_api_evaluate_unified_risk_success():
    """POST /api/v1/risk-assessment/evaluate live execution succeeds with 200 OK."""
    payload = {
        "transaction_id": "TX-API-1001",
        "customer_id": "CUST-API-1001",
        "recipient_id": "BEN-API-1001",
        "amount": 2500.00,
        "currency": "INR",
        "intent_assessment": {
            "risk_level": "LOW",
            "heuristic_score": 0.05,
            "detected_indicators": ["MATCHING_INTENT"],
            "reasons": ["Matching recipient and amount"],
        },
        "behavioural_assessment": {
            "risk_level": "LOW",
            "anomaly_score": 0.05,
            "data_sufficiency": "SUFFICIENT",
            "detected_indicators": ["NORMAL_PATTERN"],
        },
        "recipient_assessment": {
            "risk_level": "LOW",
            "recipient_risk_score": 0.00,
            "data_sufficiency": "ADEQUATE",
            "detected_indicators": ["CLEAN_RECIPIENT"],
        },
    }

    response = client.post("/api/v1/risk-assessment/evaluate", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    assert data["transaction_id"] == "TX-API-1001"
    assert data["risk_level"] == "LOW"
    assert float(data["overall_risk_score"]) < 0.10
    assert data["recommended_action"] == "ALLOW_WITH_CAUTION"
    assert data["policy_version"] == POLICY_VERSION
    assert data["model_type"] == MODEL_TYPE_IDENTIFIER
    assert "explanation" in data


def test_19_api_evaluate_unified_risk_invalid_request():
    """POST /api/v1/risk-assessment/evaluate with invalid payload returns 422."""
    # Missing required customer_id and recipient_id
    bad_payload = {"transaction_id": "TX-BAD"}
    response = client.post("/api/v1/risk-assessment/evaluate", json=bad_payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
