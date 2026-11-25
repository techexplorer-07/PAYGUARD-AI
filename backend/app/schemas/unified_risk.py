"""Pydantic v2 data contracts for the Unified Risk Assessment Engine (Phase 2.4).

Synthesizes multi-engine outputs (Intent Correlation, Behavioural Risk, Recipient Intelligence)
into an explainable, deterministic composite risk assessment without conflating disparate
heuristics with calibrated statistical fraud probabilities.
"""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator

from app.schemas.behavioural import (
    BehaviouralAnalysisRequest,
    BehaviouralRiskAssessment,
    BehaviouralRiskLevel,
    DataSufficiencyLevel,
)
from app.schemas.correlation import (
    ComparisonStatus,
    CorrelationRequest,
    CorrelationResponse,
    EvidenceSnippet,
    RecommendedAction as CorrelationRecommendedAction,
    RiskAssessment as IntentRiskAssessment,
    RiskLevel as IntentRiskLevel,
)
from app.schemas.recipient import (
    EvidenceStatus,
    RecipientDataSufficiency,
    RecipientRecommendedAction,
    RecipientRiskAssessment,
    RecipientRiskLevel,
    SupportingEvidenceItem,
)


def _validate_timezone_aware(dt: Optional[datetime], field_name: str) -> Optional[datetime]:
    """Ensure datetime is timezone-aware."""
    if dt is not None and (dt.tzinfo is None or dt.tzinfo.utcoffset(dt) is None):
        raise ValueError(f"{field_name} must be timezone-aware (e.g. UTC).")
    return dt


