"""API router for End-to-End Payment Protection Orchestration."""

import logging
from fastapi import APIRouter, status
from app.schemas.payment_protection import (
    PaymentProtectionRequest,
    PaymentProtectionResponse,
)
from app.services.payment_protection_orchestrator import orchestrate_payment_protection

logger = logging.getLogger("payguard.payment_protection")

router = APIRouter(prefix="/payment-protection", tags=["Payment Protection Orchestration"])


@router.post(
    "/evaluate",
    response_model=PaymentProtectionResponse,
    status_code=status.HTTP_200_OK,
    summary="Evaluate End-to-End Payment Protection Pipeline",
    description=(
        "Executes complete multi-engine fraud defense pipeline: "
        "1) Intent-to-Payment Correlation, "
        "2) Behavioural Anomaly Scoring, "
        "3) Recipient SPEG Intelligence, "
        "4) Unified Risk Assessment, and "
        "5) Simulated Payment Intervention Recommendation."
    ),
)
async def evaluate_payment_protection(
    request: PaymentProtectionRequest,
) -> PaymentProtectionResponse:
    """Evaluate full payment protection pipeline and return unified risk decision with simulated intervention.

    Privacy & Operational Boundaries:
    - Never persists or logs raw communication text.
    - Operates purely in-memory with deterministic heuristics and provenance graphs.
    - Payment intervention is simulated; no live banking or UPI transaction control is executed.
    """
    return orchestrate_payment_protection(request)
