"""Optional synthetic SPEG evidence graph for demo deployments.

Enabled with SEED_DEMO_GRAPH=true (off by default). Every node, edge and source
reference is synthetic and prefixed with "sample"/"SAMPLE"; nothing describes a
real person, account, payment or fraud case. VERIFIED edges are promoted through
the internal verification routine with a clearly named sample authority, exactly
as the backend's own tests do; the public /graph/build endpoint still rejects
VERIFIED evidence.

Mirrors the frontend's investigator demo dataset so live recipient lookups for
these sample UPI IDs (e.g. sample-refund-desk@ybl) return real engine output.
"""

from datetime import datetime, timedelta, timezone
import logging
from typing import List, Tuple

from app.schemas.recipient import (
    EvidenceEdge,
    EvidenceNode,
    EvidenceNodeType as NT,
    EvidenceRelationshipType as RT,
    EvidenceStatus as ES,
    SPEGGraphInput,
    TrustedVerificationAuthority,
)
from app.services.speg_graph_builder import build_speg_graph, verify_evidence_edge

logger = logging.getLogger("payguard.demo_graph_seed")

DEMO_GRAPH_ID = "SPEG-DEMO-INVESTIGATOR"
_VERIFIED_EDGE_IDS = ["E-INV-01", "E-INV-12", "E-INV-13", "E-INV-14", "E-INV-15"]