class UnifiedRiskLevel(str, Enum):
    """Categorical risk tier for the unified assessment."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    UNCERTAIN = "UNCERTAIN"


class UnifiedRecommendedAction(str, Enum):
    """Explainable recommended actions synthesized across all intelligence engines."""

    ALLOW_WITH_CAUTION = "ALLOW_WITH_CAUTION"
    WARN_CUSTOMER = "WARN_CUSTOMER"
    STEP_UP_VERIFICATION = "STEP_UP_VERIFICATION"
    PAUSE_AND_VERIFY = "PAUSE_AND_VERIFY"
    MANUAL_REVIEW = "MANUAL_REVIEW"
    INSUFFICIENT_DATA_REVIEW = "INSUFFICIENT_DATA_REVIEW"


# =====================================================================
# ENGINE SIGNAL ADAPTERS
# =====================================================================


class IntentRiskSignal(BaseModel):
    """Adapter contract representing payment intent-to-transaction correlation output."""

    assessment_id: Optional[str] = Field(default=None, description="Optional intent assessment identifier")
    risk_level: IntentRiskLevel = Field(..., description="Categorical risk tier from intent engine")
    heuristic_score: Optional[float] = Field(
        default=None, ge=0.0, le=1.0, description="Heuristic intent contradiction score"
    )
    score_type: Optional[str] = Field(
        default="rule_based_intent_heuristic", description="Score classification"
    )
    detected_indicators: List[str] = Field(default_factory=list, description="Intent risk signals triggered")
    reasons: List[str] = Field(default_factory=list, description="Explanations justifying intent score")
    evidence_snippets: List[EvidenceSnippet] = Field(
        default_factory=list, description="Extracted communication snippets with provenance"
    )
    comparison_summary: Optional[str] = Field(default=None, description="Summary of field comparison")
    amount_status: Optional[ComparisonStatus] = Field(default=None, description="Amount match status")
    recipient_status: Optional[ComparisonStatus] = Field(default=None, description="Recipient match status")

    @classmethod
    def from_correlation_response(
        cls, response: CorrelationResponse, assessment_id: Optional[str] = None
    ) -> "IntentRiskSignal":
        """Instantiate an IntentRiskSignal from a full CorrelationResponse."""
        ra = response.risk_assessment
        cmp = response.comparison
        intent = response.extracted_intent
        return cls(
            assessment_id=assessment_id or f"INTENT-{response.timestamp}",
            risk_level=ra.risk_level,
            heuristic_score=ra.heuristic_score,
            score_type=ra.score_type,
            detected_indicators=list(ra.signals_detected),
            reasons=list(ra.reasons),
            evidence_snippets=list(intent.evidence_snippets),
            comparison_summary=cmp.summary,
            amount_status=cmp.amount_status,
            recipient_status=cmp.recipient_status,
        )


class BehaviouralRiskSignal(BaseModel):
    """Adapter contract representing customer behavioural anomaly analysis output."""

    assessment_id: Optional[str] = Field(default=None, description="Behavioural assessment identifier")
    anomaly_score: Optional[Decimal] = Field(
        default=None, ge=Decimal("0.0000"), le=Decimal("1.0000"), description="Composite behavioural anomaly score"
    )
    risk_level: BehaviouralRiskLevel = Field(..., description="Categorical risk tier from behavioural engine")
    data_sufficiency: DataSufficiencyLevel = Field(
        ..., description="Historical sample sufficiency for baseline comparison"
    )
    detected_indicators: List[str] = Field(
        default_factory=list, description="Behavioural anomaly flags triggered"
    )
    feature_contributions: Dict[str, Decimal] = Field(
        default_factory=dict, description="Numerical contributions by behavioural feature"
    )
    explanation: List[str] = Field(default_factory=list, description="Explanatory notes from scorer")
    paysim_prediction: Optional[Dict[str, Any]] = Field(
        default=None, description="Supervised PaySim behavioral model output"
    )

    @classmethod
    def from_behavioural_assessment(
        cls, assessment: BehaviouralRiskAssessment
    ) -> "BehaviouralRiskSignal":
        """Instantiate a BehaviouralRiskSignal from a BehaviouralRiskAssessment."""
        return cls(
            assessment_id=assessment.assessment_id,
            anomaly_score=assessment.anomaly_score,
            risk_level=assessment.risk_level,
            data_sufficiency=assessment.data_sufficiency,
            detected_indicators=list(assessment.detected_indicators),
            feature_contributions=dict(assessment.feature_contributions),
            explanation=list(assessment.explanation),
            paysim_prediction=assessment.paysim_prediction,
        )


class RecipientRiskSignal(BaseModel):
    """Adapter contract representing recipient risk intelligence output."""

    assessment_id: Optional[str] = Field(default=None, description="Recipient risk assessment identifier")
    recipient_risk_score: Optional[Decimal] = Field(
        default=None, ge=Decimal("0.0000"), le=Decimal("1.0000"), description="Deterministic recipient risk score"
    )
    risk_level: RecipientRiskLevel = Field(..., description="Categorical risk tier from recipient engine")
    data_sufficiency: RecipientDataSufficiency = Field(
        ..., description="Data sufficiency tier regarding recipient evidence"
    )
    detected_indicators: List[str] = Field(
        default_factory=list, description="Recipient risk flags and context indicators"
    )
    feature_contributions: Dict[str, float] = Field(
        default_factory=dict, description="Feature breakdown from recipient risk scorer"
    )
    supporting_evidence: List[SupportingEvidenceItem] = Field(
        default_factory=list, description="Traceable graph evidence edges and multi-hop paths"
    )
    explanation: str = Field(default="", description="Explanatory narrative from recipient scorer")

    @classmethod
    def from_recipient_assessment(
        cls, assessment: RecipientRiskAssessment
    ) -> "RecipientRiskSignal":
        """Instantiate a RecipientRiskSignal from a RecipientRiskAssessment."""
        return cls(
            assessment_id=assessment.assessment_id,
            recipient_risk_score=assessment.recipient_risk_score,
            risk_level=assessment.risk_level,
            data_sufficiency=assessment.data_sufficiency,
            detected_indicators=list(assessment.detected_indicators),
            feature_contributions=dict(assessment.feature_contributions),
            supporting_evidence=list(assessment.supporting_evidence),
            explanation=assessment.explanation,
        )


# =====================================================================
# UNIFIED TRACEABILITY EVIDENCE
# =====================================================================


class UnifiedEvidenceItem(BaseModel):
    """Traceable evidence item linking unified decision to specific engine artifacts."""

    engine_source: str = Field(..., description="Originating engine (INTENT, BEHAVIOURAL, RECIPIENT)")
    evidence_id: str = Field(..., description="Edge ID, snippet index, or feature tag")
    epistemic_status: str = Field(
        ..., description="Epistemic tier: VERIFIED, REPORTED, INFERRED, EXTRACTED, STATISTICAL"
    )
    source_reference: str = Field(..., description="Provenance reference or filing identifier")
    description: str = Field(..., description="Traceable narrative description of this finding")


# =====================================================================
# UNIFIED REQUEST & RESPONSE CONTRACTS
# =====================================================================


class UnifiedEvaluationRequest(BaseModel):
    """Input contract for the Unified Risk Assessment Engine."""

    transaction_id: str = Field(
        ..., min_length=1, max_length=120, description="Unique transaction identifier"
    )
    customer_id: str = Field(
        ..., min_length=1, max_length=120, description="Payer customer identifier"
    )
    recipient_id: str = Field(
        ..., min_length=1, max_length=120, description="Payee beneficiary identifier (e.g. UPI VPA or account)"
    )
    amount: Optional[Decimal] = Field(
        default=None, gt=0, description="Transaction payment amount"
    )
    currency: Optional[str] = Field(
        default="INR", min_length=3, max_length=3, description="ISO currency code"
    )

    # Pre-computed engine assessments (if caller already computed them)
    intent_assessment: Optional[IntentRiskSignal] = Field(
        default=None, description="Pre-computed intent correlation risk signal"
    )
    behavioural_assessment: Optional[BehaviouralRiskSignal] = Field(
        default=None, description="Pre-computed customer behavioural risk signal"
    )
    recipient_assessment: Optional[RecipientRiskSignal] = Field(
        default=None, description="Pre-computed recipient graph risk signal"
    )

    # Optional on-the-fly execution hooks (if caller wants service to run engines)
    correlation_request: Optional[CorrelationRequest] = Field(
        default=None, description="Optional raw text and transaction payload for on-the-fly intent analysis"
    )
    behavioural_request: Optional[BehaviouralAnalysisRequest] = Field(
        default=None, description="Optional historical transactions payload for on-the-fly behavioural analysis"
    )
    graph_id: Optional[str] = Field(
        default=None, description="Optional SPEG graph instance ID for on-the-fly recipient analysis"
    )
    as_of: Optional[datetime] = Field(
        default=None, description="Optional reference timestamp for temporal expiry and recency calculations"
    )

    @field_validator("as_of")
    @classmethod
    def validate_as_of_tz(cls, v: Optional[datetime]) -> Optional[datetime]:
        return _validate_timezone_aware(v, "as_of")


class UnifiedRiskAssessment(BaseModel):
    """Synthesized multi-engine risk evaluation response for a financial transaction."""

    unified_assessment_id: str = Field(
        ..., description="Unique identifier for this unified evaluation run (e.g. URA-...)"
    )
    transaction_id: str = Field(..., description="Target transaction identifier")
    customer_id: str = Field(..., description="Customer identifier")
    recipient_id: str = Field(..., description="Recipient identifier")
    overall_risk_score: Decimal = Field(
        ...,
        ge=Decimal("0.0000"),
        le=Decimal("1.0000"),
        description="Provisional composite risk-severity score in [0.0000, 1.0000]. Represents heuristic severity, not a calibrated fraud probability.",
    )
    risk_level: UnifiedRiskLevel = Field(
        ..., description="Categorical unified risk tier: LOW, MEDIUM, HIGH, or UNCERTAIN"
    )
    contributing_assessments: Dict[str, Optional[str]] = Field(
        ..., description="Mapping of engine names (intent, behavioural, recipient) to source assessment IDs"
    )
    engine_signal_summary: Dict[str, Any] = Field(
        ..., description="Structured summary of each contributing engine's score, risk tier, and status"
    )
    detected_indicators: List[str] = Field(
        default_factory=list, description="Aggregated, deduplicated risk indicators across all engines"
    )
    feature_contributions: Dict[str, float] = Field(
        default_factory=dict, description="Provisional weighted contribution breakdown by engine"
    )
    supporting_evidence: List[UnifiedEvidenceItem] = Field(
        default_factory=list, description="Traceable supporting evidence artifacts backing the unified finding"
    )
    explanation: str = Field(
        ..., min_length=10, max_length=4000, description="Traceable, multi-engine audit narrative explaining final risk level"
    )
    missing_evidence: List[str] = Field(
        default_factory=list, description="Disclosures of missing or unavailable intelligence streams"
    )
    conflicting_signals: List[str] = Field(
        default_factory=list, description="Explanations of any disagreements or contradictions between engine outputs"
    )
    data_sufficiency: str = Field(
        ..., description="Overall data sufficiency evaluation across all contributing engines"
    )
    recommended_action: UnifiedRecommendedAction = Field(
        ..., description="Explainable recommended intervention action (advisory only; no real blocking)"
    )
    policy_version: str = Field(
        default="PAYGUARD_UNIFIED_POLICY_V1", description="Decision policy version identifier"
    )
    model_type: str = Field(
        default="PROVISIONAL_DETERMINISTIC_MULTI_ENGINE_FUSION_V1",
        description="Multi-engine fusion model architecture identifier",
    )
    assessment_timestamp: datetime = Field(
        ..., description="Timezone-aware timestamp when this unified assessment was computed"
    )

    @field_validator("assessment_timestamp")
    @classmethod
    def validate_timestamp_tz(cls, v: datetime) -> datetime:
        res = _validate_timezone_aware(v, "assessment_timestamp")
        assert res is not None
        return res
