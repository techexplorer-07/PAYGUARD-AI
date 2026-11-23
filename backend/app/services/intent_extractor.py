"""Context Intelligence component for deterministic payment intent extraction."""

import re
from typing import Dict, List, Optional, Tuple
from app.schemas.correlation import EvidenceSnippet, ExtractedPaymentIntent, ExtractionStatus

# Currency symbol and code mapping to standard ISO-4217 codes
CURRENCY_MAP: Dict[str, str] = {
    "₹": "INR",
    "rs": "INR",
    "rs.": "INR",
    "rupee": "INR",
    "rupees": "INR",
    "inr": "INR",
    "$": "USD",
    "usd": "USD",
    "dollar": "USD",
    "dollars": "USD",
    "€": "EUR",
    "eur": "EUR",
    "euro": "EUR",
    "euros": "EUR",
    "£": "GBP",
    "gbp": "GBP",
    "pound": "GBP",
    "pounds": "GBP",
    "cad": "CAD",
    "aud": "AUD",
}

# Regex pattern for currency prefix followed by amount
# e.g., ₹ 8,500 | Rs. 8,500 | INR 8500 | USD 8,500 | $8500 | €500 | £250 | Rs 85,000 | Rs 850
AMOUNT_PREFIX_PATTERN = re.compile(
    r"(?P<prefix>₹|\$|€|£|\b(?:rs\.?|inr|usd|eur|gbp|cad|aud))\s*(?P<amt>(?:\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?))(?!\d)",
    re.IGNORECASE,
)

# Regex pattern for amount followed by currency suffix
# e.g., 8500 INR | 8,500 rupees | 5000 rs | 8500 USD | 500 dollars | 85,000 rs
AMOUNT_SUFFIX_PATTERN = re.compile(
    r"\b(?P<amt>(?:\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?))\s*(?P<suffix>inr|rupees?|rs\.?|₹|usd|dollars?|\$|eur|euros?|€|gbp|pounds?|£|cad|aud)(?![a-zA-Z0-9])",
    re.IGNORECASE,
)

# UPI Virtual Private Address (VPA) pattern: username@handle (e.g. powerhelp@upi, merchant@okaxis)
UPI_PATTERN = re.compile(
    r"\b(?P<upi>[a-zA-Z0-9.\-_]{2,64}@[a-zA-Z]{2,32})\b",
    re.IGNORECASE,
)

# Negation patterns preceding a recipient handle (e.g. "do not send to x@upi")
NEGATION_PREFIX_PATTERNS = [
    re.compile(
        r"(?:do\s+not|don'?t|never|not\s+to|avoid|instead\s+of|rather\s+than|no\s+longer|beware\s+of)\s+(?:(?:pay|send|transfer|use|remit|deposit)\s+)?(?:to\s+)?\s*$",
        re.IGNORECASE,
    ),
]

# Negation patterns following a recipient handle (e.g. "x@upi is fake / fraud")
NEGATION_SUFFIX_PATTERNS = [
    re.compile(
        r"^\s*(?:is\s+(?:fake|fraud|invalid|scam|compromised|blocked|not\s+valid)|should\s+not\s+be\s+used)",
        re.IGNORECASE,
    ),
]

# Total / primary payment indicator words
TOTAL_INDICATORS = [
    re.compile(r"\b(?:total|payable|net|final|sum|aggregate|amount\s+to\s+pay|pay\s+total)\b", re.IGNORECASE),
]

# Common payment purpose / context keywords
PURPOSE_KEYWORDS = [
    ("electricity", "Electricity / Utility Bill"),
    ("power", "Electricity / Utility Bill"),
    ("bill", "Utility / Service Bill"),
    ("invoice", "Invoice Settlement"),
    ("recharge", "Mobile / DTH Recharge"),
    ("fine", "Penalty / Challan Payment"),
    ("challan", "Traffic / Municipal Challan"),
    ("tax", "Tax Obligation"),
    ("loan", "Loan Repayment / EMI"),
    ("emi", "Loan Repayment / EMI"),
    ("refund", "Refund Processing"),
    ("subscription", "Subscription Fee"),
    ("fee", "Administrative / Service Fee"),
    ("lottery", "Prize / Lottery Claim"),
    ("prize", "Prize / Lottery Claim"),
    ("courier", "Courier / Delivery Fee"),
    ("customs", "Customs Clearance Fee"),
]

# Psychological urgency indicators
URGENCY_KEYWORDS = [
    r"\bimmediate(?:ly)?\b",
    r"\burgent(?:ly)?\b",
    r"\btoday\b",
    r"\bnow\b",
    r"\bright now\b",
    r"\bat once\b",
    r"\blast chance\b",
    r"\bexpir(?:e|ing|es|ed)\b",
    r"\bdeadline\b",
    r"\bwithin \d+ (?:hours?|hrs?|mins?|minutes?)\b",
    r"\bhurry\b",
    r"\bquick(?:ly)?\b",
]

