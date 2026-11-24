/**
 * Types mirroring the backend Payment Protection contract.
 *
 * Source of truth (owned by the backend team, read-only for the frontend):
 *   POST /api/v1/payment-protection/evaluate
 *   backend/app/schemas/payment_protection.py  (request, response, intervention)
 *   backend/app/schemas/correlation.py         (intent assessment)
 *   backend/app/schemas/behavioural.py         (behavioural assessment)
 *   backend/app/schemas/recipient.py           (recipient assessment, evidence)
 *   backend/app/schemas/unified_risk.py        (unified assessment)
 *
 * Enum-like fields are typed as `string` where the UI must tolerate values it
 * does not recognise; presentation adapters map known values and fall back
 * safely for anything else. Pydantic `Decimal` fields serialise as strings.
 */

/** Pydantic Decimal values arrive as JSON strings (e.g. "0.95"); floats as numbers. */
export type DecimalValue = string | number;

// ---------------------------------------------------------------------------
// Request
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Intent-to-Payment Correlation (correlation.py)
// ---------------------------------------------------------------------------

/** FOUND | NOT_FOUND | UNCERTAIN */
export type ExtractionStatus = string;
/** MATCH | MISMATCH | NOT_FOUND | UNCERTAIN */
export type ComparisonStatus = string;

export interface EvidenceSnippet {
  field: string;
  extracted_value: string | null;
  text_snippet: string;
  start_char: number | null;
  end_char: number | null;
  status: ExtractionStatus;
}

export interface ExtractedPaymentIntent {
  amount: number | null;
  amount_status: ExtractionStatus;
  currency: string | null;
  recipient_id: string | null;
  recipient_status: ExtractionStatus;
  purpose: string | null;
  urgency_detected: boolean;
  threat_detected: boolean;
  evidence_snippets: EvidenceSnippet[];
}

export interface IntentPaymentComparison {
  amount_status: ComparisonStatus;
  amount_difference: number | null;
  currency_status: ComparisonStatus;
  recipient_status: ComparisonStatus;
  normalized_requested_currency: string | null;
  normalized_transaction_currency: string;
  normalized_requested_recipient: string | null;
  normalized_transaction_recipient: string;
  summary: string;
}

export interface IntentRiskAssessment {
  /** LOW | MEDIUM | HIGH | UNCERTAIN */
  risk_level: string;
  /** Prototype heuristic score in [0, 1]; not a calibrated probability. */
  heuristic_score: number;
  score_type: string;
  reasons: string[];
  signals_detected: string[];
  recommended_action: string;
}

