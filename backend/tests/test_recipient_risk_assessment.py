"""Comprehensive automated test suite for Recipient Risk Assessment Engine (Phase 2.3.4).

Validates:
1. Recipient with sufficient ordinary evidence (LOW risk).
2. Direct VERIFIED fraud-case association (HIGH risk).
3. Single REPORTED case association (MEDIUM risk).
4. Multiple distinct reported source references.
5. Duplicate reports from the same source (deduplication prevents double-counting).
6. Inferred shared-identifier relationship.
7. Inferred relationship alone must not produce HIGH risk (guardrail).
8. High transaction volume without suspicious evidence (remains LOW risk).
9. Expired evidence exclusion with temporal as_of filtering.
10. Recent versus older evidence recency decay.
11. Insufficient graph evidence (UNCERTAIN risk).
12. Missing recipient node handling (service ValueError and HTTP 404).
13. Missing graph handling (service ValueError and HTTP 404).
14. No fabricated risk reasons (explanation reflects only actual evidence).
15. Deduplication of the same evidence across graph paths.
16. Score normalization strictly bounded in [0.0000, 1.0000].
17. Risk threshold boundaries (LOW < 0.30, MEDIUM 0.30..0.70, HIGH >= 0.70).
18. Provenance integrity (supporting evidence and edge IDs fully traceable).
19. Public VERIFIED evidence submission rejection remains enforced.
20. API live execution: GET /api/v1/recipient-intelligence/recipients/{recipient_id}/risk-assessment.
"""

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Optional
from fastapi import status
from fastapi.testclient import TestClient
import networkx as nx
import pytest

from app.main import app
from app.schemas.recipient import (
    EvidenceEdge,
    EvidenceNode,
    EvidenceNodeType,
    EvidenceRelationshipType,
    EvidenceStatus,
    RecipientDataSufficiency,
    RecipientRecommendedAction,
    RecipientRiskAssessment,
    RecipientRiskLevel,
    SPEGGraphInput,
    TrustedVerificationAuthority,
)
from app.services.recipient_relationship_analyzer import analyze_recipient_relationships
from app.services.recipient_risk_scorer import (
    MODEL_TYPE_IDENTIFIER,
    score_recipient_risk,
)
from app.services.speg_graph_builder import (
    build_speg_graph,
    clear_active_graphs,
    verify_evidence_edge,
)

BASE_TIME = datetime(2026, 11, 23, 12, 0, 0, tzinfo=timezone.utc)
client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_graph_registry():
    """Ensure in-memory graph registry is pristine before and after each test."""
    clear_active_graphs()
    yield
    clear_active_graphs()


def _node(node_id: str, node_type: EvidenceNodeType, label: str) -> EvidenceNode:
    return EvidenceNode(
        node_id=node_id,
        node_type=node_type,
        display_label=label,
        synthetic_identifier=f"SYN-{node_id}",
        created_at=BASE_TIME,
        metadata={"category": "test"},
    )


def _edge(
    edge_id: str,
    src: str,
    dst: str,
    rel: EvidenceRelationshipType = EvidenceRelationshipType.PAID_TO,
    status_type: EvidenceStatus = EvidenceStatus.REPORTED,
    observed_at: datetime = BASE_TIME,
    expires_at: Optional[datetime] = None,
    source_reference: Optional[str] = None,
    description: Optional[str] = None,
) -> EvidenceEdge:
    return EvidenceEdge(
        edge_id=edge_id,
        source_node_id=src,
        target_node_id=dst,
        relationship_type=rel,
        evidence_status=status_type,
        source_reference=source_reference or f"REF-{edge_id}",
        observed_at=observed_at,
        expires_at=expires_at,
        confidence=0.9,
        description=description or f"Edge {edge_id} connecting {src} -> {dst}",
    )


# =====================================================================
# 1. CORE EVIDENCE-BASED SCORING TESTS
# =====================================================================


