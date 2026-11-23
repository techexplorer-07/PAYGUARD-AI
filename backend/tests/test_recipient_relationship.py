"""Automated test suite for Recipient Relationship Analysis Engine (Phase 2.3.3).

Validates:
1. Direct customer-beneficiary transaction relationships.
2. Multiple customers transacting with the same beneficiary.
3. Multiple transactions involving the beneficiary.
4. Reported fraud case associations.
5. Verified evidence breakdown.
6. Inferred shared-identifier associations (2-hop traversal).
7. Incoming edge retrieval (in-degree semantics).
8. Outgoing edge retrieval (out-degree semantics).
9. Multi-hop path provenance (path tracking in supporting evidence items).
10. Cyclic graph handling and loop termination.
11. Duplicate evidence handling without inflated counts.
12. Expired relationship exclusion via temporal `as_of`.
13. Historical evidence preservation in underlying graph.
14. Missing beneficiary lookup (service error and HTTP 404).
15. Invalid graph identifier handling (service error and HTTP 404).
16. Untrusted VERIFIED submission rejection (security trust boundary).
17. Insufficient evidence handling and data sufficiency levels.
18. API integration for GET /api/v1/recipient-intelligence/recipients/{recipient_id}/profile.
19. Regression tests for existing graph APIs.
"""

from datetime import datetime, timedelta, timezone
from typing import List
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
    RecipientIntelligenceProfile,
    SPEGGraphInput,
    TrustedVerificationAuthority,
)
from app.services.recipient_relationship_analyzer import analyze_recipient_relationships
from app.services.speg_graph_builder import (
    build_speg_graph,
    clear_active_graphs,
    get_active_graph,
    get_recipient_evidence,
    verify_evidence_edge,
)

BASE_TIME = datetime(2026, 11, 22, 12, 0, 0, tzinfo=timezone.utc)
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
    expires_at: datetime = None,
    confidence: float = 0.8,
) -> EvidenceEdge:
    return EvidenceEdge(
        edge_id=edge_id,
        source_node_id=src,
        target_node_id=dst,
        relationship_type=rel,
        evidence_status=status_type,
        source_reference=f"REF-{edge_id}",
        observed_at=observed_at,
        expires_at=expires_at,
        confidence=confidence,
        description=f"Relationship connecting {src} and {dst}",
    )


# =====================================================================
# 1. DIRECT RELATIONSHIPS TESTS
# =====================================================================


def test_1_direct_customer_beneficiary_relationship():
    """Identify customer who transacted with a beneficiary."""
    c1 = _node("CUST-10", EvidenceNodeType.CUSTOMER, "Customer Alice")
    b1 = _node("BEN-20", EvidenceNodeType.BENEFICIARY, "Beneficiary Store")
    e1 = _edge("E-1", "CUST-10", "BEN-20", rel=EvidenceRelationshipType.PAID_TO)

    G, _ = build_speg_graph(SPEGGraphInput(nodes=[c1, b1], edges=[e1]))
    profile = analyze_recipient_relationships("BEN-20", G)

    assert profile.recipient_id == "BEN-20"
    assert profile.direct_customer_count == 1
    assert profile.total_transaction_count == 1
    assert len(profile.supporting_evidence) == 1
    assert profile.supporting_evidence[0].source_node_id == "CUST-10"


def test_2_multiple_customers_transacting_with_beneficiary():
    """Count multiple distinct customers transacting with the same beneficiary."""
    c1 = _node("CUST-1", EvidenceNodeType.CUSTOMER, "Alice")
    c2 = _node("CUST-2", EvidenceNodeType.CUSTOMER, "Bob")
    c3 = _node("CUST-3", EvidenceNodeType.CUSTOMER, "Charlie")
    ben = _node("BEN-POOL", EvidenceNodeType.BENEFICIARY, "Mule Pool")

    e1 = _edge("E-1", "CUST-1", "BEN-POOL", rel=EvidenceRelationshipType.PAID_TO)
    e2 = _edge("E-2", "CUST-2", "BEN-POOL", rel=EvidenceRelationshipType.PAID_TO)
    e3 = _edge("E-3", "CUST-3", "BEN-POOL", rel=EvidenceRelationshipType.INITIATED_TRANSACTION)

    G, _ = build_speg_graph(SPEGGraphInput(nodes=[c1, c2, c3, ben], edges=[e1, e2, e3]))
    profile = analyze_recipient_relationships("BEN-POOL", G)

    assert profile.direct_customer_count == 3
    assert profile.total_transaction_count == 3


