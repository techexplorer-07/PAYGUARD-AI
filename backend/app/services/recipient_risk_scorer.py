"""Recipient Risk Assessment Service (Phase 2.3.4).

Computes transparent, evidence-based recipient risk assessments from Scam-to-Payment
Evidence Graph (SPEG) intelligence profiles without propagating guilt-by-association
or claiming calibrated statistical fraud probabilities.
"""

from datetime import datetime, timedelta, timezone
from decimal import Decimal
import logging
from typing import Any, Dict, List, Optional, Set, Tuple
import uuid

from app.schemas.recipient import (
    EvidenceNodeType,
    EvidenceRelationshipType,
    EvidenceStatus,
    RecipientDataSufficiency,
    RecipientIntelligenceProfile,
    RecipientRecommendedAction,
    RecipientRiskAssessment,
    RecipientRiskLevel,
    SupportingEvidenceItem,
)

logger = logging.getLogger("payguard.recipient_risk_scorer")

MODEL_TYPE_IDENTIFIER = "PROVISIONAL_DETERMINISTIC_RECIPIENT_SCORER_V1"

# Documented provisional scoring weights and contribution bounds
WEIGHT_VERIFIED_SINGLE_CASE = 0.85
WEIGHT_VERIFIED_MULTIPLE_CASES = 0.95

WEIGHT_REPORTED_SINGLE_SOURCE = 0.25
WEIGHT_REPORTED_TWO_SOURCES = 0.40
WEIGHT_REPORTED_THREE_PLUS_SOURCES = 0.55

WEIGHT_INFERRED_SINGLE_IDENTIFIER = 0.12
WEIGHT_INFERRED_MULTIPLE_IDENTIFIERS = 0.20
MAX_INFERRED_ONLY_SCORE = 0.25  # Inferred associations ALONE must NEVER produce HIGH risk

RECENCY_WINDOW_RECENT_DAYS = 30
RECENCY_WINDOW_MODERATE_DAYS = 90
RECENCY_FACTOR_RECENT = 1.00
RECENCY_FACTOR_MODERATE = 0.80
RECENCY_FACTOR_STALE = 0.60

THRESHOLD_LOW_MAX = Decimal("0.3000")
THRESHOLD_MEDIUM_MAX = Decimal("0.7000")


def _calculate_recency_factor(observed_at: datetime, ref_time: datetime) -> Tuple[float, str]:
    """Compute recency decay factor and category for a given evidence observation."""
    age_days = max(0, (ref_time - observed_at).days)
    if age_days <= RECENCY_WINDOW_RECENT_DAYS:
        return RECENCY_FACTOR_RECENT, f"recent ({age_days}d ago)"
    elif age_days <= RECENCY_WINDOW_MODERATE_DAYS:
        return RECENCY_FACTOR_MODERATE, f"moderate age ({age_days}d ago)"
    else:
        return RECENCY_FACTOR_STALE, f"stale historical ({age_days}d ago)"


