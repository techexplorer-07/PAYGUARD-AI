"""Data contracts for Intent-to-Payment Correlation Engine."""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class ExtractionStatus(str, Enum):
    """Status of field extraction from communication text."""

    FOUND = "FOUND"
    NOT_FOUND = "NOT_FOUND"
    UNCERTAIN = "UNCERTAIN"


class ComparisonStatus(str, Enum):
    """Comparison result between extracted intent and transaction data."""

    MATCH = "MATCH"
    MISMATCH = "MISMATCH"
    NOT_FOUND = "NOT_FOUND"
    UNCERTAIN = "UNCERTAIN"


class RiskLevel(str, Enum):
    """Categorical risk tiers for intent correlation."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    UNCERTAIN = "UNCERTAIN"


class RecommendedAction(str, Enum):
    """Explainable recommended actions based on correlation assessment."""

    PROCEED_WITH_STANDARD_VERIFICATION = "PROCEED_WITH_STANDARD_VERIFICATION"
    REVIEW_PAYMENT_DETAILS = "REVIEW_PAYMENT_DETAILS"
    VERIFY_RECIPIENT_IDENTITY = "VERIFY_RECIPIENT_IDENTITY"
    PAUSE_AND_VERIFY_CALLER = "PAUSE_AND_VERIFY_CALLER"


class SimulatedTransaction(BaseModel):
    """Simulated payment transaction information submitted for correlation."""

    amount: float = Field(
        ...,
        gt=0,
        description="Transaction amount in positive units (e.g. 8500.00)",
    )
    currency: str = Field(
        default="INR",
        min_length=3,
        max_length=3,
        pattern=r"^[A-Z]{3}$",
        description="Three-letter ISO currency code (e.g. INR)",
    )
    recipient_id: str = Field(
        ...,
        min_length=3,
        max_length=120,
        description="Recipient identifier, e.g. a UPI ID (user@bank)",
    )
    transaction_reference: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Optional client reference or invoice ID for the simulated payment",
    )


class CorrelationRequest(BaseModel):
    """Input payload for payment intent-to-transaction correlation."""

    customer_consent: bool = Field(
        ...,
        description="Explicit customer consent to analyze the supplied communication text. Must be True.",
    )
    communication_text: str = Field(
        ...,
        min_length=3,
        max_length=5000,
        description="Customer-authorized communication snippet (e.g. SMS, chat, email text).",
    )
    simulated_transaction: SimulatedTransaction


class EvidenceSnippet(BaseModel):
    """Extracted textual evidence with location provenance."""

    field: str = Field(..., description="Field represented by this evidence (e.g. amount, recipient)")
    extracted_value: Optional[str] = Field(None, description="Normalized extracted value if matched")
    text_snippet: str = Field(..., description="Exact substring matched from input text")
    start_char: Optional[int] = Field(None, description="Start index in communication text")
    end_char: Optional[int] = Field(None, description="End index in communication text")
    status: ExtractionStatus = Field(ExtractionStatus.FOUND, description="Extraction confidence status")


class ExtractedPaymentIntent(BaseModel):
    """Extracted payment instructions from customer communication."""

    amount: Optional[float] = Field(None, description="Requested payment amount if found")
    amount_status: ExtractionStatus = Field(
        default=ExtractionStatus.NOT_FOUND,
        description="Whether a payment amount was extracted",
    )
    currency: Optional[str] = Field(None, description="Detected currency (e.g. INR)")
    recipient_id: Optional[str] = Field(None, description="Normalized recipient identifier (e.g. UPI ID)")
    recipient_status: ExtractionStatus = Field(
        default=ExtractionStatus.NOT_FOUND,
        description="Whether a recipient identifier was extracted",
    )
    purpose: Optional[str] = Field(None, description="Extracted payment context/purpose if detected")
    urgency_detected: bool = Field(default=False, description="Whether urgency patterns were detected")
    threat_detected: bool = Field(default=False, description="Whether coercion/threat patterns were detected")
    evidence_snippets: List[EvidenceSnippet] = Field(
        default_factory=list,
        description="List of raw text snippets supporting the extracted intent",
    )


class IntentPaymentComparison(BaseModel):
    """Comparison between extracted payment instructions and transaction details."""

    amount_status: ComparisonStatus = Field(
        ..., description="Comparison status for payment amount (MATCH, MISMATCH, NOT_FOUND, UNCERTAIN)"
    )
    amount_difference: Optional[float] = Field(
        None, description="Difference between transaction amount and requested amount (tx - req)"
    )
    currency_status: ComparisonStatus = Field(
        default=ComparisonStatus.MATCH,
        description="Comparison status for currency (MATCH, MISMATCH, NOT_FOUND, UNCERTAIN)",
    )
    recipient_status: ComparisonStatus = Field(
        ..., description="Comparison status for recipient (MATCH, MISMATCH, NOT_FOUND, UNCERTAIN)"
    )
    normalized_requested_currency: Optional[str] = Field(
        None, description="Normalized currency extracted from communication"
    )
    normalized_transaction_currency: str = Field(
        ..., description="Currency code from simulated transaction"
    )
    normalized_requested_recipient: Optional[str] = Field(
        None, description="Normalized recipient extracted from communication"
    )
    normalized_transaction_recipient: str = Field(
        ..., description="Normalized recipient from simulated transaction"
    )
    summary: str = Field(..., description="Human-readable summary of the comparison")


class RiskAssessment(BaseModel):
    """Rule-based, explainable risk assessment for intent correlation."""

    risk_level: RiskLevel = Field(..., description="Categorical risk tier (LOW, MEDIUM, HIGH, UNCERTAIN)")
    heuristic_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Prototype heuristic risk score (0.0=lowest risk, 1.0=highest risk). Not a calibrated ML probability.",
    )
    score_type: str = Field(
        default="prototype_heuristic_score (deterministic rule-based, non-ML)",
        description="Explicit classification of the risk score algorithm",
    )
    reasons: List[str] = Field(..., description="List of transparent reasons explaining the assessment")
    signals_detected: List[str] = Field(default_factory=list, description="Specific risk signals triggered")
    recommended_action: RecommendedAction = Field(..., description="Actionable recommendation for payment flow")


class CorrelationResponse(BaseModel):
    """Full structured response from the Intent-to-Payment Correlation Engine."""

    status: str = Field(default="success", description="API response status")
    consent_verified: bool = Field(default=True, description="Confirmation that customer analysis consent was granted")
    extracted_intent: ExtractedPaymentIntent
    comparison: IntentPaymentComparison
    risk_assessment: RiskAssessment
    timestamp: str = Field(..., description="ISO 8601 UTC timestamp of the analysis")
