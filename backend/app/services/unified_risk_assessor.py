"""Unified Risk Assessment Service (Phase 2.4).

Synthesizes multi-engine outputs (Intent Correlation, Behavioural Risk, Recipient Intelligence)
into an explainable, deterministic composite risk assessment without conflating disparate
heuristics with calibrated statistical fraud probabilities.
"""

from datetime import datetime, timezone
from decimal import Decimal
import logging
from typing import Any, Dict, List, Optional, Set, Tuple
import uuid

from app.schemas.behavioural import (
    BehaviouralRiskLevel,
    DataSufficiencyLevel,
)
from app.schemas.correlation import (
    ComparisonStatus,
    RiskLevel as IntentRiskLevel,
)
from app.schemas.recipient import (
    EvidenceStatus,
    RecipientDataSufficiency,
    RecipientRiskLevel,
)
from app.schemas.unified_risk import (
    BehaviouralRiskSignal,
    IntentRiskSignal,
    RecipientRiskSignal,
    UnifiedEvidenceItem,
    UnifiedEvaluationRequest,
    UnifiedRecommendedAction,
    UnifiedRiskAssessment,
    UnifiedRiskLevel,
)
from app.services.behavioural_feature_extractor import extract_behavioural_features
from app.services.behavioural_risk_scorer import score_behavioural_risk
from app.services.correlation_engine import compare_intent_to_transaction
from app.services.intent_extractor import extract_payment_intent
from app.services.recipient_relationship_analyzer import analyze_recipient_relationships
from app.services.recipient_risk_scorer import score_recipient_risk
from app.services.risk_assessor import assess_risk
from app.services.speg_graph_builder import get_active_graph

logger = logging.getLogger("payguard.unified_risk_assessor")

POLICY_VERSION = "PAYGUARD_UNIFIED_POLICY_V1"
MODEL_TYPE_IDENTIFIER = "PROVISIONAL_DETERMINISTIC_MULTI_ENGINE_FUSION_V1"

# Documented provisional baseline weights across intelligence engines
BASE_WEIGHT_INTENT = 0.40
BASE_WEIGHT_BEHAVIOURAL = 0.30
BASE_WEIGHT_RECIPIENT = 0.30

# Policy thresholds
THRESHOLD_LOW_MAX = Decimal("0.3000")
THRESHOLD_MEDIUM_MAX = Decimal("0.7000")


def _score_to_float(val: Optional[Any]) -> Optional[float]:
    """Helper to convert float, Decimal, or None to a standard float."""
    if val is None:
        return None
    return float(val)


