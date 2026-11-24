/**
 * DEMO ASSESSMENTS — ILLUSTRATIVE ONLY.
 *
 * Each response below was produced by running the backend PAYGUARD engines
 * offline on synthetic sample inputs (sample UPI IDs, sample payment history and
 * a sample evidence graph). They are not real customers, payments or live
 * model predictions, and are only reachable from the clearly labelled demo
 * routes. They are never used as a fallback for failed API requests.
 *
 * Responses pass through the same runtime parser as live API data.
 */
import type { SubmittedTransaction } from '../types/assessment';

export type DemoScenarioId = 'high' | 'medium' | 'low' | 'insufficient';

export interface DemoScenario {
  id: DemoScenarioId;
  title: string;
  description: string;
  submitted: SubmittedTransaction;
  /** Raw backend-shaped response; validated by parsePaymentProtectionResponse before use. */
  response: unknown;
}

export const demoScenarioIds: DemoScenarioId[] = ['high',  'medium',  'low',  'insufficient'];

export function isDemoScenarioId(value: string | undefined): value is DemoScenarioId {
  return value !== undefined && (demoScenarioIds as string[]).includes(value);
}

export const demoScenarios: Record<DemoScenarioId, DemoScenario> = {
  high: {
    id: 'high',
    title: "High risk",
    description: "Urgent disconnection threat, with the payment redirected to a recipient that has verified, reported and inferred evidence.",
    submitted: {"amount": 8500, "currency": "INR", "recipientId": "sample-refund-desk@ybl"},
    response: {
      "evaluation_id": "PPE-B4F811616839",
      "timestamp": "2026-11-23T14:00:00Z",
      "transaction_id": "TX-EAC391BB",
      "customer_id": "CUST-DEMO",
      "recipient_id": "sample-refund-desk@ybl",
      "customer_consent": true,
      "intent_assessment": {
        "status": "success",
        "consent_verified": true,
        "extracted_intent": {
          "amount": 8500.0,
          "amount_status": "FOUND",
          "currency": "INR",
          "recipient_id": "sample-power-bill@okaxis",
          "recipient_status": "FOUND",
          "purpose": "Electricity / Utility Bill",
          "urgency_detected": true,
          "threat_detected": true,
          "evidence_snippets": [
            {
              "field": "amount",
              "extracted_value": "INR 8500.0",
              "text_snippet": "Rs 8,500",
              "start_char": 70,
              "end_char": 78,
              "status": "FOUND"
            },
            {
              "field": "recipient_id",
              "extracted_value": "sample-power-bill@okaxis",
              "text_snippet": "sample-power-bill@okaxis",
              "start_char": 94,
              "end_char": 118,
              "status": "FOUND"
            },
            {
              "field": "purpose",
              "extracted_value": "Electricity / Utility Bill",
              "text_snippet": "electricity",
              "start_char": 13,
              "end_char": 24,
              "status": "FOUND"
            },
            {
              "field": "urgency",
              "extracted_value": "urgency_indicator",
              "text_snippet": "immediately",
              "start_char": 79,
              "end_char": 90,
              "status": "FOUND"
            },
            {
              "field": "urgency",
              "extracted_value": "urgency_indicator",
              "text_snippet": "URGENT",
              "start_char": 0,
              "end_char": 6,
              "status": "FOUND"
            },
            {
              "field": "threat",
              "extracted_value": "threat_indicator",
              "text_snippet": "disconnected",
              "start_char": 33,
              "end_char": 45,
              "status": "FOUND"
            }
          ]
        },
        "comparison": {
          "amount_status": "MATCH",
          "amount_difference": 0.0,
          "currency_status": "MATCH",
          "recipient_status": "MISMATCH",
          "normalized_requested_currency": "INR",
          "normalized_transaction_currency": "INR",
          "normalized_requested_recipient": "sample-power-bill@okaxis",
          "normalized_transaction_recipient": "sample-refund-desk@ybl",
          "summary": "Amount matches requested instruction (INR 8,500.00). RECIPIENT DIVERSION WARNING: Transaction is directed to 'sample-refund-desk@ybl', but message requested payment to 'sample-power-bill@okaxis'."
        },
        "risk_assessment": {
          "risk_level": "HIGH",
          "heuristic_score": 0.93,
          "score_type": "prototype_heuristic_score (deterministic rule-based, non-ML)",
          "reasons": [
            "RECIPIENT DIVERSION: Communication requested payment to 'sample-power-bill@okaxis', but simulated transaction is directed to 'sample-refund-desk@ybl'.",
            "Classic scam indicator: Amount (INR 8,500.00) matches request, but the destination account was diverted.",
            "Aggravating factor: Threat or coercion language detected (e.g. service cutoff or legal action)."
          ],
          "signals_detected": [
            "URGENCY_LANGUAGE_DETECTED",
            "COERCIVE_THREAT_LANGUAGE_DETECTED",
            "CONTEXT_PURPOSE_ELECTRICITY___UTILITY_BILL",
            "RECIPIENT_MISMATCH",
            "AMOUNT_MATCH_WITH_RECIPIENT_DIVERSION"
          ],
          "recommended_action": "VERIFY_RECIPIENT_IDENTITY"
        },
        "timestamp": "2026-11-23T14:00:00+00:00"
      },
      "behavioural_assessment": {
        "assessment_id": "ASM-EF42926035C9",
        "customer_id": "CUST-DEMO",
        "transaction_id": "TX-EAC391BB",
        "anomaly_score": "0.7000",
        "risk_level": "HIGH",
        "detected_indicators": [
          "EXTREME_AMOUNT_DEVIATION",
          "NEW_BENEFICIARY",
          "COMPOUND_NOVEL_BENEFICIARY_AMOUNT_SPIKE"
        ],
        "feature_contributions": {
          "amount_deviation": "0.3500",
          "beneficiary_novelty": "0.2500",
          "velocity_surge": "0.0000",
          "payment_method_novelty": "0.0000",
          "time_deviation": "0.0000",
          "compound_synergy": "0.1000"
        },
        "explanation": [
          "HIGH BEHAVIOURAL ANOMALY: Severe divergence from historical profile detected across critical dimensions (e.g. novel beneficiary paired with extreme amount deviation or velocity acceleration).",
          "Extreme statistical amount outlier: robust z-score of +163.79 (median: 1215, MAD: 30 INR).",
          "First-time beneficiary: 'sample-refund-desk@ybl' has not appeared in prior transaction history. (Note: Novel beneficiary alone does not trigger high risk without supporting anomalies).",
          "Transaction velocity conforms to normal pacing.",
          "Payment method 'UPI' is known and previously utilized.",
          "Time of day (14:00 UTC) conforms to known customer activity corridors (shortest distance: 0 mins).",
          "Compound behavioural risk: High transaction amount deviation directed to an unprecedented beneficiary."
        ],
        "data_sufficiency": "SUFFICIENT",
        "model_type": "deterministic_heuristic_anomaly_scorer (provisional v1)",
        "assessment_timestamp": "2026-11-24T14:11:42.141130Z"
      },
      "recipient_assessment": {
        "assessment_id": "RRA-E385E15DB4A6",
        "recipient_id": "sample-refund-desk@ybl",
        "graph_id": "SPEG-DEMO-HIGH",
        "assessment_timestamp": "2026-11-23T14:00:00Z",
        "recipient_risk_score": "1.0",
        "risk_level": "HIGH",
        "data_sufficiency": "ADEQUATE",
        "detected_indicators": [
          "VERIFIED_FRAUD_CASE_ASSOCIATION (1 case(s))",
          "REPORTED_FRAUD_ALLEGATIONS (1 report(s) across 1 distinct source(s))",
          "INFERRED_SHARED_IDENTIFIERS (1 shared identifier(s))"
        ],
        "feature_contributions": {
          "verified_fraud_case_association": 0.85,
          "reported_fraud_case_association": 0.25,
          "inferred_shared_identifier_relationships": 0.12,
          "transaction_volume_context": 0.0
        },
        "explanation": "Recipient 'sample-refund-desk@ybl' evaluated under model 'PROVISIONAL_DETERMINISTIC_RECIPIENT_SCORER_V1' with score 1.0 (HIGH). Strong signal: Directly linked to 1 VERIFIED fraud case filing(s) (+0.85). Reported allegations: Linked to 1 distinct reported source reference(s) with recent (3d ago) recency (+0.25). Inferred associations: Associated with 1 shared identifier node(s) (+0.12). Inferred associations reflect network co-occurrence and alone cannot produce HIGH risk.",
        "supporting_evidence": [
          {
            "edge_id": "E-DEMO-H1",
            "source_reference": "SAMPLE_BANK_INVESTIGATION_301",
            "evidence_status": "VERIFIED",
            "relationship_type": "REPORTED_IN_CASE",
            "observed_at": "2026-11-16T14:00:00Z",
            "source_node_id": "sample-refund-desk@ybl",
            "target_node_id": "SAMPLE-CASE-301",
            "path": [
              "sample-refund-desk@ybl",
              "SAMPLE-CASE-301"
            ],
            "description": "Sample bank-confirmed case of utility impersonation. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-DEMO-H1]"
          },
          {
            "edge_id": "E-DEMO-H2",
            "source_reference": "SAMPLE_USER_COMPLAINT_302",
            "evidence_status": "REPORTED",
            "relationship_type": "REPORTED_IN_CASE",
            "observed_at": "2026-11-20T14:00:00Z",
            "source_node_id": "sample-refund-desk@ybl",
            "target_node_id": "SAMPLE-CASE-302",
            "path": [
              "sample-refund-desk@ybl",
              "SAMPLE-CASE-302"
            ],
            "description": "Sample customer report of a disconnection threat call."
          },
          {
            "edge_id": "E-DEMO-H3",
            "source_reference": "SAMPLE_GRAPH_LINK_11",
            "evidence_status": "INFERRED",
            "relationship_type": "SHARES_IDENTIFIER",
            "observed_at": "2026-11-11T14:00:00Z",
            "source_node_id": "sample-refund-desk@ybl",
            "target_node_id": "SAMPLE-PHONE-11",
            "path": [
              "sample-refund-desk@ybl",
              "SAMPLE-PHONE-11"
            ],
            "description": "Sample phone identifier shared with another beneficiary."
          },
          {
            "edge_id": "PATH-sample-refund-desk@ybl-SAMPLE-PHONE-11-sample-mule@okicici",
            "source_reference": "SAMPLE_GRAPH_LINK_11",
            "evidence_status": "INFERRED",
            "relationship_type": "SHARES_IDENTIFIER",
            "observed_at": "2026-11-11T14:00:00Z",
            "source_node_id": "sample-refund-desk@ybl",
            "target_node_id": "sample-mule@okicici",
            "path": [
              "sample-refund-desk@ybl",
              "SAMPLE-PHONE-11",
              "sample-mule@okicici"
            ],
            "description": "Beneficiary 'sample-refund-desk@ybl' shares identifier node 'SAMPLE-PHONE-11' with beneficiary 'sample-mule@okicici'. (Inferred association, does not prove common ownership)."
          }
        ],
        "assessment_limitations": [
          "This assessment is a provisional deterministic heuristic score and does not represent a calibrated statistical fraud probability.",
          "A LOW risk level indicates an absence of concerning signals in available SPEG data, not a guarantee that the recipient is benign.",
          "Shared identifier links reflect topological co-occurrence (e.g. shared hardware, network, or communication rail) and must not be treated as common legal or beneficial account ownership.",
          "REPORTED claims represent unadjudicated customer or external allegations; only formal VERIFIED cases indicate external institutional corroboration.",
          "In this prototype, VERIFIED evidence reflects controlled internal assertions and not live banking or law enforcement data feeds."
        ],
        "recommended_action": "REVIEW_PAYMENT",
        "model_type": "PROVISIONAL_DETERMINISTIC_RECIPIENT_SCORER_V1"
      },
      "unified_risk_assessment": {
        "unified_assessment_id": "URA-95707C6AD8E0",
        "transaction_id": "TX-EAC391BB",
        "customer_id": "CUST-DEMO",
        "recipient_id": "sample-refund-desk@ybl",
        "overall_risk_score": "0.882",
        "risk_level": "HIGH",
        "contributing_assessments": {
          "intent_correlation": "INTENT-2026-11-23T14:00:00+00:00",
          "behavioural_risk": "ASM-EF42926035C9",
          "recipient_intelligence": "RRA-E385E15DB4A6"
        },
        "engine_signal_summary": {
          "intent_correlation": {
            "status": "EVALUATED",
            "risk_level": "HIGH",
            "heuristic_score": 0.93,
            "score_type": "prototype_heuristic_score (deterministic rule-based, non-ML)",
            "indicators": [
              "URGENCY_LANGUAGE_DETECTED",
              "COERCIVE_THREAT_LANGUAGE_DETECTED",
              "CONTEXT_PURPOSE_ELECTRICITY___UTILITY_BILL",
              "RECIPIENT_MISMATCH",
              "AMOUNT_MATCH_WITH_RECIPIENT_DIVERSION"
            ]
          },
          "behavioural_risk": {
            "status": "EVALUATED",
            "risk_level": "HIGH",
            "anomaly_score": 0.7,
            "data_sufficiency": "SUFFICIENT",
            "indicators": [
              "EXTREME_AMOUNT_DEVIATION",
              "NEW_BENEFICIARY",
              "COMPOUND_NOVEL_BENEFICIARY_AMOUNT_SPIKE"
            ]
          },
          "recipient_intelligence": {
            "status": "EVALUATED",
            "risk_level": "HIGH",
            "recipient_risk_score": 1.0,
            "data_sufficiency": "ADEQUATE",
            "indicators": [
              "VERIFIED_FRAUD_CASE_ASSOCIATION (1 case(s))",
              "REPORTED_FRAUD_ALLEGATIONS (1 report(s) across 1 distinct source(s))",
              "INFERRED_SHARED_IDENTIFIERS (1 shared identifier(s))"
            ]
          }
        },
        "detected_indicators": [
          "BEHAVIOURAL_COMPOUND_NOVEL_BENEFICIARY_AMOUNT_SPIKE",
          "BEHAVIOURAL_EXTREME_AMOUNT_DEVIATION",
          "BEHAVIOURAL_NEW_BENEFICIARY",
          "DESTINATION_INTENT_DIVERGENCE_OVERRIDE",
          "INTENT_AMOUNT_MATCH_WITH_RECIPIENT_DIVERSION",
          "INTENT_COERCIVE_THREAT_LANGUAGE_DETECTED",
          "INTENT_CONTEXT_PURPOSE_ELECTRICITY___UTILITY_BILL",
          "INTENT_RECIPIENT_MISMATCH",
          "INTENT_URGENCY_LANGUAGE_DETECTED",
          "RECIPIENT_INFERRED_SHARED_IDENTIFIERS (1 shared identifier(s))",
          "RECIPIENT_REPORTED_FRAUD_ALLEGATIONS (1 report(s) across 1 distinct source(s))",
          "RECIPIENT_VERIFIED_FRAUD_CASE_ASSOCIATION (1 case(s))",
          "REPORTED_RECIPIENT_FRAUD_ELEVATION",
          "VERIFIED_RECIPIENT_FRAUD_CASE_OVERRIDE"
        ],
        "feature_contributions": {
          "intent": 0.372,
          "behavioural": 0.21,
          "recipient": 0.3
        },
        "supporting_evidence": [
          {
            "engine_source": "INTENT",
            "evidence_id": "SNIPPET-0",
            "epistemic_status": "EXTRACTED",
            "source_reference": "COMMUNICATION_AMOUNT",
            "description": "Extracted amount: 'Rs 8,500' (FOUND)"
          },
          {
            "engine_source": "INTENT",
            "evidence_id": "SNIPPET-1",
            "epistemic_status": "EXTRACTED",
            "source_reference": "COMMUNICATION_RECIPIENT_ID",
            "description": "Extracted recipient_id: 'sample-power-bill@okaxis' (FOUND)"
          },
          {
            "engine_source": "INTENT",
            "evidence_id": "SNIPPET-2",
            "epistemic_status": "EXTRACTED",
            "source_reference": "COMMUNICATION_PURPOSE",
            "description": "Extracted purpose: 'electricity' (FOUND)"
          },
          {
            "engine_source": "INTENT",
            "evidence_id": "SNIPPET-3",
            "epistemic_status": "EXTRACTED",
            "source_reference": "COMMUNICATION_URGENCY",
            "description": "Extracted urgency: 'immediately' (FOUND)"
          },
          {
            "engine_source": "INTENT",
            "evidence_id": "SNIPPET-4",
            "epistemic_status": "EXTRACTED",
            "source_reference": "COMMUNICATION_URGENCY",
            "description": "Extracted urgency: 'URGENT' (FOUND)"
          },
          {
            "engine_source": "INTENT",
            "evidence_id": "SNIPPET-5",
            "epistemic_status": "EXTRACTED",
            "source_reference": "COMMUNICATION_THREAT",
            "description": "Extracted threat: 'disconnected' (FOUND)"
          },
          {
            "engine_source": "BEHAVIOURAL",
            "evidence_id": "FEAT-amount_deviation",
            "epistemic_status": "STATISTICAL",
            "source_reference": "CUSTOMER_BASELINE_AMOUNT_DEVIATION",
            "description": "Behavioural signal amount_deviation: contribution 0.3500"
          },
          {
            "engine_source": "BEHAVIOURAL",
            "evidence_id": "FEAT-beneficiary_novelty",
            "epistemic_status": "STATISTICAL",
            "source_reference": "CUSTOMER_BASELINE_BENEFICIARY_NOVELTY",
            "description": "Behavioural signal beneficiary_novelty: contribution 0.2500"
          },
          {
            "engine_source": "BEHAVIOURAL",
            "evidence_id": "FEAT-velocity_surge",
            "epistemic_status": "STATISTICAL",
            "source_reference": "CUSTOMER_BASELINE_VELOCITY_SURGE",
            "description": "Behavioural signal velocity_surge: contribution 0.0000"
          },
          {
            "engine_source": "BEHAVIOURAL",
            "evidence_id": "FEAT-payment_method_novelty",
            "epistemic_status": "STATISTICAL",
            "source_reference": "CUSTOMER_BASELINE_PAYMENT_METHOD_NOVELTY",
            "description": "Behavioural signal payment_method_novelty: contribution 0.0000"
          },
          {
            "engine_source": "BEHAVIOURAL",
            "evidence_id": "FEAT-time_deviation",
            "epistemic_status": "STATISTICAL",
            "source_reference": "CUSTOMER_BASELINE_TIME_DEVIATION",
            "description": "Behavioural signal time_deviation: contribution 0.0000"
          },
          {
            "engine_source": "BEHAVIOURAL",
            "evidence_id": "FEAT-compound_synergy",
            "epistemic_status": "STATISTICAL",
            "source_reference": "CUSTOMER_BASELINE_COMPOUND_SYNERGY",
            "description": "Behavioural signal compound_synergy: contribution 0.1000"
          },
          {
            "engine_source": "RECIPIENT",
            "evidence_id": "E-DEMO-H1",
            "epistemic_status": "VERIFIED",
            "source_reference": "SAMPLE_BANK_INVESTIGATION_301",
            "description": "REPORTED_IN_CASE: Sample bank-confirmed case of utility impersonation. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-DEMO-H1]"
          },
          {
            "engine_source": "RECIPIENT",
            "evidence_id": "E-DEMO-H2",
            "epistemic_status": "REPORTED",
            "source_reference": "SAMPLE_USER_COMPLAINT_302",
            "description": "REPORTED_IN_CASE: Sample customer report of a disconnection threat call."
          },
          {
            "engine_source": "RECIPIENT",
            "evidence_id": "E-DEMO-H3",
            "epistemic_status": "INFERRED",
            "source_reference": "SAMPLE_GRAPH_LINK_11",
            "description": "SHARES_IDENTIFIER: Sample phone identifier shared with another beneficiary."
          },
          {
            "engine_source": "RECIPIENT",
            "evidence_id": "PATH-sample-refund-desk@ybl-SAMPLE-PHONE-11-sample-mule@okicici",
            "epistemic_status": "INFERRED",
            "source_reference": "SAMPLE_GRAPH_LINK_11",
            "description": "SHARES_IDENTIFIER: Beneficiary 'sample-refund-desk@ybl' shares identifier node 'SAMPLE-PHONE-11' with beneficiary 'sample-mule@okicici'. (Inferred association, does not prove common ownership)."
          }
        ],
        "explanation": "Unified transaction evaluation for customer 'CUST-DEMO' paying 'sample-refund-desk@ybl' produced composite risk score 0.882 (HIGH) under policy 'PAYGUARD_UNIFIED_POLICY_V1'. Critical Intent Alert: Communication intent analysis identified payment destination diversion or amount contradiction; intent override applied. Critical Recipient Alert: Beneficiary has direct associations with VERIFIED fraud case filings; verified evidence override applied. Behavioural Anomaly: Evaluated with risk tier HIGH (anomaly score 0.7000, sufficiency SUFFICIENT).",
        "missing_evidence": [],
        "conflicting_signals": [],
        "data_sufficiency": "ADEQUATE",
        "recommended_action": "PAUSE_AND_VERIFY",
        "policy_version": "PAYGUARD_UNIFIED_POLICY_V1",
        "model_type": "PROVISIONAL_DETERMINISTIC_MULTI_ENGINE_FUSION_V1",
        "assessment_timestamp": "2026-11-23T14:00:00Z"
      },
      "intervention_recommendation": {
        "action": "PAUSE_AND_VERIFY",
        "severity": "HIGH",
        "intervention_type": "SIMULATED_PAYMENT_HOLD",
        "simulated_action_code": "PAUSE_HOLD_SIMULATION",
        "user_guidance_message": "PAYGUARD detected that the communication requested payment to sample-power-bill@okaxis, while the simulated transaction targets sample-refund-desk@ybl. We recommend pausing and independently verifying the recipient before proceeding. This is a simulation; no actual bank or UPI payment has been paused.",
        "rationale": [
          "Destination Diversion: Communication requested 'sample-power-bill@okaxis', but simulated transaction targets 'sample-refund-desk@ybl'."
        ],
        "simulated_intervention_active": true,
        "disclaimer": "Simulated intervention only. No live banking, UPI blocking, or payment gateway interception is executed."
      },
      "summary_narrative": "PAYGUARD AI evaluated transaction 'TX-EAC391BB' for customer 'CUST-DEMO' transferring to 'sample-refund-desk@ybl'. Synthesized composite risk score: 0.882 (HIGH). Recommended operational action: PAUSE_AND_VERIFY (SIMULATED_PAYMENT_HOLD). PAYGUARD detected that the communication requested payment to sample-power-bill@okaxis, while the simulated transaction targets sample-refund-desk@ybl. We recommend pausing and independently verifying the recipient before proceeding. This is a simulation; no actual bank or UPI payment has been paused.",
      "disclaimer": "PAYGUARD AI prototype simulation only. Payment intervention is simulated; no live banking or UPI transaction control is executed."
    },
  },
  medium: {
    id: 'medium',
    title: "Medium risk",
    description: "Advance payment to a new seller, unusually large for this customer, with an unconfirmed complaint on record.",
    submitted: {"amount": 6500, "currency": "INR", "recipientId": "sample-new-seller@ybl"},
    response: {
      "evaluation_id": "PPE-ECFE08E0BEEF",
      "timestamp": "2026-11-23T14:00:00Z",
      "transaction_id": "TX-87652DBD",
      "customer_id": "CUST-DEMO",
      "recipient_id": "sample-new-seller@ybl",
      "customer_consent": true,
      "intent_assessment": {
        "status": "success",
        "consent_verified": true,
        "extracted_intent": {
          "amount": 6500.0,
          "amount_status": "FOUND",
          "currency": "INR",
          "recipient_id": "sample-new-seller@ybl",
          "recipient_status": "FOUND",
          "purpose": null,
          "urgency_detected": true,
          "threat_detected": false,
          "evidence_snippets": [
            {
              "field": "amount",
              "extracted_value": "INR 6500.0",
              "text_snippet": "Rs 6,500",
              "start_char": 50,
              "end_char": 58,
              "status": "FOUND"
            },
            {
              "field": "recipient_id",
              "extracted_value": "sample-new-seller@ybl",
              "text_snippet": "sample-new-seller@ybl",
              "start_char": 62,
              "end_char": 83,
              "status": "FOUND"
            },
            {
              "field": "urgency",
              "extracted_value": "urgency_indicator",
              "text_snippet": "today",
              "start_char": 84,
              "end_char": 89,
              "status": "FOUND"
            }
          ]
        },
        "comparison": {
          "amount_status": "MATCH",
          "amount_difference": 0.0,
          "currency_status": "MATCH",
          "recipient_status": "MATCH",
          "normalized_requested_currency": "INR",
          "normalized_transaction_currency": "INR",
          "normalized_requested_recipient": "sample-new-seller@ybl",
          "normalized_transaction_recipient": "sample-new-seller@ybl",
          "summary": "Amount matches requested instruction (INR 6,500.00). Recipient matches requested beneficiary (sample-new-seller@ybl)."
        },
        "risk_assessment": {
          "risk_level": "LOW",
          "heuristic_score": 0.2,
          "score_type": "prototype_heuristic_score (deterministic rule-based, non-ML)",
          "reasons": [
            "Both requested amount (INR 6,500.00) and recipient ('sample-new-seller@ybl') match the communication instructions.",
            "No payment-instruction mismatch was identified in the available evidence.",
            "DISCLAIMER: A matching request does not establish that the communication or recipient is legitimate, verified safe, or fraud-free. Always remain alert to social engineering."
          ],
          "signals_detected": [
            "URGENCY_LANGUAGE_DETECTED",
            "FULL_INTENT_TRANSACTION_MATCH"
          ],
          "recommended_action": "PROCEED_WITH_STANDARD_VERIFICATION"
        },
        "timestamp": "2026-11-23T14:00:00+00:00"
      },
      "behavioural_assessment": {
        "assessment_id": "ASM-5AE55837F851",
        "customer_id": "CUST-DEMO",
        "transaction_id": "TX-87652DBD",
        "anomaly_score": "0.7000",
        "risk_level": "HIGH",
        "detected_indicators": [
          "EXTREME_AMOUNT_DEVIATION",
          "NEW_BENEFICIARY",
          "COMPOUND_NOVEL_BENEFICIARY_AMOUNT_SPIKE"
        ],
        "feature_contributions": {
          "amount_deviation": "0.3500",
          "beneficiary_novelty": "0.2500",
          "velocity_surge": "0.0000",
          "payment_method_novelty": "0.0000",
          "time_deviation": "0.0000",
          "compound_synergy": "0.1000"
        },
        "explanation": [
          "HIGH BEHAVIOURAL ANOMALY: Severe divergence from historical profile detected across critical dimensions (e.g. novel beneficiary paired with extreme amount deviation or velocity acceleration).",
          "Extreme statistical amount outlier: robust z-score of +72.72 (median: 570, MAD: 55 INR).",
          "First-time beneficiary: 'sample-new-seller@ybl' has not appeared in prior transaction history. (Note: Novel beneficiary alone does not trigger high risk without supporting anomalies).",
          "Transaction velocity conforms to normal pacing.",
          "Payment method 'UPI' is known and previously utilized.",
          "Time of day (14:00 UTC) conforms to known customer activity corridors (shortest distance: 0 mins).",
          "Compound behavioural risk: High transaction amount deviation directed to an unprecedented beneficiary."
        ],
        "data_sufficiency": "SUFFICIENT",
        "model_type": "deterministic_heuristic_anomaly_scorer (provisional v1)",
        "assessment_timestamp": "2026-11-24T14:11:42.139625Z"
      },
      "recipient_assessment": {
        "assessment_id": "RRA-4FAE6F1F95C8",
        "recipient_id": "sample-new-seller@ybl",
        "graph_id": "SPEG-DEMO-MED",
        "assessment_timestamp": "2026-11-23T14:00:00Z",
        "recipient_risk_score": "0.37",
        "risk_level": "MEDIUM",
        "data_sufficiency": "LIMITED",
        "detected_indicators": [
          "REPORTED_FRAUD_ALLEGATIONS (1 report(s) across 1 distinct source(s))",
          "INFERRED_SHARED_IDENTIFIERS (1 shared identifier(s))"
        ],
        "feature_contributions": {
          "verified_fraud_case_association": 0.0,
          "reported_fraud_case_association": 0.25,
          "inferred_shared_identifier_relationships": 0.12,
          "transaction_volume_context": 0.0
        },
        "explanation": "Recipient 'sample-new-seller@ybl' evaluated under model 'PROVISIONAL_DETERMINISTIC_RECIPIENT_SCORER_V1' with score 0.37 (MEDIUM). Reported allegations: Linked to 1 distinct reported source reference(s) with recent (6d ago) recency (+0.25). Inferred associations: Associated with 1 shared identifier node(s) (+0.12). Inferred associations reflect network co-occurrence and alone cannot produce HIGH risk.",
        "supporting_evidence": [
          {
            "edge_id": "E-DEMO-M1",
            "source_reference": "SAMPLE_USER_COMPLAINT_201",
            "evidence_status": "REPORTED",
            "relationship_type": "REPORTED_IN_CASE",
            "observed_at": "2026-11-17T14:00:00Z",
            "source_node_id": "sample-new-seller@ybl",
            "target_node_id": "SAMPLE-CASE-201",
            "path": [
              "sample-new-seller@ybl",
              "SAMPLE-CASE-201"
            ],
            "description": "Sample customer complaint: item not delivered after advance payment."
          },
          {
            "edge_id": "E-DEMO-M2",
            "source_reference": "SAMPLE_GRAPH_LINK_77",
            "evidence_status": "INFERRED",
            "relationship_type": "SHARES_IDENTIFIER",
            "observed_at": "2026-11-13T14:00:00Z",
            "source_node_id": "sample-new-seller@ybl",
            "target_node_id": "SAMPLE-DEVICE-77",
            "path": [
              "sample-new-seller@ybl",
              "SAMPLE-DEVICE-77"
            ],
            "description": "Sample identifier shared with another beneficiary."
          },
          {
            "edge_id": "PATH-sample-new-seller@ybl-SAMPLE-DEVICE-77-sample-other-seller@ybl",
            "source_reference": "SAMPLE_GRAPH_LINK_77",
            "evidence_status": "INFERRED",
            "relationship_type": "SHARES_IDENTIFIER",
            "observed_at": "2026-11-13T14:00:00Z",
            "source_node_id": "sample-new-seller@ybl",
            "target_node_id": "sample-other-seller@ybl",
            "path": [
              "sample-new-seller@ybl",
              "SAMPLE-DEVICE-77",
              "sample-other-seller@ybl"
            ],
            "description": "Beneficiary 'sample-new-seller@ybl' shares identifier node 'SAMPLE-DEVICE-77' with beneficiary 'sample-other-seller@ybl'. (Inferred association, does not prove common ownership)."
          }
        ],
        "assessment_limitations": [
          "This assessment is a provisional deterministic heuristic score and does not represent a calibrated statistical fraud probability.",
          "A LOW risk level indicates an absence of concerning signals in available SPEG data, not a guarantee that the recipient is benign.",
          "Shared identifier links reflect topological co-occurrence (e.g. shared hardware, network, or communication rail) and must not be treated as common legal or beneficial account ownership.",
          "REPORTED claims represent unadjudicated customer or external allegations; only formal VERIFIED cases indicate external institutional corroboration.",
          "In this prototype, VERIFIED evidence reflects controlled internal assertions and not live banking or law enforcement data feeds."
        ],
        "recommended_action": "WARN_CUSTOMER",
        "model_type": "PROVISIONAL_DETERMINISTIC_RECIPIENT_SCORER_V1"
      },
      "unified_risk_assessment": {
        "unified_assessment_id": "URA-B4A601378F19",
        "transaction_id": "TX-87652DBD",
        "customer_id": "CUST-DEMO",
        "recipient_id": "sample-new-seller@ybl",
        "overall_risk_score": "0.401",
        "risk_level": "MEDIUM",
        "contributing_assessments": {
          "intent_correlation": "INTENT-2026-11-23T14:00:00+00:00",
          "behavioural_risk": "ASM-5AE55837F851",
          "recipient_intelligence": "RRA-4FAE6F1F95C8"
        },
        "engine_signal_summary": {
          "intent_correlation": {
            "status": "EVALUATED",
            "risk_level": "LOW",
            "heuristic_score": 0.2,
            "score_type": "prototype_heuristic_score (deterministic rule-based, non-ML)",
            "indicators": [
              "URGENCY_LANGUAGE_DETECTED",
              "FULL_INTENT_TRANSACTION_MATCH"
            ]
          },
          "behavioural_risk": {
            "status": "EVALUATED",
            "risk_level": "HIGH",
            "anomaly_score": 0.7,
            "data_sufficiency": "SUFFICIENT",
            "indicators": [
              "EXTREME_AMOUNT_DEVIATION",
              "NEW_BENEFICIARY",
              "COMPOUND_NOVEL_BENEFICIARY_AMOUNT_SPIKE"
            ]
          },
          "recipient_intelligence": {
            "status": "EVALUATED",
            "risk_level": "MEDIUM",
            "recipient_risk_score": 0.37,
            "data_sufficiency": "LIMITED",
            "indicators": [
              "REPORTED_FRAUD_ALLEGATIONS (1 report(s) across 1 distinct source(s))",
              "INFERRED_SHARED_IDENTIFIERS (1 shared identifier(s))"
            ]
          }
        },
        "detected_indicators": [
          "BEHAVIOURAL_COMPOUND_NOVEL_BENEFICIARY_AMOUNT_SPIKE",
          "BEHAVIOURAL_EXTREME_AMOUNT_DEVIATION",
          "BEHAVIOURAL_NEW_BENEFICIARY",
          "INTENT_FULL_INTENT_TRANSACTION_MATCH",
          "INTENT_URGENCY_LANGUAGE_DETECTED",
          "RECIPIENT_INFERRED_SHARED_IDENTIFIERS (1 shared identifier(s))",
          "RECIPIENT_REPORTED_FRAUD_ALLEGATIONS (1 report(s) across 1 distinct source(s))",
          "REPORTED_RECIPIENT_FRAUD_ELEVATION"
        ],
        "feature_contributions": {
          "intent": 0.08,
          "behavioural": 0.21,
          "recipient": 0.111
        },
        "supporting_evidence": [
          {
            "engine_source": "INTENT",
            "evidence_id": "SNIPPET-0",
            "epistemic_status": "EXTRACTED",
            "source_reference": "COMMUNICATION_AMOUNT",
            "description": "Extracted amount: 'Rs 6,500' (FOUND)"
          },
          {
            "engine_source": "INTENT",
            "evidence_id": "SNIPPET-1",
            "epistemic_status": "EXTRACTED",
            "source_reference": "COMMUNICATION_RECIPIENT_ID",
            "description": "Extracted recipient_id: 'sample-new-seller@ybl' (FOUND)"
          },
          {
            "engine_source": "INTENT",
            "evidence_id": "SNIPPET-2",
            "epistemic_status": "EXTRACTED",
            "source_reference": "COMMUNICATION_URGENCY",
            "description": "Extracted urgency: 'today' (FOUND)"
          },
          {
            "engine_source": "BEHAVIOURAL",
            "evidence_id": "FEAT-amount_deviation",
            "epistemic_status": "STATISTICAL",
            "source_reference": "CUSTOMER_BASELINE_AMOUNT_DEVIATION",
            "description": "Behavioural signal amount_deviation: contribution 0.3500"
          },
          {
            "engine_source": "BEHAVIOURAL",
            "evidence_id": "FEAT-beneficiary_novelty",
            "epistemic_status": "STATISTICAL",
            "source_reference": "CUSTOMER_BASELINE_BENEFICIARY_NOVELTY",
            "description": "Behavioural signal beneficiary_novelty: contribution 0.2500"
          },
          {
            "engine_source": "BEHAVIOURAL",
            "evidence_id": "FEAT-velocity_surge",
            "epistemic_status": "STATISTICAL",
            "source_reference": "CUSTOMER_BASELINE_VELOCITY_SURGE",
            "description": "Behavioural signal velocity_surge: contribution 0.0000"
          },
          {
            "engine_source": "BEHAVIOURAL",
            "evidence_id": "FEAT-payment_method_novelty",
            "epistemic_status": "STATISTICAL",
            "source_reference": "CUSTOMER_BASELINE_PAYMENT_METHOD_NOVELTY",
            "description": "Behavioural signal payment_method_novelty: contribution 0.0000"
          },
          {
            "engine_source": "BEHAVIOURAL",
            "evidence_id": "FEAT-time_deviation",
            "epistemic_status": "STATISTICAL",
            "source_reference": "CUSTOMER_BASELINE_TIME_DEVIATION",
            "description": "Behavioural signal time_deviation: contribution 0.0000"
          },
          {
            "engine_source": "BEHAVIOURAL",
            "evidence_id": "FEAT-compound_synergy",
            "epistemic_status": "STATISTICAL",
            "source_reference": "CUSTOMER_BASELINE_COMPOUND_SYNERGY",
            "description": "Behavioural signal compound_synergy: contribution 0.1000"
          },
          {
            "engine_source": "RECIPIENT",
            "evidence_id": "E-DEMO-M1",
            "epistemic_status": "REPORTED",
            "source_reference": "SAMPLE_USER_COMPLAINT_201",
            "description": "REPORTED_IN_CASE: Sample customer complaint: item not delivered after advance payment."
          },
          {
            "engine_source": "RECIPIENT",
            "evidence_id": "E-DEMO-M2",
            "epistemic_status": "INFERRED",
            "source_reference": "SAMPLE_GRAPH_LINK_77",
            "description": "SHARES_IDENTIFIER: Sample identifier shared with another beneficiary."
          },
          {
            "engine_source": "RECIPIENT",
            "evidence_id": "PATH-sample-new-seller@ybl-SAMPLE-DEVICE-77-sample-other-seller@ybl",
            "epistemic_status": "INFERRED",
            "source_reference": "SAMPLE_GRAPH_LINK_77",
            "description": "SHARES_IDENTIFIER: Beneficiary 'sample-new-seller@ybl' shares identifier node 'SAMPLE-DEVICE-77' with beneficiary 'sample-other-seller@ybl'. (Inferred association, does not prove common ownership)."
          }
        ],
        "explanation": "Unified transaction evaluation for customer 'CUST-DEMO' paying 'sample-new-seller@ybl' produced composite risk score 0.401 (MEDIUM) under policy 'PAYGUARD_UNIFIED_POLICY_V1'. Intent Correlation: Evaluated with risk tier LOW (heuristic score 0.2). Recipient Intelligence: Evaluated with risk tier MEDIUM (score 0.37, sufficiency LIMITED). Behavioural Anomaly: Evaluated with risk tier HIGH (anomaly score 0.7000, sufficiency SUFFICIENT). Conflict Resolution: Behavioural-Intent Contradiction: Customer communication confirms payment intent, but transaction exhibits significant amount or velocity anomalies against baseline.",
        "missing_evidence": [],
        "conflicting_signals": [
          "Behavioural-Intent Contradiction: Customer communication confirms payment intent, but transaction exhibits significant amount or velocity anomalies against baseline."
        ],
        "data_sufficiency": "LIMITED",
        "recommended_action": "WARN_CUSTOMER",
        "policy_version": "PAYGUARD_UNIFIED_POLICY_V1",
        "model_type": "PROVISIONAL_DETERMINISTIC_MULTI_ENGINE_FUSION_V1",
        "assessment_timestamp": "2026-11-23T14:00:00Z"
      },
      "intervention_recommendation": {
        "action": "WARN_CUSTOMER",
        "severity": "MEDIUM",
        "intervention_type": "CONTEXTUAL_WARNING",
        "simulated_action_code": "DISPLAY_WARNING",
        "user_guidance_message": "Caution: The destination recipient has unconfirmed fraud complaints or incident reports in the evidence graph. Please verify recipient authenticity before confirming. This is a simulation; no actual bank or UPI payment has been paused.",
        "rationale": [
          "Recipient Intelligence: Multiple unverified reported allegations exist in the evidence graph."
        ],
        "simulated_intervention_active": true,
        "disclaimer": "Simulated intervention only. No live banking, UPI blocking, or payment gateway interception is executed."
      },
      "summary_narrative": "PAYGUARD AI evaluated transaction 'TX-87652DBD' for customer 'CUST-DEMO' transferring to 'sample-new-seller@ybl'. Synthesized composite risk score: 0.401 (MEDIUM). Recommended operational action: WARN_CUSTOMER (CONTEXTUAL_WARNING). Caution: The destination recipient has unconfirmed fraud complaints or incident reports in the evidence graph. Please verify recipient authenticity before confirming. This is a simulation; no actual bank or UPI payment has been paused.",
      "disclaimer": "PAYGUARD AI prototype simulation only. Payment intervention is simulated; no live banking or UPI transaction control is executed."
    },
  },
  low: {
    id: 'low',
    title: "Low risk",
    description: "Regular rent payment that matches the message and the customer’s payment history.",
    submitted: {"amount": 12000, "currency": "INR", "recipientId": "sample-landlord@okhdfc"},
    response: {
      "evaluation_id": "PPE-1797C7449F6C",
      "timestamp": "2026-11-23T14:00:00Z",
      "transaction_id": "TX-FE032097",
      "customer_id": "CUST-DEMO",
      "recipient_id": "sample-landlord@okhdfc",
      "customer_consent": true,
      "intent_assessment": {
        "status": "success",
        "consent_verified": true,
        "extracted_intent": {
          "amount": 12000.0,
          "amount_status": "FOUND",
          "currency": "INR",
          "recipient_id": "sample-landlord@okhdfc",
          "recipient_status": "FOUND",
          "purpose": null,
          "urgency_detected": false,
          "threat_detected": false,
          "evidence_snippets": [
            {
              "field": "amount",
              "extracted_value": "INR 12000.0",
              "text_snippet": "Rs 12,000",
              "start_char": 25,
              "end_char": 34,
              "status": "FOUND"
            },
            {
              "field": "recipient_id",
              "extracted_value": "sample-landlord@okhdfc",
              "text_snippet": "sample-landlord@okhdfc",
              "start_char": 50,
              "end_char": 72,
              "status": "FOUND"
            }
          ]
        },
        "comparison": {
          "amount_status": "MATCH",
          "amount_difference": 0.0,
          "currency_status": "MATCH",
          "recipient_status": "MATCH",
          "normalized_requested_currency": "INR",
          "normalized_transaction_currency": "INR",
          "normalized_requested_recipient": "sample-landlord@okhdfc",
          "normalized_transaction_recipient": "sample-landlord@okhdfc",
          "summary": "Amount matches requested instruction (INR 12,000.00). Recipient matches requested beneficiary (sample-landlord@okhdfc)."
        },
        "risk_assessment": {
          "risk_level": "LOW",
          "heuristic_score": 0.1,
          "score_type": "prototype_heuristic_score (deterministic rule-based, non-ML)",
          "reasons": [
            "Both requested amount (INR 12,000.00) and recipient ('sample-landlord@okhdfc') match the communication instructions.",
            "No payment-instruction mismatch was identified in the available evidence.",
            "DISCLAIMER: A matching request does not establish that the communication or recipient is legitimate, verified safe, or fraud-free. Always remain alert to social engineering."
          ],
          "signals_detected": [
            "FULL_INTENT_TRANSACTION_MATCH"
          ],
          "recommended_action": "PROCEED_WITH_STANDARD_VERIFICATION"
        },
        "timestamp": "2026-11-23T14:00:00+00:00"
      },
      "behavioural_assessment": {
        "assessment_id": "ASM-8EBED840964A",
        "customer_id": "CUST-DEMO",
        "transaction_id": "TX-FE032097",
        "anomaly_score": "0.0000",
        "risk_level": "LOW",
        "detected_indicators": [],
        "feature_contributions": {
          "amount_deviation": "0.0000",
          "beneficiary_novelty": "0.0000",
          "velocity_surge": "0.0000",
          "payment_method_novelty": "0.0000",
          "time_deviation": "0.0000",
          "compound_synergy": "0.0000"
        },
        "explanation": [
          "LOW BEHAVIOURAL ANOMALY: Transaction parameters broadly conform to established customer baseline. (Note: Low behavioural divergence does not guarantee absence of external scam pressure).",
          "Amount 12000.0 INR matches uniform historical baseline (12000 INR, ratio 1.00x).",
          "Familiar beneficiary: 'sample-landlord@okhdfc' has received 10 prior payments (100.00% of customer history).",
          "Transaction velocity conforms to normal pacing.",
          "Payment method 'UPI' is known and previously utilized.",
          "Time of day (14:00 UTC) conforms to known customer activity corridors (shortest distance: 0 mins)."
        ],
        "data_sufficiency": "SUFFICIENT",
        "model_type": "deterministic_heuristic_anomaly_scorer (provisional v1)",
        "assessment_timestamp": "2026-11-24T14:11:42.139625Z"
      },
      "recipient_assessment": {
        "assessment_id": "RRA-6FBB4C0CE114",
        "recipient_id": "sample-landlord@okhdfc",
        "graph_id": "SPEG-DEMO-LOW",
        "assessment_timestamp": "2026-11-23T14:00:00Z",
        "recipient_risk_score": "0.0",
        "risk_level": "LOW",
        "data_sufficiency": "LIMITED",
        "detected_indicators": [
          "ORDINARY_BENIGN_ACTIVITY"
        ],
        "feature_contributions": {
          "verified_fraud_case_association": 0.0,
          "reported_fraud_case_association": 0.0,
          "inferred_shared_identifier_relationships": 0.0,
          "transaction_volume_context": 0.0
        },
        "explanation": "Recipient 'sample-landlord@okhdfc' evaluated under model 'PROVISIONAL_DETERMINISTIC_RECIPIENT_SCORER_V1' with score 0.0 (LOW). No adverse fraud filings or suspicious network associations were identified in available SPEG data.",
        "supporting_evidence": [
          {
            "edge_id": "E-DEMO-L1",
            "source_reference": "SAMPLE_LEDGER_0001",
            "evidence_status": "VERIFIED",
            "relationship_type": "PAID_TO",
            "observed_at": "2026-11-03T14:00:00Z",
            "source_node_id": "SAMPLE-CUST-A",
            "target_node_id": "sample-landlord@okhdfc",
            "path": [
              "SAMPLE-CUST-A",
              "sample-landlord@okhdfc"
            ],
            "description": "Sample settled rent payment recorded in ledger. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-DEMO-L1]"
          }
        ],
        "assessment_limitations": [
          "This assessment is a provisional deterministic heuristic score and does not represent a calibrated statistical fraud probability.",
          "A LOW risk level indicates an absence of concerning signals in available SPEG data, not a guarantee that the recipient is benign.",
          "Shared identifier links reflect topological co-occurrence (e.g. shared hardware, network, or communication rail) and must not be treated as common legal or beneficial account ownership.",
          "REPORTED claims represent unadjudicated customer or external allegations; only formal VERIFIED cases indicate external institutional corroboration.",
          "In this prototype, VERIFIED evidence reflects controlled internal assertions and not live banking or law enforcement data feeds."
        ],
        "recommended_action": "ALLOW",
        "model_type": "PROVISIONAL_DETERMINISTIC_RECIPIENT_SCORER_V1"
      },
      "unified_risk_assessment": {
        "unified_assessment_id": "URA-5E3819DEC5B4",
        "transaction_id": "TX-FE032097",
        "customer_id": "CUST-DEMO",
        "recipient_id": "sample-landlord@okhdfc",
        "overall_risk_score": "0.04",
        "risk_level": "LOW",
        "contributing_assessments": {
          "intent_correlation": "INTENT-2026-11-23T14:00:00+00:00",
          "behavioural_risk": "ASM-8EBED840964A",
          "recipient_intelligence": "RRA-6FBB4C0CE114"
        },
        "engine_signal_summary": {
          "intent_correlation": {
            "status": "EVALUATED",
            "risk_level": "LOW",
            "heuristic_score": 0.1,
            "score_type": "prototype_heuristic_score (deterministic rule-based, non-ML)",
            "indicators": [
              "FULL_INTENT_TRANSACTION_MATCH"
            ]
          },
          "behavioural_risk": {
            "status": "EVALUATED",
            "risk_level": "LOW",
            "anomaly_score": 0.0,
            "data_sufficiency": "SUFFICIENT",
            "indicators": []
          },
          "recipient_intelligence": {
            "status": "EVALUATED",
            "risk_level": "LOW",
            "recipient_risk_score": 0.0,
            "data_sufficiency": "LIMITED",
            "indicators": [
              "ORDINARY_BENIGN_ACTIVITY"
            ]
          }
        },
        "detected_indicators": [
          "INTENT_FULL_INTENT_TRANSACTION_MATCH",
          "RECIPIENT_ORDINARY_BENIGN_ACTIVITY"
        ],
        "feature_contributions": {
          "intent": 0.04,
          "behavioural": 0.0,
          "recipient": 0.0
        },
        "supporting_evidence": [
          {
            "engine_source": "INTENT",
            "evidence_id": "SNIPPET-0",
            "epistemic_status": "EXTRACTED",
            "source_reference": "COMMUNICATION_AMOUNT",
            "description": "Extracted amount: 'Rs 12,000' (FOUND)"
          },
          {
            "engine_source": "INTENT",
            "evidence_id": "SNIPPET-1",
            "epistemic_status": "EXTRACTED",
            "source_reference": "COMMUNICATION_RECIPIENT_ID",
            "description": "Extracted recipient_id: 'sample-landlord@okhdfc' (FOUND)"
          },
          {
            "engine_source": "BEHAVIOURAL",
            "evidence_id": "FEAT-amount_deviation",
            "epistemic_status": "STATISTICAL",
            "source_reference": "CUSTOMER_BASELINE_AMOUNT_DEVIATION",
            "description": "Behavioural signal amount_deviation: contribution 0.0000"
          },
          {
            "engine_source": "BEHAVIOURAL",
            "evidence_id": "FEAT-beneficiary_novelty",
            "epistemic_status": "STATISTICAL",
            "source_reference": "CUSTOMER_BASELINE_BENEFICIARY_NOVELTY",
            "description": "Behavioural signal beneficiary_novelty: contribution 0.0000"
          },
          {
            "engine_source": "BEHAVIOURAL",
            "evidence_id": "FEAT-velocity_surge",
            "epistemic_status": "STATISTICAL",
            "source_reference": "CUSTOMER_BASELINE_VELOCITY_SURGE",
            "description": "Behavioural signal velocity_surge: contribution 0.0000"
          },
          {
            "engine_source": "BEHAVIOURAL",
            "evidence_id": "FEAT-payment_method_novelty",
            "epistemic_status": "STATISTICAL",
            "source_reference": "CUSTOMER_BASELINE_PAYMENT_METHOD_NOVELTY",
            "description": "Behavioural signal payment_method_novelty: contribution 0.0000"
          },
          {
            "engine_source": "BEHAVIOURAL",
            "evidence_id": "FEAT-time_deviation",
            "epistemic_status": "STATISTICAL",
            "source_reference": "CUSTOMER_BASELINE_TIME_DEVIATION",
            "description": "Behavioural signal time_deviation: contribution 0.0000"
          },
          {
            "engine_source": "BEHAVIOURAL",
            "evidence_id": "FEAT-compound_synergy",
            "epistemic_status": "STATISTICAL",
            "source_reference": "CUSTOMER_BASELINE_COMPOUND_SYNERGY",
            "description": "Behavioural signal compound_synergy: contribution 0.0000"
          },
          {
            "engine_source": "RECIPIENT",
            "evidence_id": "E-DEMO-L1",
            "epistemic_status": "VERIFIED",
            "source_reference": "SAMPLE_LEDGER_0001",
            "description": "PAID_TO: Sample settled rent payment recorded in ledger. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-DEMO-L1]"
          }
        ],
        "explanation": "Unified transaction evaluation for customer 'CUST-DEMO' paying 'sample-landlord@okhdfc' produced composite risk score 0.04 (LOW) under policy 'PAYGUARD_UNIFIED_POLICY_V1'. Intent Correlation: Evaluated with risk tier LOW (heuristic score 0.1). Recipient Intelligence: Evaluated with risk tier LOW (score 0.0, sufficiency LIMITED). Behavioural Anomaly: Evaluated with risk tier LOW (anomaly score 0.0000, sufficiency SUFFICIENT).",
        "missing_evidence": [],
        "conflicting_signals": [],
        "data_sufficiency": "LIMITED",
        "recommended_action": "ALLOW_WITH_CAUTION",
        "policy_version": "PAYGUARD_UNIFIED_POLICY_V1",
        "model_type": "PROVISIONAL_DETERMINISTIC_MULTI_ENGINE_FUSION_V1",
        "assessment_timestamp": "2026-11-23T14:00:00Z"
      },
      "intervention_recommendation": {
        "action": "ALLOW_WITH_CAUTION",
        "severity": "LOW",
        "intervention_type": "TRANSACTION_PERMITTED",
        "simulated_action_code": "PERMIT",
        "user_guidance_message": "Payment parameters match expected communication intent and customer historical baseline. Transaction permitted with standard security monitoring. This is a simulation; no live payment execution is performed.",
        "rationale": [
          "Communication Intent: Recipient handle matches extracted communication instructions.",
          "Customer Baseline: Transaction activity is consistent with historical baseline patterns.",
          "Recipient Evidence: No adverse fraud associations observed in evidence graph."
        ],
        "simulated_intervention_active": true,
        "disclaimer": "Simulated intervention only. No live banking, UPI blocking, or payment gateway interception is executed."
      },
      "summary_narrative": "PAYGUARD AI evaluated transaction 'TX-FE032097' for customer 'CUST-DEMO' transferring to 'sample-landlord@okhdfc'. Synthesized composite risk score: 0.04 (LOW). Recommended operational action: ALLOW_WITH_CAUTION (TRANSACTION_PERMITTED). Payment parameters match expected communication intent and customer historical baseline. Transaction permitted with standard security monitoring. This is a simulation; no live payment execution is performed.",
      "disclaimer": "PAYGUARD AI prototype simulation only. Payment intervention is simulated; no live banking or UPI transaction control is executed."
    },
  },
  insufficient: {
    id: 'insufficient',
    title: "Insufficient data",
    description: "No message, no payment history and an unknown recipient.",
    submitted: {"amount": 499, "currency": "INR", "recipientId": "sample-first-time@okbank"},
    response: {
      "evaluation_id": "PPE-C0F10A4B6F1A",
      "timestamp": "2026-11-23T14:00:00Z",
      "transaction_id": "TX-46C1D450",
      "customer_id": "CUST-DEMO",
      "recipient_id": "sample-first-time@okbank",
      "customer_consent": true,
      "intent_assessment": null,
      "behavioural_assessment": null,
      "recipient_assessment": null,
      "unified_risk_assessment": {
        "unified_assessment_id": "URA-A17F20BD026F",
        "transaction_id": "TX-46C1D450",
        "customer_id": "CUST-DEMO",
        "recipient_id": "sample-first-time@okbank",
        "overall_risk_score": "0.0000",
        "risk_level": "UNCERTAIN",
        "contributing_assessments": {
          "intent_correlation": null,
          "behavioural_risk": null,
          "recipient_intelligence": null
        },
        "engine_signal_summary": {
          "intent_correlation": {
            "status": "NOT_EVALUATED",
            "risk_level": "UNAVAILABLE",
            "heuristic_score": null,
            "notes": "No customer communication intent submitted for analysis."
          },
          "behavioural_risk": {
            "status": "NOT_EVALUATED",
            "risk_level": "UNAVAILABLE",
            "anomaly_score": null,
            "notes": "No historical customer transaction baseline submitted."
          },
          "recipient_intelligence": {
            "status": "NOT_EVALUATED",
            "risk_level": "UNAVAILABLE",
            "recipient_risk_score": null,
            "notes": "No recipient graph intelligence queried."
          }
        },
        "detected_indicators": [
          "INSUFFICIENT_MULTI_ENGINE_DATA"
        ],
        "feature_contributions": {
          "insufficient_data": 0.0
        },
        "supporting_evidence": [],
        "explanation": "Insufficient intelligence available across engines. No communication intent, customer baseline, or recipient history was available with sufficient depth to compute an explainable risk decision.",
        "missing_evidence": [
          "Intent correlation not evaluated: no communication text submitted.",
          "Customer behavioural history not evaluated: historical transactions unavailable.",
          "Recipient risk intelligence not evaluated: target not queried against SPEG graph."
        ],
        "conflicting_signals": [],
        "data_sufficiency": "INSUFFICIENT",
        "recommended_action": "INSUFFICIENT_DATA_REVIEW",
        "policy_version": "PAYGUARD_UNIFIED_POLICY_V1",
        "model_type": "PROVISIONAL_DETERMINISTIC_MULTI_ENGINE_FUSION_V1",
        "assessment_timestamp": "2026-11-23T14:00:00Z"
      },
      "intervention_recommendation": {
        "action": "INSUFFICIENT_DATA_REVIEW",
        "severity": "UNCERTAIN",
        "intervention_type": "FALLBACK_CONFIRMATION",
        "simulated_action_code": "PROMPT_MANUAL_CONFIRMATION",
        "user_guidance_message": "Notice: Insufficient historical or graph intelligence available to definitively score transaction safety. Please confirm you personally know and trust this recipient before proceeding. This is a simulation; no actual payment has been affected.",
        "rationale": [
          "Intent correlation not evaluated: no communication text submitted.",
          "Customer behavioural history not evaluated: historical transactions unavailable.",
          "Recipient risk intelligence not evaluated: target not queried against SPEG graph."
        ],
        "simulated_intervention_active": true,
        "disclaimer": "Simulated intervention only. No live banking, UPI blocking, or payment gateway interception is executed."
      },
      "summary_narrative": "PAYGUARD AI evaluated transaction 'TX-46C1D450' for customer 'CUST-DEMO' transferring to 'sample-first-time@okbank'. Synthesized composite risk score: 0.0000 (UNCERTAIN). Recommended operational action: INSUFFICIENT_DATA_REVIEW (FALLBACK_CONFIRMATION). Notice: Insufficient historical or graph intelligence available to definitively score transaction safety. Please confirm you personally know and trust this recipient before proceeding. This is a simulation; no actual payment has been affected.",
      "disclaimer": "PAYGUARD AI prototype simulation only. Payment intervention is simulated; no live banking or UPI transaction control is executed."
    },
  },
};
