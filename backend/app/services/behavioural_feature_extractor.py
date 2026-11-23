"""Deterministic feature extraction service for customer behavioural risk baselines (Phase 2.2.2)."""

from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional, Tuple
from app.schemas.behavioural import (
    AmountDeviationFeature,
    BeneficiaryFeature,
    BeneficiaryNoveltyStatus,
    BehaviouralAnalysisRequest,
    BehaviouralFeatureSet,
    CurrentTransaction,
    DataSufficiencyLevel,
    HistoricalTransaction,
    PaymentMethodFeature,
    PaymentMethodNoveltyStatus,
    TimeDeviationFeature,
    VelocityFeature,
)


def _calculate_median(values: List[Decimal]) -> Decimal:
    """Calculate the exact median of a non-empty list of Decimals."""
    sorted_vals = sorted(values)
    n = len(sorted_vals)
    mid = n // 2
    if n % 2 == 1:
        return sorted_vals[mid]
    else:
        return (sorted_vals[mid - 1] + sorted_vals[mid]) / Decimal("2")


def _calculate_circular_minute_distance(min_a: int, min_b: int) -> int:
    """Calculate the shortest circular distance between two minutes of the day (0 to 1439).

    The time of day lies on a 24-hour circular manifold (1440 minutes).
    The distance between 23:55 (1435 min) and 00:05 (5 min) is 10 minutes, not 1430 minutes.
    """
    direct_diff = abs(min_a - min_b)
    return min(direct_diff, 1440 - direct_diff)


def extract_amount_deviation_feature(
    current_tx: CurrentTransaction,
    historical_txs: List[HistoricalTransaction],
) -> AmountDeviationFeature:
    """Compute robust median and Median Absolute Deviation (MAD) for transaction amounts.

    Strict Invariants:
    - Excludes cross-currency historical records (compares only transactions in identical ISO currency).
    - Uses Median and MAD instead of Mean and Standard Deviation to eliminate outlier distortion.
    - Gracefully handles zero MAD when all historical amounts are identical.
    - Never converts missing data into artificial zero anomalies.
    """
    target_currency = current_tx.currency.strip().upper()
    comparable_txs = [
        ht for ht in historical_txs
        if ht.currency.strip().upper() == target_currency
    ]
    comparable_count = len(comparable_txs)

    if comparable_count == 0:
        return AmountDeviationFeature(
            current_amount=current_tx.amount,
            currency=target_currency,
            comparable_count=0,
            historical_median=None,
            difference_from_median=None,
            ratio_to_median=None,
            median_absolute_deviation=None,
            robust_z_score=None,
            is_zero_mad=False,
            calculation_notes=(
                f"No historical transactions found denominated in {target_currency}. "
                "Amount deviation metrics cannot be calculated."
            ),
        )

    amounts = [ht.amount for ht in comparable_txs]
    median_val = _calculate_median(amounts)
    diff_from_median = current_tx.amount - median_val

    ratio_to_median: Optional[Decimal] = None
    if median_val > Decimal("0.00"):
        ratio_to_median = round(current_tx.amount / median_val, 4)

    # Median Absolute Deviation (MAD)
    abs_deviations = [abs(amt - median_val) for amt in amounts]
    mad_val = _calculate_median(abs_deviations)

    if mad_val == Decimal("0.00"):
        # Zero MAD occurs when >= 50% of historical transactions have the exact same amount
        is_zero_mad = True
        robust_z = None
        notes = (
            f"Zero MAD detected across {comparable_count} {target_currency} historical transactions "
            f"(median: {median_val} {target_currency}). All observed transactions cluster at identical values. "
            f"Difference from median is {diff_from_median:+.2f} {target_currency}."
        )
    else:
        is_zero_mad = False
        # Modified z-score: 0.6745 * (x - median) / MAD
        # 0.6745 represents the 75th percentile of normal distribution, ensuring MAD scales to standard deviation
        raw_z = (Decimal("0.6745") * diff_from_median) / mad_val
        robust_z = round(raw_z, 4)
        notes = (
            f"Compared against {comparable_count} historical {target_currency} transactions. "
            f"Median: {median_val} {target_currency}, MAD: {mad_val} {target_currency}. "
            f"Difference: {diff_from_median:+.2f} {target_currency} (ratio: {ratio_to_median}x, robust z-score: {robust_z:+0.2f})."
        )

    return AmountDeviationFeature(
        current_amount=current_tx.amount,
        currency=target_currency,
        comparable_count=comparable_count,
        historical_median=median_val,
        difference_from_median=diff_from_median,
        ratio_to_median=ratio_to_median,
        median_absolute_deviation=mad_val,
        robust_z_score=robust_z,
        is_zero_mad=is_zero_mad,
        calculation_notes=notes,
    )