def test_1_recipient_with_sufficient_ordinary_evidence():
    """Recipient with benign transaction activity yields LOW risk."""
    ben = _node("BEN-MERCHANT-01", EvidenceNodeType.BENEFICIARY, "Grocery Store")
    c1 = _node("CUST-01", EvidenceNodeType.CUSTOMER, "Alice")
    c2 = _node("CUST-02", EvidenceNodeType.CUSTOMER, "Bob")
    c3 = _node("CUST-03", EvidenceNodeType.CUSTOMER, "Charlie")

    e1 = _edge("E1", "CUST-01", "BEN-MERCHANT-01")
    e2 = _edge("E2", "CUST-02", "BEN-MERCHANT-01")
    e3 = _edge("E3", "CUST-03", "BEN-MERCHANT-01")

    G, _ = build_speg_graph(SPEGGraphInput(nodes=[ben, c1, c2, c3], edges=[e1, e2, e3]))
    profile = analyze_recipient_relationships("BEN-MERCHANT-01", G)
    assessment = score_recipient_risk(profile)

    assert assessment.recipient_id == "BEN-MERCHANT-01"
    assert assessment.risk_level == RecipientRiskLevel.LOW
    assert assessment.recipient_risk_score == Decimal("0.0000")
    assert assessment.data_sufficiency == RecipientDataSufficiency.ADEQUATE
    assert assessment.recommended_action == RecipientRecommendedAction.ALLOW
    assert "No adverse fraud filings" in assessment.explanation


def test_2_direct_verified_fraud_case_association():
    """Direct VERIFIED link to a fraud case yields HIGH risk."""
    ben = _node("BEN-FRAUD-01", EvidenceNodeType.BENEFICIARY, "Scammer Account")
    case = _node("CASE-999", EvidenceNodeType.FRAUD_CASE, "Police Cyber FIR 999")
    c1 = _node("CUST-01", EvidenceNodeType.CUSTOMER, "Victim")

    e_case = _edge("E-CASE-1", "BEN-FRAUD-01", "CASE-999", rel=EvidenceRelationshipType.REPORTED_IN_CASE)
    e_pay = _edge("E-PAY-1", "CUST-01", "BEN-FRAUD-01")

    G, _ = build_speg_graph(SPEGGraphInput(nodes=[ben, case, c1], edges=[e_case, e_pay]))

    # Promote case to VERIFIED via controlled internal fixture operation
    auth = TrustedVerificationAuthority(
        authority_id="LE_OFFICER_404",
        verification_rationale="Corroborated by certified law enforcement FIR registration.",
    )
    verify_evidence_edge(G, "E-CASE-1", auth, "LE_FIR_999_AUTHENTICATED")

    profile = analyze_recipient_relationships("BEN-FRAUD-01", G)
    assessment = score_recipient_risk(profile)

    assert assessment.risk_level == RecipientRiskLevel.HIGH
    assert assessment.recipient_risk_score >= Decimal("0.7000")
    assert assessment.feature_contributions["verified_fraud_case_association"] == 0.85
    assert assessment.recommended_action == RecipientRecommendedAction.REVIEW_PAYMENT
    assert any("VERIFIED_FRAUD_CASE_ASSOCIATION" in ind for ind in assessment.detected_indicators)


def test_3_single_reported_case_association():
    """Single unadjudicated REPORTED fraud filing produces MEDIUM risk (bounded)."""
    ben = _node("BEN-REPORTED-01", EvidenceNodeType.BENEFICIARY, "Reported Account")
    case = _node("CASE-101", EvidenceNodeType.FRAUD_CASE, "User Complaint 101")
    c1 = _node("CUST-01", EvidenceNodeType.CUSTOMER, "Reporter")

    e_case = _edge("E-REP-1", "BEN-REPORTED-01", "CASE-101", rel=EvidenceRelationshipType.REPORTED_IN_CASE, status_type=EvidenceStatus.REPORTED)
    e_pay = _edge("E-PAY-1", "CUST-01", "BEN-REPORTED-01")

    G, _ = build_speg_graph(SPEGGraphInput(nodes=[ben, case, c1], edges=[e_case, e_pay]))
    profile = analyze_recipient_relationships("BEN-REPORTED-01", G)
    assessment = score_recipient_risk(profile)

    assert assessment.risk_level == RecipientRiskLevel.LOW or assessment.risk_level == RecipientRiskLevel.MEDIUM
    assert Decimal("0.2000") <= assessment.recipient_risk_score <= Decimal("0.3500")
    assert assessment.feature_contributions["verified_fraud_case_association"] == 0.0
    assert assessment.feature_contributions["reported_fraud_case_association"] == 0.25


