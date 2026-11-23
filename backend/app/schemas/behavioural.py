"""Pydantic v2 data contracts for Behavioural Risk Analysis Engine (Phase 2.2.1)."""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator, model_validator


class BeneficiaryNoveltyStatus(str, Enum):
    """Categorical status for beneficiary novelty assessment."""

    KNOWN = "KNOWN"
    NEW = "NEW"
    INSUFFICIENT_HISTORY = "INSUFFICIENT_HISTORY"


class PaymentMethodNoveltyStatus(str, Enum):
    """Categorical status for payment method novelty assessment."""

    KNOWN = "KNOWN"
    NEW = "NEW"
    INSUFFICIENT_HISTORY = "INSUFFICIENT_HISTORY"


class DataSufficiencyLevel(str, Enum):
    """Evaluation of historical transaction sample sufficiency for behavioural baselines."""

    INSUFFICIENT = "INSUFFICIENT"  # < 3 comparable transactions
    MINIMAL = "MINIMAL"            # 3 to 9 comparable transactions
    SUFFICIENT = "SUFFICIENT"      # 10 or more comparable transactions


def _validate_timezone_aware(dt: datetime, field_name: str) -> datetime:
    """Ensure a datetime object is strictly timezone-aware."""
    if dt.tzinfo is None or dt.tzinfo.utcoffset(dt) is None:
        raise ValueError(f"{field_name} must be timezone-aware (e.g. UTC or with explicit offset).")
    return dt


class HistoricalTransaction(BaseModel):
    """Historical transaction record belonging to a customer profile."""

    transaction_id: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Unique identifier for the historical transaction",
    )
    customer_id: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Customer identifier associated with this transaction",
    )
    amount: Decimal = Field(
        ...,
        gt=Decimal("0.00"),
        decimal_places=2,
        description="Transaction monetary amount (must be positive Decimal)",
    )
    currency: str = Field(
        default="INR",
        min_length=3,
        max_length=3,
        pattern=r"^[A-Z]{3}$",
        description="Three-letter ISO 4217 uppercase currency code",
    )
    beneficiary_id: str = Field(
        ...,
        min_length=1,
        max_length=120,
        description="Beneficiary account handle, UPI VPA, or identifier",
    )
    payment_method: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Payment rail or method used (e.g. UPI, CARD, NETBANKING)",
    )
    transaction_timestamp: datetime = Field(
        ...,
        description="Timezone-aware timestamp when transaction was executed",
    )

    @field_validator("transaction_timestamp")
    @classmethod
    def validate_timestamp_tz(cls, v: datetime) -> datetime:
        return _validate_timezone_aware(v, "transaction_timestamp")


class CurrentTransaction(BaseModel):
    """The simulated or incoming transaction currently being evaluated for behavioural risk."""

    transaction_id: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Optional unique identifier for the current pending transaction",
    )
    customer_id: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Customer identifier initiating the transaction",
    )
    amount: Decimal = Field(
        ...,
        gt=Decimal("0.00"),
        decimal_places=2,
        description="Transaction monetary amount (must be positive Decimal)",
    )
    currency: str = Field(
        default="INR",
        min_length=3,
        max_length=3,
        pattern=r"^[A-Z]{3}$",
        description="Three-letter ISO 4217 uppercase currency code",
    )
    beneficiary_id: str = Field(
        ...,
        min_length=1,
        max_length=120,
        description="Beneficiary account handle, UPI VPA, or identifier",
    )
    payment_method: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Payment rail or method used (e.g. UPI, CARD, NETBANKING)",
    )
    transaction_timestamp: datetime = Field(
        ...,
        description="Timezone-aware timestamp of the current transaction attempt",
    )

    @field_validator("transaction_timestamp")
    @classmethod
    def validate_timestamp_tz(cls, v: datetime) -> datetime:
        return _validate_timezone_aware(v, "transaction_timestamp")