def extract_beneficiary_feature(
    current_tx: CurrentTransaction,
    historical_txs: List[HistoricalTransaction],
) -> BeneficiaryFeature:
    """Evaluate beneficiary familiarity and historical transaction distribution."""
    total_history = len(historical_txs)
    current_ben = current_tx.beneficiary_id.strip().lower()

    if total_history == 0:
        return BeneficiaryFeature(
            beneficiary_id=current_tx.beneficiary_id,
            status=BeneficiaryNoveltyStatus.INSUFFICIENT_HISTORY,
            historical_transaction_count=0,
            historical_share_percentage=None,
            calculation_notes="No historical transactions available to establish beneficiary familiarity.",
        )

    matching_count = sum(
        1 for ht in historical_txs
        if ht.beneficiary_id.strip().lower() == current_ben
    )

    if matching_count > 0:
        status = BeneficiaryNoveltyStatus.KNOWN
        share_pct = round(
            (Decimal(str(matching_count)) / Decimal(str(total_history))) * Decimal("100.0"), 2
        )
        notes = (
            f"Known beneficiary: '{current_tx.beneficiary_id}' has received {matching_count} of "
            f"{total_history} historical transactions ({share_pct}% share)."
        )
    else:
        status = BeneficiaryNoveltyStatus.NEW
        share_pct = Decimal("0.00")
        notes = (
            f"New beneficiary: '{current_tx.beneficiary_id}' has not appeared in any of the "
            f"{total_history} historical transactions recorded for this customer."
        )

    return BeneficiaryFeature(
        beneficiary_id=current_tx.beneficiary_id,
        status=status,
        historical_transaction_count=matching_count,
        historical_share_percentage=share_pct,
        calculation_notes=notes,
    )


def extract_velocity_feature(
    current_tx: CurrentTransaction,
    historical_txs: List[HistoricalTransaction],
) -> VelocityFeature:
    """Compute rolling frequency and volume velocities over 1h, 24h, and 7d historical windows."""
    curr_time = current_tx.transaction_timestamp
    target_currency = current_tx.currency.strip().upper()

    count_1h, count_24h, count_7d = 0, 0, 0
    vol_1h, vol_24h, vol_7d = Decimal("0.00"), Decimal("0.00"), Decimal("0.00")

    for ht in historical_txs:
        # Only evaluate transactions occurring prior to current transaction
        if ht.transaction_timestamp <= curr_time:
            delta_seconds = (curr_time - ht.transaction_timestamp).total_seconds()
            same_currency = (ht.currency.strip().upper() == target_currency)

            # 1 Hour Window (3600 seconds)
            if delta_seconds <= 3600:
                count_1h += 1
                if same_currency:
                    vol_1h += ht.amount

            # 24 Hour Window (86400 seconds)
            if delta_seconds <= 86400:
                count_24h += 1
                if same_currency:
                    vol_24h += ht.amount

            # 7 Day Window (604800 seconds)
            if delta_seconds <= 604800:
                count_7d += 1
                if same_currency:
                    vol_7d += ht.amount

    # Compute historical daily baseline rate
    hist_daily_avg: Optional[Decimal] = None
    vel_ratio_24h: Optional[Decimal] = None
    if len(historical_txs) > 0:
        oldest_ts = min(ht.transaction_timestamp for ht in historical_txs)
        span_seconds = max(86400.0, (curr_time - oldest_ts).total_seconds())
        span_days = Decimal(str(round(span_seconds / 86400.0, 2)))
        if span_days > Decimal("0.00"):
            hist_daily_avg = round(Decimal(str(len(historical_txs))) / span_days, 2)
            if hist_daily_avg > Decimal("0.00"):
                vel_ratio_24h = round(Decimal(str(count_24h)) / hist_daily_avg, 2)

    notes = (
        f"Velocity windows prior to current transaction: {count_1h} tx in last 1h ({vol_1h} {target_currency}), "
        f"{count_24h} tx in last 24h ({vol_24h} {target_currency}), {count_7d} tx in last 7d ({vol_7d} {target_currency}). "
        f"Baseline: {hist_daily_avg} tx/day."
    )

    return VelocityFeature(
        tx_count_1h=count_1h,
        tx_volume_1h=vol_1h,
        tx_count_24h=count_24h,
        tx_volume_24h=vol_24h,
        tx_count_7d=count_7d,
        tx_volume_7d=vol_7d,
        historical_daily_avg_count=hist_daily_avg,
        velocity_ratio_24h=vel_ratio_24h,
        calculation_notes=notes,
    )