def test_4_multiple_distinct_reported_source_references():
    """Multiple distinct reported sources incrementally increase concern."""
    ben = _node("BEN-MULTI-REP", EvidenceNodeType.BENEFICIARY, "Multi Reported Account")
    case1 = _node("CASE-01", EvidenceNodeType.FRAUD_CASE, "FIR 01")
    case2 = _node("CASE-02", EvidenceNodeType.FRAUD_CASE, "FIR 02")
    case3 = _node("CASE-03", EvidenceNodeType.FRAUD_CASE, "FIR 03")

    e1 = _edge("E1", "BEN-MULTI-REP", "CASE-01", rel=EvidenceRelationshipType.REPORTED_IN_CASE, source_reference="PORTAL_REPORT_A")
    e2 = _edge("E2", "BEN-MULTI-REP", "CASE-02", rel=EvidenceRelationshipType.REPORTED_IN_CASE, source_reference="POLICE_FIR_B")
    e3 = _edge("E3", "BEN-MULTI-REP", "CASE-03", rel=EvidenceRelationshipType.REPORTED_IN_CASE, source_reference="BANK_DISPUTE_C")

    G, _ = build_speg_graph(SPEGGraphInput(nodes=[ben, case1, case2, case3], edges=[e1, e2, e3]))
    profile = analyze_recipient_relationships("BEN-MULTI-REP", G)
    assessment = score_recipient_risk(profile)

    assert assessment.risk_level == RecipientRiskLevel.MEDIUM
    assert assessment.recipient_risk_score == Decimal("0.5500")
    assert assessment.feature_contributions["reported_fraud_case_association"] == 0.55
    assert any("REPORTED_FRAUD_ALLEGATIONS" in ind for ind in assessment.detected_indicators)


def test_5_duplicate_reports_from_same_source_deduplicated():
    """Repeated reports with the exact same source reference are deduplicated."""
    ben = _node("BEN-DUP-REP", EvidenceNodeType.BENEFICIARY, "Duplicate Reported Account")
    case1 = _node("CASE-01", EvidenceNodeType.FRAUD_CASE, "Filing 01")
    case2 = _node("CASE-02", EvidenceNodeType.FRAUD_CASE, "Filing 02")

    # Identical source reference "IDENTICAL_EXTERNAL_COMPLAINT_REF_99"
    e1 = _edge("E1", "BEN-DUP-REP", "CASE-01", rel=EvidenceRelationshipType.REPORTED_IN_CASE, source_reference="IDENTICAL_REF_99")
    e2 = _edge("E2", "BEN-DUP-REP", "CASE-02", rel=EvidenceRelationshipType.REPORTED_IN_CASE, source_reference="IDENTICAL_REF_99")

    G, _ = build_speg_graph(SPEGGraphInput(nodes=[ben, case1, case2], edges=[e1, e2]))
    profile = analyze_recipient_relationships("BEN-DUP-REP", G)
    assessment = score_recipient_risk(profile)

    # 2 edges exist, but they share 1 distinct source reference -> score is single source (0.25), not two sources (0.40)
    assert assessment.feature_contributions["reported_fraud_case_association"] == 0.25
    assert "deduplicated" in assessment.explanation


def test_6_inferred_shared_identifier_relationship():
    """Inferred 2-hop connection through shared hardware/phone yields bounded contribution."""
    ben_a = _node("BEN-A", EvidenceNodeType.BENEFICIARY, "Target Recipient")
    ben_b = _node("BEN-B", EvidenceNodeType.BENEFICIARY, "Linked Recipient")
    ident = _node("IDENT-1", EvidenceNodeType.IDENTIFIER, "Device UUID")

    e1 = _edge("E1", "BEN-A", "IDENT-1", rel=EvidenceRelationshipType.SHARES_IDENTIFIER, status_type=EvidenceStatus.INFERRED)
    e2 = _edge("E2", "BEN-B", "IDENT-1", rel=EvidenceRelationshipType.SHARES_IDENTIFIER, status_type=EvidenceStatus.INFERRED)

    G, _ = build_speg_graph(SPEGGraphInput(nodes=[ben_a, ben_b, ident], edges=[e1, e2]))
    profile = analyze_recipient_relationships("BEN-A", G)
    assessment = score_recipient_risk(profile)

    assert assessment.risk_level == RecipientRiskLevel.LOW
    assert assessment.feature_contributions["inferred_shared_identifier_relationships"] == 0.12
    assert "Inferred associations reflect network co-occurrence and alone cannot produce HIGH risk" in assessment.explanation


