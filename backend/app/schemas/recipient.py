"""Pydantic v2 data contracts for Recipient Risk Intelligence and SPEG (Phase 2.3.1)."""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional, Set
from pydantic import BaseModel, Field, field_validator, model_validator


def _validate_timezone_aware(dt: Optional[datetime], field_name: str) -> Optional[datetime]:
    """Ensure datetime is timezone-aware."""
    if dt is not None and (dt.tzinfo is None or dt.tzinfo.utcoffset(dt) is None):
        raise ValueError(f"{field_name} must be timezone-aware (e.g. UTC).")
    return dt


class EvidenceNodeType(str, Enum):
    """Supported entity categories within the Scam-to-Payment Evidence Graph (SPEG)."""

    CUSTOMER = "CUSTOMER"
    BENEFICIARY = "BENEFICIARY"
    TRANSACTION = "TRANSACTION"
    COMMUNICATION = "COMMUNICATION"
    FRAUD_CASE = "FRAUD_CASE"
    IDENTIFIER = "IDENTIFIER"


class EvidenceStatus(str, Enum):
    """Epistemic evidence classification preventing false certainty propagation."""

    VERIFIED = "VERIFIED"    # Formally corroborated by bank record, police report, or court ruling
    REPORTED = "REPORTED"    # User-submitted allegation or unverified complaint
    INFERRED = "INFERRED"    # Derived via heuristic link, shared entity, or co-occurrence


class EvidenceRelationshipType(str, Enum):
    """Permitted directed relationship edge types connecting SPEG entities."""

    INITIATED_TRANSACTION = "INITIATED_TRANSACTION"
    PAID_TO = "PAID_TO"
    MENTIONED_IN = "MENTIONED_IN"
    REPORTED_IN_CASE = "REPORTED_IN_CASE"
    ASSOCIATED_WITH = "ASSOCIATED_WITH"
    SHARES_IDENTIFIER = "SHARES_IDENTIFIER"


class EvidenceNode(BaseModel):
    """An individual entity node in the Scam-to-Payment Evidence Graph."""

    node_id: str = Field(
        ...,
        min_length=1,
        max_length=120,
        description="Unique identifier for the evidence graph node",
    )
    node_type: EvidenceNodeType = Field(
        ...,
        description="Categorical entity type (e.g. BENEFICIARY, CUSTOMER, FRAUD_CASE)",
    )
    display_label: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Human-readable label or title for UI/diagnostic display",
    )
    synthetic_identifier: str = Field(
        ...,
        min_length=1,
        max_length=150,
        description="Synthetic entity handle (e.g. UPI VPA, masked token, or synthetic account ID)",
    )
    created_at: datetime = Field(
        ...,
        description="Timezone-aware timestamp when entity node was created/recorded",
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Non-sensitive diagnostic and contextual key-value attributes",
    )

    @field_validator("created_at")
    @classmethod
    def validate_created_at_tz(cls, v: datetime) -> datetime:
        res = _validate_timezone_aware(v, "created_at")
        assert res is not None
        return res


class VerificationAuditRecord(BaseModel):
    """Immutable audit record documenting formal evidence verification."""

    original_evidence_status: EvidenceStatus = Field(
        ...,
        description="The epistemic status before verification (e.g. REPORTED or INFERRED)",
    )
    verified_at: datetime = Field(
        ...,
        description="Timezone-aware timestamp when verification was executed",
    )
    verified_by: str = Field(
        ...,
        min_length=1,
        max_length=120,
        description="Identifier of authorized verifier who performed verification",
    )
    verification_authority_org: str = Field(
        default="INTERNAL_COMPLIANCE_OPS",
        description="Organization or unit of the verification authority",
    )
    verification_reference: str = Field(
        ...,
        min_length=1,
        max_length=250,
        description="Official audit or case reference establishing verification",
    )
    verification_rationale: str = Field(
        ...,
        min_length=5,
        max_length=500,
        description="Auditable justification for formal evidence verification",
    )
    audit_notes: Optional[str] = Field(
        default="",
        description="Optional diagnostic notes recorded by the verifier",
    )


