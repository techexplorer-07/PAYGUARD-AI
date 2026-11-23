"""Deterministic, explainable behavioural anomaly scoring engine (Phase 2.2.3)."""

from datetime import datetime, timezone
from decimal import Decimal
from typing import Dict, List, Optional
import uuid

from app.schemas.behavioural import (
    BeneficiaryNoveltyStatus,
    BehaviouralFeatureSet,
    BehaviouralRiskAssessment,
    BehaviouralRiskLevel,
    DataSufficiencyLevel,
    PaymentMethodNoveltyStatus,
)

# Documented Provisional Heuristic Maximum Weights
MAX_WEIGHT_AMOUNT = Decimal("0.3500")       # 35% max: statistical amount deviation
MAX_WEIGHT_BENEFICIARY = Decimal("0.2500")  # 25% max: novelty of payee (never HIGH alone)
MAX_WEIGHT_VELOCITY = Decimal("0.2000")     # 20% max: frequency / volume acceleration
MAX_WEIGHT_PAYMENT_METHOD = Decimal("0.1000")# 10% max: novel payment rail
MAX_WEIGHT_TIME = Decimal("0.1000")         # 10% max: circular time deviation
SYNERGY_COMPOUND_WEIGHT = Decimal("0.1000") # 10% compound bonus for joint new payee + extreme amount

# Threshold Bands for Minimal or Sufficient Data
THRESHOLD_LOW_UPPER = Decimal("0.3000")     # [0.0000, 0.3000) -> LOW
THRESHOLD_MEDIUM_UPPER = Decimal("0.6500")  # [0.3000, 0.6500) -> MEDIUM
                                            # [0.6500, 1.0000] -> HIGH


