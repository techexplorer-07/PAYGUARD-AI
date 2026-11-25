# PAYGUARD AI — FINAL MVP INTEGRATION & ORCHESTRATION ARCHITECTURE

## End-to-End Payment Protection Pipeline & Simulated Intervention Engine

---

## 1. Executive Architecture Overview

PAYGUARD AI completes its hackathon MVP integration by connecting five core components into an end-to-end payment evaluation pipeline:

1. **Intent-to-Payment Correlation Engine (Phase 2.1)**: Validates explicit customer consent, extracts payment instructions from suspicious communication text, and detects destination or amount divergence.
2. **Customer Behavioural Anomaly Scorer (Phase 2.2)**: Extracts financial baseline features (amount MAD deviation, transaction velocity, circular time-of-day, beneficiary novelty) and computes deterministic anomaly scores.
3. **Recipient Risk Intelligence Engine (Phase 2.3)**: Queries the Scam-to-Payment Evidence Graph (SPEG) to identify multi-hop associations, reported user complaints, and verified judicial/police fraud records.
4. **Unified Risk Assessment Engine (Phase 2.4)**: Performs dynamic multi-engine weighted fusion with policy overrides (intent divergence, verified fraud records, new beneficiary guardrails, inferred guilt-by-association limits).
5. **Simulated Intervention Recommendation Engine (Phase 2.5 / Final MVP)**: Maps the unified risk tier to actionable operational guidance and simulated transaction controls.

```
+-----------------------------------------------------------------------------------------+
|                  PAYGUARD AI: COMPLETE PAYMENT EVALUATION PIPELINE                      |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|   POST /api/v1/payment-protection/evaluate                                              |
|                                                                                         |
|   [1. Ingestion & Consent Gate]                                                         |
|         |                                                                               |
|         +--> Strict Consent Check (Customer consent required for text analysis)          |
|                                                                                         |
|   [2. In-Memory Direct Multi-Engine Execution]                                          |
|         |                                                                               |
|         +---> Engine 1: Intent Extraction & Payment Correlation (Weight: 0.40)          |
|         |                                                                               |
|         +---> Engine 2: Behavioural Feature Extraction & Scoring (Weight: 0.30)          |
|         |                                                                               |
|         +---> Engine 3: Recipient Relationship Analysis & Scorer (Weight: 0.30)         |
|                                                                                         |
|   [3. Unified Risk Assessment Synthesis]                                                |
|         |                                                                               |
|         +---> Dynamic Re-weighting for missing intelligence streams                      |
|         +---> Policy Invariant Overrides (Intent Diversion / Verified Fraud Records)     |
|         +---> Guardrails (New Beneficiary Cap / Inferred Links Cap)                     |
|                                                                                         |
|   [4. Simulated Intervention Policy Engine]                                             |
|         |                                                                               |
|         +---> ALLOW_WITH_CAUTION      -> PERMIT (Standard monitoring)                   |
|         +---> WARN_CUSTOMER           -> DISPLAY_WARNING (Contextual friction)          |
|         +---> STEP_UP_VERIFICATION    -> CHALLENGE_BIOMETRIC (Secondary step-up)       |
|         +---> PAUSE_AND_VERIFY        -> PAUSE_HOLD_SIMULATION (Out-of-band check)      |
|         +---> MANUAL_REVIEW           -> ROUTE_TO_ANALYST (Fraud investigation desk)    |
|         +---> INSUFFICIENT_DATA_REVIEW-> PROMPT_MANUAL_CONFIRMATION (Self-verify)       |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
```

---

## 2. API Specification

