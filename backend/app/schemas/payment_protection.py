"""Pydantic schemas for End-to-End Payment Protection Orchestration."""

from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import uuid4
from pydantic import BaseModel, Field, field_validator

from app.schemas.behavioural import (
    BehaviouralRiskAssessment,
    HistoricalTransaction,
)
from app.schemas.correlation import (
    CorrelationResponse,
    SimulatedTransaction,
)
from app.schemas.recipient import (
    RecipientRiskAssessment,
)
from app.schemas.unified_risk import (
    UnifiedRecommendedAction,
    UnifiedRiskAssessment,
    UnifiedRiskLevel,
)


class InterventionSeverity(str, Enum):
    """Categorical severity tier for intervention recommendation."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    UNCERTAIN = "UNCERTAIN"


class InterventionType(str, Enum):
    """Specific operational category of the recommended intervention."""

    TRANSACTION_PERMITTED = "TRANSACTION_PERMITTED"
    CONTEXTUAL_WARNING = "CONTEXTUAL_WARNING"
    STEP_UP_VERIFICATION = "STEP_UP_VERIFICATION"
    SIMULATED_PAYMENT_HOLD = "SIMULATED_PAYMENT_HOLD"
    FRAUD_ANALYST_QUEUE = "FRAUD_ANALYST_QUEUE"
    FALLBACK_CONFIRMATION = "FALLBACK_CONFIRMATION"


class InterventionRecommendation(BaseModel):
    """Complete explainable recommendation for simulated payment intervention."""

    action: UnifiedRecommendedAction = Field(
        ...,
        description="Core policy action (ALLOW_WITH_CAUTION, WARN_CUSTOMER, STEP_UP_VERIFICATION, PAUSE_AND_VERIFY, MANUAL_REVIEW, INSUFFICIENT_DATA_REVIEW).",
    )
    severity: InterventionSeverity = Field(
        ..., description="Categorical intervention severity tier."
    )
    intervention_type: InterventionType = Field(
        ..., description="Specific operational classification of the intervention."
    )
    simulated_action_code: str = Field(
        ...,
        description="Machine-readable simulation instruction (e.g. PERMIT, DISPLAY_WARNING, CHALLENGE_BIOMETRIC, PAUSE_HOLD_SIMULATION, ROUTE_TO_ANALYST, PROMPT_MANUAL_CONFIRMATION).",
    )
    user_guidance_message: str = Field(
        ...,
        description="Clear, explainable narrative for user notification or friction dialogue.",
    )
    rationale: List[str] = Field(
        default_factory=list,
        description="Bullet-point justifications detailing why this intervention was triggered.",
    )
    simulated_intervention_active: bool = Field(
        default=True,
        description="Confirmation that this intervention is simulated within the prototype sandbox.",
    )
    disclaimer: str = Field(
        default="Simulated intervention only. No live banking, UPI blocking, or payment gateway interception is executed.",
        description="Operational and legal disclaimer.",
    )


class PaymentProtectionRequest(BaseModel):
    """Unified input request for the end-to-end payment protection pipeline."""

    customer_consent: bool = Field(
        ...,
        description="Explicit customer consent to analyze communication text (required if communication_text is provided).",
    )
    communication_text: Optional[str] = Field(
        default=None,
        max_length=5000,
        description="Optional suspicious communication text (SMS, WhatsApp message, email).",
    )
    simulated_transaction: SimulatedTransaction = Field(
        ...,
        description="Simulated transaction parameters being evaluated.",
    )
    customer_id: Optional[str] = Field(
        default="CUST-DEFAULT",
        min_length=1,
        max_length=100,
        description="Customer identifier initiating the payment attempt.",
    )
    recipient_id: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=120,
        description="Target recipient identifier. If omitted, defaults to simulated_transaction.recipient_id.",
    )
    historical_transactions: Optional[List[HistoricalTransaction]] = Field(
        default=None,
        description="Customer historical transactions for baseline behavioral anomaly scoring.",
    )
    payment_method: Optional[str] = Field(
        default="UPI",
        min_length=1,
        max_length=50,
        description="Payment rail or method used (defaults to 'UPI').",
    )
    graph_id: Optional[str] = Field(
        default=None,
        description="Optional specific SPEG graph instance ID in memory to query for recipient intelligence.",
    )
    as_of: Optional[datetime] = Field(
        default=None,
        description="Optional reference timestamp for evaluation. Defaults to current UTC time.",
    )

    @field_validator("as_of")
    @classmethod
    def validate_as_of_tz(cls, v: Optional[datetime]) -> Optional[datetime]:
        if v is not None and (v.tzinfo is None or v.tzinfo.utcoffset(v) is None):
            raise ValueError("as_of timestamp must be timezone-aware.")
        return v


class PaymentProtectionResponse(BaseModel):
    """Complete end-to-end payment protection evaluation response."""

    evaluation_id: str = Field(
        ..., description="Unique evaluation identifier (PPE-XXXXXXXXXXXX)."
    )
    timestamp: datetime = Field(
        ..., description="Timezone-aware timestamp when evaluation completed."
    )
    transaction_id: str = Field(
        ..., description="Transaction identifier under evaluation."
    )
    customer_id: str = Field(
        ..., description="Customer identifier associated with evaluation."
    )
    recipient_id: str = Field(
        ..., description="Recipient identifier evaluated across all engines."
    )
    customer_consent: bool = Field(
        ..., description="Whether customer consent was provided."
    )
    intent_assessment: Optional[CorrelationResponse] = Field(
        default=None,
        description="Original assessment from Intent-to-Payment Correlation Engine (Phase 2.1).",
    )
    behavioural_assessment: Optional[BehaviouralRiskAssessment] = Field(
        default=None,
        description="Original assessment from Customer Behavioural Anomaly Scorer (Phase 2.2).",
    )
    recipient_assessment: Optional[RecipientRiskAssessment] = Field(
        default=None,
        description="Original assessment from Recipient Risk Intelligence Engine (Phase 2.3).",
    )
    unified_risk_assessment: UnifiedRiskAssessment = Field(
        ...,
        description="Synthesized multi-engine assessment with composite score and evidence (Phase 2.4).",
    )
    intervention_recommendation: InterventionRecommendation = Field(
        ...,
        description="Actionable, explainable intervention recommendation.",
    )
    summary_narrative: str = Field(
        ...,
        description="Comprehensive natural language summary explaining the multi-engine decision.",
    )
    disclaimer: str = Field(
        default="PAYGUARD AI prototype simulation only. Payment intervention is simulated; no live banking or UPI transaction control is executed.",
        description="Legal and epistemic simulation notice.",
    )