class EvidenceEdge(BaseModel):
    """A directed evidence relationship edge linking two nodes in the SPEG."""

    edge_id: str = Field(
        ...,
        min_length=1,
        max_length=120,
        description="Unique identifier for the evidence edge",
    )
    source_node_id: str = Field(
        ...,
        min_length=1,
        max_length=120,
        description="Source entity node_id",
    )
    target_node_id: str = Field(
        ...,
        min_length=1,
        max_length=120,
        description="Target entity node_id",
    )
    relationship_type: EvidenceRelationshipType = Field(
        ...,
        description="Specific semantics of the relationship",
    )
    evidence_status: EvidenceStatus = Field(
        ...,
        description="Verification level: VERIFIED, REPORTED, or INFERRED",
    )
    source_reference: str = Field(
        ...,
        min_length=1,
        max_length=250,
        description="Provenance audit trail reference (case ID, filing ref, or extractor tag)",
    )
    observed_at: datetime = Field(
        ...,
        description="Timezone-aware timestamp when this relationship was observed",
    )
    expires_at: Optional[datetime] = Field(
        default=None,
        description="Optional timezone-aware timestamp when temporal evidence ceases validity",
    )
    confidence: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Confidence level in [0.0, 1.0]. Represents epistemic confidence, NOT fraud probability.",
    )
    description: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Explanatory narrative detailing evidence provenance",
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Non-sensitive diagnostic and contextual key-value attributes",
    )
    verification_audit: Optional[VerificationAuditRecord] = Field(
        default=None,
        description="Immutable audit provenance recorded when this edge is verified",
    )

    @field_validator("observed_at")
    @classmethod
    def validate_observed_at_tz(cls, v: datetime) -> datetime:
        res = _validate_timezone_aware(v, "observed_at")
        assert res is not None
        return res

    @field_validator("expires_at")
    @classmethod
    def validate_expires_at_tz(cls, v: Optional[datetime]) -> Optional[datetime]:
        return _validate_timezone_aware(v, "expires_at")

    @model_validator(mode="after")
    def validate_temporal_ordering(self) -> "EvidenceEdge":
        if self.expires_at is not None and self.expires_at < self.observed_at:
            raise ValueError(
                f"expires_at ({self.expires_at}) cannot be earlier than observed_at ({self.observed_at})."
            )
        return self


class TrustedVerificationAuthority(BaseModel):
    """Internal test/fixture verification context for controlled prototype execution.

    PROTOTYPE TRUST ASSUMPTIONS & EXPLICIT BOUNDARIES:
    - This model represents internal operator or automated test assertions within the local prototype.
    - It does NOT authenticate external banks, law enforcement, or regulatory institutions.
    - Static or hardcoded tokens have been removed to avoid false pretense of institutional authentication.
    - For this prototype, VERIFIED evidence may only exist in controlled internal seed/test fixtures
      or documented trusted import scripts. It is NEVER accepted over public API boundaries.
    - Production systems require mutual TLS (mTLS), HSM cryptographic signatures, or federated OIDC identity.
    """

    authority_id: str = Field(
        ...,
        min_length=1,
        max_length=120,
        description="Internal verifier or test operator identifier (e.g. COMPLIANCE_OFFICER_401)",
    )
    is_internal_authorized: bool = Field(
        default=True,
        description="Explicit internal authorization assertion for controlled seed/fixture execution",
    )
    authorization_token: Optional[str] = Field(
        default=None,
        description="Deprecated prototype token field preserved for backwards-compatible test calls",
    )
    organization: str = Field(
        default="INTERNAL_COMPLIANCE_OPS",
        description="Internal compliance or financial intelligence unit",
    )
    verification_rationale: str = Field(
        ...,
        min_length=5,
        max_length=500,
        description="Auditable justification for formal evidence verification",
    )


