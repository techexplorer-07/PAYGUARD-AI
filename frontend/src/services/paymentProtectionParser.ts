/**
 * Runtime validation for Payment Protection responses.
 *
 * The UI never trusts the shape of network data. `parsePaymentProtectionResponse`
 * returns a typed response only when every field the results page relies on
 * has the expected type; otherwise it returns null and the caller shows an
 * "unexpected response" state rather than rendering partial or guessed data.
 */
import type {
  BehaviouralAssessment,
  EngineSignalSummary,
  EvidenceSnippet,
  IntentAssessment,
  InterventionRecommendation,
  PaymentProtectionResponse,
  RecipientAssessment,
  RecipientEvidenceItem,
  UnifiedEvidenceItem,
  UnifiedRiskAssessment,
} from '../types/paymentProtection';

import {
  hasFields,
  isArrayOf,
  isBoolean,
  isDecimal,
  isNullable,
  isNumber,
  isRecord,
  isRecordOf,
  isString,
  isStringArray,
} from './guards';

const isEvidenceSnippet = (v: unknown): v is EvidenceSnippet =>
  hasFields(v, {
    field: isString,
    extracted_value: isNullable(isString),
    text_snippet: isString,
    start_char: isNullable(isNumber),
    end_char: isNullable(isNumber),
    status: isString,
  });

const isIntentAssessment = (v: unknown): v is IntentAssessment =>
  hasFields(v, {
    extracted_intent: (e) =>
      hasFields(e, {
        amount: isNullable(isNumber),
        amount_status: isString,
        currency: isNullable(isString),
        recipient_id: isNullable(isString),
        recipient_status: isString,
        purpose: isNullable(isString),
        urgency_detected: isBoolean,
        threat_detected: isBoolean,
        evidence_snippets: isArrayOf(isEvidenceSnippet),
      }),
    comparison: (c) =>
      hasFields(c, {
        amount_status: isString,
        amount_difference: isNullable(isNumber),
        currency_status: isString,
        recipient_status: isString,
        normalized_requested_currency: isNullable(isString),
        normalized_transaction_currency: isString,
        normalized_requested_recipient: isNullable(isString),
        normalized_transaction_recipient: isString,
        summary: isString,
      }),
    risk_assessment: (r) =>
      hasFields(r, {
        risk_level: isString,
        heuristic_score: isNumber,
        reasons: isStringArray,
        signals_detected: isStringArray,
        recommended_action: isString,
      }),
  });

const isBehaviouralAssessment = (v: unknown): v is BehaviouralAssessment =>
  hasFields(v, {
    assessment_id: isString,
    anomaly_score: isDecimal,
    risk_level: isString,
    detected_indicators: isStringArray,
    feature_contributions: isRecordOf(isDecimal),
    explanation: isStringArray,
    data_sufficiency: isString,
  });

export const isRecipientEvidenceItem = (v: unknown): v is RecipientEvidenceItem =>
  hasFields(v, {
    edge_id: isString,
    source_reference: isString,
    evidence_status: isString,
    relationship_type: isString,
    observed_at: isString,
    path: isNullable(isStringArray),
    description: isString,
  });

export const isRecipientAssessment = (v: unknown): v is RecipientAssessment =>
  hasFields(v, {
    assessment_id: isString,
    recipient_id: isString,
    recipient_risk_score: isDecimal,
    risk_level: isString,
    data_sufficiency: isString,
    detected_indicators: isStringArray,
    explanation: isString,
    supporting_evidence: isArrayOf(isRecipientEvidenceItem),
    assessment_limitations: isStringArray,
  });

const isUnifiedEvidenceItem = (v: unknown): v is UnifiedEvidenceItem =>
  hasFields(v, {
    engine_source: isString,
    evidence_id: isString,
    epistemic_status: isString,
    source_reference: isString,
    description: isString,
  });

const isEngineSignalSummary = (v: unknown): v is EngineSignalSummary =>
  isRecord(v) && (v.status === undefined || isString(v.status));

const isUnifiedRiskAssessment = (v: unknown): v is UnifiedRiskAssessment =>
  hasFields(v, {
    unified_assessment_id: isString,
    overall_risk_score: isDecimal,
    risk_level: isString,
    engine_signal_summary: isRecordOf(isEngineSignalSummary),
    detected_indicators: isStringArray,
    feature_contributions: isRecordOf(isNumber),
    supporting_evidence: isArrayOf(isUnifiedEvidenceItem),
    explanation: isString,
    missing_evidence: isStringArray,
    conflicting_signals: isStringArray,
    data_sufficiency: isString,
    recommended_action: isString,
    assessment_timestamp: isString,
  });

const isInterventionRecommendation = (v: unknown): v is InterventionRecommendation =>
  hasFields(v, {
    action: isString,
    severity: isString,
    intervention_type: isString,
    simulated_action_code: isString,
    user_guidance_message: isString,
    rationale: isStringArray,
    simulated_intervention_active: isBoolean,
    disclaimer: isString,
  });

export function parsePaymentProtectionResponse(value: unknown): PaymentProtectionResponse | null {
  const valid = hasFields(value, {
    evaluation_id: isString,
    timestamp: isString,
    transaction_id: isString,
    recipient_id: isString,
    customer_consent: isBoolean,
    intent_assessment: isNullable(isIntentAssessment),
    behavioural_assessment: isNullable(isBehaviouralAssessment),
    recipient_assessment: isNullable(isRecipientAssessment),
    unified_risk_assessment: isUnifiedRiskAssessment,
    intervention_recommendation: isInterventionRecommendation,
    disclaimer: isString,
  });
  if (!valid) return null;
  const response = value as unknown as PaymentProtectionResponse;
  return {
    ...response,
    intent_assessment: response.intent_assessment ?? null,
    behavioural_assessment: response.behavioural_assessment ?? null,
    recipient_assessment: response.recipient_assessment ?? null,
  };
}
