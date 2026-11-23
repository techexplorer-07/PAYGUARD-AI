"""Recipient Relationship Analysis Service (Phase 2.3.3).

Transforms the Scam-to-Payment Evidence Graph (SPEG) into structured, provenance-aware
recipient intelligence without calculating fraud risk scores or propagating guilt by association.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Set, Tuple
import networkx as nx

from app.schemas.recipient import (
    EvidenceEdge,
    EvidenceNode,
    EvidenceNodeType,
    EvidenceRelationshipType,
    EvidenceStatus,
    RecipientIntelligenceProfile,
    SupportingEvidenceItem,
)
from app.services.speg_graph_builder import get_active_graph

RECENCY_WINDOW_DAYS = 30


def analyze_recipient_relationships(
    recipient_id: str,
    graph: Optional[nx.MultiDiGraph] = None,
    graph_id: Optional[str] = None,
    as_of: Optional[datetime] = None,
) -> RecipientIntelligenceProfile:
    """Analyze structured graph relationships and evidence provenance for a beneficiary.

    Core Invariants:
    1. Zero Fraud Scoring: Emits factual relationship counts and evidence provenance;
       never calculates numerical fraud scores or automated risk classifications.
    2. Zero Ownership Inference: Sharing an identifier (e.g. phone, device, payment rail)
       is reported as an INFERRED association, never as common account ownership.
    3. Safe Traversal: Multi-hop queries are bounded to 2-hop radius, cycle-safe,
       and never propagate VERIFIED evidence status through intermediate nodes.
    4. Temporal Integrity: Excludes expired evidence when as_of is supplied while
       preserving all historical observations in graph memory.

    Args:
        recipient_id: Node ID of the beneficiary to analyze.
        graph: Optional MultiDiGraph instance.
        graph_id: Optional graph instance ID to look up from registry.
        as_of: Optional reference timestamp for temporal expiry and recency calculations.

    Returns:
        RecipientIntelligenceProfile with auditable supporting evidence items.

    Raises:
        ValueError: If graph or beneficiary node does not exist.
    """
    target_graph = graph or get_active_graph(graph_id)
    if target_graph is None:
        raise ValueError(f"Graph '{graph_id or 'default'}' not found in active graph store.")

    if recipient_id not in target_graph:
        raise ValueError(f"Beneficiary '{recipient_id}' not found in evidence graph.")

    node_data = target_graph.nodes[recipient_id]
    ref_time = as_of or datetime.now(timezone.utc)
    recent_cutoff = ref_time - timedelta(days=RECENCY_WINDOW_DAYS)

    # 1. Collect and filter all incident edges (1-hop direct relationships)
    direct_customers: Set[str] = set()
    transaction_edges: Set[str] = set()
    transaction_nodes: Set[str] = set()
    communication_nodes: Set[str] = set()
    fraud_case_nodes: Set[str] = set()
    shared_identifier_nodes: Set[str] = set()
    associated_beneficiaries: Set[str] = set()

    supporting_evidence: List[SupportingEvidenceItem] = []
    seen_edge_ids: Set[str] = set()

    verified_count = 0
    reported_count = 0
    inferred_count = 0
    recent_count = 0
    expired_count = 0

    # Inspect in-edges (u -> recipient_id)
    for u, v, k, data in target_graph.in_edges(recipient_id, keys=True, data=True):
        edge = EvidenceEdge(**data)
        # Expiry check
        if edge.expires_at is not None and edge.expires_at < ref_time:
            expired_count += 1
            continue

        if edge.edge_id in seen_edge_ids:
            continue
        seen_edge_ids.add(edge.edge_id)

        # Recency check
        if edge.observed_at >= recent_cutoff:
            recent_count += 1

        # Status count
        if edge.evidence_status == EvidenceStatus.VERIFIED:
            verified_count += 1
        elif edge.evidence_status == EvidenceStatus.REPORTED:
            reported_count += 1
        elif edge.evidence_status == EvidenceStatus.INFERRED:
            inferred_count += 1

        # Direct relationship categorization
        u_type = target_graph.nodes[u].get("node_type")
        if u_type == EvidenceNodeType.CUSTOMER.value or edge.relationship_type in (
            EvidenceRelationshipType.PAID_TO,
            EvidenceRelationshipType.INITIATED_TRANSACTION,
        ):
            if u_type == EvidenceNodeType.CUSTOMER.value:
                direct_customers.add(u)
            if edge.relationship_type in (EvidenceRelationshipType.PAID_TO, EvidenceRelationshipType.INITIATED_TRANSACTION):
                transaction_edges.add(edge.edge_id)

        if u_type == EvidenceNodeType.TRANSACTION.value:
            transaction_nodes.add(u)
        elif u_type == EvidenceNodeType.COMMUNICATION.value or edge.relationship_type == EvidenceRelationshipType.MENTIONED_IN:
            communication_nodes.add(u)
        elif u_type == EvidenceNodeType.FRAUD_CASE.value or edge.relationship_type == EvidenceRelationshipType.REPORTED_IN_CASE:
            fraud_case_nodes.add(u)
        elif u_type == EvidenceNodeType.IDENTIFIER.value or edge.relationship_type == EvidenceRelationshipType.SHARES_IDENTIFIER:
            shared_identifier_nodes.add(u)
        elif u_type == EvidenceNodeType.BENEFICIARY.value:
            associated_beneficiaries.add(u)

        supporting_evidence.append(
            SupportingEvidenceItem(
                edge_id=edge.edge_id,
                source_reference=edge.source_reference,
                evidence_status=edge.evidence_status,
                relationship_type=edge.relationship_type,
                observed_at=edge.observed_at,
                source_node_id=edge.source_node_id,
                target_node_id=edge.target_node_id,
                path=[edge.source_node_id, edge.target_node_id],
                description=edge.description,
            )
        )

    # Inspect out-edges (recipient_id -> v)
    for u, v, k, data in target_graph.out_edges(recipient_id, keys=True, data=True):
        edge = EvidenceEdge(**data)
        # Expiry check
        if edge.expires_at is not None and edge.expires_at < ref_time:
            expired_count += 1
            continue

        if edge.edge_id in seen_edge_ids:
            continue
        seen_edge_ids.add(edge.edge_id)

        # Recency check
        if edge.observed_at >= recent_cutoff:
            recent_count += 1

        # Status count
        if edge.evidence_status == EvidenceStatus.VERIFIED:
            verified_count += 1
        elif edge.evidence_status == EvidenceStatus.REPORTED:
            reported_count += 1
        elif edge.evidence_status == EvidenceStatus.INFERRED:
            inferred_count += 1

        v_type = target_graph.nodes[v].get("node_type")
        if v_type == EvidenceNodeType.CUSTOMER.value:
            direct_customers.add(v)
        elif v_type == EvidenceNodeType.TRANSACTION.value:
            transaction_nodes.add(v)
        elif v_type == EvidenceNodeType.FRAUD_CASE.value or edge.relationship_type == EvidenceRelationshipType.REPORTED_IN_CASE:
            fraud_case_nodes.add(v)
        elif v_type == EvidenceNodeType.IDENTIFIER.value or edge.relationship_type == EvidenceRelationshipType.SHARES_IDENTIFIER:
            shared_identifier_nodes.add(v)
        elif v_type == EvidenceNodeType.BENEFICIARY.value:
            associated_beneficiaries.add(v)

        if edge.relationship_type in (EvidenceRelationshipType.PAID_TO, EvidenceRelationshipType.INITIATED_TRANSACTION):
            transaction_edges.add(edge.edge_id)

        supporting_evidence.append(
            SupportingEvidenceItem(
                edge_id=edge.edge_id,
                source_reference=edge.source_reference,
                evidence_status=edge.evidence_status,
                relationship_type=edge.relationship_type,
                observed_at=edge.observed_at,
                source_node_id=edge.source_node_id,
                target_node_id=edge.target_node_id,
                path=[edge.source_node_id, edge.target_node_id],
                description=edge.description,
            )
        )

    # 2. 2-Hop Traversal: Shared Identifier Relationships
    # Beneficiary A <-> Identifier Node <-> Beneficiary B
    for ident_id in list(shared_identifier_nodes):
        # Look at both in-edges and out-edges connecting to ident_id
        ident_edges = list(target_graph.in_edges(ident_id, keys=True, data=True)) + list(
            target_graph.out_edges(ident_id, keys=True, data=True)
        )

        for src, dst, key, edata in ident_edges:
            other_id = src if dst == ident_id else dst
            if other_id == recipient_id:
                continue

            # Anti-cycle & type check
            other_type = target_graph.nodes[other_id].get("node_type")
            if other_type == EvidenceNodeType.BENEFICIARY.value:
                associated_beneficiaries.add(other_id)

                multi_hop_edge_id = f"PATH-{recipient_id}-{ident_id}-{other_id}"
                if multi_hop_edge_id not in seen_edge_ids:
                    seen_edge_ids.add(multi_hop_edge_id)

                    supporting_evidence.append(
                        SupportingEvidenceItem(
                            edge_id=multi_hop_edge_id,
                            source_reference=edata.get("source_reference", f"SHARED_IDENTIFIER_{ident_id}"),
                            evidence_status=EvidenceStatus.INFERRED,  # Multi-hop associations are strictly INFERRED
                            relationship_type=EvidenceRelationshipType.SHARES_IDENTIFIER,
                            observed_at=edata.get("observed_at", ref_time),
                            source_node_id=recipient_id,
                            target_node_id=other_id,
                            path=[recipient_id, ident_id, other_id],
                            description=(
                                f"Beneficiary '{recipient_id}' shares identifier node '{ident_id}' "
                                f"with beneficiary '{other_id}'. (Inferred association, does not prove common ownership)."
                            ),
                        )
                    )

    # 3. Calculate metrics
    total_tx_count = max(len(transaction_nodes), len(transaction_edges))
    active_edge_count = verified_count + reported_count + inferred_count

    # Data sufficiency assessment
    if active_edge_count == 0:
        data_sufficiency = "INSUFFICIENT"
    elif active_edge_count < 3:
        data_sufficiency = "MINIMAL"
    else:
        data_sufficiency = "SUFFICIENT"

    # 4. Construct factual, explainable narrative summary
    summary_parts = [
        f"Recipient intelligence profile for '{recipient_id}' ({node_data.get('display_label', 'Unknown')}).",
        f"Direct relationships: {len(direct_customers)} distinct customers, {total_tx_count} transactions.",
        f"Active evidence breakdown: {verified_count} VERIFIED, {reported_count} REPORTED, {inferred_count} INFERRED.",
    ]

    if len(associated_beneficiaries) > 0:
        summary_parts.append(
            f"Network association: Connected to {len(associated_beneficiaries)} other beneficiaries "
            f"via {len(shared_identifier_nodes)} shared identifiers. "
            "(Note: Shared infrastructure does not establish common ownership or coordinated fraud)."
        )

    if len(fraud_case_nodes) > 0:
        summary_parts.append(f"Linked to {len(fraud_case_nodes)} distinct fraud case filings.")

    if reported_count > 0 and verified_count == 0:
        summary_parts.append(
            "Caution: Incident relationships contain uncorroborated REPORTED claims with zero confirmed fraud determinations."
        )

    if expired_count > 0:
        summary_parts.append(
            f"Temporal filter: {expired_count} historical evidence record(s) excluded due to expiration before as_of."
        )

    summary_parts.append(
        "Recipient relationship analysis active. Recipient risk scoring, ownership inference "
        "and automatic fraud classification are not yet implemented."
    )

    evidence_summary = " ".join(summary_parts)

    return RecipientIntelligenceProfile(
        recipient_id=recipient_id,
        graph_id=target_graph.graph.get("graph_id", graph_id or "default"),
        analysis_timestamp=ref_time,
        direct_customer_count=len(direct_customers),
        total_transaction_count=total_tx_count,
        distinct_beneficiary_association_count=len(associated_beneficiaries),
        verified_evidence_count=verified_count,
        reported_evidence_count=reported_count,
        inferred_evidence_count=inferred_count,
        shared_identifier_count=len(shared_identifier_nodes),
        recent_relationship_count=recent_count,
        expired_relationship_count=expired_count,
        evidence_summary=evidence_summary,
        supporting_evidence=supporting_evidence,
        data_sufficiency=data_sufficiency,
    )