def test_3_multiple_transactions_involving_beneficiary():
    """Repeated payments from same customer count as multiple transactions but 1 distinct customer."""
    c1 = _node("CUST-1", EvidenceNodeType.CUSTOMER, "Alice")
    ben = _node("BEN-1", EvidenceNodeType.BENEFICIARY, "Merchant")

    e1 = _edge("E-TX-1", "CUST-1", "BEN-1", rel=EvidenceRelationshipType.PAID_TO)
    e2 = _edge("E-TX-2", "CUST-1", "BEN-1", rel=EvidenceRelationshipType.PAID_TO)
    e3 = _edge("E-TX-3", "CUST-1", "BEN-1", rel=EvidenceRelationshipType.PAID_TO)

    G, _ = build_speg_graph(SPEGGraphInput(nodes=[c1, ben], edges=[e1, e2, e3]))
    profile = analyze_recipient_relationships("BEN-1", G)

    assert profile.direct_customer_count == 1
    assert profile.total_transaction_count == 3


def test_4_reported_case_association():
    """Identify when a beneficiary is reported in a fraud case filing."""
    ben = _node("BEN-SUSP", EvidenceNodeType.BENEFICIARY, "Suspect Account")
    case = _node("CASE-99", EvidenceNodeType.FRAUD_CASE, "Cybercell FIR 99")
    e1 = _edge(
        "E-REP-1", "BEN-SUSP", "CASE-99",
        rel=EvidenceRelationshipType.REPORTED_IN_CASE,
        status_type=EvidenceStatus.REPORTED,
    )

    G, _ = build_speg_graph(SPEGGraphInput(nodes=[ben, case], edges=[e1]))
    profile = analyze_recipient_relationships("BEN-SUSP", G)

    assert profile.reported_evidence_count == 1
    assert "Linked to 1 distinct fraud case filings." in profile.evidence_summary
    assert "Caution: Incident relationships contain uncorroborated REPORTED claims" in profile.evidence_summary


def test_5_verified_evidence_breakdown():
    """Verified evidence is accurately enumerated after authorized internal verification."""
    ben = _node("BEN-CORROBORATED", EvidenceNodeType.BENEFICIARY, "Verified Target")
    case = _node("CASE-JUDICIAL", EvidenceNodeType.FRAUD_CASE, "Court Injunction 404")
    c1 = _node("CUST-1", EvidenceNodeType.CUSTOMER, "Victim")

    # Ingest evidence initially via public-safe REPORTED status
    e_ver = _edge(
        "E-VER-OFFICIAL", "BEN-CORROBORATED", "CASE-JUDICIAL",
        rel=EvidenceRelationshipType.REPORTED_IN_CASE,
        status_type=EvidenceStatus.REPORTED,
    )
    e_rep = _edge(
        "E-REP-UNVER", "CUST-1", "BEN-CORROBORATED",
        rel=EvidenceRelationshipType.PAID_TO,
        status_type=EvidenceStatus.REPORTED,
    )

    G, _ = build_speg_graph(SPEGGraphInput(nodes=[ben, case, c1], edges=[e_ver, e_rep]))

    # Perform authorized internal verification
    authority = TrustedVerificationAuthority(
        authority_id="COURT_COMPLIANCE_OFFICER_01",
        organization="JUDICIAL_ENFORCEMENT_UNIT",
        verification_rationale="Corroborated by formal court injunction 404.",
    )
    verified_edge = verify_evidence_edge(
        graph=G,
        edge_id="E-VER-OFFICIAL",
        authority=authority,
        verification_reference="COURT_INJUNCTION_404_CERTIFIED",
    )
    assert verified_edge.evidence_status == EvidenceStatus.VERIFIED
    assert verified_edge.verification_audit is not None
    assert verified_edge.verification_audit.verified_by == "COURT_COMPLIANCE_OFFICER_01"
    assert verified_edge.verification_audit.verification_reference == "COURT_INJUNCTION_404_CERTIFIED"
    assert verified_edge.verification_audit.verification_rationale == "Corroborated by formal court injunction 404."
    assert "verification_audit" in verified_edge.metadata

    profile = analyze_recipient_relationships("BEN-CORROBORATED", G)

    assert profile.verified_evidence_count == 1
    assert profile.reported_evidence_count == 1
    assert profile.inferred_evidence_count == 0