def extract_payment_method_feature(
    current_tx: CurrentTransaction,
    historical_txs: List[HistoricalTransaction],
) -> PaymentMethodFeature:
    """Determine whether the payment method has precedent in customer history."""
    total_history = len(historical_txs)
    current_pm = current_tx.payment_method.strip().upper()

    if total_history == 0:
        return PaymentMethodFeature(
            payment_method=current_tx.payment_method,
            status=PaymentMethodNoveltyStatus.INSUFFICIENT_HISTORY,
            historical_usage_count=0,
            calculation_notes="No historical transactions available to assess payment method precedent.",
        )

    usage_count = sum(
        1 for ht in historical_txs
        if ht.payment_method.strip().upper() == current_pm
    )

    if usage_count > 0:
        status = PaymentMethodNoveltyStatus.KNOWN
        notes = f"Known payment method: '{current_pm}' previously used in {usage_count} of {total_history} transactions."
    else:
        status = PaymentMethodNoveltyStatus.NEW
        notes = f"New payment method: '{current_pm}' has no historical usage across {total_history} transactions."

    return PaymentMethodFeature(
        payment_method=current_tx.payment_method,
        status=status,
        historical_usage_count=usage_count,
        calculation_notes=notes,
    )


def extract_time_deviation_feature(
    current_tx: CurrentTransaction,
    historical_txs: List[HistoricalTransaction],
) -> TimeDeviationFeature:
    """Compute circular time-of-day conformity metrics on a 24-hour circular manifold."""
    total_history = len(historical_txs)
    curr_utc = current_tx.transaction_timestamp.astimezone(timezone.utc)
    curr_min = curr_utc.hour * 60 + curr_utc.minute
    curr_str = f"{curr_utc.hour:02d}:{curr_utc.minute:02d} UTC"

    if total_history < 3:
        return TimeDeviationFeature(
            current_time_of_day_utc=curr_str,
            sample_count=total_history,
            min_circular_distance_minutes=None,
            median_circular_distance_minutes=None,
            is_unusual_hour=None,
            calculation_notes=(
                f"Transaction executed at {curr_str}. Insufficient historical sample ({total_history} < 3 transactions) "
                "to construct an empirical time-of-day profile."
            ),
        )

    # Compute shortest circular distance to every historical transaction's UTC minute of day
    circular_distances: List[int] = []
    for ht in historical_txs:
        ht_utc = ht.transaction_timestamp.astimezone(timezone.utc)
        ht_min = ht_utc.hour * 60 + ht_utc.minute
        dist = _calculate_circular_minute_distance(curr_min, ht_min)
        circular_distances.append(dist)

    min_dist = min(circular_distances)
    median_dist = _calculate_median([Decimal(str(d)) for d in circular_distances])

    # A transaction is deemed an unusual hour if it occurs > 180 minutes (3 hours) away
    # from any historically observed transaction time for this customer.
    is_unusual = (min_dist > 180)

    notes = (
        f"Transaction at {curr_str}. Shortest circular distance to observed historical activity: {min_dist} mins "
        f"(median distance: {median_dist:0.1f} mins). "
        f"{'Flagged as unusual activity corridor (> 3 hours from any known transaction).' if is_unusual else 'Conforms to historical activity corridor.'}"
    )

    return TimeDeviationFeature(
        current_time_of_day_utc=curr_str,
        sample_count=total_history,
        min_circular_distance_minutes=min_dist,
        median_circular_distance_minutes=median_dist,
        is_unusual_hour=is_unusual,
        calculation_notes=notes,
    )


