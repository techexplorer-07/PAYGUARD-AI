"""API router for Unified Risk Assessment Engine (Phase 2.4)."""

import logging
from fastapi import APIRouter, HTTPException, status

from app.schemas.unified_risk import (
    UnifiedEvaluationRequest,
    UnifiedRiskAssessment,
)
from app.services.unified_risk_assessor import evaluate_unified_risk

logger = logging.getLogger("payguard.unified_risk_api")

router = APIRouter(prefix="/risk-assessment", tags=["Unified Risk Assessment"])


@router.post(
    "/evaluate",
    response_model=UnifiedRiskAssessment,
    status_code=status.HTTP_200_OK,
    summary="Evaluate Unified Financial Scam & Transaction Risk",
    description=(
        "Synthesizes intent correlation, customer behavioural anomaly scoring, "
        "and recipient graph intelligence into a transparent, explainable composite risk decision."
    ),
)
async def evaluate_transaction_risk(
    request: UnifiedEvaluationRequest,
) -> UnifiedRiskAssessment:
    """Evaluate financial transaction risk across all available intelligence engines.

    Analytical & Ethical Invariants:
    - Bounded composite score in [0.0000, 1.0000] representing heuristic risk severity, NOT a fraud probability.
    - Intent destination diversion contradictions override low behavioural/recipient scores.
    - Controlled VERIFIED recipient fraud case filings trigger HIGH risk and review recommendations.
    - New beneficiary status alone or inferred shared-identifier links alone NEVER trigger HIGH risk.
    - Missing intelligence streams are disclosed explicitly and not treated as clean zero-risk evidence.
    """
    logger.info(
        "Evaluating unified risk for transaction '%s' (Customer: '%s', Recipient: '%s')",
        request.transaction_id,
        request.customer_id,
        request.recipient_id,
    )
    try:
        assessment = evaluate_unified_risk(request)
        return assessment
    except ValueError as e:
        logger.warning("Unified risk validation error: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    except Exception as e:
        logger.error("Unexpected error in unified risk evaluation: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unified risk evaluation failed: {str(e)}",
        )