class BehaviouralAnalysisRequest(BaseModel):
    """Payload submitted to extract behavioural features for a transaction against customer history."""

    customer_id: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Customer identifier being analyzed",
    )
    current_transaction: CurrentTransaction = Field(
        ...,
        description="Transaction currently being evaluated",
    )
    historical_transactions: List[HistoricalTransaction] = Field(
        default_factory=list,
        max_length=500,
        description="Bounded list of prior transactions for this customer (up to 500)",
    )

    @model_validator(mode="after")
    def validate_integrity(self) -> "BehaviouralAnalysisRequest":
        # 1. Ownership check: current transaction must belong to customer_id
        if self.current_transaction.customer_id != self.customer_id:
            raise ValueError(
                f"current_transaction.customer_id ('{self.current_transaction.customer_id}') "
                f"must match request customer_id ('{self.customer_id}')."
            )

        # 2. Ownership check: all historical transactions must belong to customer_id
        for idx, ht in enumerate(self.historical_transactions):
            if ht.customer_id != self.customer_id:
                raise ValueError(
                    f"Historical transaction at index {idx} with id '{ht.transaction_id}' has customer_id "
                    f"'{ht.customer_id}', which does not match request customer_id ('{self.customer_id}')."
                )

        # 3. Duplicate ID check in historical transactions
        seen_ids = set()
        for ht in self.historical_transactions:
            if ht.transaction_id in seen_ids:
                raise ValueError(
                    f"Duplicate transaction_id '{ht.transaction_id}' detected in historical_transactions."
                )
            seen_ids.add(ht.transaction_id)

        # Also check current_transaction.transaction_id doesn't duplicate history
        if self.current_transaction.transaction_id and self.current_transaction.transaction_id in seen_ids:
            raise ValueError(
                f"current_transaction.transaction_id '{self.current_transaction.transaction_id}' "
                "duplicates an existing historical transaction_id."
            )

        # 4. Temporal consistency: historical transactions must not be strictly in the future relative to current
        curr_ts = self.current_transaction.transaction_timestamp
        for ht in self.historical_transactions:
            if ht.transaction_timestamp > curr_ts:
                raise ValueError(
                    f"Historical transaction '{ht.transaction_id}' has timestamp {ht.transaction_timestamp} "
                    f"strictly in the future relative to current transaction timestamp {curr_ts}."
                )

        return self


# =====================================================================
# FEATURE SET DATA CONTRACTS
# =====================================================================


class AmountDeviationFeature(BaseModel):
    """Statistical features measuring transaction amount divergence from historical profile."""

    current_amount: Decimal = Field(..., description="Amount of current transaction")
    currency: str = Field(..., description="Currency evaluated")
    comparable_count: int = Field(..., description="Number of historical transactions in the same currency")
    historical_median: Optional[Decimal] = Field(
        None, description="Median historical amount in comparable currency"
    )
    difference_from_median: Optional[Decimal] = Field(
        None, description="Current amount minus historical median (current - median)"
    )
    ratio_to_median: Optional[Decimal] = Field(
        None, description="Ratio of current amount to median (current / median)"
    )
    median_absolute_deviation: Optional[Decimal] = Field(
        None, description="Median Absolute Deviation (MAD) of historical amounts"
    )
    robust_z_score: Optional[Decimal] = Field(
        None, description="Modified robust z-score: 0.6745 * (current - median) / MAD"
    )
    is_zero_mad: bool = Field(
        default=False,
        description="True if MAD is zero (e.g. all historical transactions have identical amounts)",
    )
    calculation_notes: str = Field(..., description="Human-readable explanation of the amount feature calculation")


class BeneficiaryFeature(BaseModel):
    """Features measuring relationship and familiarity with the transaction beneficiary."""

    beneficiary_id: str = Field(..., description="Beneficiary identifier evaluated")
    status: BeneficiaryNoveltyStatus = Field(..., description="Whether beneficiary is known, new, or unknown")
    historical_transaction_count: int = Field(
        ..., description="Number of previous transactions directed to this beneficiary"
    )
    historical_share_percentage: Optional[Decimal] = Field(
        None, description="Percentage of total historical transactions sent to this beneficiary"
    )
    calculation_notes: str = Field(..., description="Explanatory notes regarding beneficiary familiarity")


class VelocityFeature(BaseModel):
    """Transaction frequency and monetary velocity across sliding historical windows."""

    tx_count_1h: int = Field(..., description="Number of transactions initiated in the 1 hour prior to current")
    tx_volume_1h: Decimal = Field(
        ..., description="Total monetary volume in current currency in the 1 hour prior to current"
    )
    tx_count_24h: int = Field(..., description="Number of transactions initiated in the 24 hours prior to current")
    tx_volume_24h: Decimal = Field(
        ..., description="Total monetary volume in current currency in the 24 hours prior to current"
    )
    tx_count_7d: int = Field(..., description="Number of transactions initiated in the 7 days prior to current")
    tx_volume_7d: Decimal = Field(
        ..., description="Total monetary volume in current currency in the 7 days prior to current"
    )
    historical_daily_avg_count: Optional[Decimal] = Field(
        default=None, description="Average daily transaction frequency across observed historical timespan"
    )
    velocity_ratio_24h: Optional[Decimal] = Field(
        default=None, description="Ratio of 24h count to historical daily average count (count_24h / avg_daily)"
    )
    calculation_notes: str = Field(..., description="Explanatory summary of velocity observations")


class PaymentMethodFeature(BaseModel):
    """Features measuring familiarity with the selected payment instrument or channel."""

    payment_method: str = Field(..., description="Payment method evaluated")
    status: PaymentMethodNoveltyStatus = Field(..., description="Whether payment method is known or new")
    historical_usage_count: int = Field(..., description="Number of historical transactions using this method")
    calculation_notes: str = Field(..., description="Explanatory notes on payment method history")


