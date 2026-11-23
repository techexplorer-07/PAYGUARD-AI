"""API endpoint for Intent-to-Payment Correlation."""

from datetime import datetime, timezone
import logging
from fastapi import APIRouter, HTTPException, status
from app.schemas.correlation import CorrelationRequest, CorrelationResponse
from app.services.correlation_engine import compare_intent_to_transaction
from app.services.intent_extractor import extract_payment_intent
from app.services.risk_assessor import assess_risk

logger = logging.getLogger("payguard.correlation")

router = APIRouter(prefix="/correlation", tags=["Intent Correlation"])


@router.post(
    "/analyze",
    response_model=CorrelationResponse,
    status_code=status.HTTP_200_OK,
    summary="Correlate Communication Intent with Simulated Transaction",
    description=(
        "Extracts payment instructions (amount, recipient VPA, purpose, urgency/threat cues) "
        "from customer-authorized communication text and compares them against simulated transaction parameters "
        "to detect destination diversion or amount mismatches."
    ),
)
async def analyze_intent_correlation(request: CorrelationRequest) -> CorrelationResponse:
    """Analyze communication intent against transaction details with strict consent validation.

    Privacy & Security Guarantees:
    - Never persists or writes raw communication text to any database.
    - Never logs raw message content; logs only diagnostic telemetry (text length, status).
    - Requires customer_consent == True to proceed; rejects otherwise.

    Args:
        request: Validated CorrelationRequest containing consent, text, and transaction.

    Returns:
        CorrelationResponse: Detailed extraction, field comparison, and explainable risk tier.

    Raises:
        HTTPException(400): When explicit customer analysis consent is not provided.
    """
    # 1. Strict Consent Check (Step 2 requirement)
    if not request.customer_consent:
        logger.warning("Rejected correlation request: explicit customer consent was False.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Explicit customer consent to analyze the supplied communication text is required.",
        )

    # 2. Context Intelligence: Extract intent from communication
    extracted_intent = extract_payment_intent(request.communication_text)

    # 3. Intent-to-Payment Comparison
    comparison = compare_intent_to_transaction(extracted_intent, request.simulated_transaction)

    # 4. Explainable Rule-Based Risk Assessment
    risk_assessment = assess_risk(extracted_intent, comparison, request.simulated_transaction)

    # Privacy-conscious diagnostic log (never logging raw text)
    logger.info(
        "Completed intent correlation: text_len=%d, risk=%s, score=%.2f, recipient_status=%s",
        len(request.communication_text),
        risk_assessment.risk_level.value,
        risk_assessment.heuristic_score,
        comparison.recipient_status.value,
    )

    return CorrelationResponse(
        status="success",
        consent_verified=True,
        extracted_intent=extracted_intent,
        comparison=comparison,
        risk_assessment=risk_assessment,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