def score_behavioural_risk(
    features: BehaviouralFeatureSet,
    transaction_id: Optional[str] = None,
) -> BehaviouralRiskAssessment:
    """Evaluate deterministic, explainable behavioural anomaly rules on extracted features.

    Core Invariants:
    - Never assigns HIGH or CRITICAL risk from a new beneficiary alone (max contribution 0.25 < 0.30 threshold).
    - Uses UNCERTAIN when historical data is insufficient (< 3 comparable transactions) or missing.
    - Uses Median/MAD robust z-scores with fallback to ratio-to-median when MAD is zero.
    - Never conflates anomaly severity with machine-learning fraud probability.
    - Normalizes composite anomaly score strictly to [0.0000, 1.0000].

    Args:
        features: Fully extracted BehaviouralFeatureSet for the customer transaction.
        transaction_id: Optional transaction reference identifier.

    Returns:
        BehaviouralRiskAssessment: Score, risk tier, indicator flags, feature contributions, and explanations.
    """
    detected_indicators: List[str] = []
    explanations: List[str] = []
    contributions: Dict[str, Decimal] = {}

    amt_feat = features.amount_deviation
    ben_feat = features.beneficiary_feature
    vel_feat = features.velocity_feature
    pm_feat = features.payment_method_feature
    time_feat = features.time_deviation

    # -----------------------------------------------------------------
    # SIGNAL 1: AMOUNT ANOMALY SCORING (Max 0.3500)
    # -----------------------------------------------------------------
    amount_contrib = Decimal("0.0000")
    if amt_feat.comparable_count == 0 or amt_feat.historical_median is None:
        amount_contrib = Decimal("0.0000")
        explanations.append(
            f"Amount baseline unavailable: No comparable historical transactions in {amt_feat.currency}. "
            "Amount deviation contributes zero anomaly score."
        )
    elif amt_feat.is_zero_mad:
        # Zero MAD fallback: use ratio_to_median
        ratio = amt_feat.ratio_to_median or Decimal("1.0000")
        if ratio <= Decimal("1.2500"):
            amount_contrib = Decimal("0.0000")
            explanations.append(
                f"Amount {amt_feat.current_amount} {amt_feat.currency} matches uniform historical baseline "
                f"({amt_feat.historical_median} {amt_feat.currency}, ratio {ratio:.2f}x)."
            )
        elif ratio <= Decimal("2.0000"):
            amount_contrib = Decimal("0.1500")
            detected_indicators.append("MODERATE_AMOUNT_DEVIATION_ZERO_MAD")
            explanations.append(
                f"Moderate amount elevation from uniform historical baseline: {ratio:.2f}x median "
                f"({amt_feat.current_amount} vs {amt_feat.historical_median} {amt_feat.currency})."
            )
        elif ratio <= Decimal("3.5000"):
            amount_contrib = Decimal("0.2500")
            detected_indicators.append("HIGH_AMOUNT_DEVIATION_ZERO_MAD")
            explanations.append(
                f"High amount surge from uniform historical baseline: {ratio:.2f}x median "
                f"({amt_feat.current_amount} vs {amt_feat.historical_median} {amt_feat.currency})."
            )
        else:
            amount_contrib = MAX_WEIGHT_AMOUNT
            detected_indicators.append("EXTREME_AMOUNT_DEVIATION_ZERO_MAD")
            explanations.append(
                f"Extreme amount spike from uniform historical baseline: {ratio:.2f}x median "
                f"({amt_feat.current_amount} vs {amt_feat.historical_median} {amt_feat.currency})."
            )
    else:
        # Robust z-score calculation available (MAD > 0)
        z = amt_feat.robust_z_score or Decimal("0.0000")
        if z <= Decimal("1.5000"):
            amount_contrib = Decimal("0.0000")
            explanations.append(
                f"Amount conforms to historical distribution (robust z-score: {z:+0.2f}, median: {amt_feat.historical_median} {amt_feat.currency})."
            )
        elif z <= Decimal("2.5000"):
            amount_contrib = Decimal("0.1500")
            detected_indicators.append("MODERATE_AMOUNT_DEVIATION")
            explanations.append(
                f"Moderate amount elevation: robust z-score of {z:+0.2f} above historical median ({amt_feat.historical_median} {amt_feat.currency})."
            )
        elif z <= Decimal("4.0000"):
            amount_contrib = Decimal("0.2500")
            detected_indicators.append("HIGH_AMOUNT_DEVIATION")
            explanations.append(
                f"High amount deviation: robust z-score of {z:+0.2f} (MAD: {amt_feat.median_absolute_deviation} {amt_feat.currency})."
            )
        else:
            amount_contrib = MAX_WEIGHT_AMOUNT
            detected_indicators.append("EXTREME_AMOUNT_DEVIATION")
            explanations.append(
                f"Extreme statistical amount outlier: robust z-score of {z:+0.2f} (median: {amt_feat.historical_median}, MAD: {amt_feat.median_absolute_deviation} {amt_feat.currency})."
            )

    contributions["amount_deviation"] = amount_contrib

    # -----------------------------------------------------------------
    # SIGNAL 2: BENEFICIARY NOVELTY SCORING (Max 0.2500)
    # -----------------------------------------------------------------
    ben_contrib = Decimal("0.0000")
    if ben_feat.status == BeneficiaryNoveltyStatus.KNOWN:
        ben_contrib = Decimal("0.0000")
        explanations.append(
            f"Familiar beneficiary: '{ben_feat.beneficiary_id}' has received {ben_feat.historical_transaction_count} prior payments "
            f"({ben_feat.historical_share_percentage}% of customer history)."
        )
    elif ben_feat.status == BeneficiaryNoveltyStatus.NEW:
        # Crucial Rule: New beneficiary alone contributes at most 0.25, ensuring it stays in the LOW band (< 0.30)
        ben_contrib = MAX_WEIGHT_BENEFICIARY
        detected_indicators.append("NEW_BENEFICIARY")
        explanations.append(
            f"First-time beneficiary: '{ben_feat.beneficiary_id}' has not appeared in prior transaction history. "
            "(Note: Novel beneficiary alone does not trigger high risk without supporting anomalies)."
        )
    else:  # INSUFFICIENT_HISTORY
        ben_contrib = Decimal("0.0000")
        explanations.append("Beneficiary novelty cannot be evaluated due to insufficient historical records.")

    contributions["beneficiary_novelty"] = ben_contrib

    # -----------------------------------------------------------------
    # SIGNAL 3: VELOCITY SURGE SCORING (Max 0.2000)
    # -----------------------------------------------------------------
    vel_contrib = Decimal("0.0000")
    is_high_surge = (
        vel_feat.tx_count_1h >= 3
        or vel_feat.tx_count_24h >= 5
        or (vel_feat.velocity_ratio_24h is not None and vel_feat.velocity_ratio_24h >= Decimal("3.50"))
    )
    is_moderate_surge = (
        vel_feat.tx_count_1h >= 2
        or vel_feat.tx_count_24h >= 3
        or (vel_feat.velocity_ratio_24h is not None and vel_feat.velocity_ratio_24h >= Decimal("2.00"))
    )

    if is_high_surge:
        vel_contrib = MAX_WEIGHT_VELOCITY
        detected_indicators.append("HIGH_VELOCITY_SURGE")
        explanations.append(
            f"High transaction frequency surge: {vel_feat.tx_count_1h} tx in last 1h, {vel_feat.tx_count_24h} tx in last 24h."
        )
    elif is_moderate_surge:
        vel_contrib = Decimal("0.1000")
        detected_indicators.append("MODERATE_VELOCITY_ELEVATION")
        explanations.append(
            f"Moderate velocity elevation: {vel_feat.tx_count_24h} transactions in prior 24 hours."
        )
    else:
        vel_contrib = Decimal("0.0000")
        explanations.append("Transaction velocity conforms to normal pacing.")

    contributions["velocity_surge"] = vel_contrib

    # -----------------------------------------------------------------
    # SIGNAL 4: PAYMENT METHOD NOVELTY (Max 0.1000)
    # -----------------------------------------------------------------
    pm_contrib = Decimal("0.0000")
    if pm_feat.status == PaymentMethodNoveltyStatus.NEW:
        pm_contrib = MAX_WEIGHT_PAYMENT_METHOD
        detected_indicators.append("NEW_PAYMENT_METHOD")
        explanations.append(
            f"Novel payment method: Instrument '{pm_feat.payment_method}' has no observed prior usage for this customer."
        )
    else:
        pm_contrib = Decimal("0.0000")
        if pm_feat.status == PaymentMethodNoveltyStatus.KNOWN:
            explanations.append(f"Payment method '{pm_feat.payment_method}' is known and previously utilized.")
        else:
            explanations.append("Payment method novelty cannot be assessed due to empty history.")

    contributions["payment_method_novelty"] = pm_contrib

    # -----------------------------------------------------------------
    # SIGNAL 5: CIRCULAR TIME-OF-DAY DEVIATION (Max 0.1000)
    # -----------------------------------------------------------------
    time_contrib = Decimal("0.0000")
    if time_feat.is_unusual_hour is True:
        time_contrib = MAX_WEIGHT_TIME
        detected_indicators.append("UNUSUAL_TRANSACTION_TIME")
        explanations.append(
            f"Unusual transaction timing: Executed at {time_feat.current_time_of_day_utc}, which is "
            f"{time_feat.min_circular_distance_minutes} minutes from nearest historically observed activity."
        )
    elif time_feat.is_unusual_hour is False:
        time_contrib = Decimal("0.0000")
        explanations.append(
            f"Time of day ({time_feat.current_time_of_day_utc}) conforms to known customer activity corridors "
            f"(shortest distance: {time_feat.min_circular_distance_minutes} mins)."
        )
    else:
        time_contrib = Decimal("0.0000")
        explanations.append("Time-of-day profile unavailable due to insufficient historical sample (< 3 transactions).")

    contributions["time_deviation"] = time_contrib

    # -----------------------------------------------------------------
    # COMPOUND RISK SYNERGY (Novel Payee + Large Amount Spike)
    # -----------------------------------------------------------------
    synergy_contrib = Decimal("0.0000")
    has_large_amount = any(
        ind in detected_indicators
        for ind in [
            "HIGH_AMOUNT_DEVIATION",
            "EXTREME_AMOUNT_DEVIATION",
            "HIGH_AMOUNT_DEVIATION_ZERO_MAD",
            "EXTREME_AMOUNT_DEVIATION_ZERO_MAD",
        ]
    )
    if "NEW_BENEFICIARY" in detected_indicators and has_large_amount:
        synergy_contrib = SYNERGY_COMPOUND_WEIGHT
        detected_indicators.append("COMPOUND_NOVEL_BENEFICIARY_AMOUNT_SPIKE")
        explanations.append(
            "Compound behavioural risk: High transaction amount deviation directed to an unprecedented beneficiary."
        )

    contributions["compound_synergy"] = synergy_contrib

    # -----------------------------------------------------------------
    # SCORE NORMALIZATION & TIER SELECTION
    # -----------------------------------------------------------------
    raw_composite = (
        amount_contrib
        + ben_contrib
        + vel_contrib
        + pm_contrib
        + time_contrib
        + synergy_contrib
    )
    normalized_score = min(Decimal("1.0000"), max(Decimal("0.0000"), raw_composite))

    # Evaluate Data Sufficiency First
    if (
        features.data_sufficiency == DataSufficiencyLevel.INSUFFICIENT
        or amt_feat.comparable_count == 0
    ):
        risk_level = BehaviouralRiskLevel.UNCERTAIN
        explanations.insert(
            0,
            "DATA SUFFICIENCY NOTICE: Historical transaction profile is insufficient (< 3 comparable records). "
            "Risk tier is classified as UNCERTAIN to prevent false security assumptions.",
        )
    else:
        if normalized_score < THRESHOLD_LOW_UPPER:
            risk_level = BehaviouralRiskLevel.LOW
            explanations.insert(
                0,
                "LOW BEHAVIOURAL ANOMALY: Transaction parameters broadly conform to established customer baseline. "
                "(Note: Low behavioural divergence does not guarantee absence of external scam pressure).",
            )
        elif normalized_score < THRESHOLD_MEDIUM_UPPER:
            risk_level = BehaviouralRiskLevel.MEDIUM
            explanations.insert(
                0,
                "MODERATE BEHAVIOURAL ANOMALY: Moderate divergence from customer baseline detected. "
                "Secondary step-up verification or review recommended.",
            )
        else:
            risk_level = BehaviouralRiskLevel.HIGH
            explanations.insert(
                0,
                "HIGH BEHAVIOURAL ANOMALY: Severe divergence from historical profile detected across critical dimensions "
                "(e.g. novel beneficiary paired with extreme amount deviation or velocity acceleration).",
            )

    return BehaviouralRiskAssessment(
        assessment_id=f"ASM-{uuid.uuid4().hex[:12].upper()}",
        customer_id=features.customer_id,
        transaction_id=transaction_id,
        anomaly_score=round(normalized_score, 4),
        risk_level=risk_level,
        detected_indicators=detected_indicators,
        feature_contributions=contributions,
        explanation=explanations,
        data_sufficiency=features.data_sufficiency,
        model_type="deterministic_heuristic_anomaly_scorer (provisional v1)",
        assessment_timestamp=datetime.now(timezone.utc),
    )