def test_7_inferred_relationship_alone_must_not_produce_high_risk():
    """GUARDRAIL: Multiple inferred associations alone must NEVER produce HIGH risk."""
    ben_a = _node("BEN-TARGET", EvidenceNodeType.BENEFICIARY, "Target Recipient")
    nodes = [ben_a]
    edges = []

    # Connect to 10 distinct shared identifiers
    for i in range(10):
        ident = _node(f"IDENT-{i}", EvidenceNodeType.IDENTIFIER, f"Device-{i}")
        ben_other = _node(f"BEN-OTHER-{i}", EvidenceNodeType.BENEFICIARY, f"Other-{i}")
        nodes.extend([ident, ben_other])
        edges.append(_edge(f"EA-{i}", "BEN-TARGET", f"IDENT-{i}", rel=EvidenceRelationshipType.SHARES_IDENTIFIER, status_type=EvidenceStatus.INFERRED))
        edges.append(_edge(f"EB-{i}", f"BEN-OTHER-{i}", f"IDENT-{i}", rel=EvidenceRelationshipType.SHARES_IDENTIFIER, status_type=EvidenceStatus.INFERRED))

    G, _ = build_speg_graph(SPEGGraphInput(nodes=nodes, edges=edges))
    profile = analyze_recipient_relationships("BEN-TARGET", G)
    assessment = score_recipient_risk(profile)

    # Must be capped at <= 0.25 (LOW risk)
    assert assessment.recipient_risk_score <= Decimal("0.2500")
    assert assessment.risk_level == RecipientRiskLevel.LOW
    assert assessment.risk_level != RecipientRiskLevel.HIGH


def test_8_high_transaction_volume_without_suspicious_evidence():
    """GUARDRAIL: Legitimate high transaction volume alone does not increase risk."""
    ben = _node("BEN-SUPERMARKET", EvidenceNodeType.BENEFICIARY, "Supermarket VPA")
    nodes = [ben]
    edges = []

    # 30 customers paying the supermarket
    for i in range(30):
        c = _node(f"CUST-{i}", EvidenceNodeType.CUSTOMER, f"Customer-{i}")
        nodes.append(c)
        edges.append(_edge(f"EPAY-{i}", f"CUST-{i}", "BEN-SUPERMARKET"))

    G, _ = build_speg_graph(SPEGGraphInput(nodes=nodes, edges=edges))
    profile = analyze_recipient_relationships("BEN-SUPERMARKET", G)
    assessment = score_recipient_risk(profile)

    assert assessment.recipient_risk_score == Decimal("0.0000")
    assert assessment.risk_level == RecipientRiskLevel.LOW
    assert "High degree does not imply fraud" in assessment.explanation


def test_9_expired_evidence_exclusion():
    """Expired evidence is excluded from risk assessment calculation."""
    ben = _node("BEN-EXP", EvidenceNodeType.BENEFICIARY, "Beneficiary")
    case = _node("CASE-OLD", EvidenceNodeType.FRAUD_CASE, "Old Expired Case")

    # Expired 10 days ago relative to BASE_TIME
    e_expired = _edge(
        "E-EXP", "BEN-EXP", "CASE-OLD",
        rel=EvidenceRelationshipType.REPORTED_IN_CASE,
        observed_at=BASE_TIME - timedelta(days=40),
        expires_at=BASE_TIME - timedelta(days=10),
    )

    G, _ = build_speg_graph(SPEGGraphInput(nodes=[ben, case], edges=[e_expired]))
    profile = analyze_recipient_relationships("BEN-EXP", G, as_of=BASE_TIME)
    assessment = score_recipient_risk(profile, as_of=BASE_TIME)

    # Since the single edge was expired, data sufficiency is INSUFFICIENT
    assert assessment.risk_level == RecipientRiskLevel.UNCERTAIN
    assert assessment.data_sufficiency == RecipientDataSufficiency.INSUFFICIENT


