"""Scam-to-Payment Evidence Graph (SPEG) Builder and Query Service (Phase 2.3.2).

Constructs and queries provenance-aware directed multigraphs connecting financial
entities, transaction rails, communications, and reported fraud cases.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set, Tuple
import uuid
import networkx as nx

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
    VerificationAuditRecord,
)

# In-memory graph storage registry for prototype execution
_ACTIVE_GRAPHS: Dict[str, nx.MultiDiGraph] = {}
_CURRENT_DEFAULT_GRAPH_ID: Optional[str] = None


def get_active_graph(graph_id: Optional[str] = None) -> Optional[nx.MultiDiGraph]:
    """Retrieve an active graph instance by graph_id or return current default."""
    if graph_id:
        return _ACTIVE_GRAPHS.get(graph_id)
    if _CURRENT_DEFAULT_GRAPH_ID:
        return _ACTIVE_GRAPHS.get(_CURRENT_DEFAULT_GRAPH_ID)
    return None


def clear_active_graphs() -> None:
    """Clear all stored in-memory graph instances (for test fixture teardown)."""
    global _CURRENT_DEFAULT_GRAPH_ID
    _ACTIVE_GRAPHS.clear()
    _CURRENT_DEFAULT_GRAPH_ID = None


def build_speg_graph(
    graph_input: SPEGGraphInput,
    graph_id: Optional[str] = None,
    set_as_default: bool = True,
) -> Tuple[nx.MultiDiGraph, GraphBuildResponse]:
    """Construct an in-memory provenance-aware Scam-to-Payment Evidence Graph (SPEG).

    Graph Architecture Decision — nx.MultiDiGraph:
    1. Directed: Financial relationships possess distinct semantic directions
       (e.g., Customer -> PAID_TO -> Beneficiary != Beneficiary -> PAID_TO -> Customer).
    2. Multigraph: Multiple distinct pieces of evidence may link the exact same
       pair of nodes (e.g. repeated payments, or an account both MENTIONED_IN a
       phishing message and REPORTED_IN_CASE by an investigator). A simple DiGraph
       would overwrite edge attributes, destroying provenance and auditability.
    3. Deterministic & Non-Probabilistic: Preserves exact node and edge dictionaries
       without mutating weights or imputing unobserved edges.

    Args:
        graph_input: Validated SPEGGraphInput containing nodes and edges.
        graph_id: Optional explicit graph identifier.
        set_as_default: Whether this instance becomes the default query target.

    Returns:
        Tuple of (constructed nx.MultiDiGraph, GraphBuildResponse metadata).
    """
    global _CURRENT_DEFAULT_GRAPH_ID

    gid = graph_id or f"SPEG-{uuid.uuid4().hex[:8].upper()}"
    G = nx.MultiDiGraph(graph_id=gid, created_at=datetime.now(timezone.utc))

    node_type_counts: Dict[str, int] = {}
    rel_type_counts: Dict[str, int] = {}
    evidence_status_counts: Dict[str, int] = {}

    # 1. Add all validated nodes with attributes
    for node in graph_input.nodes:
        node_dict = node.model_dump()
        G.add_node(node.node_id, **node_dict)

        ntype = node.node_type.value
        node_type_counts[ntype] = node_type_counts.get(ntype, 0) + 1

    # 2. Add all directed evidence edges with unique keys and full provenance
    for edge in graph_input.edges:
        edge_dict = edge.model_dump()
        # Use edge.edge_id as the multi-edge key for O(1) attribute lookup
        G.add_edge(
            edge.source_node_id,
            edge.target_node_id,
            key=edge.edge_id,
            **edge_dict,
        )

        rel = edge.relationship_type.value
        rel_type_counts[rel] = rel_type_counts.get(rel, 0) + 1

        status = edge.evidence_status.value
        evidence_status_counts[status] = evidence_status_counts.get(status, 0) + 1

    # 3. Register in in-memory store
    _ACTIVE_GRAPHS[gid] = G
    if set_as_default or _CURRENT_DEFAULT_GRAPH_ID is None:
        _CURRENT_DEFAULT_GRAPH_ID = gid

    notes = [
        f"SPEG graph '{gid}' successfully built with {G.number_of_nodes()} nodes and {G.number_of_edges()} edges.",
        "Graph type: NetworkX MultiDiGraph (directed multigraph preserving multi-edge provenance).",
        "Storage: In-memory runtime graph store. Graph database persistence is not yet implemented.",
    ]

    response = GraphBuildResponse(
        status="success",
        graph_id=gid,
        node_count=G.number_of_nodes(),
        edge_count=G.number_of_edges(),
        node_type_counts=node_type_counts,
        relationship_type_counts=rel_type_counts,
        evidence_status_counts=evidence_status_counts,
        built_at=datetime.now(timezone.utc),
        notes=notes,
    )

    return G, response


def verify_evidence_edge(
    graph: nx.MultiDiGraph,
    edge_id: str,
    authority: TrustedVerificationAuthority,
    verification_reference: str,
    verified_at: Optional[datetime] = None,
    notes: Optional[str] = None,
) -> EvidenceEdge:
    """Authorized internal service operation to promote an evidence relationship to VERIFIED.

    Security & Trust Boundaries:
    - Never exposed as an unauthenticated or public HTTP endpoint.
    - Requires an explicit, authenticated TrustedVerificationAuthority decision.
    - Preserves original evidence provenance (original_status, timestamps, descriptions).
    - Records the authorized actor, verification reference, rationale, and verification timestamp.
    - Does NOT automatically propagate verification to adjacent edges or multi-hop paths.
    - Does NOT upgrade evidence merely because an unverified report exists.

    Args:
        graph: Target nx.MultiDiGraph containing the edge.
        edge_id: Unique edge identifier to verify.
        authority: Authenticated internal authority context.
        verification_reference: Formal audit/court/bank ledger reference.
        verified_at: Optional explicit timestamp of verification (defaults to now UTC).
        notes: Optional extra audit notes.

    Returns:
        Updated EvidenceEdge instance with VERIFIED status and audit provenance.

    Raises:
        PermissionError: If authority is not internally authorized or missing rationale.
        KeyError: If edge_id is not found in the graph.
    """
    if not authority.is_internal_authorized:
        raise PermissionError(
            f"Unauthorized verification attempt by '{authority.authority_id}'. "
            "Internal authorization assertion failed (is_internal_authorized=False)."
        )

    if not authority.authority_id or not authority.verification_rationale:
        raise PermissionError("Unauthorized verification attempt: Authority ID and rationale are required.")

    # Search for the edge across all multi-edges
    found_u, found_v, found_k, found_data = None, None, None, None
    for u, v, k, data in graph.edges(keys=True, data=True):
        if data.get("edge_id") == edge_id or k == edge_id:
            found_u, found_v, found_k, found_data = u, v, k, dict(data)
            break

    if found_data is None:
        raise KeyError(
            f"Evidence edge '{edge_id}' not found in evidence graph '{graph.graph.get('graph_id', 'unknown')}'."
        )

    v_time = verified_at or datetime.now(timezone.utc)
    raw_status = found_data.get("evidence_status", EvidenceStatus.REPORTED.value)
    original_status = EvidenceStatus(raw_status) if isinstance(raw_status, str) else raw_status

    # 1. Preserve original provenance in structured audit record and metadata
    audit_record = VerificationAuditRecord(
        original_evidence_status=original_status,
        verified_at=v_time,
        verified_by=authority.authority_id,
        verification_authority_org=authority.organization,
        verification_reference=verification_reference,
        verification_rationale=authority.verification_rationale,
        audit_notes=notes or "",
    )
    found_data["verification_audit"] = audit_record
    meta = dict(found_data.get("metadata") or {})
    meta["verification_audit"] = audit_record.model_dump(mode="json")
    found_data["metadata"] = meta

    # 2. Promote status to VERIFIED
    found_data["evidence_status"] = EvidenceStatus.VERIFIED.value

    # 3. Update description with immutable audit trail
    base_desc = found_data.get("description", "")
    found_data["description"] = (
        f"{base_desc} [VERIFIED by {authority.authority_id} ref: {verification_reference}]"
    )

    updated_edge = EvidenceEdge(**found_data)

    # 4. Update edge in-place in NetworkX graph
    graph[found_u][found_v][found_k].update(updated_edge.model_dump())

    return updated_edge


def build_internal_speg_graph(
    nodes: List[EvidenceNode],
    edges: List[EvidenceEdge],
    authority: Optional[TrustedVerificationAuthority] = None,
    graph_id: Optional[str] = None,
    set_as_default: bool = True,
) -> Tuple[nx.MultiDiGraph, GraphBuildResponse]:
    """Internal graph constructor supporting pre-verified edges when authorized by internal authority.

    Security Boundary:
    - If any edge possesses VERIFIED status, a valid TrustedVerificationAuthority must be provided.
    - Never exposed as a public API ingestion endpoint.
    """
    has_verified = any(e.evidence_status == EvidenceStatus.VERIFIED for e in edges)
    if has_verified:
        if authority is None or not authority.is_internal_authorized:
            raise PermissionError(
                "Internal graph construction with VERIFIED edges requires valid TrustedVerificationAuthority credentials."
            )

    global _CURRENT_DEFAULT_GRAPH_ID
    gid = graph_id or f"SPEG-INTERNAL-{uuid.uuid4().hex[:8].upper()}"
    G = nx.MultiDiGraph(graph_id=gid, created_at=datetime.now(timezone.utc))

    node_type_counts: Dict[str, int] = {}
    rel_type_counts: Dict[str, int] = {}
    evidence_status_counts: Dict[str, int] = {}

    for node in nodes:
        G.add_node(node.node_id, **node.model_dump())
        ntype = node.node_type.value
        node_type_counts[ntype] = node_type_counts.get(ntype, 0) + 1

    for edge in edges:
        G.add_edge(edge.source_node_id, edge.target_node_id, key=edge.edge_id, **edge.model_dump())
        rel = edge.relationship_type.value
        rel_type_counts[rel] = rel_type_counts.get(rel, 0) + 1
        status_val = edge.evidence_status.value
        evidence_status_counts[status_val] = evidence_status_counts.get(status_val, 0) + 1

    _ACTIVE_GRAPHS[gid] = G
    if set_as_default or _CURRENT_DEFAULT_GRAPH_ID is None:
        _CURRENT_DEFAULT_GRAPH_ID = gid

    notes = [
        f"Internal SPEG graph '{gid}' successfully built with {G.number_of_nodes()} nodes and {G.number_of_edges()} edges.",
        "Created via authenticated internal pipeline with verified evidence privileges.",
    ]

    response = GraphBuildResponse(
        status="success",
        graph_id=gid,
        node_count=G.number_of_nodes(),
        edge_count=G.number_of_edges(),
        node_type_counts=node_type_counts,
        relationship_type_counts=rel_type_counts,
        evidence_status_counts=evidence_status_counts,
        built_at=datetime.now(timezone.utc),
        notes=notes,
    )

    return G, response


def get_recipient_evidence(
    recipient_id: str,
    graph: Optional[nx.MultiDiGraph] = None,
    graph_id: Optional[str] = None,
    as_of: Optional[datetime] = None,
) -> RecipientEvidenceSummary:
    """Retrieve full evidence provenance connected to a target recipient/beneficiary.

    Invariants:
    - Never conflates reported allegations with verified fraud.
    - Excludes expired evidence when an as_of reference timestamp is supplied.
    - Captures both inbound relationships (who paid/reported the recipient) and
      outbound relationships (who the recipient paid/shares identifiers with).
    - Preserves confidence intervals without treating them as fraud probabilities.

    Args:
        recipient_id: Node identifier of the beneficiary/recipient entity.
        graph: Optional specific MultiDiGraph instance.
        graph_id: Optional graph identifier to lookup from active registry.
        as_of: Optional timezone-aware reference timestamp for temporal expiry filtering.

    Returns:
        RecipientEvidenceSummary detailing nodes, edges, provenance, and counts.
    """
    target_graph = graph or get_active_graph(graph_id)

    # 1. Handle missing graph
    if target_graph is None:
        return RecipientEvidenceSummary(
            recipient_id=recipient_id,
            recipient_node=None,
            connected_node_count=0,
            total_evidence_edge_count=0,
            verified_edge_count=0,
            reported_edge_count=0,
            inferred_edge_count=0,
            connected_nodes=[],
            evidence_edges=[],
            query_reference_time=as_of,
            expired_edges_excluded_count=0,
            assessment_notes=["No active SPEG graph found in memory registry."],
        )

    # 2. Handle missing recipient node
    if recipient_id not in target_graph:
        return RecipientEvidenceSummary(
            recipient_id=recipient_id,
            recipient_node=None,
            connected_node_count=0,
            total_evidence_edge_count=0,
            verified_edge_count=0,
            reported_edge_count=0,
            inferred_edge_count=0,
            connected_nodes=[],
            evidence_edges=[],
            query_reference_time=as_of,
            expired_edges_excluded_count=0,
            assessment_notes=[
                f"Recipient node '{recipient_id}' not found in evidence graph '{target_graph.graph.get('graph_id', 'unknown')}'."
            ],
        )

    recipient_data = target_graph.nodes[recipient_id]
    recipient_node = EvidenceNode(**recipient_data)

    connected_node_ids: Set[str] = set()
    valid_edges: List[EvidenceEdge] = []
    expired_count = 0

    # 3. Retrieve all incident edges (both in-edges and out-edges)
    # in_edges: (u, recipient_id, key, data)
    for u, v, k, data in target_graph.in_edges(recipient_id, keys=True, data=True):
        edge = EvidenceEdge(**data)
        # Temporal expiry check
        if as_of is not None and edge.expires_at is not None and edge.expires_at < as_of:
            expired_count += 1
            continue

        valid_edges.append(edge)
        if u != recipient_id:
            connected_node_ids.add(u)

    # out_edges: (recipient_id, v, key, data)
    for u, v, k, data in target_graph.out_edges(recipient_id, keys=True, data=True):
        edge = EvidenceEdge(**data)
        # Temporal expiry check
        if as_of is not None and edge.expires_at is not None and edge.expires_at < as_of:
            expired_count += 1
            continue

        valid_edges.append(edge)
        if v != recipient_id:
            connected_node_ids.add(v)

    # 4. Retrieve connected node entities
    connected_nodes: List[EvidenceNode] = []
    for nid in sorted(connected_node_ids):
        ndata = target_graph.nodes[nid]
        connected_nodes.append(EvidenceNode(**ndata))

    # 5. Calculate evidence status breakdowns
    verified_count = sum(1 for e in valid_edges if e.evidence_status == EvidenceStatus.VERIFIED)
    reported_count = sum(1 for e in valid_edges if e.evidence_status == EvidenceStatus.REPORTED)
    inferred_count = sum(1 for e in valid_edges if e.evidence_status == EvidenceStatus.INFERRED)

    # 6. Generate explainable provenance notes
    notes: List[str] = [
        f"Entity '{recipient_id}' retrieved from SPEG graph as type '{recipient_node.node_type.value}'.",
        f"Found {len(connected_nodes)} directly connected entities and {len(valid_edges)} active evidence relationships.",
        f"Evidence Status Breakdown: {verified_count} VERIFIED, {reported_count} REPORTED, {inferred_count} INFERRED.",
    ]

    if expired_count > 0:
        notes.append(
            f"Temporal Filter: Excluded {expired_count} historical evidence relationship(s) expired before as_of ({as_of.isoformat()})."
        )

    if reported_count > 0 and verified_count == 0:
        notes.append(
            "Caution: Incident relationships contain uncorroborated REPORTED allegations with zero verified fraud outcomes."
        )

    if recipient_node.node_type != EvidenceNodeType.BENEFICIARY:
        notes.append(
            f"Notice: Queried entity is typed as '{recipient_node.node_type.value}', not 'BENEFICIARY'."
        )

    notes.append(
        "SPEG graph construction and provenance-aware evidence retrieval active. "
        "Recipient risk scoring and automatic fraud relationship inference are not yet implemented."
    )

    return RecipientEvidenceSummary(
        recipient_id=recipient_id,
        recipient_node=recipient_node,
        connected_node_count=len(connected_nodes),
        total_evidence_edge_count=len(valid_edges),
        verified_edge_count=verified_count,
        reported_edge_count=reported_count,
        inferred_edge_count=inferred_count,
        connected_nodes=connected_nodes,
        evidence_edges=valid_edges,
        query_reference_time=as_of,
        expired_edges_excluded_count=expired_count,
        assessment_notes=notes,
    )
