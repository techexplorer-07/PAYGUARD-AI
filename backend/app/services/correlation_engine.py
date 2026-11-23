"""Comparison engine correlating extracted payment intent with simulated transactions."""

from decimal import Decimal
from typing import Optional
from app.schemas.correlation import (
    ComparisonStatus,
    ExtractedPaymentIntent,
    ExtractionStatus,
    IntentPaymentComparison,
    SimulatedTransaction,
)


def compare_intent_to_transaction(
    intent: ExtractedPaymentIntent,
    transaction: SimulatedTransaction,
) -> IntentPaymentComparison:
    """Compare extracted communication instructions against the simulated transaction.

    Applies the central question:
    "Does the payment the customer is about to make match the payment request they received?"

    Args:
        intent: Deterministically extracted payment intent from communication.
        transaction: Simulated payment parameters about to be authorized.

    Returns:
        IntentPaymentComparison: Status of currency, amount, and recipient comparisons with detail summary.
    """
    normalized_tx_recipient = transaction.recipient_id.strip().lower()
    normalized_req_recipient: Optional[str] = (
        intent.recipient_id.strip().lower() if intent.recipient_id else None
    )

    normalized_tx_currency = transaction.currency.strip().upper()
    normalized_req_currency: Optional[str] = (
        intent.currency.strip().upper() if intent.currency else None
    )

    # 1. Compare Currency
    if normalized_req_currency is None:
        currency_status = ComparisonStatus.NOT_FOUND
    elif normalized_req_currency == normalized_tx_currency:
        currency_status = ComparisonStatus.MATCH
    else:
        currency_status = ComparisonStatus.MISMATCH

    # 2. Compare Amount
    amount_difference: Optional[float] = None
    if intent.amount_status == ExtractionStatus.UNCERTAIN:
        amount_status = ComparisonStatus.UNCERTAIN
    elif intent.amount_status == ExtractionStatus.NOT_FOUND or intent.amount is None:
        amount_status = ComparisonStatus.NOT_FOUND
    elif currency_status == ComparisonStatus.MISMATCH:
        # Critical rule: Differing currencies strictly invalidate numerical amount matching
        amount_status = ComparisonStatus.MISMATCH
        amount_difference = None
    else:
        # Use Python Decimal for exact financial comparison without binary float drift
        tx_dec = Decimal(str(transaction.amount))
        req_dec = Decimal(str(intent.amount))
        diff_dec = tx_dec - req_dec
        amount_difference = float(diff_dec)

        if abs(diff_dec) < Decimal("0.001"):
            amount_status = ComparisonStatus.MATCH
        else:
            amount_status = ComparisonStatus.MISMATCH

    # 3. Compare Recipient
    # Strict rule: A missing recipient in communication must NEVER be marked as MISMATCH.
    if intent.recipient_status == ExtractionStatus.UNCERTAIN:
        recipient_status = ComparisonStatus.UNCERTAIN
    elif intent.recipient_status == ExtractionStatus.NOT_FOUND or normalized_req_recipient is None:
        recipient_status = ComparisonStatus.NOT_FOUND
    else:
        # Case-insensitive comparison of normalized payment handles (e.g. UPI IDs)
        if normalized_req_recipient == normalized_tx_recipient:
            recipient_status = ComparisonStatus.MATCH
        else:
            recipient_status = ComparisonStatus.MISMATCH

    # 4. Formulate Human-Readable Summary
    summary_parts = []

    # Currency summary
    if currency_status == ComparisonStatus.MISMATCH:
        summary_parts.append(
            f"CURRENCY MISMATCH: Transaction is {normalized_tx_currency}, "
            f"but communication requested {normalized_req_currency}."
        )
    elif currency_status == ComparisonStatus.NOT_FOUND:
        summary_parts.append("No explicit currency code was specified in communication text.")

    # Amount summary
    if amount_status == ComparisonStatus.MATCH:
        summary_parts.append(
            f"Amount matches requested instruction ({normalized_tx_currency} {transaction.amount:,.2f})."
        )
    elif amount_status == ComparisonStatus.MISMATCH:
        if currency_status == ComparisonStatus.MISMATCH:
            summary_parts.append(
                f"Amount mismatch: Differing currencies prevent matching ({normalized_tx_currency} {transaction.amount:,.2f} vs {normalized_req_currency} {intent.amount:,.2f})."
            )
        else:
            summary_parts.append(
                f"Amount mismatch: Transaction is {normalized_tx_currency} {transaction.amount:,.2f}, but message requested {normalized_tx_currency} {intent.amount:,.2f}."
            )
    elif amount_status == ComparisonStatus.UNCERTAIN:
        summary_parts.append(
            "Multiple ambiguous or conflicting payment amounts were detected in the message; exact intended amount could not be resolved."
        )
    else:
        summary_parts.append("No requested payment amount was identified in communication text.")

    # Recipient summary
    if recipient_status == ComparisonStatus.MATCH:
        summary_parts.append(f"Recipient matches requested beneficiary ({normalized_tx_recipient}).")
    elif recipient_status == ComparisonStatus.MISMATCH:
        summary_parts.append(
            f"RECIPIENT DIVERSION WARNING: Transaction is directed to '{normalized_tx_recipient}', but message requested payment to '{normalized_req_recipient}'."
        )
    elif recipient_status == ComparisonStatus.UNCERTAIN:
        summary_parts.append(
            "Multiple or conflicting recipient identifiers were detected in the message; exact intended beneficiary could not be resolved."
        )
    else:
        summary_parts.append("No explicit recipient identifier was identified in communication text.")

    summary = " ".join(summary_parts)

    return IntentPaymentComparison(
        amount_status=amount_status,
        amount_difference=amount_difference,
        currency_status=currency_status,
        recipient_status=recipient_status,
        normalized_requested_currency=normalized_req_currency,
        normalized_transaction_currency=normalized_tx_currency,
        normalized_requested_recipient=normalized_req_recipient,
        normalized_transaction_recipient=normalized_tx_recipient,
        summary=summary,
    )
