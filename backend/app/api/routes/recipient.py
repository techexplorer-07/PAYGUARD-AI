"""API router for Recipient Risk Intelligence and SPEG Graph Foundation (Phase 2.3.1, 2.3.2 & 2.3.3)."""

from datetime import datetime
import logging
from typing import Optional
from fastapi import APIRouter, Header, HTTPException, Query, status

from app.schemas.recipient import (
    EvidenceStatus,
    GraphBuildResponse,
    RecipientEvidenceSummary,
    RecipientIntelligenceProfile,
    RecipientRiskAssessment,
    SPEGGraphInput,
)
from app.services.recipient_relationship_analyzer import analyze_recipient_relationships
from app.services.recipient_risk_scorer import score_recipient_risk
from app.services.speg_graph_builder import (
    build_speg_graph,
    get_recipient_evidence,
)

logger = logging.getLogger("payguard.recipient_intelligence")

router = APIRouter(prefix="/recipient-intelligence", tags=["Recipient Risk Intelligence"])


@router.post(
    "/graph/build",
    response_model=GraphBuildResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Construct a Scam-to-Payment Evidence Graph (SPEG)",
    description=(
        "Constructs a validated, provenance-aware directed multigraph linking entities, "
        "communications, transactions, and fraud reports in memory."
    ),
)
async def build_evidence_graph(request: SPEGGraphInput) -> GraphBuildResponse:
    """Build in-memory SPEG graph from validated nodes and directed evidence edges.

    Public Trust Boundary:
    - Rejects any evidence edge specifying VERIFIED status.
    - Rejects client self-declarations of trust.
    - Public callers can only submit REPORTED or INFERRED evidence.
    """
    logger.info("Building SPEG graph with %d nodes and %d edges", len(request.nodes), len(request.edges))
    _, response = build_speg_graph(request)
    return response


@router.get(
    "/recipients/{recipient_id}/evidence",
    response_model=RecipientEvidenceSummary,
    status_code=status.HTTP_200_OK,
    summary="Retrieve Evidence Provenance for a Recipient",
    description=(
        "Retrieves the entity node, connected nodes, incident evidence relationships, "
        "and provenance breakdown (VERIFIED, REPORTED, INFERRED) for a target beneficiary."
    ),
)
async def get_beneficiary_evidence(
    recipient_id: str,
    as_of: Optional[datetime] = Query(
        None,
        description="Optional timezone-aware reference timestamp to filter out expired evidence.",
    ),
    graph_id: Optional[str] = Query(
        None,
        description="Optional specific graph_id instance to query. Defaults to active graph in memory.",
    ),
) -> RecipientEvidenceSummary:
    """Query provenance-aware evidence for a recipient node.

    Provenance & Epistemic Boundaries:
    - Preserves distinction between VERIFIED outcomes, user REPORTED claims, and INFERRED links.
    - Excludes temporally expired evidence when `as_of` is supplied.
    - Does not calculate automatic fraud scores or propagate guilt by association.
    """
    summary = get_recipient_evidence(recipient_id=recipient_id, graph_id=graph_id, as_of=as_of)

    if summary.recipient_node is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=summary.assessment_notes[0] if summary.assessment_notes else f"Recipient '{recipient_id}' not found.",
        )

    return summary


@router.get(
    "/recipients/{recipient_id}/profile",
    response_model=RecipientIntelligenceProfile,
    status_code=status.HTTP_200_OK,
    summary="Retrieve Recipient Relationship Intelligence Profile",
    description=(
        "Analyzes SPEG graph topology to construct an auditable recipient intelligence profile, "
        "including direct customer transactors, transaction volumes, shared identifier associations, "
        "and epistemic evidence breakdown (VERIFIED, REPORTED, INFERRED)."
    ),
)
async def get_recipient_profile(
    recipient_id: str,
    as_of: Optional[datetime] = Query(
        None,
        description="Optional timezone-aware reference timestamp for temporal expiry and recency calculations.",
    ),
    graph_id: Optional[str] = Query(
        None,
        description="Optional specific graph_id instance to query. Defaults to active graph in memory.",
    ),
) -> RecipientIntelligenceProfile:
    """Retrieve structured recipient relationship intelligence profile.

    Ethical & Analytical Boundaries:
    - Never calculates automated fraud risk scores or blocking recommendations.
    - Does not infer common account ownership from shared identifiers.
    - Limits multi-hop path traversals to prevent combinatorial cycles.
    """
    try:
        profile = analyze_recipient_relationships(
            recipient_id=recipient_id,
            graph_id=graph_id,
            as_of=as_of,
        )
        return profile
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get(
    "/recipients/{recipient_id}/risk-assessment",
    response_model=RecipientRiskAssessment,
    status_code=status.HTTP_200_OK,
    summary="Compute Recipient Risk Assessment",
    description=(
        "Computes a transparent, evidence-based recipient risk assessment from SPEG intelligence profile, "
        "including normalized score, categorical risk tier, feature contributions, and traceable explanation."
    ),
)
async def get_recipient_risk_assessment(
    recipient_id: str,
    as_of: Optional[datetime] = Query(
        None,
        description="Optional timezone-aware reference timestamp for temporal expiry and recency calculations.",
    ),
    graph_id: Optional[str] = Query(
        None,
        description="Optional specific graph_id instance to query. Defaults to active graph in memory.",
    ),
) -> RecipientRiskAssessment:
    """Evaluate recipient graph evidence and return deterministic risk assessment.

    Ethical & Analytical Invariants:
    - Interpretable heuristic score in [0.0000, 1.0000], not a calibrated fraud probability.
    - Preserves provenance of VERIFIED, REPORTED, and INFERRED evidence.
    - High transaction volume alone or inferred associations alone never trigger HIGH risk.
    """
    try:
        profile = analyze_recipient_relationships(
            recipient_id=recipient_id,
            graph_id=graph_id,
            as_of=as_of,
        )
        assessment = score_recipient_risk(profile=profile, as_of=as_of)
        return assessment
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
