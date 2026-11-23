"""Comprehensive test suite for the Intent-to-Payment Correlation Engine."""

from decimal import Decimal
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.correlation import (
    ComparisonStatus,
    CorrelationRequest,
    ExtractionStatus,
    RiskLevel,
    SimulatedTransaction,
)
from app.services.correlation_engine import compare_intent_to_transaction
from app.services.intent_extractor import extract_payment_intent, normalize_amount_str
from app.services.risk_assessor import assess_risk

client = TestClient(app)

ENDPOINT_URL = "/api/v1/correlation/analyze"


# =====================================================================
# STEP 8 MANDATORY SCENARIOS
# =====================================================================


def test_scenario_a_recipient_mismatch() -> None:
    """Scenario A: Electricity cutoff threat with explicit recipient diversion.

    Message requests payment to 'powerhelp@upi', but transaction is to 'personalaccount@upi'.
    Expected: Amount MATCH, Recipient MISMATCH, Risk HIGH.
    """
    payload = {
        "customer_consent": True,
        "communication_text": (
            "Your electricity connection will be disconnected today. "
            "Pay INR 8,500 immediately to powerhelp@upi to avoid disconnection."
        ),
        "simulated_transaction": {
            "amount": 8500.0,
            "currency": "INR",
            "recipient_id": "personalaccount@upi",
            "transaction_reference": "TXN-SCENARIO-A",
        },
    }

    response = client.post(ENDPOINT_URL, json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "success"
    assert data["consent_verified"] is True

    # Extraction assertions
    extracted = data["extracted_intent"]
    assert extracted["amount"] == 8500.0
    assert extracted["amount_status"] == ExtractionStatus.FOUND.value
    assert extracted["recipient_id"] == "powerhelp@upi"
    assert extracted["urgency_detected"] is True
    assert extracted["threat_detected"] is True

    # Comparison assertions
    comparison = data["comparison"]
    assert comparison["amount_status"] == ComparisonStatus.MATCH.value
    assert comparison["recipient_status"] == ComparisonStatus.MISMATCH.value
    assert comparison["normalized_requested_recipient"] == "powerhelp@upi"
    assert comparison["normalized_transaction_recipient"] == "personalaccount@upi"

    # Risk Assessment assertions
    risk = data["risk_assessment"]
    assert risk["risk_level"] == RiskLevel.HIGH.value
    assert risk["heuristic_score"] >= 0.85
    assert any("RECIPIENT DIVERSION" in r or "recipient" in r.lower() for r in risk["reasons"])
    assert "RECIPIENT_MISMATCH" in risk["signals_detected"]


def test_scenario_b_amount_mismatch() -> None:
    """Scenario B: Message requests ₹5,000 to merchant@upi, but simulated tx is ₹8,000.

    Expected: Amount MISMATCH, Recipient MATCH, Risk requires review (MEDIUM).
    """
    payload = {
        "customer_consent": True,
        "communication_text": "Please pay ₹5,000 to merchant@upi.",
        "simulated_transaction": {
            "amount": 8000.0,
            "currency": "INR",
            "recipient_id": "merchant@upi",
        },
    }

    response = client.post(ENDPOINT_URL, json=payload)
    assert response.status_code == 200
    data = response.json()

    extracted = data["extracted_intent"]
    assert extracted["amount"] == 5000.0
    assert extracted["recipient_id"] == "merchant@upi"

    comparison = data["comparison"]
    assert comparison["amount_status"] == ComparisonStatus.MISMATCH.value
    assert comparison["recipient_status"] == ComparisonStatus.MATCH.value
    assert comparison["amount_difference"] == 3000.0  # 8000 - 5000

    risk = data["risk_assessment"]
    assert risk["risk_level"] == RiskLevel.MEDIUM.value
    assert risk["heuristic_score"] >= 0.60
    assert any("discrepancy" in r.lower() or "amount" in r.lower() for r in risk["reasons"])


def test_scenario_c_matching_payment() -> None:
    """Scenario C: Clean matching payment where amount and recipient align.

    Expected: Amount MATCH, Recipient MATCH, Risk LOW.
    (Must not claim payment is guaranteed 100% safe).
    """
    payload = {
        "customer_consent": True,
        "communication_text": "Please pay ₹2,000 to merchant@upi.",
        "simulated_transaction": {
            "amount": 2000.0,
            "currency": "INR",
            "recipient_id": "merchant@upi",
        },
    }

    response = client.post(ENDPOINT_URL, json=payload)
    assert response.status_code == 200
    data = response.json()

    comparison = data["comparison"]
    assert comparison["amount_status"] == ComparisonStatus.MATCH.value
    assert comparison["recipient_status"] == ComparisonStatus.MATCH.value

    risk = data["risk_assessment"]
    assert risk["risk_level"] == RiskLevel.LOW.value
    assert risk["heuristic_score"] <= 0.25
    # Ensure false-confidence disclaimer is present
    assert any("no payment-instruction mismatch was identified" in r.lower() for r in risk["reasons"])
    assert any("does not establish that the communication or recipient is legitimate" in r.lower() or "fraud-free" in r.lower() for r in risk["reasons"])


def test_scenario_d_missing_recipient() -> None:
    """Scenario D: Prompt exact scenario - Missing recipient in urgency notice.

    Message: 'Your account requires immediate payment to avoid service disruption.'
    Simulated transaction: Amount ₹2,000, Recipient merchant@upi.
    Expected: Recipient NOT_FOUND (never fabricated as MISMATCH).
    Risk assessment accounts for insufficient evidence.
    """
    payload = {
        "customer_consent": True,
        "communication_text": "Your account requires immediate payment to avoid service disruption.",
        "simulated_transaction": {
            "amount": 2000.0,
            "currency": "INR",
            "recipient_id": "merchant@upi",
        },
    }

    response = client.post(ENDPOINT_URL, json=payload)
    assert response.status_code == 200
    data = response.json()

    extracted = data["extracted_intent"]
    assert extracted["recipient_id"] is None
    assert extracted["recipient_status"] == ExtractionStatus.NOT_FOUND.value

    comparison = data["comparison"]
    # Crucial rule: Missing recipient must NEVER be treated as MISMATCH
    assert comparison["recipient_status"] == ComparisonStatus.NOT_FOUND.value
    assert comparison["recipient_status"] != ComparisonStatus.MISMATCH.value

    risk = data["risk_assessment"]
    # Accounts for insufficient evidence
    assert risk["risk_level"] in (RiskLevel.UNCERTAIN.value, RiskLevel.MEDIUM.value)
    assert any("insufficient" in r.lower() or "recipient" in r.lower() for r in risk["reasons"])


def test_scenario_d_missing_recipient_with_matching_amount() -> None:
    """Scenario D variant: Amount is present and matches, but recipient is missing.

    Message: 'Your account requires immediate payment of ₹2,000 to avoid service disruption.'
    Expected: Amount MATCH, Recipient NOT_FOUND (never MISMATCH), Risk MEDIUM.
    """
    payload = {
        "customer_consent": True,
        "communication_text": "Your account requires immediate payment of ₹2,000 to avoid service disruption.",
        "simulated_transaction": {
            "amount": 2000.0,
            "currency": "INR",
            "recipient_id": "merchant@upi",
        },
    }

    response = client.post(ENDPOINT_URL, json=payload)
    assert response.status_code == 200
    data = response.json()

    extracted = data["extracted_intent"]
    assert extracted["amount"] == 2000.0
    assert extracted["recipient_id"] is None
    assert extracted["recipient_status"] == ExtractionStatus.NOT_FOUND.value

    comparison = data["comparison"]
    assert comparison["amount_status"] == ComparisonStatus.MATCH.value
    assert comparison["recipient_status"] == ComparisonStatus.NOT_FOUND.value

    risk = data["risk_assessment"]
    assert risk["risk_level"] == RiskLevel.MEDIUM.value
    assert "AMOUNT_MATCH_UNSPECIFIED_RECIPIENT" in risk["signals_detected"]


def test_scenario_e_no_payment_details() -> None:
    """Scenario E: Message contains no extractable financial parameters.

    Expected: Risk UNCERTAIN with clear explanation of insufficient evidence.
    """
    payload = {
        "customer_consent": True,
        "communication_text": "Hello, thanks for reaching out. Let's catch up later today at the office.",
        "simulated_transaction": {
            "amount": 1500.0,
            "currency": "INR",
            "recipient_id": "friend@upi",
        },
    }

    response = client.post(ENDPOINT_URL, json=payload)
    assert response.status_code == 200
    data = response.json()

    extracted = data["extracted_intent"]
    assert extracted["amount_status"] == ExtractionStatus.NOT_FOUND.value
    assert extracted["recipient_status"] == ExtractionStatus.NOT_FOUND.value

    comparison = data["comparison"]
    assert comparison["amount_status"] == ComparisonStatus.NOT_FOUND.value
    assert comparison["recipient_status"] == ComparisonStatus.NOT_FOUND.value

    risk = data["risk_assessment"]
    assert risk["risk_level"] == RiskLevel.UNCERTAIN.value
    assert any("insufficient" in r.lower() for r in risk["reasons"])


def test_scenario_f_no_consent_rejected() -> None:
    """Scenario F: customer_consent is False.

    Expected: Request rejected with HTTP 400 Bad Request.
    """
    payload = {
        "customer_consent": False,
        "communication_text": "Pay INR 1,000 to user@upi.",
        "simulated_transaction": {
            "amount": 1000.0,
            "currency": "INR",
            "recipient_id": "user@upi",
        },
    }

    response = client.post(ENDPOINT_URL, json=payload)
    assert response.status_code == 400
    error_data = response.json()
    assert "detail" in error_data
    assert "consent" in error_data["detail"].lower()


# =====================================================================
# INTELLIGENCE HARDENING TESTS
# =====================================================================


def test_currency_mismatch_fails_amount_match() -> None:
    """Critical: Requested USD 8,500 vs Simulated INR 8,500 must NOT match as an amount."""
    payload = {
        "customer_consent": True,
        "communication_text": "Please pay USD 8,500 to merchant@upi.",
        "simulated_transaction": {
            "amount": 8500.0,
            "currency": "INR",
            "recipient_id": "merchant@upi",
        },
    }

    response = client.post(ENDPOINT_URL, json=payload)
    assert response.status_code == 200
    data = response.json()

    # Currency comparison
    assert data["comparison"]["currency_status"] == ComparisonStatus.MISMATCH.value
    assert data["comparison"]["normalized_requested_currency"] == "USD"
    assert data["comparison"]["normalized_transaction_currency"] == "INR"

    # Amount comparison MUST be MISMATCH because currency difference invalidates equality
    assert data["comparison"]["amount_status"] == ComparisonStatus.MISMATCH.value

    # Risk level must be HIGH due to currency mismatch
    risk = data["risk_assessment"]
    assert risk["risk_level"] == RiskLevel.HIGH.value
    assert "CURRENCY_MISMATCH" in risk["signals_detected"]
    assert any("currency mismatch" in r.lower() for r in risk["reasons"])


def test_multi_currency_matching_usd() -> None:
    """Verify clean match when communication and transaction both use USD."""
    payload = {
        "customer_consent": True,
        "communication_text": "Please pay $150.00 to consultant@upi for consultation fee.",
        "simulated_transaction": {
            "amount": 150.0,
            "currency": "USD",
            "recipient_id": "consultant@upi",
        },
    }

    response = client.post(ENDPOINT_URL, json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["comparison"]["currency_status"] == ComparisonStatus.MATCH.value
    assert data["comparison"]["amount_status"] == ComparisonStatus.MATCH.value
    assert data["comparison"]["recipient_status"] == ComparisonStatus.MATCH.value
    assert data["risk_assessment"]["risk_level"] == RiskLevel.LOW.value


def test_multi_amount_ambiguous_yields_uncertain() -> None:
    """Multiple distinct amounts without explicit total must yield UNCERTAIN status."""
    payload = {
        "customer_consent": True,
        "communication_text": "Your bill is ₹5,000 and late fee is ₹500. Pay to bill@upi.",
        "simulated_transaction": {
            "amount": 5000.0,
            "currency": "INR",
            "recipient_id": "bill@upi",
        },
    }

    response = client.post(ENDPOINT_URL, json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["extracted_intent"]["amount_status"] == ExtractionStatus.UNCERTAIN.value
    assert data["comparison"]["amount_status"] == ComparisonStatus.UNCERTAIN.value
    assert data["risk_assessment"]["risk_level"] == RiskLevel.UNCERTAIN.value
    assert "AMBIGUOUS_AMOUNT_DETECTED" in data["risk_assessment"]["signals_detected"]


def test_multi_amount_with_explicit_total_resolves() -> None:
    """Multiple amounts with explicit 'total payable' phrase resolves to the total."""
    payload = {
        "customer_consent": True,
        "communication_text": "Electricity charge ₹5,000, penalty ₹500, total payable ₹5,500 to power@upi.",
        "simulated_transaction": {
            "amount": 5500.0,
            "currency": "INR",
            "recipient_id": "power@upi",
        },
    }

    response = client.post(ENDPOINT_URL, json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["extracted_intent"]["amount"] == 5500.0
    assert data["extracted_intent"]["amount_status"] == ExtractionStatus.FOUND.value
    assert data["comparison"]["amount_status"] == ComparisonStatus.MATCH.value
    assert data["comparison"]["recipient_status"] == ComparisonStatus.MATCH.value


def test_multi_recipient_with_negation_resolves_affirmative() -> None:
    """Multiple UPI handles where one is negated (e.g. 'do not send to') resolves the affirmative one."""
    payload = {
        "customer_consent": True,
        "communication_text": (
            "Pay INR 8,500 to electricity@upi, do not send to personalaccount@upi."
        ),
        "simulated_transaction": {
            "amount": 8500.0,
            "currency": "INR",
            "recipient_id": "electricity@upi",
        },
    }

    response = client.post(ENDPOINT_URL, json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["extracted_intent"]["recipient_id"] == "electricity@upi"
    assert data["extracted_intent"]["recipient_status"] == ExtractionStatus.FOUND.value
    assert data["comparison"]["recipient_status"] == ComparisonStatus.MATCH.value


def test_multi_recipient_ambiguous_yields_uncertain() -> None:
    """Multiple un-disambiguated handles yield UNCERTAIN recipient status."""
    payload = {
        "customer_consent": True,
        "communication_text": "Please transfer ₹2,500 to support@upi or billing@upi.",
        "simulated_transaction": {
            "amount": 2500.0,
            "currency": "INR",
            "recipient_id": "support@upi",
        },
    }

    response = client.post(ENDPOINT_URL, json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["extracted_intent"]["recipient_status"] == ExtractionStatus.UNCERTAIN.value
    assert data["comparison"]["recipient_status"] == ComparisonStatus.UNCERTAIN.value
    assert data["risk_assessment"]["risk_level"] == RiskLevel.UNCERTAIN.value
    assert "AMBIGUOUS_RECIPIENT_DETECTED" in data["risk_assessment"]["signals_detected"]


def test_repeated_identical_recipient_deduplicates() -> None:
    """Repeated identical recipient handle in one text cleanly deduplicates to FOUND."""
    payload = {
        "customer_consent": True,
        "communication_text": "Pay ₹1,000 to vendor@upi. Remember to confirm payment to vendor@upi.",
        "simulated_transaction": {
            "amount": 1000.0,
            "currency": "INR",
            "recipient_id": "vendor@upi",
        },
    }

    response = client.post(ENDPOINT_URL, json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["extracted_intent"]["recipient_id"] == "vendor@upi"
    assert data["extracted_intent"]["recipient_status"] == ExtractionStatus.FOUND.value
    assert data["comparison"]["recipient_status"] == ComparisonStatus.MATCH.value


def test_decimal_precision_exact_subtraction() -> None:
    """Verify that Python Decimal prevents float precision drift (e.g. 0.1 + 0.2 != 0.3)."""
    payload = {
        "customer_consent": True,
        "communication_text": "Pay INR 100.10 to vendor@upi.",
        "simulated_transaction": {
            "amount": 100.10,
            "currency": "INR",
            "recipient_id": "vendor@upi",
        },
    }

    response = client.post(ENDPOINT_URL, json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["comparison"]["amount_status"] == ComparisonStatus.MATCH.value
    assert data["comparison"]["amount_difference"] == 0.0


def test_false_confidence_prevention_wording() -> None:
    """Verify strict false-confidence wording for clean LOW risk transactions."""
    payload = {
        "customer_consent": True,
        "communication_text": "Payment request: INR 1,200 to service@upi for invoice.",
        "simulated_transaction": {
            "amount": 1200.0,
            "currency": "INR",
            "recipient_id": "service@upi",
        },
    }

    response = client.post(ENDPOINT_URL, json=payload)
    assert response.status_code == 200
    data = response.json()

    risk = data["risk_assessment"]
    assert risk["risk_level"] == RiskLevel.LOW.value
    assert "No payment-instruction mismatch was identified in the available evidence." in risk["reasons"]
    assert any("does not establish that the communication or recipient is legitimate" in r for r in risk["reasons"])


# =====================================================================
# EDGE-CASE & UNIT TESTS
# =====================================================================


def test_case_insensitive_upi_matching() -> None:
    """Verify that UPI ID matching is case-insensitive and whitespace-trimmed."""
    payload = {
        "customer_consent": True,
        "communication_text": "Send Rs. 500 to Support.Bill@OkAxis today.",
        "simulated_transaction": {
            "amount": 500.0,
            "currency": "INR",
            "recipient_id": "  support.bill@okaxis  ",
        },
    }

    response = client.post(ENDPOINT_URL, json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["comparison"]["recipient_status"] == ComparisonStatus.MATCH.value
    assert data["comparison"]["normalized_requested_recipient"] == "support.bill@okaxis"
    assert data["comparison"]["normalized_transaction_recipient"] == "support.bill@okaxis"


def test_amount_with_commas_and_decimals() -> None:
    """Verify parsing of formatted Indian amounts such as '₹ 1,25,000.50'."""
    text = "Please transfer ₹ 1,25,000.50 for the invoice."
    intent = extract_payment_intent(text)

    assert intent.amount == 125000.50
    assert intent.amount_status == ExtractionStatus.FOUND
    assert intent.currency == "INR"


def test_invalid_negative_amount_validation() -> None:
    """Verify that zero or negative transaction amounts are rejected by Pydantic."""
    payload = {
        "customer_consent": True,
        "communication_text": "Pay ₹500 to user@upi.",
        "simulated_transaction": {
            "amount": -50.0,  # Invalid: gt=0
            "currency": "INR",
            "recipient_id": "user@upi",
        },
    }

    response = client.post(ENDPOINT_URL, json=payload)
    assert response.status_code == 422  # Pydantic Unprocessable Entity


def test_invalid_currency_code_validation() -> None:
    """Verify that non-standard currency codes are rejected."""
    payload = {
        "customer_consent": True,
        "communication_text": "Pay ₹500 to user@upi.",
        "simulated_transaction": {
            "amount": 500.0,
            "currency": "inr",  # Invalid: requires uppercase 3-letter code
            "recipient_id": "user@upi",
        },
    }

    response = client.post(ENDPOINT_URL, json=payload)
    assert response.status_code == 422


def test_message_too_short_validation() -> None:
    """Verify that empty or sub-3-char messages are rejected."""
    payload = {
        "customer_consent": True,
        "communication_text": "hi",  # Too short (min_length=3)
        "simulated_transaction": {
            "amount": 100.0,
            "currency": "INR",
            "recipient_id": "test@upi",
        },
    }

    response = client.post(ENDPOINT_URL, json=payload)
    assert response.status_code == 422


def test_evidence_snippets_provenance() -> None:
    """Verify that extracted evidence carries accurate character index offsets."""
    text = "Urgent: Pay Rs. 3500 to utility@oksbi immediately."
    intent = extract_payment_intent(text)

    assert len(intent.evidence_snippets) >= 3
    for snippet in intent.evidence_snippets:
        assert snippet.start_char is not None
        assert snippet.end_char is not None
        # Check that sliced substring matches the text_snippet
        assert text[snippet.start_char : snippet.end_char] == snippet.text_snippet


def test_amount_extraction_digit_preservation_and_formats() -> None:
    """Verify Bug 1 fix: Every digit is preserved across various currency/amount representations."""
    cases = [
        ("Pay Rs 8500 to powerhelp@upi", 8500.0, "INR", "Rs 8500"),
        ("Please pay Rs. 8500 today", 8500.0, "INR", "Rs. 8500"),
        ("Send INR 8500 now", 8500.0, "INR", "INR 8500"),
        ("Transfer ₹8500 to merchant", 8500.0, "INR", "₹8500"),
        ("Bill amount is Rs 8,500 due now", 8500.0, "INR", "Rs 8,500"),
        ("Total is ₹8,500.50 including tax", 8500.5, "INR", "₹8,500.50"),
        ("Small fee of Rs 850", 850.0, "INR", "Rs 850"),
        ("High transfer of Rs 85,000", 85000.0, "INR", "Rs 85,000"),
        ("Lakh transfer of Rs 1,85,000", 185000.0, "INR", "Rs 1,85,000"),
        ("USD amount of $8500", 8500.0, "USD", "$8500"),
        ("EUR amount of €500", 500.0, "EUR", "€500"),
        ("GBP amount of £250", 250.0, "GBP", "£250"),
        ("Pay 8500 INR to vendor", 8500.0, "INR", "8500 INR"),
        ("Transfer 8,500 rupees", 8500.0, "INR", "8,500 rupees"),
        ("Pay 5000 rs to utility", 5000.0, "INR", "5000 rs"),
    ]

    for text, expected_amount, expected_curr, expected_snippet in cases:
        intent = extract_payment_intent(text)
        assert intent.amount == expected_amount, f"Failed amount on '{text}': got {intent.amount}, expected {expected_amount}"
        assert intent.currency == expected_curr, f"Failed currency on '{text}': got {intent.currency}, expected {expected_curr}"
        assert intent.amount_status == ExtractionStatus.FOUND
        # Verify snippet accuracy
        amt_snippets = [s for s in intent.evidence_snippets if s.field == "amount"]
        assert len(amt_snippets) >= 1
        snippet = amt_snippets[0]
        assert snippet.text_snippet == expected_snippet
        assert text[snippet.start_char : snippet.end_char] == expected_snippet


def test_amount_extraction_excludes_phone_numbers_and_dates() -> None:
    """Verify that 10-digit phone numbers, times, and dates are not extracted as amounts."""
    text = "Pay Rs 8500 to powerhelp@upi for your electricity bill before 5 PM. Call 9876543210 on 23/11/2026."
    intent = extract_payment_intent(text)

    assert intent.amount == 8500.0
    assert intent.currency == "INR"
    assert intent.amount_status == ExtractionStatus.FOUND

    amt_snippets = [s for s in intent.evidence_snippets if s.field == "amount"]
    assert len(amt_snippets) == 1
    assert amt_snippets[0].text_snippet == "Rs 8500"
    assert "9876543210" not in amt_snippets[0].text_snippet
    assert "5 PM" not in amt_snippets[0].text_snippet