class SPEGGraphInput(BaseModel):
    """Validated input contract for constructing or populating an Evidence Graph via public intake.

    Security & Trust Boundaries:
    - Rejects all self-declarations of trust (is_trusted_source is forbidden).
    - Rejects any evidence relationship specifying VERIFIED status.
    - Public callers can only submit REPORTED or INFERRED evidence.
    """

    nodes: List[EvidenceNode] = Field(
        ...,
        min_length=0,
        max_length=1000,
        description="Collection of entities (max 1000 for prototype scope)",
    )
    edges: List[EvidenceEdge] = Field(
        ...,
        min_length=0,
        max_length=2500,
        description="Collection of evidence edges (max 2500 for prototype scope)",
    )

    @model_validator(mode="before")
    @classmethod
    def reject_untrusted_declarations(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "is_trusted_source" in data:
                raise ValueError(
                    "Client self-declaration of 'is_trusted_source' is rejected. "
                    "Public API callers cannot declare themselves trusted."
                )
        return data

    @model_validator(mode="after")
    def validate_graph_integrity(self) -> "SPEGGraphInput":
        # 1. Public API Restriction: Unconditionally reject VERIFIED evidence status
        for edge in self.edges:
            if edge.evidence_status == EvidenceStatus.VERIFIED:
                raise ValueError(
                    f"Public intake rejected: Edge '{edge.edge_id}' specifies VERIFIED status. "
                    "Public API submissions cannot declare VERIFIED evidence; use REPORTED or INFERRED. "
                    "VERIFIED evidence can only be established via authorized internal verification operations."
                )

        # 2. Unique Node IDs
        seen_node_ids: Set[str] = set()
        for node in self.nodes:
            if node.node_id in seen_node_ids:
                raise ValueError(f"Duplicate node_id '{node.node_id}' detected in graph input.")
            seen_node_ids.add(node.node_id)

        # 3. Unique Edge IDs
        seen_edge_ids: Set[str] = set()
        for edge in self.edges:
            if edge.edge_id in seen_edge_ids:
                raise ValueError(f"Duplicate edge_id '{edge.edge_id}' detected in graph input.")
            seen_edge_ids.add(edge.edge_id)

            # 4. Referential integrity: endpoints must exist in nodes
            if edge.source_node_id not in seen_node_ids:
                raise ValueError(
                    f"Edge '{edge.edge_id}' references non-existent source_node_id '{edge.source_node_id}'."
                )
            if edge.target_node_id not in seen_node_ids:
                raise ValueError(
                    f"Edge '{edge.edge_id}' references non-existent target_node_id '{edge.target_node_id}'."
                )

            # 5. Reject self-referential loops
            if edge.source_node_id == edge.target_node_id:
                raise ValueError(
                    f"Self-referential edge '{edge.edge_id}' detected on node '{edge.source_node_id}'. "
                    "Self-loops are rejected by SPEG graph integrity rules."
                )

        return self


class GraphBuildResponse(BaseModel):
    """Metadata response returned after constructing a SPEG graph."""

    status: str = Field(default="success", description="Status indicator")
    graph_id: str = Field(..., description="Unique identifier for the constructed graph instance")
    node_count: int = Field(..., description="Total number of nodes registered in graph")
    edge_count: int = Field(..., description="Total number of directed edges registered in graph")
    node_type_counts: Dict[str, int] = Field(
        default_factory=dict, description="Breakdown of nodes by EvidenceNodeType"
    )
    relationship_type_counts: Dict[str, int] = Field(
        default_factory=dict, description="Breakdown of edges by EvidenceRelationshipType"
    )
    evidence_status_counts: Dict[str, int] = Field(
        default_factory=dict, description="Breakdown of edges by EvidenceStatus (VERIFIED, REPORTED, INFERRED)"
    )
    built_at: datetime = Field(..., description="Timezone-aware build timestamp")
    notes: List[str] = Field(
        default_factory=list,
        description="Informational provenance and persistence notes",
    )


class RecipientEvidenceSummary(BaseModel):
    """Comprehensive evidence profile retrieved for a specific beneficiary."""

    recipient_id: str = Field(..., description="Queried beneficiary node_id")
    recipient_node: Optional[EvidenceNode] = Field(
        None, description="Queried beneficiary node entity"
    )
    connected_node_count: int = Field(
        ..., description="Count of distinct connected entities (predecessors and successors)"
    )
    total_evidence_edge_count: int = Field(
        ..., description="Total number of valid evidence relationships retrieved"
    )
    verified_edge_count: int = Field(
        ..., description="Number of VERIFIED evidence relationships"
    )
    reported_edge_count: int = Field(
        ..., description="Number of user-REPORTED evidence relationships"
    )
    inferred_edge_count: int = Field(
        ..., description="Number of INFERRED evidence associations"
    )
    connected_nodes: List[EvidenceNode] = Field(
        default_factory=list, description="List of directly connected entity nodes"
    )
    evidence_edges: List[EvidenceEdge] = Field(
        default_factory=list, description="List of connecting evidence relationships"
    )
    query_reference_time: Optional[datetime] = Field(
        default=None, description="Reference as_of timestamp used for temporal expiry filtering"
    )
    expired_edges_excluded_count: int = Field(
        default=0, description="Number of historical relationships excluded due to expiry"
    )
    assessment_notes: List[str] = Field(
        default_factory=list,
        description="Provenance and analytical notes regarding retrieved evidence",
    )


class SupportingEvidenceItem(BaseModel):
    """An individual piece of supporting graph evidence backing an intelligence finding."""

    edge_id: str = Field(..., description="Evidence edge identifier")
    source_reference: str = Field(..., description="Audit/source citation reference")
    evidence_status: EvidenceStatus = Field(..., description="Epistemic status: VERIFIED, REPORTED, INFERRED")
    relationship_type: EvidenceRelationshipType = Field(..., description="Relationship semantic category")
    observed_at: datetime = Field(..., description="Timezone-aware timestamp of observation")
    source_node_id: str = Field(..., description="Source entity ID")
    target_node_id: str = Field(..., description="Target entity ID")
    path: Optional[List[str]] = Field(
        default=None, description="Multi-hop entity path for indirect associations (e.g. ['BEN-A', 'IDENT', 'BEN-B'])"
    )
    description: str = Field(..., description="Human-readable description of this evidence item")


class RecipientIntelligenceProfile(BaseModel):
    """Structured recipient relationship intelligence profile derived from graph topology."""

    recipient_id: str = Field(..., description="Queried beneficiary node identifier")
    graph_id: str = Field(..., description="Identifier of the SPEG graph instance analyzed")
    analysis_timestamp: datetime = Field(..., description="Timezone-aware timestamp of intelligence computation")
    direct_customer_count: int = Field(
        ..., description="Number of distinct customers directly transacting with this beneficiary"
    )
    total_transaction_count: int = Field(
        ..., description="Total count of transactions involving this beneficiary"
    )
    distinct_beneficiary_association_count: int = Field(
        ..., description="Number of distinct other beneficiaries connected via shared identifiers or links"
    )
    verified_evidence_count: int = Field(
        ..., description="Number of VERIFIED incident evidence relationships"
    )
    reported_evidence_count: int = Field(
        ..., description="Number of user-REPORTED incident evidence relationships"
    )
    inferred_evidence_count: int = Field(
        ..., description="Number of INFERRED incident evidence relationships"
    )
    shared_identifier_count: int = Field(
        ..., description="Number of shared identifier nodes linking this beneficiary to others"
    )
    recent_relationship_count: int = Field(
        ..., description="Count of active relationships observed within the recency window (last 30 days)"
    )
    expired_relationship_count: int = Field(
        ..., description="Count of historical relationships excluded due to expiry"
    )
    evidence_summary: str = Field(
        ..., description="High-level narrative explaining the recipient's graph profile and provenance"
    )
    supporting_evidence: List[SupportingEvidenceItem] = Field(
        default_factory=list,
        description="Auditable, traceable evidence items substantiating all relationship counts",
    )
    data_sufficiency: str = Field(
        ..., description="Evaluation of available evidence volume: SUFFICIENT, MINIMAL, or INSUFFICIENT"
    )


class RecipientRiskLevel(str, Enum):
    """Categorical recipient risk evaluation tier."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    UNCERTAIN = "UNCERTAIN"


class RecipientDataSufficiency(str, Enum):
    """Evaluation of available evidence depth for recipient risk assessment."""

    INSUFFICIENT = "INSUFFICIENT"
    LIMITED = "LIMITED"
    ADEQUATE = "ADEQUATE"


class RecipientRecommendedAction(str, Enum):
    """Controlled actionable recommendations based on recipient risk assessment."""

    ALLOW = "ALLOW"
    STEP_UP_VERIFICATION = "STEP_UP_VERIFICATION"
    REVIEW_PAYMENT = "REVIEW_PAYMENT"
    WARN_CUSTOMER = "WARN_CUSTOMER"
    INSUFFICIENT_DATA_REVIEW = "INSUFFICIENT_DATA_REVIEW"


class RecipientRiskAssessment(BaseModel):
    """Comprehensive, explainable recipient risk assessment derived from SPEG evidence.

    Ethical and Epistemic Integrity:
    - Deterministic, evidence-based scoring (not a calibrated fraud probability).
    - Preserves provenance of VERIFIED, REPORTED, and INFERRED evidence.
    - Does not infer beneficiary legal or beneficial ownership from shared identifiers.
    - Transaction volume alone or inferred associations alone never produce HIGH risk.
    """

    assessment_id: str = Field(
        ...,
        min_length=1,
        max_length=120,
        description="Unique identifier for this risk assessment instance",
    )
    recipient_id: str = Field(
        ...,
        min_length=1,
        max_length=120,
        description="Target recipient entity node identifier",
    )
    graph_id: str = Field(
        ...,
        min_length=1,
        max_length=120,
        description="Identifier of the SPEG graph instance evaluated",
    )
    assessment_timestamp: datetime = Field(
        ...,
        description="Timezone-aware timestamp when assessment was generated",
    )
    recipient_risk_score: Decimal = Field(
        ...,
        ge=Decimal("0.0000"),
        le=Decimal("1.0000"),
        description="Deterministic risk score normalized to [0.0000, 1.0000]. Represents heuristic concern, NOT a calibrated fraud probability.",
    )
    risk_level: RecipientRiskLevel = Field(
        ...,
        description="Categorical risk tier: LOW, MEDIUM, HIGH, or UNCERTAIN",
    )
    data_sufficiency: RecipientDataSufficiency = Field(
        ...,
        description="Data sufficiency level: INSUFFICIENT, LIMITED, or ADEQUATE",
    )
    detected_indicators: List[str] = Field(
        default_factory=list,
        description="High-signal risk or context indicators detected in recipient graph evidence",
    )
    feature_contributions: Dict[str, float] = Field(
        default_factory=dict,
        description="Traceable numerical contribution breakdown by risk feature",
    )
    explanation: str = Field(
        ...,
        min_length=10,
        max_length=3000,
        description="Traceable, evidence-backed narrative explaining the risk score and rationale",
    )
    supporting_evidence: List[SupportingEvidenceItem] = Field(
        default_factory=list,
        description="Direct graph edges and multi-hop paths backing the detected indicators",
    )
    assessment_limitations: List[str] = Field(
        default_factory=list,
        description="Epistemic caveats and explicit system limitations",
    )
    recommended_action: RecipientRecommendedAction = Field(
        ...,
        description="Controlled actionable recommendation for downstream decisioning",
    )
    model_type: str = Field(
        default="PROVISIONAL_DETERMINISTIC_RECIPIENT_SCORER_V1",
        description="Model architecture identifier: provisional deterministic recipient risk scorer",
    )

    @field_validator("assessment_timestamp")
    @classmethod
    def validate_timestamp_tz(cls, v: datetime) -> datetime:
        res = _validate_timezone_aware(v, "assessment_timestamp")
        assert res is not None
        return res