# High-coercion and threat indicators
THREAT_KEYWORDS = [
    r"\bdisconnect(?:ed|ion|s)?\b",
    r"\bdisrupt(?:ed|ion|s)?\b",
    r"\bsuspend(?:ed|sion|s)?\b",
    r"\bblock(?:ed|ing|s)?\b",
    r"\bfreez(?:e|ing|ed|es)\b",
    r"\blegal action\b",
    r"\bpolice\b",
    r"\barrest(?:ed)?\b",
    r"\bcourt\b",
    r"\bpenalt(?:y|ies)\b",
    r"\bwarrant\b",
    r"\bpower cut\b",
    r"\baccount lock(?:ed)?\b",
]


def normalize_amount_str(amt_str: str) -> float:
    """Strip comma formatting and convert to float."""
    clean_amt = amt_str.replace(",", "").strip()
    return float(clean_amt)


def normalize_recipient_id(recipient: str) -> str:
    """Normalize a payment identifier to lowercase stripped string."""
    return recipient.strip().lower()


def normalize_currency_str(curr_raw: str) -> str:
    """Normalize currency symbols and textual names to ISO code."""
    clean = curr_raw.strip().lower()
    return CURRENCY_MAP.get(clean, clean.upper())


def _extract_amounts_and_currency(
    text: str,
) -> Tuple[Optional[float], Optional[str], ExtractionStatus, List[EvidenceSnippet]]:
    """Scan text for all amount candidates and handle multiple/ambiguous amounts."""
    evidence: List[EvidenceSnippet] = []
    candidates: List[Tuple[float, str, int, int, str]] = []  # (amount, currency, start, end, full_match)

    # Prefix matches
    for m in AMOUNT_PREFIX_PATTERN.finditer(text):
        amt_val = normalize_amount_str(m.group("amt"))
        curr_val = normalize_currency_str(m.group("prefix"))
        candidates.append((amt_val, curr_val, m.start(), m.end(), m.group(0)))

    # Suffix matches (avoid duplicates if prefix pattern already covered it)
    for m in AMOUNT_SUFFIX_PATTERN.finditer(text):
        m_start = m.start()
        m_end = m.end()
        # Check overlap with existing candidates
        overlap = any(
            (c[2] <= m_start < c[3]) or (c[2] < m_end <= c[3])
            for c in candidates
        )
        if not overlap:
            amt_val = normalize_amount_str(m.group("amt"))
            curr_val = normalize_currency_str(m.group("suffix"))
            candidates.append((amt_val, curr_val, m_start, m_end, m.group(0)))

    if not candidates:
        return None, None, ExtractionStatus.NOT_FOUND, evidence

    # Record all found amounts as evidence snippets
    for amt_val, curr_val, start, end, snippet in candidates:
        evidence.append(
            EvidenceSnippet(
                field="amount",
                extracted_value=f"{curr_val} {amt_val}",
                text_snippet=snippet,
                start_char=start,
                end_char=end,
                status=ExtractionStatus.FOUND,
            )
        )

    # Check for distinct amounts
    unique_amounts = list({c[0] for c in candidates})

    if len(unique_amounts) == 1:
        # All occurrences refer to the exact same amount
        chosen = candidates[0]
        return chosen[0], chosen[1], ExtractionStatus.FOUND, evidence

    # Multiple distinct amounts found (e.g. ₹5,000 bill and ₹500 fee)
    # Check if one of them is clearly designated as the total/payable amount
    total_candidates = []
    for c in candidates:
        # Check preceding 40 characters for 'total', 'payable', etc.
        prefix_window = text[max(0, c[2] - 40) : c[2]]
        if any(p.search(prefix_window) for p in TOTAL_INDICATORS):
            total_candidates.append(c)

    if len(total_candidates) == 1:
        chosen = total_candidates[0]
        return chosen[0], chosen[1], ExtractionStatus.FOUND, evidence

    # Ambiguous amounts: return UNCERTAIN to prevent picking the first arbitrarily
    for ev in evidence:
        if ev.field == "amount":
            ev.status = ExtractionStatus.UNCERTAIN

    return None, None, ExtractionStatus.UNCERTAIN, evidence


def _is_negated_recipient(text: str, start: int, end: int) -> bool:
    """Check if a recipient handle is in a negated context (e.g. 'do not send to x@upi')."""
    # Check preceding characters up to 50 chars before the handle
    prefix_window = text[max(0, start - 50) : start]
    for neg_pat in NEGATION_PREFIX_PATTERNS:
        if neg_pat.search(prefix_window):
            return True

    # Check trailing characters up to 30 chars immediately following the handle
    suffix_window = text[end : min(len(text), end + 30)]
    for neg_pat in NEGATION_SUFFIX_PATTERNS:
        if neg_pat.search(suffix_window):
            return True

    return False