### Endpoint: `POST /api/v1/payment-protection/evaluate`
Mounted in [main.py](file:///c:/Users/SUDHARSAN/Desktop/PAYGAURD%20AI/backend/app/main.py) and routed via [payment_protection.py](file:///c:/Users/SUDHARSAN/Desktop/PAYGAURD%20AI/backend/app/api/routes/payment_protection.py).

### 2.1 Request Schema (`PaymentProtectionRequest`)
Defined in [payment_protection.py](file:///c:/Users/SUDHARSAN/Desktop/PAYGAURD%20AI/backend/app/schemas/payment_protection.py).

| Field | Type | Required | Description |
|:---|:---|:---|:---|
| `customer_consent` | `bool` | Yes | Explicit consent to analyze communication text. Must be `true` if text is provided. |
| `communication_text` | `string` | Optional | Suspicious message, email, SMS, or WhatsApp instruction text ($\le 5000$ chars). |
| `simulated_transaction` | `object` | Yes | Simulated transaction parameters (`amount`, `currency`, `recipient_id`, `transaction_reference`). |
| `customer_id` | `string` | Optional | Identifier of the customer initiating transfer (defaults to `"CUST-DEFAULT"`). |
| `recipient_id` | `string` | Optional | Target recipient handle (defaults to `simulated_transaction.recipient_id`). |
| `historical_transactions`| `array` | Optional | List of customer historical transactions for baseline behavioral modeling. |
| `payment_method` | `string` | Optional | Payment rail used (e.g. `"UPI"`, `"CARD"`, `"NETBANKING"`; defaults to `"UPI"`). |
| `graph_id` | `string` | Optional | Specific SPEG graph instance in memory to query for recipient intelligence. |
| `as_of` | `datetime` | Optional | Timezone-aware reference timestamp for temporal calculations. |

#### Request Example
```json
{
  "customer_consent": true,
  "communication_text": "Please transfer Rs 1200 for electricity bill to powercorp@billdesk immediately.",
  "simulated_transaction": {
    "amount": 1200.0,
    "currency": "INR",
    "recipient_id": "scam_collector@attacker",
    "transaction_reference": "TX-EVAL-8821"
  },
  "customer_id": "CUST-9921",
  "historical_transactions": [
    {
      "transaction_id": "HIST-001",
      "customer_id": "CUST-9921",
      "amount": "1200.00",
      "currency": "INR",
      "beneficiary_id": "powercorp@billdesk",
      "payment_method": "UPI",
      "transaction_timestamp": "2026-11-20T10:00:00Z"
    }
  ]
}
```

### 2.2 Response Schema (`PaymentProtectionResponse`)

| Field | Type | Description |
|:---|:---|:---|
| `evaluation_id` | `string` | Unique evaluation identifier (`PPE-XXXXXXXXXXXX`). |
| `timestamp` | `datetime` | Timezone-aware execution completion timestamp. |
| `transaction_id` | `string` | Transaction reference evaluated. |
| `customer_id` | `string` | Evaluated customer identifier. |
| `recipient_id` | `string` | Evaluated destination beneficiary. |
| `customer_consent` | `bool` | Whether explicit customer consent was granted. |
| `intent_assessment` | `object` \| `null` | Original assessment from Intent Correlation Engine (Phase 2.1). |
| `behavioural_assessment` | `object` \| `null` | Original assessment from Customer Behavioural Scorer (Phase 2.2). |
| `recipient_assessment` | `object` \| `null` | Original assessment from SPEG Recipient Scorer (Phase 2.3). |
| `unified_risk_assessment`| `object` | Synthesized multi-engine score, indicators, and evidence (Phase 2.4). |
| `intervention_recommendation` | `object` | Structured, actionable simulated intervention recommendation. |
| `summary_narrative` | `string` | Human-readable explanation summarizing the multi-engine findings. |
| `disclaimer` | `string` | Legal and operational prototype simulation notice. |

#### Response Example
```json
{
  "evaluation_id": "PPE-8B7C9D2E1F0A",
  "timestamp": "2026-11-23T14:00:00Z",
  "transaction_id": "TX-EVAL-8821",
  "customer_id": "CUST-9921",
  "recipient_id": "scam_collector@attacker",
  "customer_consent": true,
  "intent_assessment": {
    "status": "success",
    "consent_verified": true,
    "extracted_intent": {
      "amount": 1200.0,
      "amount_status": "FOUND",
      "currency": "INR",
      "recipient_id": "powercorp@billdesk",
      "recipient_status": "FOUND",
      "purpose": "bill",
      "urgency_detected": true,
      "threat_detected": false
    },
    "comparison": {
      "recipient_status": "MISMATCH",
      "amount_status": "MATCH",
      "currency_status": "MATCH",
      "summary": "Recipient ID in communication (powercorp@billdesk) does not match simulated transaction recipient (scam_collector@attacker)."
    },
    "risk_assessment": {
      "risk_level": "HIGH",
      "heuristic_score": 0.85,
      "reasons": ["Extracted recipient 'powercorp@billdesk' does not match transaction recipient 'scam_collector@attacker'."],
      "recommended_action": "PAUSE_AND_VERIFY_CALLER"
    }
  },
  "behavioural_assessment": {
    "assessment_id": "BAS-3A9B2C1D",
    "anomaly_score": "0.2500",
    "risk_level": "LOW",
    "data_sufficiency": "MINIMAL",
    "detected_indicators": ["NEW_BENEFICIARY"]
  },
  "recipient_assessment": null,
  "unified_risk_assessment": {
    "unified_assessment_id": "URA-7E9D1C2A3B4F",
    "overall_risk_score": "0.7500",
    "risk_level": "HIGH",
    "detected_indicators": [
      "BEHAVIOURAL_NEW_BENEFICIARY",
      "DESTINATION_INTENT_DIVERGENCE_OVERRIDE",
      "INTENT_DESTINATION_MISMATCH"
    ],
    "conflicting_signals": [
      "Intent-Behavioural Contradiction: Payer historical activity pattern is normal, but current payment details diverge from extracted customer communication instructions."
    ],
    "data_sufficiency": "LIMITED",
    "recommended_action": "PAUSE_AND_VERIFY"
  },
  "intervention_recommendation": {
    "action": "PAUSE_AND_VERIFY",
    "severity": "HIGH",
    "intervention_type": "SIMULATED_PAYMENT_HOLD",
    "simulated_action_code": "PAUSE_HOLD_SIMULATION",
    "user_guidance_message": "Critical Alert: Significant fraud indicators detected (destination diversion, extreme velocity spike, or payment mismatch). Payment authorization is paused for out-of-band verification.",
    "rationale": [
      "Intent-Behavioural Contradiction: Payer historical activity pattern is normal, but current payment details diverge from extracted customer communication instructions."
    ],
    "simulated_intervention_active": true,
    "disclaimer": "Simulated intervention only. No live banking, UPI blocking, or payment gateway interception is executed."
  },
  "summary_narrative": "PAYGUARD AI evaluated transaction 'TX-EVAL-8821' for customer 'CUST-9921' transferring to 'scam_collector@attacker'. Synthesized composite risk score: 0.7500 (HIGH). Recommended operational action: PAUSE_AND_VERIFY (SIMULATED_PAYMENT_HOLD). Critical Alert: Significant fraud indicators detected (destination diversion, extreme velocity spike, or payment mismatch). Payment authorization is paused for out-of-band verification.",
  "disclaimer": "PAYGUARD AI prototype simulation only. Payment intervention is simulated; no live banking or UPI transaction control is executed."
}
```

---

## 3. The Five Synthetic Benchmark Scenarios

The orchestration service was benchmarked across five end-to-end scenarios implemented in [test_payment_protection_e2e.py](file:///c:/Users/SUDHARSAN/Desktop/PAYGAURD%20AI/backend/tests/test_payment_protection_e2e.py):

| Scenario | Inputs & Context | Multi-Engine Finding | Synthesized Score & Tier | Recommended Action & Simulation Code |
|:---|:---|:---|:---|:---|
| **Scenario A: Ordinary Payment** | Matching communication (₹500), established grocery beneficiary, 10 normal baseline transactions. | All 3 engines report `MATCH` or `LOW` risk. | Score: `0.0350`<br>`LOW` | `ALLOW_WITH_CAUTION`<br>Code: `PERMIT` |
| **Scenario B: Recipient Diversion** | Communication requests bill payment to `powercorp@billdesk`, simulated transaction uses `scam_collector@attacker`. | Intent detects `MISMATCH`. Invariant A enforces destination divergence floor. | Score: `0.7500`<br>`HIGH` | `PAUSE_AND_VERIFY`<br>Code: `PAUSE_HOLD_SIMULATION` |
| **Scenario C: Behavioural Anomaly** | Payer history median is ₹200; current transaction attempts ₹50,000 to first-time beneficiary. | Baseline anomaly $\ge 0.7000$ + new beneficiary. Invariant E enforces elevation. | Score: `0.6714`<br>`MEDIUM` | `STEP_UP_VERIFICATION` / `WARN_CUSTOMER`<br>Code: `CHALLENGE_BIOMETRIC` |
| **Scenario D: Suspicious Recipient** | Beneficiary `mule_drop@paytm` has multiple distinct `REPORTED` complaint edges in SPEG graph. | Recipient scorer identifies active scam reports. Supporting graph edges preserved. | Score: `0.4786`<br>`MEDIUM` | `WARN_CUSTOMER`<br>Code: `DISPLAY_WARNING` |
| **Scenario E: Insufficient Evidence** | Cold-start customer (no history), unobserved recipient (no SPEG record), no communication text. | All available engines report `INSUFFICIENT` data. Streams explicitly listed in `missing_evidence`. | Score: `0.0000`<br>`UNCERTAIN` | `INSUFFICIENT_DATA_REVIEW`<br>Code: `PROMPT_MANUAL_CONFIRMATION` |

---

## 4. Intervention Decision Policy Rules

| Unified Action | Severity | Operational Intervention Type | Simulation Action Code | Trigger Rules & Invariants |
|:---|:---|:---|:---|:---|
| `ALLOW_WITH_CAUTION` | `LOW` | `TRANSACTION_PERMITTED` | `PERMIT` | Overall score $< 0.3000$. Matching intent, normal baseline, benign beneficiary. |
| `WARN_CUSTOMER` | `MEDIUM` | `CONTEXTUAL_WARNING` | `DISPLAY_WARNING` | $0.3000 \le S < 0.7000$ driven by moderate intent divergence or unconfirmed reported complaints. |
| `STEP_UP_VERIFICATION` | `MEDIUM` | `STEP_UP_VERIFICATION` | `CHALLENGE_BIOMETRIC` | $0.3000 \le S < 0.7000$ driven by first-time beneficiary transfers or baseline amount deviations. |
| `PAUSE_AND_VERIFY` | `HIGH` | `SIMULATED_PAYMENT_HOLD` | `PAUSE_HOLD_SIMULATION` | Overall score $\ge 0.7000$ triggered by Invariant A (intent mismatch) or acute velocity surges. |
| `MANUAL_REVIEW` | `HIGH` | `FRAUD_ANALYST_QUEUE` | `ROUTE_TO_ANALYST` | Overall score $\ge 0.8500$ triggered by Invariant B (verified judicial/police fraud records on beneficiary). |
| `INSUFFICIENT_DATA_REVIEW` | `UNCERTAIN` | `FALLBACK_CONFIRMATION` | `PROMPT_MANUAL_CONFIRMATION` | Data depth insufficient across all engines. Missing history prevents deterministic scoring. |

---

## 5. Security, Epistemic & Performance Guarantees

1. **Mandatory Explicit Consent**:
   - Customer consent is strictly validated. Submitting `communication_text` with `customer_consent=False` is rejected immediately with HTTP 400 Bad Request.
2. **Zero In-Memory Communication Logging**:
   - Communication text is never printed to application logs. The orchestrator records only diagnostic metadata (text length, customer ID, recipient ID, transaction ID).
3. **Trust Boundary Hardening**:
   - The public SPEG intake endpoint strictly rejects any edge with `VERIFIED` status. Only authorized internal compliance fixtures or judicial ingestion pipelines can promote evidence to `VERIFIED`.
4. **Performance & Algorithm Isolation**:
   - No cross-service HTTP calls. Services are invoked as pure Python in-memory functions.
   - The experimental Isolation Forest service (Phase 2.2.4) is **not** loaded or trained on API calls. Primary behavioural scoring relies exclusively on the deterministic $O(N)$ MAD median scorer.
5. **No Groundless Safety Assertions**:
   - Low risk scores indicate an absence of observed anomalies in submitted data, not guaranteed immunity from fraud.
   - Missing data streams are explicitly listed under `missing_evidence` and never treated as evidence of safety.

---

## 6. Frontend Integration Guidelines

The React/Vite frontend communicates with the orchestration endpoint via standard JSON POST requests.

### 6.1 Sample Frontend Fetch Call
```typescript
import { useState } from 'react';

interface PaymentEvaluationPayload {
  customer_consent: boolean;
  communication_text?: string;
  simulated_transaction: {
    amount: number;
    currency: string;
    recipient_id: string;
    transaction_reference?: string;
  };
  customer_id?: string;
}

export async function evaluatePaymentProtection(payload: PaymentEvaluationPayload) {
  const response = await fetch('http://localhost:8000/api/v1/payment-protection/evaluate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Evaluation request failed');
  }

  return await response.json();
}
```

### 6.2 Handling Intervention Actions in the UI
```typescript
function handlePaymentIntervention(intervention: any) {
  switch (intervention.action) {
    case 'ALLOW_WITH_CAUTION':
      // Allow user to proceed with normal PIN/biometric authorization
      showProceedConfirmation();
      break;

    case 'WARN_CUSTOMER':
      // Display prominent yellow caution banner with the guidance message
      showWarningModal({
        title: 'Recipient Notice',
        message: intervention.user_guidance_message,
        rationale: intervention.rationale,
      });
      break;

    case 'STEP_UP_VERIFICATION':
      // Trigger additional biometric or 2FA challenge modal
      triggerBiometricPrompt();
      break;

    case 'PAUSE_AND_VERIFY':
      // Show simulated temporary payment hold dialog
      showSecurityHoldModal({
        title: 'Transaction Paused for Verification',
        message: intervention.user_guidance_message,
        rationale: intervention.rationale,
      });
      break;

    case 'MANUAL_REVIEW':
      // Present formal routing notice to user
      showManualReviewNotice({
        message: 'This transfer has been flagged for compliance review. Transfer halted.',
      });
      break;

    case 'INSUFFICIENT_DATA_REVIEW':
      // Ask user to manually confirm they personally know the beneficiary
      showManualConfirmationCheckbox();
      break;
  }
}
```

---

## 7. Verification Test Summary

```powershell
.\backend\venv\Scripts\python.exe -m pytest -vv -s "backend/tests/" -o faulthandler_timeout=30
```
- **Total Backend Tests Collected**: **168**
- **Passed**: **168** (100%)
- **Failed**: **0**
- **Warnings**: 7 (non-blocking Starlette deprecations)
- **Execution Time**: 15.32 seconds
- **Frontend Verification**: `npm --prefix frontend run lint; npm --prefix frontend run build` exited with code 0 (`vite v8.3.8` built 21 modules in 332ms).
