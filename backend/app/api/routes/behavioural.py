"""API router for Behavioural Risk Feature Extraction (Phase 2.2.1 & Phase 2.2.2)."""

import logging
from fastapi import APIRouter, status
from app.schemas.behavioural import (
    BehaviouralAnalysisRequest,
    BehaviouralFeatureSet,
    BehaviouralRiskAssessment,
)
from app.services.behavioural_feature_extractor import extract_behavioural_features
from app.services.behavioural_risk_scorer import score_behavioural_risk

logger = logging.getLogger("payguard.behavioural")

router = APIRouter(prefix="/behavioural", tags=["Behavioural Risk Analysis"])


@router.post(
    "/analyze",
    response_model=BehaviouralRiskAssessment,
    status_code=status.HTTP_200_OK,
    summary="Analyze Behavioural Risk for a Transaction",
    description=(
        "Extracts behavioural features from customer transaction history and calculates a deterministic, "
        "explainable anomaly score (0.0 to 1.0) and categorical risk tier (LOW, MEDIUM, HIGH, UNCERTAIN)."
    ),
)
async def analyze_behavioural_risk(request: BehaviouralAnalysisRequest) -> BehaviouralRiskAssessment:
    """Analyze behavioural anomalies and generate explainable risk score.

    Privacy & Security Guarantees:
    - Never persists raw historical transactions to any database.
    - Operates purely in volatile heap memory with Decimal financial arithmetic.
    - Produces a transparent audit trail of feature contributions and reasons.

    Args:
        request: Validated BehaviouralAnalysisRequest containing customer_id, current_transaction,
                 and historical_transactions.

    Returns:
        BehaviouralRiskAssessment: Anomaly score, risk level, indicator flags, and explanations.
    """
    logger.info(
        "Evaluating behavioural risk: customer_id=%s, tx_id=%s, amount=%s %s",
        request.customer_id,
        request.current_transaction.transaction_id,
        request.current_transaction.amount,
        request.current_transaction.currency,
    )

    # 1. Deterministic Feature Extraction
    features = extract_behavioural_features(request)

    # 2. Explainable Anomaly Scoring
    assessment = score_behavioural_risk(
        features=features,
        transaction_id=request.current_transaction.transaction_id,
    )
    return assessment


@router.post(
    "/extract-features",
    response_model=BehaviouralFeatureSet,
    status_code=status.HTTP_200_OK,
    summary="Extract Behavioural Features from Customer Transaction History",
    description=(
        "Compares a current pending transaction against historical transactions belonging to the same customer. "
        "Deterministically extracts statistical amount deviations (Median, MAD, robust z-score), beneficiary novelty, "
        "sliding-window velocity, payment method precedent, and circular time-of-day deviations."
    ),
)
async def analyze_behavioural_features(request: BehaviouralAnalysisRequest) -> BehaviouralFeatureSet:
    """Extract behavioural anomaly baseline features for a transaction.

    Privacy & Data Integrity Guarantees:
    - Never persists or writes raw historical transactions to disk or external databases.
    - Never logs individual transaction records or beneficiary accounts.
    - Operates purely in volatile heap memory using Decimal financial precision.

    Args:
        request: Validated BehaviouralAnalysisRequest containing customer_id, current_transaction,
                 and historical_transactions.

    Returns:
        BehaviouralFeatureSet: Deterministically computed feature set and explainable narrative.
    """
    logger.info(
        "Extracting behavioural features: customer_id=%s, history_count=%d, currency=%s",
        request.customer_id,
        len(request.historical_transactions),
        request.current_transaction.currency,
    )

    feature_set = extract_behavioural_features(request)
    return feature_set