def score_recipient_risk(
    profile: RecipientIntelligenceProfile,
    as_of: Optional[datetime] = None,
) -> RecipientRiskAssessment:
    """Evaluate recipient graph evidence and return a transparent RecipientRiskAssessment.

    Core Invariants:
    1. Interpretable Features: Every risk contribution is mathematically traceable to specific edges.
    2. Zero Ownership Inference: Shared identifiers never imply beneficial or legal common ownership.
    3. Volume Guardrail: High transaction volume or customer count ALONE must NEVER produce HIGH risk.
    4. Inferred Link Guardrail: Inferred associations ALONE must NEVER produce HIGH risk (capped at LOW).
    5. Deduplication: Duplicate reports sharing the identical source reference count as 1 source.
    6. Non-Calibrated Output: Score is an interpretable heuristic metric, not a calibrated fraud probability.

    Args:
        profile: Computed RecipientIntelligenceProfile for the beneficiary.
        as_of: Optional reference timestamp for temporal expiry and recency calculations.

    Returns:
        RecipientRiskAssessment containing score, risk level, feature contributions, and explanation.
    """
    ref_time = as_of or datetime.now(timezone.utc)
    assessment_id = f"RRA-{uuid.uuid4().hex[:12].upper()}"

    # Standard explicit epistemic limitations
    assessment_limitations = [
        "This assessment is a provisional deterministic heuristic score and does not represent a calibrated statistical fraud probability.",
        "A LOW risk level indicates an absence of concerning signals in available SPEG data, not a guarantee that the recipient is benign.",
        "Shared identifier links reflect topological co-occurrence (e.g. shared hardware, network, or communication rail) and must not be treated as common legal or beneficial account ownership.",
        "REPORTED claims represent unadjudicated customer or external allegations; only formal VERIFIED cases indicate external institutional corroboration.",
        "In this prototype, VERIFIED evidence reflects controlled internal assertions and not live banking or law enforcement data feeds.",
    ]

    # Evaluate Data Sufficiency
    total_evidence_count = len(profile.supporting_evidence)
    has_activity = (profile.total_transaction_count > 0 or profile.direct_customer_count > 0)

    if profile.data_sufficiency == "INSUFFICIENT" or (total_evidence_count == 0 and not has_activity):
        return RecipientRiskAssessment(
            assessment_id=assessment_id,
            recipient_id=profile.recipient_id,
            graph_id=profile.graph_id,
            assessment_timestamp=ref_time,
            recipient_risk_score=Decimal("0.0000"),
            risk_level=RecipientRiskLevel.UNCERTAIN,
            data_sufficiency=RecipientDataSufficiency.INSUFFICIENT,
            detected_indicators=["INSUFFICIENT_GRAPH_DATA"],
            feature_contributions={"insufficient_data": 0.0},
            explanation=(
                f"Recipient '{profile.recipient_id}' has insufficient evidence in evidence graph '{profile.graph_id}'. "
                "No transaction history, fraud filings, or network associations were identified. "
                "A reliable risk determination cannot be made."
            ),
            supporting_evidence=[],
            assessment_limitations=assessment_limitations,
            recommended_action=RecipientRecommendedAction.INSUFFICIENT_DATA_REVIEW,
            model_type=MODEL_TYPE_IDENTIFIER,
        )

    # Determine mapped data sufficiency tier
    if profile.data_sufficiency == "MINIMAL" or total_evidence_count <= 2:
        sufficiency = RecipientDataSufficiency.LIMITED
    else:
        sufficiency = RecipientDataSufficiency.ADEQUATE

    # -------------------------------------------------------------------------
    # Feature 1: Verified Fraud-Case Association
    # -------------------------------------------------------------------------
    verified_fraud_items: List[SupportingEvidenceItem] = []
    seen_verified_cases: Set[str] = set()

    for item in profile.supporting_evidence:
        if item.evidence_status == EvidenceStatus.VERIFIED:
            # Check relationship semantics: direct fraud case filing
            if item.relationship_type == EvidenceRelationshipType.REPORTED_IN_CASE or "CASE" in item.target_node_id:
                verified_fraud_items.append(item)
                seen_verified_cases.add(item.target_node_id)

    verified_fraud_score = 0.0
    if len(seen_verified_cases) == 1:
        verified_fraud_score = WEIGHT_VERIFIED_SINGLE_CASE
    elif len(seen_verified_cases) > 1:
        verified_fraud_score = WEIGHT_VERIFIED_MULTIPLE_CASES

    # -------------------------------------------------------------------------
    # Feature 2: Reported Fraud-Case Association (Deduplicated by source_reference)
    # -------------------------------------------------------------------------
    reported_fraud_items: List[SupportingEvidenceItem] = []
    reports_by_source: Dict[str, List[SupportingEvidenceItem]] = {}

    for item in profile.supporting_evidence:
        if item.evidence_status == EvidenceStatus.REPORTED:
            if item.relationship_type == EvidenceRelationshipType.REPORTED_IN_CASE or "CASE" in item.target_node_id:
                reported_fraud_items.append(item)
                reports_by_source.setdefault(item.source_reference, []).append(item)

    distinct_source_count = len(reports_by_source)
    reported_base_score = 0.0
    if distinct_source_count == 1:
        reported_base_score = WEIGHT_REPORTED_SINGLE_SOURCE
    elif distinct_source_count == 2:
        reported_base_score = WEIGHT_REPORTED_TWO_SOURCES
    elif distinct_source_count >= 3:
        reported_base_score = WEIGHT_REPORTED_THREE_PLUS_SOURCES

    # Recency factor for reported evidence
    if reported_fraud_items:
        most_recent_obs = max(item.observed_at for item in reported_fraud_items)
        recency_factor, recency_label = _calculate_recency_factor(most_recent_obs, ref_time)
        reported_fraud_score = reported_base_score * recency_factor
    else:
        reported_fraud_score = 0.0
        recency_label = "no reported evidence"

    # -------------------------------------------------------------------------
    # Feature 3: Inferred Shared-Identifier Relationships
    # -------------------------------------------------------------------------
    distinct_ident_count = profile.shared_identifier_count
    inferred_identifier_score = 0.0
    if distinct_ident_count == 1:
        inferred_identifier_score = WEIGHT_INFERRED_SINGLE_IDENTIFIER
    elif distinct_ident_count >= 2:
        inferred_identifier_score = WEIGHT_INFERRED_MULTIPLE_IDENTIFIERS

    # -------------------------------------------------------------------------
    # Feature 4: Transaction & Customer Context
    # -------------------------------------------------------------------------
    # High volume alone never triggers risk. If there is legitimate merchant volume,
    # it remains 0.0 risk score contribution.
    transaction_context_score = 0.0
    is_high_volume_merchant = (profile.direct_customer_count >= 10 or profile.total_transaction_count >= 25)

    # -------------------------------------------------------------------------
    # Combined Score Computation & Strict Guardrails
    # -------------------------------------------------------------------------
    raw_score = verified_fraud_score + reported_fraud_score + inferred_identifier_score + transaction_context_score

    # Strict Invariant: Inferred associations alone must NEVER produce HIGH risk!
    has_fraud_evidence = (verified_fraud_score > 0.0 or reported_fraud_score > 0.0)
    if not has_fraud_evidence:
        raw_score = min(raw_score, MAX_INFERRED_ONLY_SCORE)

    # Score bounded to [0.0, 1.0]
    final_score_float = max(0.0, min(1.0, raw_score))
    recipient_risk_score = Decimal(str(round(final_score_float, 4)))

    # Risk level determination
    if recipient_risk_score < THRESHOLD_LOW_MAX:
        risk_level = RecipientRiskLevel.LOW
    elif recipient_risk_score < THRESHOLD_MEDIUM_MAX:
        risk_level = RecipientRiskLevel.MEDIUM
    else:
        # High risk requires corroborating direct fraud evidence
        if has_fraud_evidence:
            risk_level = RecipientRiskLevel.HIGH
        else:
            risk_level = RecipientRiskLevel.MEDIUM

    # Recommended action selection
    if risk_level == RecipientRiskLevel.LOW:
        recommended_action = RecipientRecommendedAction.ALLOW
    elif risk_level == RecipientRiskLevel.MEDIUM:
        if distinct_source_count > 0:
            recommended_action = RecipientRecommendedAction.WARN_CUSTOMER
        else:
            recommended_action = RecipientRecommendedAction.STEP_UP_VERIFICATION
    else:
        recommended_action = RecipientRecommendedAction.REVIEW_PAYMENT

    # Detected indicators list
    detected_indicators: List[str] = []
    if verified_fraud_score > 0.0:
        detected_indicators.append(f"VERIFIED_FRAUD_CASE_ASSOCIATION ({len(seen_verified_cases)} case(s))")
    if reported_fraud_score > 0.0:
        detected_indicators.append(
            f"REPORTED_FRAUD_ALLEGATIONS ({len(reported_fraud_items)} report(s) across {distinct_source_count} distinct source(s))"
        )
    if inferred_identifier_score > 0.0:
        detected_indicators.append(
            f"INFERRED_SHARED_IDENTIFIERS ({distinct_ident_count} shared identifier(s))"
        )
    if is_high_volume_merchant:
        detected_indicators.append("HIGH_TRANSACTION_ACTIVITY_MERCHANT")
    if profile.expired_relationship_count > 0:
        detected_indicators.append(f"HISTORICAL_EXPIRED_EVIDENCE_EXCLUDED ({profile.expired_relationship_count} item(s))")

    if not detected_indicators:
        detected_indicators.append("ORDINARY_BENIGN_ACTIVITY")

    # Feature contribution breakdown
    feature_contributions = {
        "verified_fraud_case_association": round(verified_fraud_score, 4),
        "reported_fraud_case_association": round(reported_fraud_score, 4),
        "inferred_shared_identifier_relationships": round(inferred_identifier_score, 4),
        "transaction_volume_context": round(transaction_context_score, 4),
    }

    # Traceable narrative explanation
    explanation_parts = [
        f"Recipient '{profile.recipient_id}' evaluated under model '{MODEL_TYPE_IDENTIFIER}' with score {recipient_risk_score} ({risk_level.value})."
    ]

    if verified_fraud_score > 0.0:
        explanation_parts.append(
            f"Strong signal: Directly linked to {len(seen_verified_cases)} VERIFIED fraud case filing(s) (+{verified_fraud_score:.2f})."
        )
    if reported_fraud_score > 0.0:
        explanation_parts.append(
            f"Reported allegations: Linked to {distinct_source_count} distinct reported source reference(s) "
            f"with {recency_label} recency (+{reported_fraud_score:.2f})."
        )
        if len(reported_fraud_items) > distinct_source_count:
            explanation_parts.append(
                f"Note: {len(reported_fraud_items) - distinct_source_count} duplicate report(s) sharing identical source references were deduplicated."
            )
    if inferred_identifier_score > 0.0:
        explanation_parts.append(
            f"Inferred associations: Associated with {distinct_ident_count} shared identifier node(s) (+{inferred_identifier_score:.2f}). "
            "Inferred associations reflect network co-occurrence and alone cannot produce HIGH risk."
        )
    if is_high_volume_merchant and not has_fraud_evidence:
        explanation_parts.append(
            f"Activity context: Recipient exhibits established volume ({profile.total_transaction_count} transaction(s), "
            f"{profile.direct_customer_count} distinct customer(s)) with zero fraud filings. High degree does not imply fraud."
        )
    if not has_fraud_evidence and inferred_identifier_score == 0.0:
        explanation_parts.append("No adverse fraud filings or suspicious network associations were identified in available SPEG data.")

    explanation = " ".join(explanation_parts)

    return RecipientRiskAssessment(
        assessment_id=assessment_id,
        recipient_id=profile.recipient_id,
        graph_id=profile.graph_id,
        assessment_timestamp=ref_time,
        recipient_risk_score=recipient_risk_score,
        risk_level=risk_level,
        data_sufficiency=sufficiency,
        detected_indicators=detected_indicators,
        feature_contributions=feature_contributions,
        explanation=explanation,
        supporting_evidence=profile.supporting_evidence,
        assessment_limitations=assessment_limitations,
        recommended_action=recommended_action,
        model_type=MODEL_TYPE_IDENTIFIER,
    )