def _extract_recipients(
    text: str,
) -> Tuple[Optional[str], ExtractionStatus, List[EvidenceSnippet]]:
    """Scan text for UPI VPAs and handle multiple/negated recipients."""
    evidence: List[EvidenceSnippet] = []
    matches = list(UPI_PATTERN.finditer(text))

    if not matches:
        return None, ExtractionStatus.NOT_FOUND, evidence

    # Group matches by normalized handle
    handles_info: Dict[str, List[Tuple[int, int, str, bool]]] = {}
    for m in matches:
        raw_upi = m.group("upi")
        norm_upi = normalize_recipient_id(raw_upi)
        negated = _is_negated_recipient(text, m.start(), m.end())
        handles_info.setdefault(norm_upi, []).append((m.start(), m.end(), raw_upi, negated))

    # Add evidence for all detected handles
    for norm_upi, occs in handles_info.items():
        for start, end, raw_upi, negated in occs:
            evidence.append(
                EvidenceSnippet(
                    field="recipient_id",
                    extracted_value=norm_upi if not negated else f"EXCLUDED:{norm_upi}",
                    text_snippet=raw_upi,
                    start_char=start,
                    end_char=end,
                    status=ExtractionStatus.FOUND if not negated else ExtractionStatus.UNCERTAIN,
                )
            )

    # Separate affirmative vs negated unique handles
    affirmative_handles = [
        norm for norm, occs in handles_info.items()
        if any(not neg for _, _, _, neg in occs)
    ]

    if len(affirmative_handles) == 1:
        # Exactly one affirmative handle! (Even if there were other negated handles or repeats)
        return affirmative_handles[0], ExtractionStatus.FOUND, evidence

    if len(affirmative_handles) == 0:
        # All mentioned handles were negated/excluded
        return None, ExtractionStatus.UNCERTAIN, evidence

    # Multiple affirmative handles without disambiguation -> UNCERTAIN
    for ev in evidence:
        if ev.field == "recipient_id":
            ev.status = ExtractionStatus.UNCERTAIN

    return None, ExtractionStatus.UNCERTAIN, evidence


def extract_payment_intent(communication_text: str) -> ExtractedPaymentIntent:
    """Deterministic extraction of payment parameters and psychological cues from communication text.

    Args:
        communication_text: Customer-authorized message or transcript snippet.

    Returns:
        ExtractedPaymentIntent: Extracted amount, currency, recipient, purpose, urgency/threat flags,
                                and evidence snippets with provenance offsets.
    """
    evidence: List[EvidenceSnippet] = []

    # 1. Extract Amount and Currency
    amt_val, curr_val, amt_status, amt_evidence = _extract_amounts_and_currency(communication_text)
    evidence.extend(amt_evidence)

    # 2. Extract Recipient Identifier (UPI / VPA)
    recip_val, recip_status, recip_evidence = _extract_recipients(communication_text)
    evidence.extend(recip_evidence)

    # 3. Detect Payment Context / Purpose
    extracted_purpose: Optional[str] = None
    lower_text = communication_text.lower()
    for keyword, purpose_label in PURPOSE_KEYWORDS:
        if keyword in lower_text:
            extracted_purpose = purpose_label
            idx = lower_text.find(keyword)
            evidence.append(
                EvidenceSnippet(
                    field="purpose",
                    extracted_value=purpose_label,
                    text_snippet=communication_text[idx : idx + len(keyword)],
                    start_char=idx,
                    end_char=idx + len(keyword),
                    status=ExtractionStatus.FOUND,
                )
            )
            break

    # 4. Detect Urgency Indicators
    urgency_detected = False
    for pattern_str in URGENCY_KEYWORDS:
        urg_match = re.search(pattern_str, communication_text, re.IGNORECASE)
        if urg_match:
            urgency_detected = True
            evidence.append(
                EvidenceSnippet(
                    field="urgency",
                    extracted_value="urgency_indicator",
                    text_snippet=urg_match.group(0),
                    start_char=urg_match.start(),
                    end_char=urg_match.end(),
                    status=ExtractionStatus.FOUND,
                )
            )

    # 5. Detect Coercion / Threat Indicators
    threat_detected = False
    for pattern_str in THREAT_KEYWORDS:
        threat_match = re.search(pattern_str, communication_text, re.IGNORECASE)
        if threat_match:
            threat_detected = True
            evidence.append(
                EvidenceSnippet(
                    field="threat",
                    extracted_value="threat_indicator",
                    text_snippet=threat_match.group(0),
                    start_char=threat_match.start(),
                    end_char=threat_match.end(),
                    status=ExtractionStatus.FOUND,
                )
            )

    return ExtractedPaymentIntent(
        amount=amt_val,
        amount_status=amt_status,
        currency=curr_val,
        recipient_id=recip_val,
        recipient_status=recip_status,
        purpose=extracted_purpose,
        urgency_detected=urgency_detected,
        threat_detected=threat_detected,
        evidence_snippets=evidence,
    )