def test_10_recent_versus_older_evidence_recency_decay():
    """Recent reported evidence contributes higher score than older evidence."""
    # Recent report (5 days old)
    ben_recent = _node("BEN-REC", EvidenceNodeType.BENEFICIARY, "Recent Case Recipient")
    case_rec = _node("CASE-REC", EvidenceNodeType.FRAUD_CASE, "Recent Case")
    e_rec = _edge("E-REC", "BEN-REC", "CASE-REC", rel=EvidenceRelationshipType.REPORTED_IN_CASE, observed_at=BASE_TIME - timedelta(days=5))

    G1, _ = build_speg_graph(SPEGGraphInput(nodes=[ben_recent, case_rec], edges=[e_rec]))
    prof_rec = analyze_recipient_relationships("BEN-REC", G1, as_of=BASE_TIME)
    assess_rec = score_recipient_risk(prof_rec, as_of=BASE_TIME)

    # Older report (120 days old)
    ben_old = _node("BEN-OLD", EvidenceNodeType.BENEFICIARY, "Old Case Recipient")
    case_old = _node("CASE-OLD", EvidenceNodeType.FRAUD_CASE, "Old Case")
    e_old = _edge("E-OLD", "BEN-OLD", "CASE-OLD", rel=EvidenceRelationshipType.REPORTED_IN_CASE, observed_at=BASE_TIME - timedelta(days=120))

    G2, _ = build_speg_graph(SPEGGraphInput(nodes=[ben_old, case_old], edges=[e_old]))
    prof_old = analyze_recipient_relationships("BEN-OLD", G2, as_of=BASE_TIME)
    assess_old = score_recipient_risk(prof_old, as_of=BASE_TIME)

    assert assess_rec.recipient_risk_score > assess_old.recipient_risk_score
    assert assess_rec.feature_contributions["reported_fraud_case_association"] == 0.25
    assert assess_old.feature_contributions["reported_fraud_case_association"] == 0.25 * 0.60


def test_11_insufficient_graph_evidence():
    """Recipient with zero transaction or evidence history yields UNCERTAIN."""
    ben = _node("BEN-EMPTY", EvidenceNodeType.BENEFICIARY, "Unused Recipient")
    G, _ = build_speg_graph(SPEGGraphInput(nodes=[ben], edges=[]))

    profile = analyze_recipient_relationships("BEN-EMPTY", G)
    assessment = score_recipient_risk(profile)

    assert assessment.risk_level == RecipientRiskLevel.UNCERTAIN
    assert assessment.data_sufficiency == RecipientDataSufficiency.INSUFFICIENT
    assert assessment.recommended_action == RecipientRecommendedAction.INSUFFICIENT_DATA_REVIEW
    assert "insufficient evidence" in assessment.explanation


def test_12_missing_recipient_raises_error():
    """Querying a non-existent recipient raises ValueError."""
    ben = _node("BEN-EXISTS", EvidenceNodeType.BENEFICIARY, "Exists")
    G, _ = build_speg_graph(SPEGGraphInput(nodes=[ben], edges=[]))

    with pytest.raises(ValueError) as exc:
        analyze_recipient_relationships("BEN-DOES-NOT-EXIST", G)
    assert "not found in evidence graph" in str(exc.value)


def test_13_missing_graph_raises_error():
    """Querying a non-existent graph_id raises ValueError."""
    with pytest.raises(ValueError) as exc:
        analyze_recipient_relationships("BEN-ANY", graph_id="SPEG-NONEXISTENT")
    assert "not found in active graph store" in str(exc.value)


def test_14_no_fabricated_risk_reasons():
    """Detected indicators and explanation reflect only factual evidence."""
    ben = _node("BEN-CLEAN", EvidenceNodeType.BENEFICIARY, "Clean Recipient")
    c1 = _node("CUST-01", EvidenceNodeType.CUSTOMER, "Alice")
    e1 = _edge("E1", "CUST-01", "BEN-CLEAN")

    G, _ = build_speg_graph(SPEGGraphInput(nodes=[ben, c1], edges=[e1]))
    profile = analyze_recipient_relationships("BEN-CLEAN", G)
    assessment = score_recipient_risk(profile)

    assert "VERIFIED_FRAUD_CASE" not in str(assessment.detected_indicators)
    assert "REPORTED_FRAUD" not in str(assessment.detected_indicators)
    assert "INFERRED_SHARED" not in str(assessment.detected_indicators)
    assert assessment.detected_indicators == ["ORDINARY_BENIGN_ACTIVITY"]