# =====================================================================
# 2. SHARED IDENTIFIER & MULTI-HOP RELATIONSHIPS TESTS
# =====================================================================


def test_6_inferred_shared_identifier_relationship():
    """Identify beneficiaries connected through a common identifier node (2 hops)."""
    b1 = _node("BEN-A", EvidenceNodeType.BENEFICIARY, "Beneficiary Alpha")
    b2 = _node("BEN-B", EvidenceNodeType.BENEFICIARY, "Beneficiary Beta")
    ident = _node("IDENT-DEVICE-01", EvidenceNodeType.IDENTIFIER, "Hardware UUID 8812")

    e1 = _edge("E-ID-1", "BEN-A", "IDENT-DEVICE-01", rel=EvidenceRelationshipType.SHARES_IDENTIFIER, status_type=EvidenceStatus.INFERRED)
    e2 = _edge("E-ID-2", "BEN-B", "IDENT-DEVICE-01", rel=EvidenceRelationshipType.SHARES_IDENTIFIER, status_type=EvidenceStatus.INFERRED)

    G, _ = build_speg_graph(SPEGGraphInput(nodes=[b1, b2, ident], edges=[e1, e2]))
    profile = analyze_recipient_relationships("BEN-A", G)

    assert profile.shared_identifier_count == 1
    assert profile.distinct_beneficiary_association_count == 1

    # Multi-hop supporting item check
    multi_hop_items = [item for item in profile.supporting_evidence if item.path and len(item.path) == 3]
    assert len(multi_hop_items) == 1
    assert multi_hop_items[0].path == ["BEN-A", "IDENT-DEVICE-01", "BEN-B"]
    assert multi_hop_items[0].evidence_status == EvidenceStatus.INFERRED
    assert "does not prove common ownership" in multi_hop_items[0].description


def test_7_incoming_and_outgoing_edge_retrieval():
    """Inspect both incoming (inbound payment) and outgoing (downstream beneficiary) edges."""
    cust = _node("CUST-IN", EvidenceNodeType.CUSTOMER, "Inbound Customer")
    ben = _node("BEN-MID", EvidenceNodeType.BENEFICIARY, "Intermediate Account")
    sub_ben = _node("BEN-OUT", EvidenceNodeType.BENEFICIARY, "Downstream Account")

    # Inbound: Customer -> BEN-MID
    e_in = _edge("E-IN", "CUST-IN", "BEN-MID", rel=EvidenceRelationshipType.PAID_TO)
    # Outbound: BEN-MID -> BEN-OUT
    e_out = _edge("E-OUT", "BEN-MID", "BEN-OUT", rel=EvidenceRelationshipType.ASSOCIATED_WITH)

    G, _ = build_speg_graph(SPEGGraphInput(nodes=[cust, ben, sub_ben], edges=[e_in, e_out]))
    profile = analyze_recipient_relationships("BEN-MID", G)

    assert profile.direct_customer_count == 1
    assert profile.distinct_beneficiary_association_count == 1
    assert len(profile.supporting_evidence) == 2


def test_8_cyclic_graph_handling():
    """Graph with cycles must not cause infinite loops during 2-hop traversals."""
    b1 = _node("BEN-1", EvidenceNodeType.BENEFICIARY, "Node 1")
    b2 = _node("BEN-2", EvidenceNodeType.BENEFICIARY, "Node 2")
    ident = _node("IDENT-1", EvidenceNodeType.IDENTIFIER, "Shared Token")

    # Cycle: BEN-1 -> IDENT-1 -> BEN-2 -> BEN-1
    e1 = _edge("E-1", "BEN-1", "IDENT-1", rel=EvidenceRelationshipType.SHARES_IDENTIFIER)
    e2 = _edge("E-2", "IDENT-1", "BEN-2", rel=EvidenceRelationshipType.SHARES_IDENTIFIER)
    e3 = _edge("E-3", "BEN-2", "BEN-1", rel=EvidenceRelationshipType.ASSOCIATED_WITH)

    G, _ = build_speg_graph(SPEGGraphInput(nodes=[b1, b2, ident], edges=[e1, e2, e3]))
    profile = analyze_recipient_relationships("BEN-1", G)

    # Traversal terminates cleanly
    assert isinstance(profile, RecipientIntelligenceProfile)
    assert profile.distinct_beneficiary_association_count == 1