def assess_data_sufficiency(same_currency_count: int) -> DataSufficiencyLevel:
    """Determine statistical sufficiency tier based on comparable currency sample size."""
    if same_currency_count < 3:
        return DataSufficiencyLevel.INSUFFICIENT
    elif same_currency_count < 10:
        return DataSufficiencyLevel.MINIMAL
    else:
        return DataSufficiencyLevel.SUFFICIENT


def extract_behavioural_features(
    request: BehaviouralAnalysisRequest,
) -> BehaviouralFeatureSet:
    """Orchestrate deterministic extraction of all behavioural risk features for a transaction.

    Args:
        request: Validated request containing customer_id, current_transaction, and historical_transactions.

    Returns:
        BehaviouralFeatureSet: Statistical amount deviation, beneficiary familiarity, velocity,
                               payment method novelty, circular time deviation, and data sufficiency status.
    """
    current_tx = request.current_transaction
    history = request.historical_transactions

    # 1. Feature extractions
    amt_feat = extract_amount_deviation_feature(current_tx, history)
    ben_feat = extract_beneficiary_feature(current_tx, history)
    vel_feat = extract_velocity_feature(current_tx, history)
    pm_feat = extract_payment_method_feature(current_tx, history)
    time_feat = extract_time_deviation_feature(current_tx, history)

    # 2. Data sufficiency assessment
    sufficiency = assess_data_sufficiency(amt_feat.comparable_count)

    # 3. Formulate transparent narrative summary
    summary_parts = []
    summary_parts.append(
        f"Customer '{request.customer_id}' evaluated across {len(history)} historical transactions "
        f"({amt_feat.comparable_count} in {amt_feat.currency})."
    )

    if amt_feat.historical_median is not None:
        if amt_feat.ratio_to_median is not None:
            summary_parts.append(
                f"Amount {current_tx.amount:,.2f} {amt_feat.currency} is {amt_feat.ratio_to_median:.2f}x historical median "
                f"({amt_feat.historical_median:,.2f} {amt_feat.currency})."
            )
    else:
        summary_parts.append(f"No comparable {amt_feat.currency} historical transactions available for amount baseline.")

    summary_parts.append(f"Beneficiary is {ben_feat.status.value}.")
    summary_parts.append(f"Payment method is {pm_feat.status.value}.")

    if vel_feat.tx_count_24h > 0:
        summary_parts.append(f"Velocity: {vel_feat.tx_count_24h} transactions in prior 24 hours.")

    if time_feat.min_circular_distance_minutes is not None:
        if time_feat.is_unusual_hour:
            summary_parts.append(
                f"UNUSUAL TIMING: Transaction executed at {time_feat.current_time_of_day_utc}, "
                f"{time_feat.min_circular_distance_minutes} minutes from nearest historical activity."
            )
        else:
            summary_parts.append(f"Timing conforms to activity corridor ({time_feat.min_circular_distance_minutes} min distance).")

    summary_text = " ".join(summary_parts)

    metadata = {
        "engine_version": "2.2.0-alpha",
        "pipeline": "deterministic_feature_extraction",
        "features_computed": [
            "amount_median_deviation",
            "median_absolute_deviation",
            "beneficiary_familiarity",
            "sliding_window_velocity",
            "payment_method_novelty",
            "circular_time_deviation",
        ],
    }

    return BehaviouralFeatureSet(
        customer_id=request.customer_id,
        data_sufficiency=sufficiency,
        total_historical_count=len(history),
        same_currency_count=amt_feat.comparable_count,
        amount_deviation=amt_feat,
        beneficiary_feature=ben_feat,
        velocity_feature=vel_feat,
        payment_method_feature=pm_feat,
        time_deviation=time_feat,
        summary=summary_text,
        metadata=metadata,
    )