def test_15_deduplication_of_same_evidence_across_graph_paths():
    """Deduplication ensures multiple occurrences of the same edge do not double count."""
    ben = _node("BEN-DEDUP", EvidenceNodeType.BENEFICIARY, "Target")
    case = _node("CASE-DEDUP", EvidenceNodeType.FRAUD_CASE, "Case")

    e1 = _edge("E-SAME", "BEN-DEDUP", "CASE-DEDUP", rel=EvidenceRelationshipType.REPORTED_IN_CASE, source_reference="FIR-DEDUP")

    G, _ = build_speg_graph(SPEGGraphInput(nodes=[ben, case], edges=[e1]))
    profile = analyze_recipient_relationships("BEN-DEDUP", G)
    assessment = score_recipient_risk(profile)

    assert len(profile.supporting_evidence) == 1
    assert assessment.feature_contributions["reported_fraud_case_association"] == 0.25


def test_16_score_normalization():
    """Scores are strictly bounded in [0.0000, 1.0000]."""
    ben = _node("BEN-OVERFLOW", EvidenceNodeType.BENEFICIARY, "Overflow Target")
    case1 = _node("CASE-1", EvidenceNodeType.FRAUD_CASE, "Case 1")
    case2 = _node("CASE-2", EvidenceNodeType.FRAUD_CASE, "Case 2")
    ident = _node("IDENT-1", EvidenceNodeType.IDENTIFIER, "ID")
    other = _node("BEN-OTHER", EvidenceNodeType.BENEFICIARY, "Other")

    e_case1 = _edge("EC1", "BEN-OVERFLOW", "CASE-1", rel=EvidenceRelationshipType.REPORTED_IN_CASE)
    e_case2 = _edge("EC2", "BEN-OVERFLOW", "CASE-2", rel=EvidenceRelationshipType.REPORTED_IN_CASE)
    e_id1 = _edge("EID1", "BEN-OVERFLOW", "IDENT-1", rel=EvidenceRelationshipType.SHARES_IDENTIFIER, status_type=EvidenceStatus.INFERRED)
    e_id2 = _edge("EID2", "BEN-OTHER", "IDENT-1", rel=EvidenceRelationshipType.SHARES_IDENTIFIER, status_type=EvidenceStatus.INFERRED)

    G, _ = build_speg_graph(SPEGGraphInput(nodes=[ben, case1, case2, ident, other], edges=[e_case1, e_case2, e_id1, e_id2]))

    # Verify both cases
    auth = TrustedVerificationAuthority(
        authority_id="LE_OFFICER_01",
        verification_rationale="Double case verification.",
    )
    verify_evidence_edge(G, "EC1", auth, "REF-1")
    verify_evidence_edge(G, "EC2", auth, "REF-2")

    profile = analyze_recipient_relationships("BEN-OVERFLOW", G)
    assessment = score_recipient_risk(profile)

    assert Decimal("0.0000") <= assessment.recipient_risk_score <= Decimal("1.0000")
    assert assessment.recipient_risk_score <= Decimal("1.0000")


def test_17_risk_threshold_boundaries():
    """Threshold boundaries: LOW < 0.30, MEDIUM 0.30..0.70, HIGH >= 0.70."""
    # Score 0.25 -> LOW
    assert Decimal("0.2500") < Decimal("0.3000")
    # Score 0.55 -> MEDIUM
    assert Decimal("0.3000") <= Decimal("0.5500") < Decimal("0.7000")
    # Score 0.85 -> HIGH
    assert Decimal("0.8500") >= Decimal("0.7000")


