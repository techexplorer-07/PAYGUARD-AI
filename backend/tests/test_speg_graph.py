"""Comprehensive automated test suite for Recipient Risk Intelligence and SPEG (Phase 2.3.1 & 2.3.2).

Validates:
1. Valid graph construction with MultiDiGraph.
2. Empty graph handling.
3. Duplicate node ID rejection.
4. Duplicate edge ID rejection.
5. Missing source node rejection.
6. Missing target node rejection.
7. Self-referential edge rejection.
8. Invalid confidence score rejection (< 0.0 or > 1.0).
9. Multiple directed edges between the same two nodes (multi-edge preservation).
10. Provenance attribute retention (audit references, timestamps, descriptions).
11. Verified evidence retrieval and isolation.
12. Reported evidence retrieval and isolation.
13. Inferred association retrieval and isolation.
14. Expired evidence exclusion with temporal `as_of` filtering.
15. Missing recipient lookup (graceful service handling and HTTP 404).
16. Graph serialization into Pydantic models.
17. API endpoint validation and live execution via FastAPI TestClient.
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
    GraphBuildResponse,
    RecipientEvidenceSummary,
    SPEGGraphInput,
    TrustedVerificationAuthority,
)
from app.services.speg_graph_builder import (
    build_internal_speg_graph,
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
    """Ensure in-memory graph registry is clean before and after each test."""
    clear_active_graphs()
    yield
    clear_active_graphs()


def _make_sample_node(node_id: str, node_type: EvidenceNodeType, label: str) -> EvidenceNode:
    return EvidenceNode(
        node_id=node_id,
        node_type=node_type,
        display_label=label,
        synthetic_identifier=f"SYN-{node_id}",
        created_at=BASE_TIME,
        metadata={"category": "sample"},
    )


def _make_sample_edge(
    edge_id: str,
    src: str,
    dst: str,
    rel: EvidenceRelationshipType = EvidenceRelationshipType.PAID_TO,
    status_type: EvidenceStatus = EvidenceStatus.REPORTED,
    confidence: float = 0.9,
    observed_at: datetime = BASE_TIME,
    expires_at: datetime = None,
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
        description=f"Evidence edge connecting {src} and {dst}",
    )


# =====================================================================
# 1. GRAPH CONSTRUCTION & INTEGRITY TESTS
# =====================================================================


def test_1_valid_graph_construction():
    """Valid nodes and edges construct a MultiDiGraph with full attributes."""
    n1 = _make_sample_node("CUST-001", EvidenceNodeType.CUSTOMER, "Alice Customer")
    n2 = _make_sample_node("BEN-901", EvidenceNodeType.BENEFICIARY, "UPI merchant@upi")
    e1 = _make_sample_edge("EDGE-001", "CUST-001", "BEN-901")

    payload = SPEGGraphInput(nodes=[n1, n2], edges=[e1])
    G, resp = build_speg_graph(payload)

    assert isinstance(G, nx.MultiDiGraph)
    assert G.number_of_nodes() == 2
    assert G.number_of_edges() == 1
    assert resp.status == "success"
    assert resp.node_count == 2
    assert resp.edge_count == 1
    assert resp.node_type_counts["CUSTOMER"] == 1
    assert resp.node_type_counts["BENEFICIARY"] == 1
    assert resp.evidence_status_counts["REPORTED"] == 1


def test_2_empty_graph():
    """An empty graph input constructs an empty graph without error."""
    payload = SPEGGraphInput(nodes=[], edges=[])
    G, resp = build_speg_graph(payload)

    assert isinstance(G, nx.MultiDiGraph)
    assert G.number_of_nodes() == 0
    assert G.number_of_edges() == 0
    assert resp.node_count == 0
    assert resp.edge_count == 0


def test_3_duplicate_node_rejection():
    """SPEGGraphInput rejects duplicate node_ids."""
    n1 = _make_sample_node("CUST-001", EvidenceNodeType.CUSTOMER, "Alice")
    n2 = _make_sample_node("CUST-001", EvidenceNodeType.CUSTOMER, "Duplicate Alice")

    with pytest.raises(ValueError, match="Duplicate node_id 'CUST-001'"):
        SPEGGraphInput(nodes=[n1, n2], edges=[])


def test_4_duplicate_edge_rejection():
    """SPEGGraphInput rejects duplicate edge_ids."""
    n1 = _make_sample_node("CUST-001", EvidenceNodeType.CUSTOMER, "Alice")
    n2 = _make_sample_node("BEN-901", EvidenceNodeType.BENEFICIARY, "Bob")
    e1 = _make_sample_edge("E-100", "CUST-001", "BEN-901")
    e2 = _make_sample_edge("E-100", "CUST-001", "BEN-901")

    with pytest.raises(ValueError, match="Duplicate edge_id 'E-100'"):
        SPEGGraphInput(nodes=[n1, n2], edges=[e1, e2])


def test_5_missing_source_node():
    """Edge referencing a non-existent source node is rejected."""
    n2 = _make_sample_node("BEN-901", EvidenceNodeType.BENEFICIARY, "Bob")
    e1 = _make_sample_edge("E-101", "CUST-NONEXISTENT", "BEN-901")

    with pytest.raises(ValueError, match="references non-existent source_node_id 'CUST-NONEXISTENT'"):
        SPEGGraphInput(nodes=[n2], edges=[e1])


def test_6_missing_target_node():
    """Edge referencing a non-existent target node is rejected."""
    n1 = _make_sample_node("CUST-001", EvidenceNodeType.CUSTOMER, "Alice")
    e1 = _make_sample_edge("E-102", "CUST-001", "BEN-NONEXISTENT")

    with pytest.raises(ValueError, match="references non-existent target_node_id 'BEN-NONEXISTENT'"):
        SPEGGraphInput(nodes=[n1], edges=[e1])


def test_7_self_referential_edge_rejection():
    """Edge where source == target is rejected by SPEG integrity rules."""
    n1 = _make_sample_node("CUST-001", EvidenceNodeType.CUSTOMER, "Alice")
    e1 = _make_sample_edge("E-103", "CUST-001", "CUST-001")

    with pytest.raises(ValueError, match="Self-referential edge 'E-103' detected"):
        SPEGGraphInput(nodes=[n1], edges=[e1])


def test_8_invalid_confidence():
    """Confidence value outside [0.0, 1.0] is rejected by Pydantic schema validation."""
    with pytest.raises(ValueError):
        _make_sample_edge("E-INVALID-1", "CUST-001", "BEN-901", confidence=1.5)

    with pytest.raises(ValueError):
        _make_sample_edge("E-INVALID-2", "CUST-001", "BEN-901", confidence=-0.1)


def test_9_multiple_edges_between_two_nodes():
    """nx.MultiDiGraph preserves multiple directed edges between the exact same pair of nodes."""
    n1 = _make_sample_node("CUST-001", EvidenceNodeType.CUSTOMER, "Alice")
    n2 = _make_sample_node("BEN-901", EvidenceNodeType.BENEFICIARY, "Merchant")

    e1 = _make_sample_edge(
        "E-PAY-1",
        "CUST-001",
        "BEN-901",
        rel=EvidenceRelationshipType.PAID_TO,
        status_type=EvidenceStatus.REPORTED,
    )
    e2 = _make_sample_edge(
        "E-REP-1",
        "CUST-001",
        "BEN-901",
        rel=EvidenceRelationshipType.REPORTED_IN_CASE,
        status_type=EvidenceStatus.REPORTED,
    )

    payload = SPEGGraphInput(nodes=[n1, n2], edges=[e1, e2])
    G, resp = build_speg_graph(payload)

    # Verify E-PAY-1 via authorized internal verification operation
    authority = TrustedVerificationAuthority(
        authority_id="OPS_LEAD_01",
        verification_rationale="Ledger reconciliation match.",
    )
    verify_evidence_edge(G, "E-PAY-1", authority, "LEDGER_REF_881")

    assert G.number_of_nodes() == 2
    assert G.number_of_edges() == 2
    # Verify both edges exist independently with distinct keys and metadata
    assert G.has_edge("CUST-001", "BEN-901", key="E-PAY-1")
    assert G.has_edge("CUST-001", "BEN-901", key="E-REP-1")
    assert G["CUST-001"]["BEN-901"]["E-PAY-1"]["evidence_status"] == "VERIFIED"
    assert G["CUST-001"]["BEN-901"]["E-REP-1"]["evidence_status"] == "REPORTED"


def test_10_provenance_retention():
    """All provenance attributes (source_reference, description, timestamps) are fully retained."""
    n1 = _make_sample_node("COMM-101", EvidenceNodeType.COMMUNICATION, "Scam SMS Message")
    n2 = _make_sample_node("BEN-888", EvidenceNodeType.BENEFICIARY, "unregistered@upi")
    e1 = EvidenceEdge(
        edge_id="EDGE-PROV-1",
        source_node_id="COMM-101",
        target_node_id="BEN-888",
        relationship_type=EvidenceRelationshipType.MENTIONED_IN,
        evidence_status=EvidenceStatus.INFERRED,
        source_reference="POLICE_FIR_CASE_2026_9011_EXHIBIT_B",
        observed_at=BASE_TIME,
        expires_at=BASE_TIME + timedelta(days=90),
        confidence=0.85,
        description="Beneficiary VPA mentioned in phishing SMS message received by victim.",
    )

    payload = SPEGGraphInput(nodes=[n1, n2], edges=[e1])
    G, _ = build_speg_graph(payload)

    edge_data = G["COMM-101"]["BEN-888"]["EDGE-PROV-1"]
    assert edge_data["source_reference"] == "POLICE_FIR_CASE_2026_9011_EXHIBIT_B"
    assert edge_data["observed_at"] == BASE_TIME
    assert edge_data["expires_at"] == BASE_TIME + timedelta(days=90)
    assert edge_data["confidence"] == 0.85
    assert edge_data["evidence_status"] == "INFERRED"


# =====================================================================
# 2. EVIDENCE RETRIEVAL & PROVENANCE ISOLATION TESTS
# =====================================================================


@pytest.fixture
def populated_evidence_graph():
    """Fixture providing a multi-entity evidence graph for retrieval tests."""
    ben = _make_sample_node("BEN-MULE-01", EvidenceNodeType.BENEFICIARY, "Mule Account @okaxis")
    c1 = _make_sample_node("CUST-001", EvidenceNodeType.CUSTOMER, "Alice")
    c2 = _make_sample_node("CUST-002", EvidenceNodeType.CUSTOMER, "Bob")
    comm = _make_sample_node("COMM-99", EvidenceNodeType.COMMUNICATION, "Phishing WhatsApp")
    case = _make_sample_node("CASE-500", EvidenceNodeType.FRAUD_CASE, "National Cyber Portal Case")
    ident = _make_sample_node("IDENT-PHONE-01", EvidenceNodeType.IDENTIFIER, "+91-9876543210")

    # Ingest edges initially as REPORTED or INFERRED
    e_ver = _make_sample_edge(
        "E-VER-1", "CUST-001", "BEN-MULE-01",
        rel=EvidenceRelationshipType.PAID_TO,
        status_type=EvidenceStatus.REPORTED,
    )
    e_rep = _make_sample_edge(
        "E-REP-1", "CUST-002", "BEN-MULE-01",
        rel=EvidenceRelationshipType.REPORTED_IN_CASE,
        status_type=EvidenceStatus.REPORTED,
    )
    e_inf = _make_sample_edge(
        "E-INF-1", "COMM-99", "BEN-MULE-01",
        rel=EvidenceRelationshipType.MENTIONED_IN,
        status_type=EvidenceStatus.INFERRED,
    )
    e_case = _make_sample_edge(
        "E-CASE-1", "BEN-MULE-01", "CASE-500",
        rel=EvidenceRelationshipType.REPORTED_IN_CASE,
        status_type=EvidenceStatus.REPORTED,
    )
    e_id = _make_sample_edge(
        "E-ID-1", "BEN-MULE-01", "IDENT-PHONE-01",
        rel=EvidenceRelationshipType.SHARES_IDENTIFIER,
        status_type=EvidenceStatus.INFERRED,
    )

    payload = SPEGGraphInput(
        nodes=[ben, c1, c2, comm, case, ident],
        edges=[e_ver, e_rep, e_inf, e_case, e_id],
    )
    G, resp = build_speg_graph(payload)

    # Authorize verification on E-VER-1 and E-CASE-1 via internal trusted operation
    authority = TrustedVerificationAuthority(
        authority_id="INTELLIGENCE_ANALYST_99",
        verification_rationale="Corroborated by verified bank settlement ledger and registered FIR filing.",
    )
    verify_evidence_edge(G, "E-VER-1", authority, "BANK_LEDGER_CONFIRMATION_9011")
    verify_evidence_edge(G, "E-CASE-1", authority, "CYBERCELL_FIR_AUTHENTICATION_CASE_500")

    return G


def test_11_verified_evidence_retrieval(populated_evidence_graph):
    """Retrieves verified evidence without conflating with reported or inferred."""
    summary = get_recipient_evidence("BEN-MULE-01", populated_evidence_graph)

    assert summary.recipient_id == "BEN-MULE-01"
    assert summary.recipient_node is not None
    assert summary.recipient_node.display_label == "Mule Account @okaxis"
    assert summary.verified_edge_count == 2
    assert summary.total_evidence_edge_count == 5

    ver_edges = [e for e in summary.evidence_edges if e.evidence_status == EvidenceStatus.VERIFIED]
    assert len(ver_edges) == 2
    ver_ids = {e.edge_id for e in ver_edges}
    assert ver_ids == {"E-VER-1", "E-CASE-1"}


def test_12_reported_evidence_retrieval(populated_evidence_graph):
    """Retrieves unverified user reports as distinctly REPORTED."""
    summary = get_recipient_evidence("BEN-MULE-01", populated_evidence_graph)

    assert summary.reported_edge_count == 1
    rep_edges = [e for e in summary.evidence_edges if e.evidence_status == EvidenceStatus.REPORTED]
    assert len(rep_edges) == 1
    assert rep_edges[0].edge_id == "E-REP-1"
    assert rep_edges[0].relationship_type == EvidenceRelationshipType.REPORTED_IN_CASE


def test_13_inferred_association_retrieval(populated_evidence_graph):
    """Retrieves inferred links (e.g. communication mentions and shared identifiers)."""
    summary = get_recipient_evidence("BEN-MULE-01", populated_evidence_graph)

    assert summary.inferred_edge_count == 2
    inf_edges = [e for e in summary.evidence_edges if e.evidence_status == EvidenceStatus.INFERRED]
    assert len(inf_edges) == 2
    inf_rels = {e.relationship_type for e in inf_edges}
    assert EvidenceRelationshipType.MENTIONED_IN in inf_rels
    assert EvidenceRelationshipType.SHARES_IDENTIFIER in inf_rels


def test_14_expired_evidence_exclusion():
    """Edges with expires_at < as_of are excluded from query results."""
    ben = _make_sample_node("BEN-EXP-01", EvidenceNodeType.BENEFICIARY, "Temp Mule")
    c1 = _make_sample_node("CUST-001", EvidenceNodeType.CUSTOMER, "Customer")

    # e1 observed 10 days ago, expired 2 days ago
    e_expired = _make_sample_edge(
        "E-EXP", "CUST-001", "BEN-EXP-01",
        observed_at=BASE_TIME - timedelta(days=10),
        expires_at=BASE_TIME - timedelta(days=2),
    )
    # e2 active for another 5 days
    e_active = _make_sample_edge(
        "E-ACT", "CUST-001", "BEN-EXP-01",
        observed_at=BASE_TIME,
        expires_at=BASE_TIME + timedelta(days=5),
    )
    # e3 has no expiration
    e_perm = _make_sample_edge(
        "E-PERM", "CUST-001", "BEN-EXP-01",
        observed_at=BASE_TIME,
        expires_at=None,
    )

    payload = SPEGGraphInput(nodes=[ben, c1], edges=[e_expired, e_active, e_perm])
    G, _ = build_speg_graph(payload)

    # Query as of BASE_TIME
    summary = get_recipient_evidence("BEN-EXP-01", G, as_of=BASE_TIME)

    assert summary.expired_edges_excluded_count == 1
    assert summary.total_evidence_edge_count == 2
    edge_ids = {e.edge_id for e in summary.evidence_edges}
    assert "E-EXP" not in edge_ids
    assert "E-ACT" in edge_ids
    assert "E-PERM" in edge_ids
    assert any("Excluded 1 historical evidence" in note for note in summary.assessment_notes)


def test_15_missing_recipient_lookup():
    """Querying an unknown recipient node returns empty structure in service."""
    n1 = _make_sample_node("CUST-001", EvidenceNodeType.CUSTOMER, "Alice")
    payload = SPEGGraphInput(nodes=[n1], edges=[])
    G, _ = build_speg_graph(payload)

    summary = get_recipient_evidence("BEN-DOES-NOT-EXIST", G)
    assert summary.recipient_node is None
    assert summary.connected_node_count == 0
    assert summary.total_evidence_edge_count == 0
    assert any("not found in evidence graph" in note for note in summary.assessment_notes)


def test_16_graph_serialization(populated_evidence_graph):
    """RecipientEvidenceSummary and GraphBuildResponse serialize cleanly to JSON."""
    summary = get_recipient_evidence("BEN-MULE-01", populated_evidence_graph)
    json_data = summary.model_dump_json()
    assert isinstance(json_data, str)
    assert "BEN-MULE-01" in json_data
    assert "VERIFIED" in json_data
    assert "REPORTED" in json_data


# =====================================================================
# 3. HTTP API INTEGRATION TESTS
# =====================================================================


def test_17_api_build_graph_endpoint_success():
    """POST /api/v1/recipient-intelligence/graph/build builds graph and returns 201."""
    n1 = _make_sample_node("CUST-API-01", EvidenceNodeType.CUSTOMER, "API Customer")
    n2 = _make_sample_node("BEN-API-01", EvidenceNodeType.BENEFICIARY, "API Beneficiary")
    e1 = _make_sample_edge("E-API-01", "CUST-API-01", "BEN-API-01")

    payload = SPEGGraphInput(nodes=[n1, n2], edges=[e1]).model_dump(mode="json")
    response = client.post("/api/v1/recipient-intelligence/graph/build", json=payload)

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["status"] == "success"
    assert data["node_count"] == 2
    assert data["edge_count"] == 1
    assert "SPEG-" in data["graph_id"]


def test_17_api_build_graph_invalid_payload_rejected():
    """POST /api/v1/recipient-intelligence/graph/build rejects invalid integrity with 422."""
    # Self-loop payload
    n1 = _make_sample_node("CUST-API-01", EvidenceNodeType.CUSTOMER, "API Customer").model_dump(mode="json")
    e1 = _make_sample_edge("E-API-LOOP", "CUST-API-01", "CUST-API-01").model_dump(mode="json")

    bad_payload = {"nodes": [n1], "edges": [e1]}
    response = client.post("/api/v1/recipient-intelligence/graph/build", json=bad_payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_18_public_request_with_verified_status_rejected():
    """Requirement 4.1: Public requests attempting to create VERIFIED evidence must be unconditionally rejected."""
    n1 = _make_sample_node("CUST-API-01", EvidenceNodeType.CUSTOMER, "Customer").model_dump(mode="json")
    n2 = _make_sample_node("BEN-API-01", EvidenceNodeType.BENEFICIARY, "Beneficiary").model_dump(mode="json")
    e_ver = _make_sample_edge(
        "E-VER-FORGED", "CUST-API-01", "BEN-API-01",
        status_type=EvidenceStatus.VERIFIED,
    ).model_dump(mode="json")

    untrusted_payload = {"nodes": [n1, n2], "edges": [e_ver]}
    resp = client.post("/api/v1/recipient-intelligence/graph/build", json=untrusted_payload)
    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    data = resp.json()
    assert "VERIFIED" in str(data)
    assert any("VERIFIED" in str(err.get("msg", "")) for err in data.get("detail", []))


def test_18_public_request_with_x_trusted_source_header_still_rejected():
    """Requirement 4.2: Providing custom headers (e.g. X-Trusted-Source: true) must NOT bypass the restriction."""
    n1 = _make_sample_node("CUST-API-01", EvidenceNodeType.CUSTOMER, "Customer").model_dump(mode="json")
    n2 = _make_sample_node("BEN-API-01", EvidenceNodeType.BENEFICIARY, "Beneficiary").model_dump(mode="json")
    e_ver = _make_sample_edge(
        "E-VER-FORGED", "CUST-API-01", "BEN-API-01",
        status_type=EvidenceStatus.VERIFIED,
    ).model_dump(mode="json")

    untrusted_payload = {"nodes": [n1, n2], "edges": [e_ver]}
    resp = client.post(
        "/api/v1/recipient-intelligence/graph/build",
        json=untrusted_payload,
        headers={"X-Trusted-Source": "true", "X-Admin": "true"},
    )
    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    data = resp.json()
    assert "VERIFIED" in str(data)
    assert any("VERIFIED" in str(err.get("msg", "")) for err in data.get("detail", []))


def test_18_public_request_with_is_trusted_source_body_flag_rejected():
    """Requirement 4.3: Body-level trust declarations (is_trusted_source) must be strictly rejected."""
    n1 = _make_sample_node("CUST-API-01", EvidenceNodeType.CUSTOMER, "Customer").model_dump(mode="json")
    n2 = _make_sample_node("BEN-API-01", EvidenceNodeType.BENEFICIARY, "Beneficiary").model_dump(mode="json")
    e1 = _make_sample_edge("E-REP-01", "CUST-API-01", "BEN-API-01").model_dump(mode="json")

    spoofed_payload = {
        "nodes": [n1, n2],
        "edges": [e1],
        "is_trusted_source": True,
    }
    resp = client.post("/api/v1/recipient-intelligence/graph/build", json=spoofed_payload)
    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    data = resp.json()
    assert "is_trusted_source" in str(data)
    assert any("is_trusted_source" in str(err.get("msg", "")) for err in data.get("detail", []))


def test_18_reported_and_inferred_evidence_accepted():
    """Requirement 4.4: Public evidence submitted with REPORTED and INFERRED status is accepted normally."""
    n1 = _make_sample_node("CUST-API-PUB", EvidenceNodeType.CUSTOMER, "Customer").model_dump(mode="json")
    n2 = _make_sample_node("BEN-API-PUB", EvidenceNodeType.BENEFICIARY, "Beneficiary").model_dump(mode="json")
    e_rep = _make_sample_edge("E-PUB-REP", "CUST-API-PUB", "BEN-API-PUB", status_type=EvidenceStatus.REPORTED).model_dump(mode="json")
    e_inf = _make_sample_edge("E-PUB-INF", "CUST-API-PUB", "BEN-API-PUB", rel=EvidenceRelationshipType.MENTIONED_IN, status_type=EvidenceStatus.INFERRED).model_dump(mode="json")

    valid_payload = {"nodes": [n1, n2], "edges": [e_rep, e_inf]}
    resp = client.post("/api/v1/recipient-intelligence/graph/build", json=valid_payload)
    assert resp.status_code == status.HTTP_201_CREATED
    data = resp.json()
    assert data["evidence_status_counts"]["REPORTED"] == 1
    assert data["evidence_status_counts"]["INFERRED"] == 1
    assert "VERIFIED" not in data["evidence_status_counts"] or data["evidence_status_counts"].get("VERIFIED", 0) == 0


def test_18_internal_verification_authorized():
    """Requirement 4.5: Authorized internal verification succeeds and promotes edge to VERIFIED."""
    clear_active_graphs()
    n1 = _make_sample_node("CUST-AUTH-01", EvidenceNodeType.CUSTOMER, "Customer")
    n2 = _make_sample_node("BEN-AUTH-01", EvidenceNodeType.BENEFICIARY, "Beneficiary")
    e1 = _make_sample_edge("E-AUTH-01", "CUST-AUTH-01", "BEN-AUTH-01", status_type=EvidenceStatus.REPORTED)

    G, _ = build_speg_graph(SPEGGraphInput(nodes=[n1, n2], edges=[e1]))
    assert G.edges["CUST-AUTH-01", "BEN-AUTH-01", "E-AUTH-01"]["evidence_status"] == EvidenceStatus.REPORTED.value

    authority = TrustedVerificationAuthority(
        authority_id="AUTH-OFFICER-007",
        authority_type="LAW_ENFORCEMENT_LIAISON",
        verification_rationale="Court order and bank KYC confirmation match",
    )

    updated_edge = verify_evidence_edge(
        graph=G,
        edge_id="E-AUTH-01",
        authority=authority,
        verification_reference="CASE-FIR-2026-9988",
        notes="Confirmed fraudulent account by cybercrime cell",
    )

    assert updated_edge.evidence_status == EvidenceStatus.VERIFIED
    assert G.edges["CUST-AUTH-01", "BEN-AUTH-01", "E-AUTH-01"]["evidence_status"] == EvidenceStatus.VERIFIED.value


def test_18_internal_verification_unauthorized_token_rejected():
    """Requirement 4.6: Unauthorized internal verification attempts fail with PermissionError."""
    clear_active_graphs()
    n1 = _make_sample_node("CUST-AUTH-02", EvidenceNodeType.CUSTOMER, "Customer")
    n2 = _make_sample_node("BEN-AUTH-02", EvidenceNodeType.BENEFICIARY, "Beneficiary")
    e1 = _make_sample_edge("E-AUTH-02", "CUST-AUTH-02", "BEN-AUTH-02", status_type=EvidenceStatus.REPORTED)

    G, _ = build_speg_graph(SPEGGraphInput(nodes=[n1, n2], edges=[e1]))

    unauthorized_authority = TrustedVerificationAuthority(
        authority_id="ROGUE-ACTOR-001",
        organization="UNAUTHORIZED",
        is_internal_authorized=False,
        verification_rationale="Attempted unauthorized promotion test",
    )

    with pytest.raises(PermissionError) as exc_info:
        verify_evidence_edge(
            graph=G,
            edge_id="E-AUTH-02",
            authority=unauthorized_authority,
            verification_reference="FORGED-REF",
        )
    assert "Unauthorized verification attempt" in str(exc_info.value)
    # Status remains REPORTED
    assert G.edges["CUST-AUTH-02", "BEN-AUTH-02", "E-AUTH-02"]["evidence_status"] == EvidenceStatus.REPORTED.value


def test_18_internal_verification_nonexistent_edge_fails():
    """Internal verification of non-existent edge raises KeyError."""
    clear_active_graphs()
    n1 = _make_sample_node("CUST-AUTH-03", EvidenceNodeType.CUSTOMER, "Customer")
    G, _ = build_speg_graph(SPEGGraphInput(nodes=[n1], edges=[]))

    authority = TrustedVerificationAuthority(
        authority_id="AUTH-OFFICER-001",
        organization="INTERNAL_SECURITY",
        verification_rationale="Investigating non-existent edge handling",
    )

    with pytest.raises(KeyError) as exc_info:
        verify_evidence_edge(
            graph=G,
            edge_id="E-NONEXISTENT",
            authority=authority,
            verification_reference="REF-001",
        )
    assert "E-NONEXISTENT" in str(exc_info.value)


def test_18_verification_provenance_and_audit_trail_recorded():
    """Requirement 4.7: Audit records capture verifier, rationale, reference, and timestamp."""
    clear_active_graphs()
    n1 = _make_sample_node("CUST-AUDIT-01", EvidenceNodeType.CUSTOMER, "Customer")
    n2 = _make_sample_node("BEN-AUDIT-01", EvidenceNodeType.BENEFICIARY, "Beneficiary")
    e1 = _make_sample_edge("E-AUDIT-01", "CUST-AUDIT-01", "BEN-AUDIT-01", status_type=EvidenceStatus.REPORTED)

    G, _ = build_speg_graph(SPEGGraphInput(nodes=[n1, n2], edges=[e1]))

    authority = TrustedVerificationAuthority(
        authority_id="AUDITOR-ID-42",
        organization="BANK_FRAUD_ANALYST",
        verification_rationale="Chargeback confirmation from beneficiary bank",
    )

    audit_timestamp = datetime(2026, 11, 22, 14, 30, tzinfo=timezone.utc)
    updated_edge = verify_evidence_edge(
        graph=G,
        edge_id="E-AUDIT-01",
        authority=authority,
        verification_reference="BANK-DISPUTE-8899",
        verified_at=audit_timestamp,
        notes="Audited against SWIFT/UPI gateway logs",
    )

    # In-memory edge inspection
    edge_data = G.edges["CUST-AUDIT-01", "BEN-AUDIT-01", "E-AUDIT-01"]
    assert "verification_audit" in edge_data["metadata"]
    audit = edge_data["metadata"]["verification_audit"]

    assert audit["original_evidence_status"] == EvidenceStatus.REPORTED.value
    assert audit["verified_by"] == "AUDITOR-ID-42"
    assert audit["verification_reference"] == "BANK-DISPUTE-8899"
    assert audit["verification_rationale"] == "Chargeback confirmation from beneficiary bank"
    assert datetime.fromisoformat(audit["verified_at"]) == audit_timestamp
    assert "VERIFIED by AUDITOR-ID-42 ref: BANK-DISPUTE-8899" in edge_data["description"]
    # Check typed audit model on updated_edge
    assert updated_edge.verification_audit is not None
    assert updated_edge.verification_audit.verified_by == "AUDITOR-ID-42"
    assert updated_edge.verification_audit.verification_reference == "BANK-DISPUTE-8899"
    assert updated_edge.verification_audit.verification_rationale == "Chargeback confirmation from beneficiary bank"


def test_18_build_internal_speg_graph_trust_boundary():
    """Requirement: Internal graph builder allows VERIFIED only with valid authority."""
    n1 = _make_sample_node("CUST-INT-01", EvidenceNodeType.CUSTOMER, "Customer")
    n2 = _make_sample_node("BEN-INT-01", EvidenceNodeType.BENEFICIARY, "Beneficiary")
    e_ver = _make_sample_edge("E-INT-VER", "CUST-INT-01", "BEN-INT-01", status_type=EvidenceStatus.VERIFIED)

    # 1. Unauthenticated internal build with VERIFIED edge -> rejected
    with pytest.raises(PermissionError) as exc:
        build_internal_speg_graph(nodes=[n1, n2], edges=[e_ver], authority=None)
    assert "requires valid TrustedVerificationAuthority" in str(exc.value)

    # 2. Invalid authority (is_internal_authorized=False) -> rejected
    bad_auth = TrustedVerificationAuthority(
        authority_id="BAD-01",
        organization="ATTEMPT",
        is_internal_authorized=False,
        verification_rationale="Attempted unauthorized internal build test",
    )
    with pytest.raises(PermissionError):
        build_internal_speg_graph(nodes=[n1, n2], edges=[e_ver], authority=bad_auth)

    # 3. Valid authority -> accepted
    good_auth = TrustedVerificationAuthority(
        authority_id="ADMIN-01",
        organization="INTERNAL_SYSTEM",
        verification_rationale="Authorized batch internal graph load",
    )
    G, resp = build_internal_speg_graph(nodes=[n1, n2], edges=[e_ver], authority=good_auth)
    assert resp.status == "success"
    assert resp.evidence_status_counts["VERIFIED"] == 1
    assert G.edges["CUST-INT-01", "BEN-INT-01", "E-INT-VER"]["evidence_status"] == EvidenceStatus.VERIFIED.value


def test_17_api_get_evidence_endpoint_success():
    """GET /api/v1/recipient-intelligence/recipients/{recipient_id}/evidence returns 200."""
    n1 = _make_sample_node("CUST-API-99", EvidenceNodeType.CUSTOMER, "Victim")
    ben = _make_sample_node("BEN-API-99", EvidenceNodeType.BENEFICIARY, "Scammer VPA")
    e1 = _make_sample_edge("E-API-99", "CUST-API-99", "BEN-API-99")

    payload = SPEGGraphInput(nodes=[n1, ben], edges=[e1])
    build_speg_graph(payload)

    response = client.get("/api/v1/recipient-intelligence/recipients/BEN-API-99/evidence")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["recipient_id"] == "BEN-API-99"
    assert data["connected_node_count"] == 1
    assert data["total_evidence_edge_count"] == 1
    assert data["reported_edge_count"] == 1


def test_17_api_get_evidence_missing_recipient_returns_404():
    """GET /api/v1/recipient-intelligence/recipients/{recipient_id}/evidence returns 404 for unknown node."""
    n1 = _make_sample_node("CUST-01", EvidenceNodeType.CUSTOMER, "Alice")
    build_speg_graph(SPEGGraphInput(nodes=[n1], edges=[]))

    response = client.get("/api/v1/recipient-intelligence/recipients/BEN-NONEXISTENT/evidence")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "not found in evidence graph" in response.json()["detail"]