class TimeDeviationFeature(BaseModel):
    """Features evaluating time-of-day conformity using circular angular geometry."""

    current_time_of_day_utc: str = Field(..., description="HH:MM UTC time of current transaction")
    sample_count: int = Field(
        default=0, description="Number of historical timestamps analyzed for time-of-day profile"
    )
    min_circular_distance_minutes: Optional[int] = Field(
        None,
        description="Minimum circular distance in minutes to any observed historical transaction time (0 to 720)",
    )
    median_circular_distance_minutes: Optional[Decimal] = Field(
        None,
        description="Median circular distance in minutes across all observed historical transaction times",
    )
    is_unusual_hour: Optional[bool] = Field(
        None,
        description="True if transaction occurs outside observed customer activity corridors (e.g. > 180 min away)",
    )
    calculation_notes: str = Field(..., description="Explanatory notes on circular time analysis")


class BehaviouralFeatureSet(BaseModel):
    """Comprehensive, explainable behavioural feature set extracted for a transaction."""

    customer_id: str = Field(..., description="Customer identifier evaluated")
    data_sufficiency: DataSufficiencyLevel = Field(
        ..., description="Evaluation of historical sample volume for baseline reliability"
    )
    total_historical_count: int = Field(..., description="Total number of historical transactions submitted")
    same_currency_count: int = Field(..., description="Number of historical transactions in same currency")
    amount_deviation: AmountDeviationFeature = Field(..., description="Statistical amount deviation metrics")
    beneficiary_feature: BeneficiaryFeature = Field(..., description="Beneficiary familiarity metrics")
    velocity_feature: VelocityFeature = Field(..., description="Sliding window velocity metrics")
    payment_method_feature: PaymentMethodFeature = Field(..., description="Payment instrument metrics")
    time_deviation: TimeDeviationFeature = Field(..., description="Circular time-of-day deviation metrics")
    summary: str = Field(..., description="High-level narrative summary of extracted behavioural features")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Diagnostic pipeline metadata")


# =====================================================================
# SCORING DATA CONTRACTS (Phase 2.2.3)
# =====================================================================


class BehaviouralRiskLevel(str, Enum):
    """Categorical risk tiers for behavioural anomaly assessment."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    UNCERTAIN = "UNCERTAIN"


class FeatureContribution(BaseModel):
    """Detailed attribution of an individual behavioural feature to the composite anomaly score."""

    signal_name: str = Field(..., description="Canonical name of the behavioural signal")
    raw_metric: Optional[str] = Field(None, description="Observed value or status of the feature")
    contribution_score: Decimal = Field(
        ...,
        ge=Decimal("0.0000"),
        le=Decimal("1.0000"),
        description="Weighted numerical contribution to the anomaly score (0.0000 to 1.0000)",
    )
    max_weight: Decimal = Field(..., description="Theoretical maximum weight for this signal")
    explanation: str = Field(..., description="Human-readable reason for this signal's contribution")


class BehaviouralRiskAssessment(BaseModel):
    """Explainable behavioural anomaly assessment for a transaction against customer baseline."""

    assessment_id: str = Field(..., description="Unique assessment identifier (e.g. ASM-...)")
    customer_id: str = Field(..., description="Customer identifier evaluated")
    transaction_id: Optional[str] = Field(None, description="Transaction identifier evaluated, if provided")
    anomaly_score: Decimal = Field(
        ...,
        ge=Decimal("0.0000"),
        le=Decimal("1.0000"),
        decimal_places=4,
        description="Normalized composite anomaly score (0.0000 to 1.0000). Represents anomaly severity, not fraud probability.",
    )
    risk_level: BehaviouralRiskLevel = Field(
        ...,
        description="Categorical risk tier: LOW, MEDIUM, HIGH, or UNCERTAIN",
    )
    detected_indicators: List[str] = Field(
        default_factory=list,
        description="List of activated behavioural anomaly flags (e.g. HIGH_AMOUNT_DEVIATION, NEW_BENEFICIARY)",
    )
    feature_contributions: Dict[str, Decimal] = Field(
        ...,
        description="Mapping of signal names to their normalized weighted contribution scores",
    )
    explanation: List[str] = Field(
        ...,
        description="Transparent array of human-readable explanations justifying the score and risk level",
    )
    data_sufficiency: DataSufficiencyLevel = Field(
        ...,
        description="Historical data sufficiency tier governing baseline confidence",
    )
    model_type: str = Field(
        default="deterministic_heuristic_anomaly_scorer (provisional v1)",
        description="Algorithm or scoring model specification",
    )
    assessment_timestamp: datetime = Field(
        ...,
        description="Timezone-aware timestamp when this assessment was generated",
    )

    @field_validator("assessment_timestamp")
    @classmethod
    def validate_timestamp_tz(cls, v: datetime) -> datetime:
        return _validate_timezone_aware(v, "assessment_timestamp")
