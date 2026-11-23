"""Explainable rule-based risk assessment component for intent-to-payment correlation."""

from typing import List
from app.schemas.correlation import (
    ComparisonStatus,
    ExtractedPaymentIntent,
    IntentPaymentComparison,
    RecommendedAction,
    RiskAssessment,
    RiskLevel,
    SimulatedTransaction,
)


def assess_risk(
    intent: ExtractedPaymentIntent,
    comparison: IntentPaymentComparison,
    transaction: SimulatedTransaction,
) -> RiskAssessment:
    """Evaluate transparent, deterministic risk rules based on intent correlation signals.

    Rules hierarchy:
    1. Currency Mismatch -> HIGH risk (forex / currency denomination mismatch).
    2. Explicit recipient mismatch -> HIGH risk (diverted payment signal).
    3. Amount mismatch -> MEDIUM/HIGH risk (amount discrepancy requiring review).
    4. Ambiguous / Uncertain extraction -> UNCERTAIN (conflicting amounts or recipients).
    5. Missing payment details -> UNCERTAIN (insufficient evidence to correlate).
    6. Matching details + severe threat/urgency -> MEDIUM risk (caution against coercive scam).
    7. Clean matching details -> LOW risk (consistent intent; not guaranteed immune).

    Args:
        intent: Extracted communication intent.
        comparison: Field-level comparison results.
        transaction: Simulated payment transaction parameters.

    Returns:
        RiskAssessment: Risk level, heuristic score (0.0 - 1.0), signals, and explainable reasons.
    """
    reasons: List[str] = []
    signals: List[str] = []

    # Track contextual flags
    if intent.urgency_detected:
        signals.append("URGENCY_LANGUAGE_DETECTED")
    if intent.threat_detected:
        signals.append("COERCIVE_THREAT_LANGUAGE_DETECTED")
    if intent.purpose:
        signals.append(f"CONTEXT_PURPOSE_{intent.purpose.upper().replace(' ', '_').replace('/', '_')}")

    # RULE 1: CURRENCY MISMATCH
    if comparison.currency_status == ComparisonStatus.MISMATCH:
        risk_level = RiskLevel.HIGH
        heuristic_score = 0.85
        signals.append("CURRENCY_MISMATCH")
        signals.append("AMOUNT_MISMATCH")
        reasons.append(
            f"Currency mismatch detected: Communication requested {intent.currency}, "
            f"but transaction is denominated in {transaction.currency}."
        )
        reasons.append(
            "Currency discrepancy strictly invalidates numerical amount equality."
        )
        if comparison.recipient_status == ComparisonStatus.MISMATCH:
            signals.append("RECIPIENT_MISMATCH")
            reasons.append(
                f"Compound mismatch: Beneficiary also diverted from '{comparison.normalized_requested_recipient}' "
                f"to '{comparison.normalized_transaction_recipient}'."
            )
            heuristic_score = 0.95
        if intent.threat_detected or intent.urgency_detected:
            reasons.append("Aggravating factor: High-urgency or coercive language accompanied this currency-inconsistent request.")
            heuristic_score = min(0.95, heuristic_score + 0.05)
        recommended_action = RecommendedAction.REVIEW_PAYMENT_DETAILS

    # RULE 2: EXPLICIT RECIPIENT MISMATCH (Significant diversion warning)
    elif comparison.recipient_status == ComparisonStatus.MISMATCH:
        risk_level = RiskLevel.HIGH
        signals.append("RECIPIENT_MISMATCH")
        reasons.append(
            f"RECIPIENT DIVERSION: Communication requested payment to '{comparison.normalized_requested_recipient}', "
            f"but simulated transaction is directed to '{comparison.normalized_transaction_recipient}'."
        )

        if comparison.amount_status == ComparisonStatus.MATCH:
            signals.append("AMOUNT_MATCH_WITH_RECIPIENT_DIVERSION")
            reasons.append(
                f"Classic scam indicator: Amount ({transaction.currency} {transaction.amount:,.2f}) matches request, "
                "but the destination account was diverted."
            )
            base_score = 0.85
        elif comparison.amount_status == ComparisonStatus.MISMATCH:
            signals.append("AMOUNT_MISMATCH")
            reasons.append(
                f"Compound mismatch: Transaction amount also differs."
            )
            base_score = 0.90
        else:
            base_score = 0.80

        if intent.threat_detected:
            reasons.append("Aggravating factor: Threat or coercion language detected (e.g. service cutoff or legal action).")
            base_score = min(0.95, base_score + 0.08)
        elif intent.urgency_detected:
            reasons.append("Aggravating factor: Urgency cues detected pressing for immediate transfer.")
            base_score = min(0.92, base_score + 0.05)

        heuristic_score = round(base_score, 2)
        recommended_action = RecommendedAction.VERIFY_RECIPIENT_IDENTITY

    # RULE 3: AMBIGUOUS / CONFLICTING EVIDENCE
    elif (
        comparison.amount_status == ComparisonStatus.UNCERTAIN
        or comparison.recipient_status == ComparisonStatus.UNCERTAIN
    ):
        risk_level = RiskLevel.UNCERTAIN
        heuristic_score = 0.50
        if comparison.amount_status == ComparisonStatus.UNCERTAIN:
            signals.append("AMBIGUOUS_AMOUNT_DETECTED")
            reasons.append("Multiple ambiguous or conflicting payment amounts were identified in the communication.")
        if comparison.recipient_status == ComparisonStatus.UNCERTAIN:
            signals.append("AMBIGUOUS_RECIPIENT_DETECTED")
            reasons.append("Multiple or conflicting payment recipient identifiers were identified in the communication.")
        reasons.append("Manual verification of payment instructions is required before proceeding.")
        if intent.threat_detected or intent.urgency_detected:
            reasons.append("Warning: Psychological pressure or urgency cues were detected alongside ambiguous instructions.")
            heuristic_score = 0.65
        recommended_action = RecommendedAction.REVIEW_PAYMENT_DETAILS

    # RULE 4: INSUFFICIENT EVIDENCE (Neither amount nor recipient found)
    elif (
        comparison.amount_status == ComparisonStatus.NOT_FOUND
        and comparison.recipient_status == ComparisonStatus.NOT_FOUND
    ):
        risk_level = RiskLevel.UNCERTAIN
        heuristic_score = 0.50
        signals.append("INSUFFICIENT_EXTRACTION_EVIDENCE")
        reasons.append("Insufficient payment details could be reliably extracted from the supplied communication.")
        reasons.append("The system cannot establish whether the transaction matches the message intent.")
        if intent.threat_detected or intent.urgency_detected:
            reasons.append("Warning: Psychological pressure or urgency cues were detected despite missing payment handles.")
            heuristic_score = 0.60
        recommended_action = RecommendedAction.REVIEW_PAYMENT_DETAILS

    # RULE 5: AMOUNT MISMATCH (Recipient matches or is not specified)
    elif comparison.amount_status == ComparisonStatus.MISMATCH:
        signals.append("AMOUNT_MISMATCH")
        reasons.append(
            f"Amount discrepancy: Simulated payment is {transaction.currency} {transaction.amount:,.2f}, "
            f"which differs from requested amount of {transaction.currency} {intent.amount:,.2f}."
        )

        if intent.threat_detected:
            risk_level = RiskLevel.HIGH
            heuristic_score = 0.80
            signals.append("HIGH_COERCION_AMOUNT_MISMATCH")
            reasons.append("Urgent or threatening language detected alongside an inconsistent payment figure.")
            recommended_action = RecommendedAction.PAUSE_AND_VERIFY_CALLER
        else:
            risk_level = RiskLevel.MEDIUM
            heuristic_score = 0.65
            recommended_action = RecommendedAction.REVIEW_PAYMENT_DETAILS

    # RULE 6: RECIPIENT NOT FOUND, BUT AMOUNT MATCHES
    elif (
        comparison.recipient_status == ComparisonStatus.NOT_FOUND
        and comparison.amount_status == ComparisonStatus.MATCH
    ):
        signals.append("AMOUNT_MATCH_UNSPECIFIED_RECIPIENT")
        reasons.append(
            f"Amount matches the requested instruction ({transaction.currency} {transaction.amount:,.2f}), "
            "but no recipient handle was specified in the communication text."
        )

        if intent.threat_detected or intent.urgency_detected:
            risk_level = RiskLevel.MEDIUM
            heuristic_score = 0.55
            reasons.append("Urgency or coercion language detected. Verify recipient identity through an independent channel.")
            recommended_action = RecommendedAction.VERIFY_RECIPIENT_IDENTITY
        else:
            risk_level = RiskLevel.LOW
            heuristic_score = 0.25
            reasons.append("No payment-instruction mismatch was identified in the available evidence.")
            reasons.append(
                "DISCLAIMER: A matching request does not establish that the communication or recipient is legitimate, verified safe, or fraud-free. Always remain alert to social engineering."
            )
            recommended_action = RecommendedAction.PROCEED_WITH_STANDARD_VERIFICATION

    # RULE 7: FULL MATCH (Amount MATCH and Recipient MATCH)
    elif (
        comparison.amount_status == ComparisonStatus.MATCH
        and comparison.recipient_status == ComparisonStatus.MATCH
    ):
        signals.append("FULL_INTENT_TRANSACTION_MATCH")
        reasons.append(
            f"Both requested amount ({transaction.currency} {transaction.amount:,.2f}) and recipient "
            f"('{comparison.normalized_transaction_recipient}') match the communication instructions."
        )

        if intent.threat_detected:
            risk_level = RiskLevel.MEDIUM
            heuristic_score = 0.40
            reasons.append(
                "CAUTION: Coercive/threat language was detected in the communication. "
                "Matching credentials reduce intent divergence, but do not guarantee the claim is genuine."
            )
            recommended_action = RecommendedAction.PAUSE_AND_VERIFY_CALLER
        elif intent.urgency_detected:
            risk_level = RiskLevel.LOW
            heuristic_score = 0.20
            reasons.append("No payment-instruction mismatch was identified in the available evidence.")
            reasons.append(
                "DISCLAIMER: A matching request does not establish that the communication or recipient is legitimate, verified safe, or fraud-free. Always remain alert to social engineering."
            )
            recommended_action = RecommendedAction.PROCEED_WITH_STANDARD_VERIFICATION
        else:
            risk_level = RiskLevel.LOW
            heuristic_score = 0.10
            reasons.append("No payment-instruction mismatch was identified in the available evidence.")
            reasons.append(
                "DISCLAIMER: A matching request does not establish that the communication or recipient is legitimate, verified safe, or fraud-free. Always remain alert to social engineering."
            )
            recommended_action = RecommendedAction.PROCEED_WITH_STANDARD_VERIFICATION

    else:
        # Fallback for unexpected state combinations
        risk_level = RiskLevel.UNCERTAIN
        heuristic_score = 0.50
        signals.append("UNRESOLVED_CORRELATION_STATE")
        reasons.append("Unable to determine correlation confidence from provided signals.")
        recommended_action = RecommendedAction.REVIEW_PAYMENT_DETAILS

    return RiskAssessment(
        risk_level=risk_level,
        heuristic_score=heuristic_score,
        score_type="prototype_heuristic_score (deterministic rule-based, non-ML)",
        reasons=reasons,
        signals_detected=signals,
        recommended_action=recommended_action,
    )