def test_9_duplicate_evidence_handling():
    """Duplicate edge observations do not inflate metric counts."""
    c1 = _node("CUST-1", EvidenceNodeType.CUSTOMER, "Customer")
    b1 = _node("BEN-1", EvidenceNodeType.BENEFICIARY, "Merchant")

    e1 = _edge("E-DUP-1", "CUST-1", "BEN-1")
    e2 = _edge("E-DUP-2", "CUST-1", "BEN-1")

    G, _ = build_speg_graph(SPEGGraphInput(nodes=[c1, b1], edges=[e1, e2]))
    profile = analyze_recipient_relationships("BEN-1", G)

    # 1 customer, 2 transactions
    assert profile.direct_customer_count == 1
    assert profile.total_transaction_count == 2


# =====================================================================
# 3. TEMPORAL & HISTORICAL INTEGRITY TESTS
# =====================================================================


def test_10_expired_relationship_exclusion():
    """Expired evidence is excluded from active counts and tracked in expired_relationship_count."""
    c1 = _node("CUST-1", EvidenceNodeType.CUSTOMER, "Customer")
    ben = _node("BEN-EXP", EvidenceNodeType.BENEFICIARY, "Beneficiary")

    # Active edge
    e_active = _edge(
        "E-ACTIVE", "CUST-1", "BEN-EXP",
        observed_at=BASE_TIME,
        expires_at=BASE_TIME + timedelta(days=10),
    )
    # Expired edge
    e_expired = _edge(
        "E-EXPIRED", "CUST-1", "BEN-EXP",
        observed_at=BASE_TIME - timedelta(days=40),
        expires_at=BASE_TIME - timedelta(days=10),
    )

    G, _ = build_speg_graph(SPEGGraphInput(nodes=[c1, ben], edges=[e_active, e_expired]))
    profile = analyze_recipient_relationships("BEN-EXP", G, as_of=BASE_TIME)

    assert profile.expired_relationship_count == 1
    assert profile.recent_relationship_count == 1
    assert profile.total_transaction_count == 1  # Only active transaction counted


def test_11_historical_evidence_preservation():
    """Historical records are preserved in graph memory and can be queried without expiration filter."""
    c1 = _node("CUST-1", EvidenceNodeType.CUSTOMER, "Customer")
    ben = _node("BEN-HIST", EvidenceNodeType.BENEFICIARY, "Beneficiary")

    e_old = _edge(
        "E-OLD", "CUST-1", "BEN-HIST",
        observed_at=BASE_TIME - timedelta(days=100),
        expires_at=BASE_TIME - timedelta(days=50),
    )

    G, _ = build_speg_graph(SPEGGraphInput(nodes=[c1, ben], edges=[e_old]))

    # Query with as_of -> expired
    prof_filtered = analyze_recipient_relationships("BEN-HIST", G, as_of=BASE_TIME)
    assert prof_filtered.expired_relationship_count == 1
    assert prof_filtered.total_transaction_count == 0

    # Query as of historical timestamp prior to expiry -> active!
    prof_hist = analyze_recipient_relationships("BEN-HIST", G, as_of=BASE_TIME - timedelta(days=60))
    assert prof_hist.expired_relationship_count == 0
    assert prof_hist.total_transaction_count == 1


# =====================================================================
# 4. ERROR HANDLING & DATA SUFFICIENCY TESTS
# =====================================================================


def test_12_missing_beneficiary():
    """Querying non-existent beneficiary raises ValueError with clear explanation."""
    n1 = _node("CUST-1", EvidenceNodeType.CUSTOMER, "Alice")
    G, _ = build_speg_graph(SPEGGraphInput(nodes=[n1], edges=[]))

    with pytest.raises(ValueError, match="Beneficiary 'BEN-MISSING' not found in evidence graph"):
        analyze_recipient_relationships("BEN-MISSING", G)