def _demo_graph_input(now: datetime) -> SPEGGraphInput:
    def node(nid: str, ntype: NT, label: str, days: int) -> EvidenceNode:
        return EvidenceNode(
            node_id=nid,
            node_type=ntype,
            display_label=label,
            synthetic_identifier=nid,
            created_at=now - timedelta(days=days),
        )

    def edge(eid: str, src: str, dst: str, rel: RT, ref: str, days: int, desc: str, status: ES = ES.REPORTED) -> EvidenceEdge:
        return EvidenceEdge(
            edge_id=eid,
            source_node_id=src,
            target_node_id=dst,
            relationship_type=rel,
            evidence_status=status,
            source_reference=ref,
            observed_at=now - timedelta(days=days),
            description=desc,
        )

    nodes: List[EvidenceNode] = [
        node("sample-refund-desk@ybl", NT.BENEFICIARY, "Sample beneficiary (refund desk)", 40),
        node("sample-mule@okicici", NT.BENEFICIARY, "Sample beneficiary", 30),
        node("sample-new-seller@ybl", NT.BENEFICIARY, "Sample beneficiary (online seller)", 25),
        node("sample-other-seller@ybl", NT.BENEFICIARY, "Sample beneficiary", 25),
        node("sample-kyc-update@ybl", NT.BENEFICIARY, "Sample beneficiary (KYC update)", 15),
        node("sample-landlord@okhdfc", NT.BENEFICIARY, "Sample beneficiary (landlord)", 300),
        node("sample-grocer@okaxis", NT.BENEFICIARY, "Sample beneficiary (grocer)", 200),
        node("SAMPLE-CUST-A", NT.CUSTOMER, "Sample customer A", 400),
        node("SAMPLE-CUST-B", NT.CUSTOMER, "Sample customer B", 400),
        node("SAMPLE-CUST-C", NT.CUSTOMER, "Sample customer C", 400),
        node("SAMPLE-CASE-301", NT.FRAUD_CASE, "Sample case 301", 9),
        node("SAMPLE-CASE-302", NT.FRAUD_CASE, "Sample complaint 302", 4),
        node("SAMPLE-CASE-303", NT.FRAUD_CASE, "Sample complaint 303", 6),
        node("SAMPLE-CASE-201", NT.FRAUD_CASE, "Sample complaint 201", 8),
        node("SAMPLE-CASE-401", NT.FRAUD_CASE, "Sample complaint 401", 5),
        node("SAMPLE-CASE-402", NT.FRAUD_CASE, "Sample complaint 402", 2),
        node("SAMPLE-PHONE-11", NT.IDENTIFIER, "Sample shared phone identifier", 14),
        node("SAMPLE-DEVICE-77", NT.IDENTIFIER, "Sample shared device identifier", 12),
        node("SAMPLE-MSG-501", NT.COMMUNICATION, "Sample reported message", 4),
    ]
    edges: List[EvidenceEdge] = [
        edge("E-INV-01", "sample-refund-desk@ybl", "SAMPLE-CASE-301", RT.REPORTED_IN_CASE, "SAMPLE_BANK_INVESTIGATION_301", 7, "Sample bank-confirmed case of utility impersonation."),
        edge("E-INV-02", "sample-refund-desk@ybl", "SAMPLE-CASE-302", RT.REPORTED_IN_CASE, "SAMPLE_USER_COMPLAINT_302", 3, "Sample customer report of a disconnection threat call."),
        edge("E-INV-03", "sample-refund-desk@ybl", "SAMPLE-PHONE-11", RT.SHARES_IDENTIFIER, "SAMPLE_GRAPH_LINK_11", 12, "Sample phone identifier observed on this beneficiary.", ES.INFERRED),
        edge("E-INV-04", "sample-mule@okicici", "SAMPLE-PHONE-11", RT.SHARES_IDENTIFIER, "SAMPLE_GRAPH_LINK_11", 12, "Sample phone identifier observed on this beneficiary.", ES.INFERRED),
        edge("E-INV-05", "sample-mule@okicici", "SAMPLE-CASE-303", RT.REPORTED_IN_CASE, "SAMPLE_USER_COMPLAINT_303", 5, "Sample customer report of an advance-fee request."),
        edge("E-INV-06", "sample-new-seller@ybl", "SAMPLE-CASE-201", RT.REPORTED_IN_CASE, "SAMPLE_USER_COMPLAINT_201", 6, "Sample complaint: item not delivered after advance payment."),
        edge("E-INV-07", "sample-new-seller@ybl", "SAMPLE-DEVICE-77", RT.SHARES_IDENTIFIER, "SAMPLE_GRAPH_LINK_77", 10, "Sample device identifier observed on this beneficiary.", ES.INFERRED),
        edge("E-INV-08", "sample-other-seller@ybl", "SAMPLE-DEVICE-77", RT.SHARES_IDENTIFIER, "SAMPLE_GRAPH_LINK_77", 10, "Sample device identifier observed on this beneficiary.", ES.INFERRED),
        edge("E-INV-09", "sample-kyc-update@ybl", "SAMPLE-CASE-401", RT.REPORTED_IN_CASE, "SAMPLE_USER_COMPLAINT_401", 4, "Sample report of a fake KYC update request."),
        edge("E-INV-10", "sample-kyc-update@ybl", "SAMPLE-CASE-402", RT.REPORTED_IN_CASE, "SAMPLE_PARTNER_REPORT_402", 1, "Sample partner report of a KYC suspension threat."),
        edge("E-INV-11", "SAMPLE-MSG-501", "sample-kyc-update@ybl", RT.MENTIONED_IN, "SAMPLE_USER_COMPLAINT_401", 4, "Sample reported message naming this beneficiary."),
        edge("E-INV-12", "SAMPLE-CUST-A", "sample-landlord@okhdfc", RT.PAID_TO, "SAMPLE_LEDGER_A_01", 30, "Sample settled rent payment."),
        edge("E-INV-13", "SAMPLE-CUST-B", "sample-landlord@okhdfc", RT.PAID_TO, "SAMPLE_LEDGER_B_01", 31, "Sample settled rent payment."),
        edge("E-INV-14", "SAMPLE-CUST-A", "sample-grocer@okaxis", RT.PAID_TO, "SAMPLE_LEDGER_A_02", 2, "Sample settled grocery payment."),
        edge("E-INV-15", "SAMPLE-CUST-C", "sample-grocer@okaxis", RT.PAID_TO, "SAMPLE_LEDGER_C_01", 3, "Sample settled grocery payment."),
    ]
    return SPEGGraphInput(nodes=nodes, edges=edges)


def seed_demo_graph() -> Tuple[str, int, int]:
    """Build the synthetic demo graph as the default in-memory graph. Returns (graph_id, nodes, edges)."""
    now = datetime.now(timezone.utc)
    graph, response = build_speg_graph(_demo_graph_input(now), graph_id=DEMO_GRAPH_ID, set_as_default=True)
    authority = TrustedVerificationAuthority(
        authority_id="SAMPLE_DEMO_AUTHORITY",
        verification_rationale="Sample corroboration for the synthetic demo graph only.",
    )
    for edge_id in _VERIFIED_EDGE_IDS:
        verify_evidence_edge(graph, edge_id, authority, f"SAMPLE_VERIFICATION_{edge_id}")
    logger.info(
        "Seeded synthetic demo SPEG graph '%s' (%d nodes, %d edges).",
        response.graph_id,
        response.node_count,
        response.edge_count,
    )
    return response.graph_id, response.node_count, response.edge_count
