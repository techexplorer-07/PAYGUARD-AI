/**
 * Types mirroring the backend Payment Protection contract.
 *
 * Source of truth (owned by the backend team, read-only for the frontend):
 *   POST /api/v1/payment-protection/evaluate
 *   backend/app/schemas/payment_protection.py
 *   backend/app/schemas/correlation.py (SimulatedTransaction)
 *
 * Only the fields the frontend sends or currently reads are typed precisely.
 * Engine-level assessment objects are kept as `unknown` until the results
 * view (Module 3) types and consumes them.
 */

/** backend SimulatedTransaction */
export interface SimulatedTransaction {
  /** Must be greater than 0. */
  amount: number;
  /** Three-letter ISO 4217 code matching ^[A-Z]{3}$. */
  currency: string;
  /** 3–120 characters, e.g. a UPI ID. */
  recipient_id: string;
  transaction_reference?: string | null;
}

/**
 * backend PaymentProtectionRequest — the subset the customer form sends.
 * Optional server-side fields (customer_id, historical_transactions, graph_id,
 * payment_method, as_of) are omitted so the backend applies its own defaults.
 */
export interface PaymentProtectionRequest {
  customer_consent: boolean;
  communication_text: string | null;
  simulated_transaction: SimulatedTransaction;
}

/** backend InterventionRecommendation */
export interface InterventionRecommendation {
  action: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNCERTAIN';
  intervention_type: string;
  simulated_action_code: string;
  user_guidance_message: string;
  rationale: string[];
  simulated_intervention_active: boolean;
  disclaimer: string;
}

/** backend PaymentProtectionResponse */
export interface PaymentProtectionResponse {
  evaluation_id: string;
  /** ISO 8601 timestamp. */
  timestamp: string;
  transaction_id: string;
  customer_id: string;
  recipient_id: string;
  customer_consent: boolean;
  intent_assessment: unknown;
  behavioural_assessment: unknown;
  recipient_assessment: unknown;
  unified_risk_assessment: unknown;
  intervention_recommendation: InterventionRecommendation;
  summary_narrative: string;
  disclaimer: string;
}

/** Router state handed from the analysis form to the results route. */
export interface AnalysisResultLocationState {
  assessment: PaymentProtectionResponse;
}

/** FastAPI request-validation error item (HTTP 422). */
export interface ApiValidationIssue {
  loc: (string | number)[];
  msg: string;
  type: string;
}