/** backend CorrelationResponse */
export interface IntentAssessment {
  status: string;
  consent_verified: boolean;
  extracted_intent: ExtractedPaymentIntent;
  comparison: IntentPaymentComparison;
  risk_assessment: IntentRiskAssessment;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Behavioural anomaly (behavioural.py)
// ---------------------------------------------------------------------------

/** backend BehaviouralRiskAssessment */
export interface BehaviouralAssessment {
  assessment_id: string;
  customer_id: string;
  transaction_id: string | null;
  /** Heuristic anomaly score in [0, 1]. */
  anomaly_score: DecimalValue;
  /** LOW | MEDIUM | HIGH | UNCERTAIN */
  risk_level: string;
  detected_indicators: string[];
  feature_contributions: Record<string, DecimalValue>;
  explanation: string[];
  /** INSUFFICIENT | MINIMAL | SUFFICIENT */
  data_sufficiency: string;
  model_type: string;
  assessment_timestamp: string;
}

// ---------------------------------------------------------------------------
// Recipient risk intelligence (recipient.py)
// ---------------------------------------------------------------------------

/** VERIFIED | REPORTED | INFERRED */
export type EvidenceProvenance = string;

/** backend SupportingEvidenceItem */
export interface RecipientEvidenceItem {
  edge_id: string;
  source_reference: string;
  evidence_status: EvidenceProvenance;
  relationship_type: string;
  observed_at: string;
  source_node_id: string;
  target_node_id: string;
  path: string[] | null;
  description: string;
}

/** backend RecipientRiskAssessment */
export interface RecipientAssessment {
  assessment_id: string;
  recipient_id: string;
  graph_id: string;
  assessment_timestamp: string;
  recipient_risk_score: DecimalValue;
  /** LOW | MEDIUM | HIGH | UNCERTAIN */
  risk_level: string;
  /** INSUFFICIENT | LIMITED | ADEQUATE */
  data_sufficiency: string;
  detected_indicators: string[];
  feature_contributions: Record<string, number>;
  explanation: string;
  supporting_evidence: RecipientEvidenceItem[];
  assessment_limitations: string[];
  recommended_action: string;
  model_type: string;
}

// ---------------------------------------------------------------------------
// Unified assessment (unified_risk.py)
// ---------------------------------------------------------------------------

/** backend UnifiedEvidenceItem */
export interface UnifiedEvidenceItem {
  /** INTENT | BEHAVIOURAL | RECIPIENT */
  engine_source: string;
  evidence_id: string;
  /** VERIFIED | REPORTED | INFERRED | EXTRACTED | STATISTICAL */
  epistemic_status: string;
  source_reference: string;
  description: string;
}

/** One entry of engine_signal_summary (backend Dict[str, Any]; shape per unified_risk_assessor.py). */
export interface EngineSignalSummary {
  /** EVALUATED | NOT_EVALUATED */
  status?: string;
  /** Engine tier, or UNAVAILABLE when not evaluated. */
  risk_level?: string;
  heuristic_score?: number | null;
  anomaly_score?: number | null;
  recipient_risk_score?: number | null;
  data_sufficiency?: string;
  indicators?: string[];
  notes?: string;
}

/** backend UnifiedRiskAssessment */
export interface UnifiedRiskAssessment {
  unified_assessment_id: string;
  transaction_id: string;
  customer_id: string;
  recipient_id: string;
  /** Provisional heuristic severity in [0, 1]; explicitly NOT a fraud probability. */
  overall_risk_score: DecimalValue;
  /** LOW | MEDIUM | HIGH | UNCERTAIN */
  risk_level: string;
  contributing_assessments: Record<string, string | null>;
  engine_signal_summary: Record<string, EngineSignalSummary>;
  detected_indicators: string[];
  feature_contributions: Record<string, number>;
  supporting_evidence: UnifiedEvidenceItem[];
  explanation: string;
  missing_evidence: string[];
  conflicting_signals: string[];
  /** INSUFFICIENT | LIMITED | ADEQUATE */
  data_sufficiency: string;
  /** ALLOW_WITH_CAUTION | WARN_CUSTOMER | STEP_UP_VERIFICATION | PAUSE_AND_VERIFY | MANUAL_REVIEW | INSUFFICIENT_DATA_REVIEW */
  recommended_action: string;
  policy_version: string;
  model_type: string;
  assessment_timestamp: string;
}

// ---------------------------------------------------------------------------
// Orchestrator response (payment_protection.py)
// ---------------------------------------------------------------------------

/** backend InterventionRecommendation */
export interface InterventionRecommendation {
  action: string;
  /** LOW | MEDIUM | HIGH | UNCERTAIN */
  severity: string;
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
  intent_assessment: IntentAssessment | null;
  behavioural_assessment: BehaviouralAssessment | null;
  recipient_assessment: RecipientAssessment | null;
  unified_risk_assessment: UnifiedRiskAssessment;
  intervention_recommendation: InterventionRecommendation;
  summary_narrative: string;
  disclaimer: string;
}

/** FastAPI request-validation error item (HTTP 422). */
export interface ApiValidationIssue {
  loc: (string | number)[];
  msg: string;
  type: string;
}