def synthesize_unified_assessment(
    transaction_id: str,
    customer_id: str,
    recipient_id: str,
    intent_signal: Optional[IntentRiskSignal] = None,
    behavioural_signal: Optional[BehaviouralRiskSignal] = None,
    recipient_signal: Optional[RecipientRiskSignal] = None,
    as_of: Optional[datetime] = None,
) -> UnifiedRiskAssessment:
    """Core multi-engine decision policy synthesizing intent, behavioural, and recipient signals.

    Decision Invariants:
    1. Intent Divergence Guard: Strong payment-intent contradictions (e.g. destination diversion)
       must remain visible and produce at least MEDIUM or HIGH risk even if behavioural or recipient
       profiles are clean or minimal.
    2. Verified Evidence Distinction: Direct, controlled VERIFIED recipient fraud cases are treated as
       formal corroboration, triggering HIGH risk, unlike uncorroborated REPORTED or INFERRED claims.
    3. New Beneficiary Guardrail: A new beneficiary alone without intent contradiction or adverse
       filings must NEVER trigger HIGH risk (capped at LOW or mild MEDIUM with cautionary action).
    4. Inferred Association Guardrail: Inferred network associations alone must never produce HIGH risk.
    5. Missing Data Transparency: Missing engines are explicitly noted and dynamically re-weighted;
       missing modules are never treated as clean zero-risk evidence.
    6. Non-Calibrated Output: Composite score represents heuristic risk severity, not a fraud probability.
    """
    ref_time = as_of or datetime.now(timezone.utc)
    unified_id = f"URA-{uuid.uuid4().hex[:12].upper()}"

    # Track contributing assessments and metadata
    contributing_assessments: Dict[str, Optional[str]] = {
        "intent_correlation": intent_signal.assessment_id if intent_signal else None,
        "behavioural_risk": behavioural_signal.assessment_id if behavioural_signal else None,
        "recipient_intelligence": recipient_signal.assessment_id if recipient_signal else None,
    }

    engine_summary: Dict[str, Any] = {}
    missing_evidence: List[str] = []
    conflicting_signals: List[str] = []
    detected_indicators_set: Set[str] = set()
    supporting_evidence_items: List[UnifiedEvidenceItem] = []

    # -------------------------------------------------------------------------
    # 1. Audit and summarize available engine outputs
    # -------------------------------------------------------------------------
    # Engine A: Intent Correlation
    if intent_signal:
        score_intent = intent_signal.heuristic_score
        engine_summary["intent_correlation"] = {
            "status": "EVALUATED",
            "risk_level": intent_signal.risk_level.value,
            "heuristic_score": score_intent,
            "score_type": intent_signal.score_type,
            "indicators": intent_signal.detected_indicators,
        }
        for ind in intent_signal.detected_indicators:
            detected_indicators_set.add(f"INTENT_{ind}")
        for idx, snippet in enumerate(intent_signal.evidence_snippets):
            supporting_evidence_items.append(
                UnifiedEvidenceItem(
                    engine_source="INTENT",
                    evidence_id=f"SNIPPET-{idx}",
                    epistemic_status="EXTRACTED",
                    source_reference=f"COMMUNICATION_{snippet.field.upper()}",
                    description=f"Extracted {snippet.field}: '{snippet.text_snippet}' ({snippet.status.value})",
                )
            )
    else:
        score_intent = None
        engine_summary["intent_correlation"] = {
            "status": "NOT_EVALUATED",
            "risk_level": "UNAVAILABLE",
            "heuristic_score": None,
            "notes": "No customer communication intent submitted for analysis.",
        }
        missing_evidence.append("Intent correlation not evaluated: no communication text submitted.")

    # Engine B: Behavioural Analysis
    if behavioural_signal:
        score_behav = _score_to_float(behavioural_signal.anomaly_score)
        engine_summary["behavioural_risk"] = {
            "status": "EVALUATED",
            "risk_level": behavioural_signal.risk_level.value,
            "anomaly_score": score_behav,
            "data_sufficiency": behavioural_signal.data_sufficiency.value,
            "indicators": behavioural_signal.detected_indicators,
        }
        for ind in behavioural_signal.detected_indicators:
            detected_indicators_set.add(f"BEHAVIOURAL_{ind}")
        for k, v in behavioural_signal.feature_contributions.items():
            supporting_evidence_items.append(
                UnifiedEvidenceItem(
                    engine_source="BEHAVIOURAL",
                    evidence_id=f"FEAT-{k}",
                    epistemic_status="STATISTICAL",
                    source_reference=f"CUSTOMER_BASELINE_{k.upper()}",
                    description=f"Behavioural signal {k}: contribution {v}",
                )
            )
    else:
        score_behav = None
        engine_summary["behavioural_risk"] = {
            "status": "NOT_EVALUATED",
            "risk_level": "UNAVAILABLE",
            "anomaly_score": None,
            "notes": "No historical customer transaction baseline submitted.",
        }
        missing_evidence.append("Customer behavioural history not evaluated: historical transactions unavailable.")

    # Engine C: Recipient Intelligence
    if recipient_signal:
        score_recip = _score_to_float(recipient_signal.recipient_risk_score)
        engine_summary["recipient_intelligence"] = {
            "status": "EVALUATED",
            "risk_level": recipient_signal.risk_level.value,
            "recipient_risk_score": score_recip,
            "data_sufficiency": recipient_signal.data_sufficiency.value,
            "indicators": recipient_signal.detected_indicators,
        }
        for ind in recipient_signal.detected_indicators:
            detected_indicators_set.add(f"RECIPIENT_{ind}")
        for item in recipient_signal.supporting_evidence:
            supporting_evidence_items.append(
                UnifiedEvidenceItem(
                    engine_source="RECIPIENT",
                    evidence_id=item.edge_id,
                    epistemic_status=item.evidence_status.value,
                    source_reference=item.source_reference,
                    description=f"{item.relationship_type.value}: {item.description}",
                )
            )
    else:
        score_recip = None
        engine_summary["recipient_intelligence"] = {
            "status": "NOT_EVALUATED",
            "risk_level": "UNAVAILABLE",
            "recipient_risk_score": None,
            "notes": "No recipient graph intelligence queried.",
        }
        missing_evidence.append("Recipient risk intelligence not evaluated: target not queried against SPEG graph.")

    # -------------------------------------------------------------------------
    # 2. Evaluate Global Data Sufficiency
    # -------------------------------------------------------------------------
    available_engines = sum(1 for s in (score_intent, score_behav, score_recip) if s is not None)

    any_sufficient = False
    if intent_signal and intent_signal.risk_level != IntentRiskLevel.UNCERTAIN:
        any_sufficient = True
    if behavioural_signal and behavioural_signal.data_sufficiency != DataSufficiencyLevel.INSUFFICIENT:
        any_sufficient = True
    if recipient_signal and recipient_signal.data_sufficiency != RecipientDataSufficiency.INSUFFICIENT:
        any_sufficient = True

    if available_engines == 0 or not any_sufficient:
        global_sufficiency = "INSUFFICIENT"
        return UnifiedRiskAssessment(
            unified_assessment_id=unified_id,
            transaction_id=transaction_id,
            customer_id=customer_id,
            recipient_id=recipient_id,
            overall_risk_score=Decimal("0.0000"),
            risk_level=UnifiedRiskLevel.UNCERTAIN,
            contributing_assessments=contributing_assessments,
            engine_signal_summary=engine_summary,
            detected_indicators=["INSUFFICIENT_MULTI_ENGINE_DATA"],
            feature_contributions={"insufficient_data": 0.0},
            supporting_evidence=[],
            explanation=(
                "Insufficient intelligence available across engines. No communication intent, customer baseline, "
                "or recipient history was available with sufficient depth to compute an explainable risk decision."
            ),
            missing_evidence=missing_evidence,
            conflicting_signals=[],
            data_sufficiency=global_sufficiency,
            recommended_action=UnifiedRecommendedAction.INSUFFICIENT_DATA_REVIEW,
            policy_version=POLICY_VERSION,
            model_type=MODEL_TYPE_IDENTIFIER,
            assessment_timestamp=ref_time,
        )
    elif available_engines < 3 or not (
        (intent_signal is None or intent_signal.risk_level != IntentRiskLevel.UNCERTAIN)
        and (behavioural_signal is None or behavioural_signal.data_sufficiency == DataSufficiencyLevel.SUFFICIENT)
        and (recipient_signal is None or recipient_signal.data_sufficiency == RecipientDataSufficiency.ADEQUATE)
    ):
        global_sufficiency = "LIMITED"
    else:
        global_sufficiency = "ADEQUATE"

    # -------------------------------------------------------------------------
    # 3. Dynamic Multi-Engine Weighted Fusion
    # -------------------------------------------------------------------------
    active_weights: Dict[str, float] = {}
    active_scores: Dict[str, float] = {}

    if score_intent is not None:
        active_weights["intent"] = BASE_WEIGHT_INTENT
        active_scores["intent"] = score_intent
    if score_behav is not None:
        active_weights["behavioural"] = BASE_WEIGHT_BEHAVIOURAL
        active_scores["behavioural"] = score_behav
    if score_recip is not None:
        active_weights["recipient"] = BASE_WEIGHT_RECIPIENT
        active_scores["recipient"] = score_recip

    total_weight = sum(active_weights.values())
    if total_weight > 0:
        base_composite = sum(active_weights[k] * active_scores[k] for k in active_weights) / total_weight
    else:
        base_composite = 0.0

    feature_contributions = {
        k: round((active_weights[k] / total_weight) * active_scores[k], 4) for k in active_weights
    }

    # -------------------------------------------------------------------------
    # 4. Decision Policy Overrides & Invariants
    # -------------------------------------------------------------------------
    adjusted_score = base_composite

    # Invariant A: Strong Intent Contradiction Override (Diverted payment destination)
    has_intent_mismatch = (
        intent_signal is not None
        and (
            intent_signal.recipient_status == ComparisonStatus.MISMATCH
            or intent_signal.risk_level == IntentRiskLevel.HIGH
        )
    )
    if has_intent_mismatch:
        # Destination diversion is an active fraud cue. Must not be diluted below HIGH threshold
        adjusted_score = max(adjusted_score, 0.75)
        detected_indicators_set.add("DESTINATION_INTENT_DIVERGENCE_OVERRIDE")

    # Invariant B: Controlled VERIFIED Recipient Evidence Override
    has_verified_recipient_fraud = False
    if recipient_signal:
        for item in recipient_signal.supporting_evidence:
            if item.evidence_status == EvidenceStatus.VERIFIED and (
                item.relationship_type.value == "REPORTED_IN_CASE" or "CASE" in item.target_node_id
            ):
                has_verified_recipient_fraud = True
                break

    if has_verified_recipient_fraud:
        adjusted_score = max(adjusted_score, 0.85)
        detected_indicators_set.add("VERIFIED_RECIPIENT_FRAUD_CASE_OVERRIDE")

    # Invariant C: New Beneficiary Guardrail
    is_new_beneficiary_only = False
    if behavioural_signal and "NEW_BENEFICIARY" in behavioural_signal.detected_indicators:
        other_behav_flags = [
            f for f in behavioural_signal.detected_indicators if f not in ("NEW_BENEFICIARY", "FIRST_TIME_TRANSFER")
        ]
        if not other_behav_flags and not has_intent_mismatch and not has_verified_recipient_fraud:
            # If recipient has no reported or verified cases and intent is clean/missing
            recip_clean = (score_recip is None or score_recip <= 0.25)
            intent_clean = (score_intent is None or score_intent <= 0.30)
            if recip_clean and intent_clean:
                is_new_beneficiary_only = True
                adjusted_score = min(adjusted_score, 0.35)
                detected_indicators_set.add("NEW_BENEFICIARY_GUARDRAIL_APPLIED")

    # Invariant D: Inferred Recipient Links Alone Guardrail
    if recipient_signal and score_recip is not None and score_recip > 0:
        if not has_intent_mismatch and not has_verified_recipient_fraud:
            has_reported_cases = any(
                "REPORTED" in ind for ind in recipient_signal.detected_indicators
            )
            if not has_reported_cases and (score_intent is None or score_intent <= 0.25) and (score_behav is None or score_behav <= 0.25):
                adjusted_score = min(adjusted_score, 0.25)
                detected_indicators_set.add("INFERRED_NETWORK_LINKS_ONLY_GUARDRAIL")

    # Invariant E: Severe Behavioural Anomaly Elevation
    # A severe customer baseline anomaly (score >= 0.75) represents acute deviation
    # and must elevate composite risk to at least the MEDIUM risk tier (score >= 0.40)
    if score_behav is not None and score_behav >= 0.75 and not is_new_beneficiary_only:
        adjusted_score = max(adjusted_score, 0.40)
        detected_indicators_set.add("ELEVATED_BEHAVIOURAL_ANOMALY_OVERRIDE")

    # Invariant F: Reported Recipient Fraud Elevation
    # A recipient with multiple reported fraud complaints represents uncorroborated allegations
    # that must elevate composite risk to at least the MEDIUM risk tier (score >= 0.35)
    if recipient_signal and score_recip is not None and score_recip >= 0.35 and any("REPORTED" in ind for ind in recipient_signal.detected_indicators):
        adjusted_score = max(adjusted_score, 0.35)
        detected_indicators_set.add("REPORTED_RECIPIENT_FRAUD_ELEVATION")

    # Normalize final score to [0.0000, 1.0000]
    final_score_float = max(0.0, min(1.0, adjusted_score))
    overall_risk_score = Decimal(str(round(final_score_float, 4)))

    # -------------------------------------------------------------------------
    # 5. Risk Level & Action Determination
    # -------------------------------------------------------------------------
    if overall_risk_score < THRESHOLD_LOW_MAX:
        risk_level = UnifiedRiskLevel.LOW
        recommended_action = UnifiedRecommendedAction.ALLOW_WITH_CAUTION
    elif overall_risk_score < THRESHOLD_MEDIUM_MAX:
        risk_level = UnifiedRiskLevel.MEDIUM
        if (
            has_intent_mismatch
            or (intent_signal and intent_signal.risk_level == IntentRiskLevel.MEDIUM)
            or (recipient_signal and any("REPORTED" in ind for ind in recipient_signal.detected_indicators))
        ):
            recommended_action = UnifiedRecommendedAction.WARN_CUSTOMER
        elif is_new_beneficiary_only:
            recommended_action = UnifiedRecommendedAction.STEP_UP_VERIFICATION
        else:
            recommended_action = UnifiedRecommendedAction.STEP_UP_VERIFICATION
    else:
        risk_level = UnifiedRiskLevel.HIGH
        if has_intent_mismatch:
            recommended_action = UnifiedRecommendedAction.PAUSE_AND_VERIFY
        elif has_verified_recipient_fraud:
            recommended_action = UnifiedRecommendedAction.MANUAL_REVIEW
        else:
            recommended_action = UnifiedRecommendedAction.PAUSE_AND_VERIFY

    # -------------------------------------------------------------------------
    # 6. Conflict Detection & Traceable Explanations
    # -------------------------------------------------------------------------
    if intent_signal and intent_signal.risk_level == IntentRiskLevel.LOW and has_verified_recipient_fraud:
        conflicting_signals.append(
            "Intent-Recipient Contradiction: Customer communication matched payment parameters, "
            "but destination recipient account is associated with VERIFIED fraud records."
        )
    if has_intent_mismatch and behavioural_signal and behavioural_signal.risk_level == BehaviouralRiskLevel.LOW:
        conflicting_signals.append(
            "Intent-Behavioural Contradiction: Payer historical activity pattern is normal, "
            "but current payment details diverge from extracted customer communication instructions."
        )
    if behavioural_signal and behavioural_signal.risk_level == BehaviouralRiskLevel.HIGH and intent_signal and intent_signal.risk_level == IntentRiskLevel.LOW:
        conflicting_signals.append(
            "Behavioural-Intent Contradiction: Customer communication confirms payment intent, "
            "but transaction exhibits significant amount or velocity anomalies against baseline."
        )

    explanation_segments: List[str] = [
        f"Unified transaction evaluation for customer '{customer_id}' paying '{recipient_id}' "
        f"produced composite risk score {overall_risk_score} ({risk_level.value}) under policy '{POLICY_VERSION}'."
    ]

    if has_intent_mismatch:
        explanation_segments.append(
            "Critical Intent Alert: Communication intent analysis identified payment destination diversion "
            "or amount contradiction; intent override applied."
        )
    elif intent_signal:
        explanation_segments.append(
            f"Intent Correlation: Evaluated with risk tier {intent_signal.risk_level.value} "
            f"(heuristic score {intent_signal.heuristic_score})."
        )

    if has_verified_recipient_fraud:
        explanation_segments.append(
            "Critical Recipient Alert: Beneficiary has direct associations with VERIFIED fraud case filings; "
            "verified evidence override applied."
        )
    elif recipient_signal:
        explanation_segments.append(
            f"Recipient Intelligence: Evaluated with risk tier {recipient_signal.risk_level.value} "
            f"(score {recipient_signal.recipient_risk_score}, sufficiency {recipient_signal.data_sufficiency.value})."
        )

    if is_new_beneficiary_only:
        explanation_segments.append(
            "Behavioural Context: Payer is transferring to a first-time beneficiary, but all other signals "
            "are benign; new beneficiary guardrail applied to prevent false positive."
        )
    elif behavioural_signal:
        explanation_segments.append(
            f"Behavioural Anomaly: Evaluated with risk tier {behavioural_signal.risk_level.value} "
            f"(anomaly score {behavioural_signal.anomaly_score}, sufficiency {behavioural_signal.data_sufficiency.value})."
        )

    if missing_evidence:
        explanation_segments.append(
            f"Missing Streams ({len(missing_evidence)}): " + " ".join(missing_evidence)
        )

    if conflicting_signals:
        explanation_segments.append(
            f"Conflict Resolution: " + " ".join(conflicting_signals)
        )

    explanation = " ".join(explanation_segments)

    # Deduplicate detected indicators
    detected_indicators = sorted(list(detected_indicators_set))
    if not detected_indicators:
        detected_indicators = ["ORDINARY_BENIGN_TRANSACTION"]

    return UnifiedRiskAssessment(
        unified_assessment_id=unified_id,
        transaction_id=transaction_id,
        customer_id=customer_id,
        recipient_id=recipient_id,
        overall_risk_score=overall_risk_score,
        risk_level=risk_level,
        contributing_assessments=contributing_assessments,
        engine_signal_summary=engine_summary,
        detected_indicators=detected_indicators,
        feature_contributions=feature_contributions,
        supporting_evidence=supporting_evidence_items,
        explanation=explanation,
        missing_evidence=missing_evidence,
        conflicting_signals=conflicting_signals,
        data_sufficiency=global_sufficiency,
        recommended_action=recommended_action,
        policy_version=POLICY_VERSION,
        model_type=MODEL_TYPE_IDENTIFIER,
        assessment_timestamp=ref_time,
    )


