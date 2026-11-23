"""Payment Protection Orchestration Service (Final MVP Integration).

Coordinates all independent PAYGUARD AI intelligence engines into a single,
deterministic, end-to-end payment evaluation pipeline:
1. Intent-to-Payment Correlation Engine (Phase 2.1)
2. Customer Behavioural Anomaly Scorer (Phase 2.2)
3. Recipient Risk Intelligence Engine (Phase 2.3)
4. Unified Risk Assessment Engine (Phase 2.4)
5. Explainable Intervention Recommendation Policy
"""

from datetime import datetime, timezone
from decimal import Decimal
import logging
from typing import List, Optional
from uuid import uuid4
from fastapi import HTTPException, status

from app.schemas.behavioural import (
    BehaviouralAnalysisRequest,
    BehaviouralRiskAssessment,
    CurrentTransaction,
)
from app.schemas.correlation import (
    ComparisonStatus,
    CorrelationResponse,
    SimulatedTransaction,
)
from app.schemas.payment_protection import (
    InterventionRecommendation,
    InterventionSeverity,
    InterventionType,
    PaymentProtectionRequest,
    PaymentProtectionResponse,
)
from app.schemas.recipient import (
    RecipientRiskAssessment,
)
from app.schemas.unified_risk import (
    BehaviouralRiskSignal,
    IntentRiskSignal,
    RecipientRiskSignal,
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
from app.services.unified_risk_assessor import synthesize_unified_assessment

logger = logging.getLogger("payguard.orchestration")


def build_intervention_recommendation(
    unified: UnifiedRiskAssessment,
    intent_resp: Optional[CorrelationResponse],
    behav_resp: Optional[BehaviouralRiskAssessment],
    recip_resp: Optional[RecipientRiskAssessment],
) -> InterventionRecommendation:
    """Build an explainable, simulated intervention recommendation based on unified risk."""
    action = unified.recommended_action
    rationale: List[str] = []

    # Identify individual engine findings dynamically
    has_recip_mismatch = bool(
        intent_resp
        and intent_resp.comparison.recipient_status == ComparisonStatus.MISMATCH
    )
    has_amt_mismatch = bool(
        intent_resp
        and intent_resp.comparison.amount_status == ComparisonStatus.MISMATCH
    )
    has_behav_high = bool(
        behav_resp and behav_resp.risk_level.value == "HIGH"
    )
    has_recip_high = bool(
        recip_resp and recip_resp.risk_level.value == "HIGH"
    )

    if action == UnifiedRecommendedAction.ALLOW_WITH_CAUTION:
        severity = InterventionSeverity.LOW
        inv_type = InterventionType.TRANSACTION_PERMITTED
        action_code = "PERMIT"
        if behav_resp is None:
            guidance = (
                "Payment parameters match communication instructions. Customer history was not evaluated. "
                "Transaction permitted in simulation with standard monitoring. This is a simulation; no live payment execution is performed."
            )
        else:
            guidance = (
                "Payment parameters match expected communication intent and customer historical baseline. "
                "Transaction permitted with standard security monitoring. This is a simulation; no live payment execution is performed."
            )
        if intent_resp and intent_resp.comparison.recipient_status == ComparisonStatus.MATCH:
            rationale.append("Communication Intent: Recipient handle matches extracted communication instructions.")
        if behav_resp:
            rationale.append("Customer Baseline: Transaction activity is consistent with historical baseline patterns.")
        else:
            rationale.append("Customer History: Behavioural baseline history was not submitted (not evaluated).")
        if recip_resp:
            rationale.append("Recipient Evidence: No adverse fraud associations observed in evidence graph.")
        else:
            rationale.append("Recipient Intelligence: Recipient was not queried in SPEG evidence graph (not evaluated).")

    elif action == UnifiedRecommendedAction.WARN_CUSTOMER:
        severity = InterventionSeverity.MEDIUM
        inv_type = InterventionType.CONTEXTUAL_WARNING
        action_code = "DISPLAY_WARNING"
        if recip_resp and any("REPORTED" in ind for ind in recip_resp.detected_indicators):
            guidance = (
                "Caution: The destination recipient has unconfirmed fraud complaints or incident reports in the evidence graph. "
                "Please verify recipient authenticity before confirming. This is a simulation; no actual bank or UPI payment has been paused."
            )
            rationale.append("Recipient Intelligence: Multiple unverified reported allegations exist in the evidence graph.")
        elif intent_resp and intent_resp.risk_assessment.risk_level.value == "MEDIUM":
            guidance = (
                "Caution: Potential ambiguities or minor discrepancies detected in payment instructions. "
                "Please confirm transaction details before authorizing. This is a simulation; no actual bank or UPI payment has been paused."
            )
            rationale.append("Communication Intent: Extracted intent exhibits moderate risk or partial details.")
        else:
            guidance = (
                "Caution: Moderate risk indicators detected across evaluated streams. "
                "Please review payment details before proceeding. This is a simulation; no actual bank or UPI payment has been paused."
            )
            rationale.append("Multi-Engine Risk: Moderate risk indicators active across evaluated streams.")

    elif action == UnifiedRecommendedAction.STEP_UP_VERIFICATION:
        severity = InterventionSeverity.MEDIUM
        inv_type = InterventionType.STEP_UP_VERIFICATION
        action_code = "CHALLENGE_BIOMETRIC"
        if behav_resp and "NEW_BENEFICIARY" in behav_resp.detected_indicators:
            guidance = (
                "Elevated friction recommended: This payment targets a first-time beneficiary for this customer account. "
                "Secondary biometric confirmation is recommended before authorizing. This is a simulation; no live biometric challenge was enforced."
            )
            rationale.append("Beneficiary Novelty (NEW_BENEFICIARY): Transfer targets a new, first-time recipient for this customer account.")
        elif behav_resp and behav_resp.anomaly_score and behav_resp.anomaly_score >= Decimal("0.3000"):
            guidance = (
                f"Elevated friction recommended: Transaction deviates from historical transfer baseline (anomaly score: {behav_resp.anomaly_score}). "
                "Secondary confirmation is recommended before authorizing. This is a simulation; no live banking challenge was enforced."
            )
            rationale.append(f"Baseline Anomaly: Transaction deviates from customer baseline (score: {behav_resp.anomaly_score}).")
        else:
            guidance = (
                "Elevated friction recommended: Multi-engine risk evaluation indicates anomalous patterns. "
                "Secondary confirmation is recommended before authorizing. This is a simulation; no live banking challenge was enforced."
            )
            rationale.append("Step-up verification recommended based on multi-engine risk synthesis.")

        if behav_resp and behav_resp.anomaly_score and behav_resp.anomaly_score >= Decimal("0.3000") and "NEW_BENEFICIARY" in behav_resp.detected_indicators:
            rationale.append(f"Baseline Anomaly: Customer historical transfer baseline exhibits statistical deviation (anomaly score: {behav_resp.anomaly_score}).")

    elif action == UnifiedRecommendedAction.PAUSE_AND_VERIFY:
        severity = InterventionSeverity.HIGH
        inv_type = InterventionType.SIMULATED_PAYMENT_HOLD
        action_code = "PAUSE_HOLD_SIMULATION"

        if has_recip_mismatch:
            req_recip = intent_resp.extracted_intent.recipient_id or "an alternate recipient"
            tx_recip = intent_resp.comparison.normalized_transaction_recipient
            guidance = (
                f"PAYGUARD detected that the communication requested payment to {req_recip}, "
                f"while the simulated transaction targets {tx_recip}. "
                "We recommend pausing and independently verifying the recipient before proceeding. "
                "This is a simulation; no actual bank or UPI payment has been paused."
            )
            rationale.append(f"Destination Diversion: Communication requested '{req_recip}', but simulated transaction targets '{tx_recip}'.")
        elif has_amt_mismatch:
            req_amt = f"{intent_resp.extracted_intent.currency or ''} {intent_resp.extracted_intent.amount}"
            tx_amt = f"{intent_resp.comparison.normalized_transaction_currency} {intent_resp.comparison.normalized_transaction_amount if hasattr(intent_resp.comparison, 'normalized_transaction_amount') else ''}"
            guidance = (
                f"PAYGUARD detected an amount mismatch between communication instructions ({req_amt}) "
                f"and simulated payment ({tx_amt}). "
                "We recommend pausing and verifying details before proceeding. "
                "This is a simulation; no actual bank or UPI payment has been paused."
            )
            rationale.append("Amount Mismatch: Requested communication amount does not match transaction amount.")
        elif has_behav_high:
            anom_signals = [s for s in behav_resp.detected_indicators if "AMOUNT" in s or "VELOCITY" in s]
            anom_desc = ", ".join(anom_signals) if anom_signals else "severe transfer deviation"
            guidance = (
                f"PAYGUARD detected severe anomalous baseline activity on the payer account ({anom_desc}). "
                "We recommend pausing and verifying the transaction out-of-band before proceeding. "
                "This is a simulation; no actual bank or UPI payment has been paused."
            )
            rationale.append(f"Acute Behavioural Anomaly: {anom_desc} against historical baseline.")
        else:
            guidance = (
                "PAYGUARD detected critical risk overrides across evaluated transaction signals. "
                "We recommend pausing and independently verifying details before proceeding. "
                "This is a simulation; no actual bank or UPI payment has been paused."
            )
            rationale.append("Critical Risk Override: Destination diversion or high-severity anomaly triggered pause policy.")

    elif action == UnifiedRecommendedAction.MANUAL_REVIEW:
        severity = InterventionSeverity.HIGH
        inv_type = InterventionType.FRAUD_ANALYST_QUEUE
        action_code = "ROUTE_TO_ANALYST"
        if recip_resp and any("VERIFIED" in ind for ind in recip_resp.detected_indicators):
            guidance = (
                "High Risk Alert: The destination recipient is associated with VERIFIED external law enforcement or judicial fraud records. "
                "Simulated transfer routed for manual fraud desk investigation. This is a simulation; no actual payment has been blocked."
            )
            rationale.append("Verified Fraud Record: Recipient node is connected to corroborated police/court fraud records.")
        else:
            guidance = (
                "High Risk Alert: Severe fraud risk indicators warrant manual fraud desk investigation. "
                "This is a simulation; no actual payment has been blocked."
            )
            rationale.append("Manual Review Required: High-severity adverse evidence detected.")

    else:  # UnifiedRecommendedAction.INSUFFICIENT_DATA_REVIEW
        severity = InterventionSeverity.UNCERTAIN
        inv_type = InterventionType.FALLBACK_CONFIRMATION
        action_code = "PROMPT_MANUAL_CONFIRMATION"
        guidance = (
            "Notice: Insufficient historical or graph intelligence available to definitively score transaction safety. "
            "Please confirm you personally know and trust this recipient before proceeding. "
            "This is a simulation; no actual payment has been affected."
        )
        if unified.missing_evidence:
            rationale.extend(unified.missing_evidence)
        else:
            rationale.append("Insufficient data: Historical customer baselines and recipient evidence profiles are unavailable.")

    # Disclose evaluated vs non-evaluated streams in rationale if not already stated
    if behav_resp is None and "Customer History: Behavioural baseline history was not submitted (not evaluated)." not in rationale and action != UnifiedRecommendedAction.INSUFFICIENT_DATA_REVIEW:
        rationale.append("Customer History: Behavioural baseline history was not submitted (not evaluated).")
    if recip_resp is None and "Recipient Intelligence: Recipient was not queried in SPEG evidence graph (not evaluated)." not in rationale and action != UnifiedRecommendedAction.INSUFFICIENT_DATA_REVIEW:
        rationale.append("Recipient Intelligence: Target recipient was not queried in SPEG evidence graph (not evaluated).")

    return InterventionRecommendation(
        action=action,
        severity=severity,
        intervention_type=inv_type,
        simulated_action_code=action_code,
        user_guidance_message=guidance,
        rationale=rationale,
        simulated_intervention_active=True,
        disclaimer="Simulated intervention only. No live banking, UPI blocking, or payment gateway interception is executed.",
    )


def orchestrate_payment_protection(request: PaymentProtectionRequest) -> PaymentProtectionResponse:
    """Execute complete end-to-end payment protection pipeline directly in memory.

    Execution Sequence:
    1. Resolve Context & Validate Explicit Consent.
    2. Engine 1: Intent-to-Payment Correlation (Phase 2.1).
    3. Engine 2: Customer Behavioural Anomaly Scorer (Phase 2.2).
    4. Engine 3: Recipient Intelligence & Risk Assessment (Phase 2.3).
    5. Engine 4: Unified Risk Assessment Synthesis (Phase 2.4).
    6. Engine 5: Explainable Intervention Recommendation.
    """
    eval_id = f"PPE-{uuid4().hex[:12].upper()}"
    eval_time = request.as_of or datetime.now(timezone.utc)
    customer_id = request.customer_id or "CUST-DEFAULT"
    recipient_id = (request.recipient_id or request.simulated_transaction.recipient_id).strip()
    tx_id = (
        request.simulated_transaction.transaction_reference
        or f"TX-{uuid4().hex[:8].upper()}"
    )

    # Privacy Guarantee: Log only telemetry metadata, NEVER raw communication text
    text_length = len(request.communication_text) if request.communication_text else 0
    history_count = len(request.historical_transactions) if request.historical_transactions else 0
    logger.info(
        "Initiating Payment Protection Evaluation '%s': customer_id='%s', recipient_id='%s', text_len=%d, history_count=%d",
        eval_id,
        customer_id,
        recipient_id,
        text_length,
        history_count,
    )

    # -------------------------------------------------------------------------
    # 1. Engine 1: Intent-to-Payment Correlation (Phase 2.1)
    # -------------------------------------------------------------------------
    intent_resp: Optional[CorrelationResponse] = None
    intent_signal: Optional[IntentRiskSignal] = None

    if request.communication_text is not None and len(request.communication_text.strip()) > 0:
        # Mandatory Consent Check (Security Rule 6)
        if not request.customer_consent:
            logger.warning("Rejected orchestration request: communication_text provided but customer_consent is False.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Explicit customer consent to analyze the supplied communication text is required.",
            )

        extracted_intent = extract_payment_intent(request.communication_text)
        comparison = compare_intent_to_transaction(extracted_intent, request.simulated_transaction)
        risk_assessment = assess_risk(extracted_intent, comparison, request.simulated_transaction)

        intent_resp = CorrelationResponse(
            timestamp=eval_time.isoformat(),
            consent_verified=request.customer_consent,
            extracted_intent=extracted_intent,
            comparison=comparison,
            risk_assessment=risk_assessment,
        )
        intent_signal = IntentRiskSignal.from_correlation_response(intent_resp)

    # -------------------------------------------------------------------------
    # 2. Engine 2: Customer Behavioural Anomaly Scorer (Phase 2.2)
    # -------------------------------------------------------------------------
    behav_resp: Optional[BehaviouralRiskAssessment] = None
    behav_signal: Optional[BehaviouralRiskSignal] = None

    if request.historical_transactions is not None:
        current_tx = CurrentTransaction(
            transaction_id=tx_id,
            customer_id=customer_id,
            amount=Decimal(str(request.simulated_transaction.amount)),
            currency=request.simulated_transaction.currency,
            beneficiary_id=recipient_id,
            payment_method=request.payment_method or "UPI",
            transaction_timestamp=eval_time,
        )
        behav_req = BehaviouralAnalysisRequest(
            customer_id=customer_id,
            current_transaction=current_tx,
            historical_transactions=request.historical_transactions,
        )
        features = extract_behavioural_features(behav_req)
        behav_resp = score_behavioural_risk(features=features, transaction_id=tx_id)
        behav_signal = BehaviouralRiskSignal.from_behavioural_assessment(behav_resp)

    # -------------------------------------------------------------------------
    # 3. Engine 3: Recipient Intelligence & Risk Assessment (Phase 2.3)
    # -------------------------------------------------------------------------
    recip_resp: Optional[RecipientRiskAssessment] = None
    recip_signal: Optional[RecipientRiskSignal] = None

    try:
        profile = analyze_recipient_relationships(
            recipient_id=recipient_id,
            graph_id=request.graph_id,
            as_of=eval_time,
        )
        recip_resp = score_recipient_risk(profile=profile, as_of=eval_time)
        recip_signal = RecipientRiskSignal.from_recipient_assessment(recip_resp)
    except (ValueError, KeyError):
        # Recipient is not present in active SPEG graph or no graph initialized
        recip_resp = None
        recip_signal = None

    # -------------------------------------------------------------------------
    # 4. Engine 4: Unified Risk Assessment Synthesis (Phase 2.4)
    # -------------------------------------------------------------------------
    unified_assessment = synthesize_unified_assessment(
        transaction_id=tx_id,
        customer_id=customer_id,
        recipient_id=recipient_id,
        intent_signal=intent_signal,
        behavioural_signal=behav_signal,
        recipient_signal=recip_signal,
        as_of=eval_time,
    )

    # -------------------------------------------------------------------------
    # 5. Engine 5: Intervention Recommendation
    # -------------------------------------------------------------------------
    intervention = build_intervention_recommendation(
        unified=unified_assessment,
        intent_resp=intent_resp,
        behav_resp=behav_resp,
        recip_resp=recip_resp,
    )

    # -------------------------------------------------------------------------
    # 6. Response Construction & Narrative Synthesis
    # -------------------------------------------------------------------------
    narrative = (
        f"PAYGUARD AI evaluated transaction '{tx_id}' for customer '{customer_id}' transferring to '{recipient_id}'. "
        f"Synthesized composite risk score: {unified_assessment.overall_risk_score} ({unified_assessment.risk_level.value}). "
        f"Recommended operational action: {intervention.action.value} ({intervention.intervention_type.value}). "
        f"{intervention.user_guidance_message}"
    )

    return PaymentProtectionResponse(
        evaluation_id=eval_id,
        timestamp=eval_time,
        transaction_id=tx_id,
        customer_id=customer_id,
        recipient_id=recipient_id,
        customer_consent=request.customer_consent,
        intent_assessment=intent_resp,
        behavioural_assessment=behav_resp,
        recipient_assessment=recip_resp,
        unified_risk_assessment=unified_assessment,
        intervention_recommendation=intervention,
        summary_narrative=narrative,
        disclaimer="PAYGUARD AI prototype simulation only. Payment intervention is simulated; no live banking or UPI transaction control is executed.",
    )