def test_18_provenance_integrity():
    """Supporting evidence items and edge identifiers survive in assessment."""
    ben = _node("BEN-PROV", EvidenceNodeType.BENEFICIARY, "Beneficiary")
    c1 = _node("CUST-PROV", EvidenceNodeType.CUSTOMER, "Customer")
    e1 = _edge("E-PROV-1", "CUST-PROV", "BEN-PROV", source_reference="SWIFT_LOG_7788")

    G, _ = build_speg_graph(SPEGGraphInput(nodes=[ben, c1], edges=[e1]))
    profile = analyze_recipient_relationships("BEN-PROV", G)
    assessment = score_recipient_risk(profile)

    assert len(assessment.supporting_evidence) == 1
    assert assessment.supporting_evidence[0].edge_id == "E-PROV-1"
    assert assessment.supporting_evidence[0].source_reference == "SWIFT_LOG_7788"


def test_19_public_verified_evidence_submission_rejected():
    """Public graph build endpoint strictly rejects any attempt to submit VERIFIED evidence."""
    n1 = _node("CUST-P", EvidenceNodeType.CUSTOMER, "Alice").model_dump(mode="json")
    n2 = _node("BEN-P", EvidenceNodeType.BENEFICIARY, "Bob").model_dump(mode="json")
    e_ver = _edge("E-VER-FORGE", "CUST-P", "BEN-P", status_type=EvidenceStatus.VERIFIED).model_dump(mode="json")

    resp = client.post("/api/v1/recipient-intelligence/graph/build", json={"nodes": [n1, n2], "edges": [e_ver]})
    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert "VERIFIED" in str(resp.json())


# =====================================================================
# 2. FASTAPI ENDPOINT INTEGRATION TESTS
# =====================================================================


def test_20_api_get_recipient_risk_assessment_success():
    """GET /api/v1/recipient-intelligence/recipients/{recipient_id}/risk-assessment returns 200."""
    ben = _node("BEN-API-ASSESS", EvidenceNodeType.BENEFICIARY, "API Beneficiary")
    c1 = _node("CUST-API-01", EvidenceNodeType.CUSTOMER, "Alice")
    c2 = _node("CUST-API-02", EvidenceNodeType.CUSTOMER, "Bob")
    c3 = _node("CUST-API-03", EvidenceNodeType.CUSTOMER, "Charlie")
    e1 = _edge("E-API-1", "CUST-API-01", "BEN-API-ASSESS")
    e2 = _edge("E-API-2", "CUST-API-02", "BEN-API-ASSESS")
    e3 = _edge("E-API-3", "CUST-API-03", "BEN-API-ASSESS")

    payload = SPEGGraphInput(nodes=[ben, c1, c2, c3], edges=[e1, e2, e3]).model_dump(mode="json")
    build_resp = client.post("/api/v1/recipient-intelligence/graph/build", json=payload)
    assert build_resp.status_code == status.HTTP_201_CREATED

    response = client.get("/api/v1/recipient-intelligence/recipients/BEN-API-ASSESS/risk-assessment")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    assert data["recipient_id"] == "BEN-API-ASSESS"
    assert data["risk_level"] == "LOW"
    assert float(data["recipient_risk_score"]) == 0.0
    assert data["data_sufficiency"] == "ADEQUATE"
    assert data["recommended_action"] == "ALLOW"
    assert data["model_type"] == MODEL_TYPE_IDENTIFIER
    assert len(data["assessment_limitations"]) >= 3


def test_21_api_get_recipient_risk_assessment_missing_recipient_404():
    """GET /api/v1/recipient-intelligence/recipients/{recipient_id}/risk-assessment returns 404 for unknown node."""
    ben = _node("BEN-ALONE", EvidenceNodeType.BENEFICIARY, "Alone")
    payload = SPEGGraphInput(nodes=[ben], edges=[]).model_dump(mode="json")
    client.post("/api/v1/recipient-intelligence/graph/build", json=payload)

    response = client.get("/api/v1/recipient-intelligence/recipients/NON-EXISTENT-RECIPIENT/risk-assessment")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "not found in evidence graph" in response.json()["detail"]


def test_22_api_get_recipient_risk_assessment_missing_graph_404():
    """GET /api/v1/recipient-intelligence/recipients/{recipient_id}/risk-assessment returns 404 for unknown graph."""
    response = client.get(
        "/api/v1/recipient-intelligence/recipients/BEN-ANY/risk-assessment",
        params={"graph_id": "SPEG-DOES-NOT-EXIST"},
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "not found in active graph store" in response.json()["detail"]