def evaluate_unified_risk(request: UnifiedEvaluationRequest) -> UnifiedRiskAssessment:
    """Orchestrate multi-engine evaluations on-the-fly where needed and synthesize unified assessment.

    Args:
        request: UnifiedEvaluationRequest containing pre-computed signals and/or raw engine parameters.

    Returns:
        UnifiedRiskAssessment synthesizing all available intelligence.
    """
    ref_time = request.as_of or datetime.now(timezone.utc)

    # 1. Resolve Intent Risk Signal
    intent_signal = request.intent_assessment
    if intent_signal is None and request.correlation_request is not None:
        try:
            if request.correlation_request.customer_consent:
                extracted = extract_payment_intent(request.correlation_request.communication_text)
                comparison = compare_intent_to_transaction(extracted, request.correlation_request.simulated_transaction)
                ra = assess_risk(extracted, comparison, request.correlation_request.simulated_transaction)
                corr_resp = CorrelationResponse(
                    status="success",
                    consent_verified=True,
                    extracted_intent=extracted,
                    comparison=comparison,
                    risk_assessment=ra,
                    timestamp=ref_time.isoformat(),
                )
                intent_signal = IntentRiskSignal.from_correlation_response(corr_resp)
        except Exception as e:
            logger.warning("On-the-fly intent correlation failed: %s", str(e))

    # 2. Resolve Behavioural Risk Signal
    behavioural_signal = request.behavioural_assessment
    if behavioural_signal is None and request.behavioural_request is not None:
        try:
            features = extract_behavioural_features(request.behavioural_request)
            assessment = score_behavioural_risk(features)
            behavioural_signal = BehaviouralRiskSignal.from_behavioural_assessment(assessment)
        except Exception as e:
            logger.warning("On-the-fly behavioural evaluation failed: %s", str(e))

    # 3. Resolve Recipient Risk Signal
    recipient_signal = request.recipient_assessment
    if recipient_signal is None and request.recipient_id:
        target_graph = get_active_graph(request.graph_id)
        if target_graph is not None and request.recipient_id in target_graph:
            try:
                profile = analyze_recipient_relationships(
                    recipient_id=request.recipient_id,
                    graph=target_graph,
                    as_of=ref_time,
                )
                rra = score_recipient_risk(profile=profile, as_of=ref_time)
                recipient_signal = RecipientRiskSignal.from_recipient_assessment(rra)
            except Exception as e:
                logger.warning("On-the-fly recipient scoring failed: %s", str(e))

    return synthesize_unified_assessment(
        transaction_id=request.transaction_id,
        customer_id=request.customer_id,
        recipient_id=request.recipient_id,
        intent_signal=intent_signal,
        behavioural_signal=behavioural_signal,
        recipient_signal=recipient_signal,
        as_of=ref_time,
    )