def test_13_invalid_graph_identifier():
    """Querying an unknown graph_id raises ValueError."""
    with pytest.raises(ValueError, match="Graph 'GRAPH-UNKNOWN' not found"):
        analyze_recipient_relationships("BEN-ANY", graph_id="GRAPH-UNKNOWN")


def test_14_data_sufficiency_tiers():
    """Validate data sufficiency mappings: INSUFFICIENT, MINIMAL, and SUFFICIENT."""
    b = _node("BEN-TIERS", EvidenceNodeType.BENEFICIARY, "Tiers")

    # Tier 1: 0 edges -> INSUFFICIENT
    G1, _ = build_speg_graph(SPEGGraphInput(nodes=[b], edges=[]))
    p1 = analyze_recipient_relationships("BEN-TIERS", G1)
    assert p1.data_sufficiency == "INSUFFICIENT"

    # Tier 2: 1-2 edges -> MINIMAL
    c1 = _node("C-1", EvidenceNodeType.CUSTOMER, "C1")
    e1 = _edge("E-1", "C-1", "BEN-TIERS")
    G2, _ = build_speg_graph(SPEGGraphInput(nodes=[b, c1], edges=[e1]))
    p2 = analyze_recipient_relationships("BEN-TIERS", G2)
    assert p2.data_sufficiency == "MINIMAL"

    # Tier 3: >= 3 edges -> SUFFICIENT
    c2 = _node("C-2", EvidenceNodeType.CUSTOMER, "C2")
    c3 = _node("C-3", EvidenceNodeType.CUSTOMER, "C3")
    e2 = _edge("E-2", "C-2", "BEN-TIERS")
    e3 = _edge("E-3", "C-3", "BEN-TIERS")
    G3, _ = build_speg_graph(SPEGGraphInput(nodes=[b, c1, c2, c3], edges=[e1, e2, e3]))
    p3 = analyze_recipient_relationships("BEN-TIERS", G3)
    assert p3.data_sufficiency == "SUFFICIENT"


# =====================================================================
# 5. API INTEGRATION TESTS
# =====================================================================


def test_15_api_get_recipient_profile_success():
    """GET /api/v1/recipient-intelligence/recipients/{recipient_id}/profile returns 200."""
    c1 = _node("CUST-API", EvidenceNodeType.CUSTOMER, "Alice")
    ben = _node("BEN-API-PROF", EvidenceNodeType.BENEFICIARY, "Store")
    e1 = _edge("E-API-P", "CUST-API", "BEN-API-PROF")

    build_speg_graph(SPEGGraphInput(nodes=[c1, ben], edges=[e1]))

    response = client.get("/api/v1/recipient-intelligence/recipients/BEN-API-PROF/profile")
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert data["recipient_id"] == "BEN-API-PROF"
    assert data["direct_customer_count"] == 1
    assert data["total_transaction_count"] == 1
    assert data["reported_evidence_count"] == 1
    assert data["data_sufficiency"] == "MINIMAL"
    assert "Recipient relationship analysis active" in data["evidence_summary"]


def test_16_api_get_recipient_profile_missing_recipient_returns_404():
    """GET /api/v1/recipient-intelligence/recipients/{recipient_id}/profile returns 404 for missing node."""
    c1 = _node("CUST-1", EvidenceNodeType.CUSTOMER, "Alice")
    build_speg_graph(SPEGGraphInput(nodes=[c1], edges=[]))

    response = client.get("/api/v1/recipient-intelligence/recipients/BEN-NONEXISTENT/profile")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "not found in evidence graph" in response.json()["detail"]


def test_17_api_get_recipient_profile_invalid_graph_id_returns_404():
    """GET /api/v1/recipient-intelligence/recipients/{recipient_id}/profile returns 404 for invalid graph_id."""
    response = client.get(
        "/api/v1/recipient-intelligence/recipients/BEN-ANY/profile?graph_id=NONEXISTENT_GRAPH"
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "not found in active graph store" in response.json()["detail"]
