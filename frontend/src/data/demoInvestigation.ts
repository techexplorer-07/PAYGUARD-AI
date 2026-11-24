/**
 * INVESTIGATOR DEMO DATASET — ILLUSTRATIVE ONLY.
 *
 * Produced by running the backend PAYGUARD engines offline on synthetic inputs:
 * sample customers, sample UPI IDs, sample payment history and a sample SPEG
 * evidence graph ("SPEG-DEMO-INVESTIGATOR"). Every value is an engine output for
 * synthetic data; none of it describes real customers, payments, fraud cases or
 * operational statistics. VERIFIED edges in this sample graph were promoted
 * through the backend's internal verification routine using a sample authority.
 *
 * Loaded on demand only when the analyst explicitly switches to the demo
 * dataset. Never used as a fallback for failed API calls, and never mixed with
 * live session records. All responses pass through the same runtime parsers as
 * live API data.
 */

export const demoInvestigationDataset: { graphId: string; assessments: { submitted: { amount: number; currency: string; recipientId: string }; response: unknown }[]; recipients: Record<string, { evidence: unknown; profile: unknown; risk: unknown }> } = {
 "graphId": "SPEG-DEMO-INVESTIGATOR",
 "assessments": [
  {
   "submitted": {
    "amount": 8500,
    "currency": "INR",
    "recipientId": "sample-refund-desk@ybl"
   },
   "response": {
    "evaluation_id": "PPE-2BCE18E9CA30",
    "timestamp": "2026-11-23T13:00:00Z",
    "transaction_id": "TX-79E37004",
    "customer_id": "CUST-DEMO-01",
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
        "start_char": 59,
        "end_char": 67,
        "status": "FOUND"
       },
       {
        "field": "recipient_id",
        "extracted_value": "sample-power-bill@okaxis",
        "text_snippet": "sample-power-bill@okaxis",
        "start_char": 83,
        "end_char": 107,
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
        "start_char": 68,
        "end_char": 79,
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
     "timestamp": "2026-11-23T13:00:00+00:00"
    },
    "behavioural_assessment": {
     "assessment_id": "ASM-204FB57A9D3F",
     "customer_id": "CUST-DEMO-01",
     "transaction_id": "TX-79E37004",
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
      "Time of day (13:00 UTC) conforms to known customer activity corridors (shortest distance: 0 mins).",
      "Compound behavioural risk: High transaction amount deviation directed to an unprecedented beneficiary."
     ],
     "data_sufficiency": "SUFFICIENT",
     "model_type": "deterministic_heuristic_anomaly_scorer (provisional v1)",
     "assessment_timestamp": "2026-11-24T15:04:10.337481Z"
    },
    "recipient_assessment": {
     "assessment_id": "RRA-D43F2F06D25A",
     "recipient_id": "sample-refund-desk@ybl",
     "graph_id": "SPEG-DEMO-INVESTIGATOR",
     "assessment_timestamp": "2026-11-23T13:00:00Z",
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
     "explanation": "Recipient 'sample-refund-desk@ybl' evaluated under model 'PROVISIONAL_DETERMINISTIC_RECIPIENT_SCORER_V1' with score 1.0 (HIGH). Strong signal: Directly linked to 1 VERIFIED fraud case filing(s) (+0.85). Reported allegations: Linked to 1 distinct reported source reference(s) with recent (2d ago) recency (+0.25). Inferred associations: Associated with 1 shared identifier node(s) (+0.12). Inferred associations reflect network co-occurrence and alone cannot produce HIGH risk.",
     "supporting_evidence": [
      {
       "edge_id": "E-INV-01",
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
       "description": "Sample bank-confirmed case of utility impersonation. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-01]"
      },
      {
       "edge_id": "E-INV-02",
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
       "edge_id": "E-INV-03",
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
       "description": "Sample phone identifier observed on this beneficiary."
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
     "unified_assessment_id": "URA-1204BB46DAA2",
     "transaction_id": "TX-79E37004",
     "customer_id": "CUST-DEMO-01",
     "recipient_id": "sample-refund-desk@ybl",
     "overall_risk_score": "0.882",
     "risk_level": "HIGH",
     "contributing_assessments": {
      "intent_correlation": "INTENT-2026-11-23T13:00:00+00:00",
      "behavioural_risk": "ASM-204FB57A9D3F",
      "recipient_intelligence": "RRA-D43F2F06D25A"
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
       "evidence_id": "E-INV-01",
       "epistemic_status": "VERIFIED",
       "source_reference": "SAMPLE_BANK_INVESTIGATION_301",
       "description": "REPORTED_IN_CASE: Sample bank-confirmed case of utility impersonation. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-01]"
      },
      {
       "engine_source": "RECIPIENT",
       "evidence_id": "E-INV-02",
       "epistemic_status": "REPORTED",
       "source_reference": "SAMPLE_USER_COMPLAINT_302",
       "description": "REPORTED_IN_CASE: Sample customer report of a disconnection threat call."
      },
      {
       "engine_source": "RECIPIENT",
       "evidence_id": "E-INV-03",
       "epistemic_status": "INFERRED",
       "source_reference": "SAMPLE_GRAPH_LINK_11",
       "description": "SHARES_IDENTIFIER: Sample phone identifier observed on this beneficiary."
      },
      {
       "engine_source": "RECIPIENT",
       "evidence_id": "PATH-sample-refund-desk@ybl-SAMPLE-PHONE-11-sample-mule@okicici",
       "epistemic_status": "INFERRED",
       "source_reference": "SAMPLE_GRAPH_LINK_11",
       "description": "SHARES_IDENTIFIER: Beneficiary 'sample-refund-desk@ybl' shares identifier node 'SAMPLE-PHONE-11' with beneficiary 'sample-mule@okicici'. (Inferred association, does not prove common ownership)."
      }
     ],
     "explanation": "Unified transaction evaluation for customer 'CUST-DEMO-01' paying 'sample-refund-desk@ybl' produced composite risk score 0.882 (HIGH) under policy 'PAYGUARD_UNIFIED_POLICY_V1'. Critical Intent Alert: Communication intent analysis identified payment destination diversion or amount contradiction; intent override applied. Critical Recipient Alert: Beneficiary has direct associations with VERIFIED fraud case filings; verified evidence override applied. Behavioural Anomaly: Evaluated with risk tier HIGH (anomaly score 0.7000, sufficiency SUFFICIENT).",
     "missing_evidence": [],
     "conflicting_signals": [],
     "data_sufficiency": "ADEQUATE",
     "recommended_action": "PAUSE_AND_VERIFY",
     "policy_version": "PAYGUARD_UNIFIED_POLICY_V1",
     "model_type": "PROVISIONAL_DETERMINISTIC_MULTI_ENGINE_FUSION_V1",
     "assessment_timestamp": "2026-11-23T13:00:00Z"
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
    "summary_narrative": "PAYGUARD AI evaluated transaction 'TX-79E37004' for customer 'CUST-DEMO-01' transferring to 'sample-refund-desk@ybl'. Synthesized composite risk score: 0.882 (HIGH). Recommended operational action: PAUSE_AND_VERIFY (SIMULATED_PAYMENT_HOLD). PAYGUARD detected that the communication requested payment to sample-power-bill@okaxis, while the simulated transaction targets sample-refund-desk@ybl. We recommend pausing and independently verifying the recipient before proceeding. This is a simulation; no actual bank or UPI payment has been paused.",
    "disclaimer": "PAYGUARD AI prototype simulation only. Payment intervention is simulated; no live banking or UPI transaction control is executed."
   }
  },
  {
   "submitted": {
    "amount": 1999,
    "currency": "INR",
    "recipientId": "sample-kyc-update@ybl"
   },
   "response": {
    "evaluation_id": "PPE-0AA2FE4E8401",
    "timestamp": "2026-11-23T11:00:00Z",
    "transaction_id": "TX-000087A6",
    "customer_id": "CUST-DEMO-02",
    "recipient_id": "sample-kyc-update@ybl",
    "customer_consent": true,
    "intent_assessment": {
     "status": "success",
     "consent_verified": true,
     "extracted_intent": {
      "amount": 1999.0,
      "amount_status": "FOUND",
      "currency": "INR",
      "recipient_id": "sample-kyc-update@ybl",
      "recipient_status": "FOUND",
      "purpose": "Administrative / Service Fee",
      "urgency_detected": true,
      "threat_detected": true,
      "evidence_snippets": [
       {
        "field": "amount",
        "extracted_value": "INR 1999.0",
        "text_snippet": "Rs 1,999",
        "start_char": 67,
        "end_char": 75,
        "status": "FOUND"
       },
       {
        "field": "recipient_id",
        "extracted_value": "sample-kyc-update@ybl",
        "text_snippet": "sample-kyc-update@ybl",
        "start_char": 96,
        "end_char": 117,
        "status": "FOUND"
       },
       {
        "field": "purpose",
        "extracted_value": "Administrative / Service Fee",
        "text_snippet": "fee",
        "start_char": 89,
        "end_char": 92,
        "status": "FOUND"
       },
       {
        "field": "urgency",
        "extracted_value": "urgency_indicator",
        "text_snippet": "today",
        "start_char": 56,
        "end_char": 61,
        "status": "FOUND"
       },
       {
        "field": "urgency",
        "extracted_value": "urgency_indicator",
        "text_snippet": "now",
        "start_char": 118,
        "end_char": 121,
        "status": "FOUND"
       },
       {
        "field": "urgency",
        "extracted_value": "urgency_indicator",
        "text_snippet": "expired",
        "start_char": 18,
        "end_char": 25,
        "status": "FOUND"
       },
       {
        "field": "threat",
        "extracted_value": "threat_indicator",
        "text_snippet": "blocked",
        "start_char": 48,
        "end_char": 55,
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
      "normalized_requested_recipient": "sample-kyc-update@ybl",
      "normalized_transaction_recipient": "sample-kyc-update@ybl",
      "summary": "Amount matches requested instruction (INR 1,999.00). Recipient matches requested beneficiary (sample-kyc-update@ybl)."
     },
     "risk_assessment": {
      "risk_level": "MEDIUM",
      "heuristic_score": 0.4,
      "score_type": "prototype_heuristic_score (deterministic rule-based, non-ML)",
      "reasons": [
       "Both requested amount (INR 1,999.00) and recipient ('sample-kyc-update@ybl') match the communication instructions.",
       "CAUTION: Coercive/threat language was detected in the communication. Matching credentials reduce intent divergence, but do not guarantee the claim is genuine."
      ],
      "signals_detected": [
       "URGENCY_LANGUAGE_DETECTED",
       "COERCIVE_THREAT_LANGUAGE_DETECTED",
       "CONTEXT_PURPOSE_ADMINISTRATIVE___SERVICE_FEE",
       "FULL_INTENT_TRANSACTION_MATCH"
      ],
      "recommended_action": "PAUSE_AND_VERIFY_CALLER"
     },
     "timestamp": "2026-11-23T11:00:00+00:00"
    },
    "behavioural_assessment": null,
    "recipient_assessment": {
     "assessment_id": "RRA-302EF0C78895",
     "recipient_id": "sample-kyc-update@ybl",
     "graph_id": "SPEG-DEMO-INVESTIGATOR",
     "assessment_timestamp": "2026-11-23T11:00:00Z",
     "recipient_risk_score": "0.4",
     "risk_level": "MEDIUM",
     "data_sufficiency": "ADEQUATE",
     "detected_indicators": [
      "REPORTED_FRAUD_ALLEGATIONS (2 report(s) across 2 distinct source(s))"
     ],
     "feature_contributions": {
      "verified_fraud_case_association": 0.0,
      "reported_fraud_case_association": 0.4,
      "inferred_shared_identifier_relationships": 0.0,
      "transaction_volume_context": 0.0
     },
     "explanation": "Recipient 'sample-kyc-update@ybl' evaluated under model 'PROVISIONAL_DETERMINISTIC_RECIPIENT_SCORER_V1' with score 0.4 (MEDIUM). Reported allegations: Linked to 2 distinct reported source reference(s) with recent (0d ago) recency (+0.40).",
     "supporting_evidence": [
      {
       "edge_id": "E-INV-11",
       "source_reference": "SAMPLE_USER_COMPLAINT_401",
       "evidence_status": "REPORTED",
       "relationship_type": "MENTIONED_IN",
       "observed_at": "2026-11-19T14:00:00Z",
       "source_node_id": "SAMPLE-MSG-501",
       "target_node_id": "sample-kyc-update@ybl",
       "path": [
        "SAMPLE-MSG-501",
        "sample-kyc-update@ybl"
       ],
       "description": "Sample reported message naming this beneficiary."
      },
      {
       "edge_id": "E-INV-09",
       "source_reference": "SAMPLE_USER_COMPLAINT_401",
       "evidence_status": "REPORTED",
       "relationship_type": "REPORTED_IN_CASE",
       "observed_at": "2026-11-19T14:00:00Z",
       "source_node_id": "sample-kyc-update@ybl",
       "target_node_id": "SAMPLE-CASE-401",
       "path": [
        "sample-kyc-update@ybl",
        "SAMPLE-CASE-401"
       ],
       "description": "Sample report of a fake KYC update request."
      },
      {
       "edge_id": "E-INV-10",
       "source_reference": "SAMPLE_PARTNER_REPORT_402",
       "evidence_status": "REPORTED",
       "relationship_type": "REPORTED_IN_CASE",
       "observed_at": "2026-11-22T14:00:00Z",
       "source_node_id": "sample-kyc-update@ybl",
       "target_node_id": "SAMPLE-CASE-402",
       "path": [
        "sample-kyc-update@ybl",
        "SAMPLE-CASE-402"
       ],
       "description": "Sample partner report of a KYC suspension threat."
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
     "unified_assessment_id": "URA-9EE0311B5E45",
     "transaction_id": "TX-000087A6",
     "customer_id": "CUST-DEMO-02",
     "recipient_id": "sample-kyc-update@ybl",
     "overall_risk_score": "0.4",
     "risk_level": "MEDIUM",
     "contributing_assessments": {
      "intent_correlation": "INTENT-2026-11-23T11:00:00+00:00",
      "behavioural_risk": null,
      "recipient_intelligence": "RRA-302EF0C78895"
     },
     "engine_signal_summary": {
      "intent_correlation": {
       "status": "EVALUATED",
       "risk_level": "MEDIUM",
       "heuristic_score": 0.4,
       "score_type": "prototype_heuristic_score (deterministic rule-based, non-ML)",
       "indicators": [
        "URGENCY_LANGUAGE_DETECTED",
        "COERCIVE_THREAT_LANGUAGE_DETECTED",
        "CONTEXT_PURPOSE_ADMINISTRATIVE___SERVICE_FEE",
        "FULL_INTENT_TRANSACTION_MATCH"
       ]
      },
      "behavioural_risk": {
       "status": "NOT_EVALUATED",
       "risk_level": "UNAVAILABLE",
       "anomaly_score": null,
       "notes": "No historical customer transaction baseline submitted."
      },
      "recipient_intelligence": {
       "status": "EVALUATED",
       "risk_level": "MEDIUM",
       "recipient_risk_score": 0.4,
       "data_sufficiency": "ADEQUATE",
       "indicators": [
        "REPORTED_FRAUD_ALLEGATIONS (2 report(s) across 2 distinct source(s))"
       ]
      }
     },
     "detected_indicators": [
      "INTENT_COERCIVE_THREAT_LANGUAGE_DETECTED",
      "INTENT_CONTEXT_PURPOSE_ADMINISTRATIVE___SERVICE_FEE",
      "INTENT_FULL_INTENT_TRANSACTION_MATCH",
      "INTENT_URGENCY_LANGUAGE_DETECTED",
      "RECIPIENT_REPORTED_FRAUD_ALLEGATIONS (2 report(s) across 2 distinct source(s))",
      "REPORTED_RECIPIENT_FRAUD_ELEVATION"
     ],
     "feature_contributions": {
      "intent": 0.2286,
      "recipient": 0.1714
     },
     "supporting_evidence": [
      {
       "engine_source": "INTENT",
       "evidence_id": "SNIPPET-0",
       "epistemic_status": "EXTRACTED",
       "source_reference": "COMMUNICATION_AMOUNT",
       "description": "Extracted amount: 'Rs 1,999' (FOUND)"
      },
      {
       "engine_source": "INTENT",
       "evidence_id": "SNIPPET-1",
       "epistemic_status": "EXTRACTED",
       "source_reference": "COMMUNICATION_RECIPIENT_ID",
       "description": "Extracted recipient_id: 'sample-kyc-update@ybl' (FOUND)"
      },
      {
       "engine_source": "INTENT",
       "evidence_id": "SNIPPET-2",
       "epistemic_status": "EXTRACTED",
       "source_reference": "COMMUNICATION_PURPOSE",
       "description": "Extracted purpose: 'fee' (FOUND)"
      },
      {
       "engine_source": "INTENT",
       "evidence_id": "SNIPPET-3",
       "epistemic_status": "EXTRACTED",
       "source_reference": "COMMUNICATION_URGENCY",
       "description": "Extracted urgency: 'today' (FOUND)"
      },
      {
       "engine_source": "INTENT",
       "evidence_id": "SNIPPET-4",
       "epistemic_status": "EXTRACTED",
       "source_reference": "COMMUNICATION_URGENCY",
       "description": "Extracted urgency: 'now' (FOUND)"
      },
      {
       "engine_source": "INTENT",
       "evidence_id": "SNIPPET-5",
       "epistemic_status": "EXTRACTED",
       "source_reference": "COMMUNICATION_URGENCY",
       "description": "Extracted urgency: 'expired' (FOUND)"
      },
      {
       "engine_source": "INTENT",
       "evidence_id": "SNIPPET-6",
       "epistemic_status": "EXTRACTED",
       "source_reference": "COMMUNICATION_THREAT",
       "description": "Extracted threat: 'blocked' (FOUND)"
      },
      {
       "engine_source": "RECIPIENT",
       "evidence_id": "E-INV-11",
       "epistemic_status": "REPORTED",
       "source_reference": "SAMPLE_USER_COMPLAINT_401",
       "description": "MENTIONED_IN: Sample reported message naming this beneficiary."
      },
      {
       "engine_source": "RECIPIENT",
       "evidence_id": "E-INV-09",
       "epistemic_status": "REPORTED",
       "source_reference": "SAMPLE_USER_COMPLAINT_401",
       "description": "REPORTED_IN_CASE: Sample report of a fake KYC update request."
      },
      {
       "engine_source": "RECIPIENT",
       "evidence_id": "E-INV-10",
       "epistemic_status": "REPORTED",
       "source_reference": "SAMPLE_PARTNER_REPORT_402",
       "description": "REPORTED_IN_CASE: Sample partner report of a KYC suspension threat."
      }
     ],
     "explanation": "Unified transaction evaluation for customer 'CUST-DEMO-02' paying 'sample-kyc-update@ybl' produced composite risk score 0.4 (MEDIUM) under policy 'PAYGUARD_UNIFIED_POLICY_V1'. Intent Correlation: Evaluated with risk tier MEDIUM (heuristic score 0.4). Recipient Intelligence: Evaluated with risk tier MEDIUM (score 0.4, sufficiency ADEQUATE). Missing Streams (1): Customer behavioural history not evaluated: historical transactions unavailable.",
     "missing_evidence": [
      "Customer behavioural history not evaluated: historical transactions unavailable."
     ],
     "conflicting_signals": [],
     "data_sufficiency": "LIMITED",
     "recommended_action": "WARN_CUSTOMER",
     "policy_version": "PAYGUARD_UNIFIED_POLICY_V1",
     "model_type": "PROVISIONAL_DETERMINISTIC_MULTI_ENGINE_FUSION_V1",
     "assessment_timestamp": "2026-11-23T11:00:00Z"
    },
    "intervention_recommendation": {
     "action": "WARN_CUSTOMER",
     "severity": "MEDIUM",
     "intervention_type": "CONTEXTUAL_WARNING",
     "simulated_action_code": "DISPLAY_WARNING",
     "user_guidance_message": "Caution: The destination recipient has unconfirmed fraud complaints or incident reports in the evidence graph. Please verify recipient authenticity before confirming. This is a simulation; no actual bank or UPI payment has been paused.",
     "rationale": [
      "Recipient Intelligence: Multiple unverified reported allegations exist in the evidence graph.",
      "Customer History: Behavioural baseline history was not submitted (not evaluated)."
     ],
     "simulated_intervention_active": true,
     "disclaimer": "Simulated intervention only. No live banking, UPI blocking, or payment gateway interception is executed."
    },
    "summary_narrative": "PAYGUARD AI evaluated transaction 'TX-000087A6' for customer 'CUST-DEMO-02' transferring to 'sample-kyc-update@ybl'. Synthesized composite risk score: 0.4 (MEDIUM). Recommended operational action: WARN_CUSTOMER (CONTEXTUAL_WARNING). Caution: The destination recipient has unconfirmed fraud complaints or incident reports in the evidence graph. Please verify recipient authenticity before confirming. This is a simulation; no actual bank or UPI payment has been paused.",
    "disclaimer": "PAYGUARD AI prototype simulation only. Payment intervention is simulated; no live banking or UPI transaction control is executed."
   }
  },
  {
   "submitted": {
    "amount": 6500,
    "currency": "INR",
    "recipientId": "sample-new-seller@ybl"
   },
   "response": {
    "evaluation_id": "PPE-392C20F113E0",
    "timestamp": "2026-11-23T09:00:00Z",
    "transaction_id": "TX-D69F9927",
    "customer_id": "CUST-DEMO-03",
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
     "timestamp": "2026-11-23T09:00:00+00:00"
    },
    "behavioural_assessment": {
     "assessment_id": "ASM-5F332E6A2274",
     "customer_id": "CUST-DEMO-03",
     "transaction_id": "TX-D69F9927",
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
      "Time of day (09:00 UTC) conforms to known customer activity corridors (shortest distance: 0 mins).",
      "Compound behavioural risk: High transaction amount deviation directed to an unprecedented beneficiary."
     ],
     "data_sufficiency": "SUFFICIENT",
     "model_type": "deterministic_heuristic_anomaly_scorer (provisional v1)",
     "assessment_timestamp": "2026-11-24T15:04:10.339491Z"
    },
    "recipient_assessment": {
     "assessment_id": "RRA-20B9F8643401",
     "recipient_id": "sample-new-seller@ybl",
     "graph_id": "SPEG-DEMO-INVESTIGATOR",
     "assessment_timestamp": "2026-11-23T09:00:00Z",
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
     "explanation": "Recipient 'sample-new-seller@ybl' evaluated under model 'PROVISIONAL_DETERMINISTIC_RECIPIENT_SCORER_V1' with score 0.37 (MEDIUM). Reported allegations: Linked to 1 distinct reported source reference(s) with recent (5d ago) recency (+0.25). Inferred associations: Associated with 1 shared identifier node(s) (+0.12). Inferred associations reflect network co-occurrence and alone cannot produce HIGH risk.",
     "supporting_evidence": [
      {
       "edge_id": "E-INV-06",
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
       "description": "Sample complaint: item not delivered after advance payment."
      },
      {
       "edge_id": "E-INV-07",
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
       "description": "Sample device identifier observed on this beneficiary."
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
     "unified_assessment_id": "URA-19F4213EA35D",
     "transaction_id": "TX-D69F9927",
     "customer_id": "CUST-DEMO-03",
     "recipient_id": "sample-new-seller@ybl",
     "overall_risk_score": "0.401",
     "risk_level": "MEDIUM",
     "contributing_assessments": {
      "intent_correlation": "INTENT-2026-11-23T09:00:00+00:00",
      "behavioural_risk": "ASM-5F332E6A2274",
      "recipient_intelligence": "RRA-20B9F8643401"
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
       "evidence_id": "E-INV-06",
       "epistemic_status": "REPORTED",
       "source_reference": "SAMPLE_USER_COMPLAINT_201",
       "description": "REPORTED_IN_CASE: Sample complaint: item not delivered after advance payment."
      },
      {
       "engine_source": "RECIPIENT",
       "evidence_id": "E-INV-07",
       "epistemic_status": "INFERRED",
       "source_reference": "SAMPLE_GRAPH_LINK_77",
       "description": "SHARES_IDENTIFIER: Sample device identifier observed on this beneficiary."
      },
      {
       "engine_source": "RECIPIENT",
       "evidence_id": "PATH-sample-new-seller@ybl-SAMPLE-DEVICE-77-sample-other-seller@ybl",
       "epistemic_status": "INFERRED",
       "source_reference": "SAMPLE_GRAPH_LINK_77",
       "description": "SHARES_IDENTIFIER: Beneficiary 'sample-new-seller@ybl' shares identifier node 'SAMPLE-DEVICE-77' with beneficiary 'sample-other-seller@ybl'. (Inferred association, does not prove common ownership)."
      }
     ],
     "explanation": "Unified transaction evaluation for customer 'CUST-DEMO-03' paying 'sample-new-seller@ybl' produced composite risk score 0.401 (MEDIUM) under policy 'PAYGUARD_UNIFIED_POLICY_V1'. Intent Correlation: Evaluated with risk tier LOW (heuristic score 0.2). Recipient Intelligence: Evaluated with risk tier MEDIUM (score 0.37, sufficiency LIMITED). Behavioural Anomaly: Evaluated with risk tier HIGH (anomaly score 0.7000, sufficiency SUFFICIENT). Conflict Resolution: Behavioural-Intent Contradiction: Customer communication confirms payment intent, but transaction exhibits significant amount or velocity anomalies against baseline.",
     "missing_evidence": [],
     "conflicting_signals": [
      "Behavioural-Intent Contradiction: Customer communication confirms payment intent, but transaction exhibits significant amount or velocity anomalies against baseline."
     ],
     "data_sufficiency": "LIMITED",
     "recommended_action": "WARN_CUSTOMER",
     "policy_version": "PAYGUARD_UNIFIED_POLICY_V1",
     "model_type": "PROVISIONAL_DETERMINISTIC_MULTI_ENGINE_FUSION_V1",
     "assessment_timestamp": "2026-11-23T09:00:00Z"
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
    "summary_narrative": "PAYGUARD AI evaluated transaction 'TX-D69F9927' for customer 'CUST-DEMO-03' transferring to 'sample-new-seller@ybl'. Synthesized composite risk score: 0.401 (MEDIUM). Recommended operational action: WARN_CUSTOMER (CONTEXTUAL_WARNING). Caution: The destination recipient has unconfirmed fraud complaints or incident reports in the evidence graph. Please verify recipient authenticity before confirming. This is a simulation; no actual bank or UPI payment has been paused.",
    "disclaimer": "PAYGUARD AI prototype simulation only. Payment intervention is simulated; no live banking or UPI transaction control is executed."
   }
  },
  {
   "submitted": {
    "amount": 2500,
    "currency": "INR",
    "recipientId": "sample-grocer@okaxis"
   },
   "response": {
    "evaluation_id": "PPE-A6EB307FB5A2",
    "timestamp": "2026-11-23T06:00:00Z",
    "transaction_id": "TX-9EB57A7C",
    "customer_id": "CUST-DEMO-04",
    "recipient_id": "sample-grocer@okaxis",
    "customer_consent": true,
    "intent_assessment": {
     "status": "success",
     "consent_verified": true,
     "extracted_intent": {
      "amount": 2000.0,
      "amount_status": "FOUND",
      "currency": "INR",
      "recipient_id": "sample-grocer@okaxis",
      "recipient_status": "FOUND",
      "purpose": null,
      "urgency_detected": true,
      "threat_detected": false,
      "evidence_snippets": [
       {
        "field": "amount",
        "extracted_value": "INR 2000.0",
        "text_snippet": "Rs 2,000",
        "start_char": 4,
        "end_char": 12,
        "status": "FOUND"
       },
       {
        "field": "recipient_id",
        "extracted_value": "sample-grocer@okaxis",
        "text_snippet": "sample-grocer@okaxis",
        "start_char": 25,
        "end_char": 45,
        "status": "FOUND"
       },
       {
        "field": "urgency",
        "extracted_value": "urgency_indicator",
        "text_snippet": "urgently",
        "start_char": 13,
        "end_char": 21,
        "status": "FOUND"
       },
       {
        "field": "urgency",
        "extracted_value": "urgency_indicator",
        "text_snippet": "today",
        "start_char": 46,
        "end_char": 51,
        "status": "FOUND"
       }
      ]
     },
     "comparison": {
      "amount_status": "MISMATCH",
      "amount_difference": 500.0,
      "currency_status": "MATCH",
      "recipient_status": "MATCH",
      "normalized_requested_currency": "INR",
      "normalized_transaction_currency": "INR",
      "normalized_requested_recipient": "sample-grocer@okaxis",
      "normalized_transaction_recipient": "sample-grocer@okaxis",
      "summary": "Amount mismatch: Transaction is INR 2,500.00, but message requested INR 2,000.00. Recipient matches requested beneficiary (sample-grocer@okaxis)."
     },
     "risk_assessment": {
      "risk_level": "MEDIUM",
      "heuristic_score": 0.65,
      "score_type": "prototype_heuristic_score (deterministic rule-based, non-ML)",
      "reasons": [
       "Amount discrepancy: Simulated payment is INR 2,500.00, which differs from requested amount of INR 2,000.00."
      ],
      "signals_detected": [
       "URGENCY_LANGUAGE_DETECTED",
       "AMOUNT_MISMATCH"
      ],
      "recommended_action": "REVIEW_PAYMENT_DETAILS"
     },
     "timestamp": "2026-11-23T06:00:00+00:00"
    },
    "behavioural_assessment": null,
    "recipient_assessment": {
     "assessment_id": "RRA-1F3622FD8D3E",
     "recipient_id": "sample-grocer@okaxis",
     "graph_id": "SPEG-DEMO-INVESTIGATOR",
     "assessment_timestamp": "2026-11-23T06:00:00Z",
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
     "explanation": "Recipient 'sample-grocer@okaxis' evaluated under model 'PROVISIONAL_DETERMINISTIC_RECIPIENT_SCORER_V1' with score 0.0 (LOW). No adverse fraud filings or suspicious network associations were identified in available SPEG data.",
     "supporting_evidence": [
      {
       "edge_id": "E-INV-14",
       "source_reference": "SAMPLE_LEDGER_A_02",
       "evidence_status": "VERIFIED",
       "relationship_type": "PAID_TO",
       "observed_at": "2026-11-21T14:00:00Z",
       "source_node_id": "SAMPLE-CUST-A",
       "target_node_id": "sample-grocer@okaxis",
       "path": [
        "SAMPLE-CUST-A",
        "sample-grocer@okaxis"
       ],
       "description": "Sample settled grocery payment. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-14]"
      },
      {
       "edge_id": "E-INV-15",
       "source_reference": "SAMPLE_LEDGER_C_01",
       "evidence_status": "VERIFIED",
       "relationship_type": "PAID_TO",
       "observed_at": "2026-11-20T14:00:00Z",
       "source_node_id": "SAMPLE-CUST-C",
       "target_node_id": "sample-grocer@okaxis",
       "path": [
        "SAMPLE-CUST-C",
        "sample-grocer@okaxis"
       ],
       "description": "Sample settled grocery payment. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-15]"
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
     "unified_assessment_id": "URA-B8F34FEC84B5",
     "transaction_id": "TX-9EB57A7C",
     "customer_id": "CUST-DEMO-04",
     "recipient_id": "sample-grocer@okaxis",
     "overall_risk_score": "0.3714",
     "risk_level": "MEDIUM",
     "contributing_assessments": {
      "intent_correlation": "INTENT-2026-11-23T06:00:00+00:00",
      "behavioural_risk": null,
      "recipient_intelligence": "RRA-1F3622FD8D3E"
     },
     "engine_signal_summary": {
      "intent_correlation": {
       "status": "EVALUATED",
       "risk_level": "MEDIUM",
       "heuristic_score": 0.65,
       "score_type": "prototype_heuristic_score (deterministic rule-based, non-ML)",
       "indicators": [
        "URGENCY_LANGUAGE_DETECTED",
        "AMOUNT_MISMATCH"
       ]
      },
      "behavioural_risk": {
       "status": "NOT_EVALUATED",
       "risk_level": "UNAVAILABLE",
       "anomaly_score": null,
       "notes": "No historical customer transaction baseline submitted."
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
      "INTENT_AMOUNT_MISMATCH",
      "INTENT_URGENCY_LANGUAGE_DETECTED",
      "RECIPIENT_ORDINARY_BENIGN_ACTIVITY"
     ],
     "feature_contributions": {
      "intent": 0.3714,
      "recipient": 0.0
     },
     "supporting_evidence": [
      {
       "engine_source": "INTENT",
       "evidence_id": "SNIPPET-0",
       "epistemic_status": "EXTRACTED",
       "source_reference": "COMMUNICATION_AMOUNT",
       "description": "Extracted amount: 'Rs 2,000' (FOUND)"
      },
      {
       "engine_source": "INTENT",
       "evidence_id": "SNIPPET-1",
       "epistemic_status": "EXTRACTED",
       "source_reference": "COMMUNICATION_RECIPIENT_ID",
       "description": "Extracted recipient_id: 'sample-grocer@okaxis' (FOUND)"
      },
      {
       "engine_source": "INTENT",
       "evidence_id": "SNIPPET-2",
       "epistemic_status": "EXTRACTED",
       "source_reference": "COMMUNICATION_URGENCY",
       "description": "Extracted urgency: 'urgently' (FOUND)"
      },
      {
       "engine_source": "INTENT",
       "evidence_id": "SNIPPET-3",
       "epistemic_status": "EXTRACTED",
       "source_reference": "COMMUNICATION_URGENCY",
       "description": "Extracted urgency: 'today' (FOUND)"
      },
      {
       "engine_source": "RECIPIENT",
       "evidence_id": "E-INV-14",
       "epistemic_status": "VERIFIED",
       "source_reference": "SAMPLE_LEDGER_A_02",
       "description": "PAID_TO: Sample settled grocery payment. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-14]"
      },
      {
       "engine_source": "RECIPIENT",
       "evidence_id": "E-INV-15",
       "epistemic_status": "VERIFIED",
       "source_reference": "SAMPLE_LEDGER_C_01",
       "description": "PAID_TO: Sample settled grocery payment. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-15]"
      }
     ],
     "explanation": "Unified transaction evaluation for customer 'CUST-DEMO-04' paying 'sample-grocer@okaxis' produced composite risk score 0.3714 (MEDIUM) under policy 'PAYGUARD_UNIFIED_POLICY_V1'. Intent Correlation: Evaluated with risk tier MEDIUM (heuristic score 0.65). Recipient Intelligence: Evaluated with risk tier LOW (score 0.0, sufficiency LIMITED). Missing Streams (1): Customer behavioural history not evaluated: historical transactions unavailable.",
     "missing_evidence": [
      "Customer behavioural history not evaluated: historical transactions unavailable."
     ],
     "conflicting_signals": [],
     "data_sufficiency": "LIMITED",
     "recommended_action": "WARN_CUSTOMER",
     "policy_version": "PAYGUARD_UNIFIED_POLICY_V1",
     "model_type": "PROVISIONAL_DETERMINISTIC_MULTI_ENGINE_FUSION_V1",
     "assessment_timestamp": "2026-11-23T06:00:00Z"
    },
    "intervention_recommendation": {
     "action": "WARN_CUSTOMER",
     "severity": "MEDIUM",
     "intervention_type": "CONTEXTUAL_WARNING",
     "simulated_action_code": "DISPLAY_WARNING",
     "user_guidance_message": "Caution: Potential ambiguities or minor discrepancies detected in payment instructions. Please confirm transaction details before authorizing. This is a simulation; no actual bank or UPI payment has been paused.",
     "rationale": [
      "Communication Intent: Extracted intent exhibits moderate risk or partial details.",
      "Customer History: Behavioural baseline history was not submitted (not evaluated)."
     ],
     "simulated_intervention_active": true,
     "disclaimer": "Simulated intervention only. No live banking, UPI blocking, or payment gateway interception is executed."
    },
    "summary_narrative": "PAYGUARD AI evaluated transaction 'TX-9EB57A7C' for customer 'CUST-DEMO-04' transferring to 'sample-grocer@okaxis'. Synthesized composite risk score: 0.3714 (MEDIUM). Recommended operational action: WARN_CUSTOMER (CONTEXTUAL_WARNING). Caution: Potential ambiguities or minor discrepancies detected in payment instructions. Please confirm transaction details before authorizing. This is a simulation; no actual bank or UPI payment has been paused.",
    "disclaimer": "PAYGUARD AI prototype simulation only. Payment intervention is simulated; no live banking or UPI transaction control is executed."
   }
  },
  {
   "submitted": {
    "amount": 12000,
    "currency": "INR",
    "recipientId": "sample-landlord@okhdfc"
   },
   "response": {
    "evaluation_id": "PPE-E20D23A6BBBD",
    "timestamp": "2026-11-22T18:00:00Z",
    "transaction_id": "TX-D0A4434F",
    "customer_id": "CUST-DEMO-05",
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
     "timestamp": "2026-11-22T18:00:00+00:00"
    },
    "behavioural_assessment": {
     "assessment_id": "ASM-CF06AE8AA0FB",
     "customer_id": "CUST-DEMO-05",
     "transaction_id": "TX-D0A4434F",
     "anomaly_score": "0.1000",
     "risk_level": "LOW",
     "detected_indicators": [
      "UNUSUAL_TRANSACTION_TIME"
     ],
     "feature_contributions": {
      "amount_deviation": "0.0000",
      "beneficiary_novelty": "0.0000",
      "velocity_surge": "0.0000",
      "payment_method_novelty": "0.0000",
      "time_deviation": "0.1000",
      "compound_synergy": "0.0000"
     },
     "explanation": [
      "LOW BEHAVIOURAL ANOMALY: Transaction parameters broadly conform to established customer baseline. (Note: Low behavioural divergence does not guarantee absence of external scam pressure).",
      "Amount 12000.0 INR matches uniform historical baseline (12000 INR, ratio 1.00x).",
      "Familiar beneficiary: 'sample-landlord@okhdfc' has received 10 prior payments (100.00% of customer history).",
      "Transaction velocity conforms to normal pacing.",
      "Payment method 'UPI' is known and previously utilized.",
      "Unusual transaction timing: Executed at 18:00 UTC, which is 240 minutes from nearest historically observed activity."
     ],
     "data_sufficiency": "SUFFICIENT",
     "model_type": "deterministic_heuristic_anomaly_scorer (provisional v1)",
     "assessment_timestamp": "2026-11-24T15:04:10.341483Z"
    },
    "recipient_assessment": {
     "assessment_id": "RRA-A528FD11DBA8",
     "recipient_id": "sample-landlord@okhdfc",
     "graph_id": "SPEG-DEMO-INVESTIGATOR",
     "assessment_timestamp": "2026-11-22T18:00:00Z",
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
       "edge_id": "E-INV-12",
       "source_reference": "SAMPLE_LEDGER_A_01",
       "evidence_status": "VERIFIED",
       "relationship_type": "PAID_TO",
       "observed_at": "2026-10-24T14:00:00Z",
       "source_node_id": "SAMPLE-CUST-A",
       "target_node_id": "sample-landlord@okhdfc",
       "path": [
        "SAMPLE-CUST-A",
        "sample-landlord@okhdfc"
       ],
       "description": "Sample settled rent payment. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-12]"
      },
      {
       "edge_id": "E-INV-13",
       "source_reference": "SAMPLE_LEDGER_B_01",
       "evidence_status": "VERIFIED",
       "relationship_type": "PAID_TO",
       "observed_at": "2026-10-23T14:00:00Z",
       "source_node_id": "SAMPLE-CUST-B",
       "target_node_id": "sample-landlord@okhdfc",
       "path": [
        "SAMPLE-CUST-B",
        "sample-landlord@okhdfc"
       ],
       "description": "Sample settled rent payment. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-13]"
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
     "unified_assessment_id": "URA-EF78CFA9D16D",
     "transaction_id": "TX-D0A4434F",
     "customer_id": "CUST-DEMO-05",
     "recipient_id": "sample-landlord@okhdfc",
     "overall_risk_score": "0.07",
     "risk_level": "LOW",
     "contributing_assessments": {
      "intent_correlation": "INTENT-2026-11-22T18:00:00+00:00",
      "behavioural_risk": "ASM-CF06AE8AA0FB",
      "recipient_intelligence": "RRA-A528FD11DBA8"
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
       "anomaly_score": 0.1,
       "data_sufficiency": "SUFFICIENT",
       "indicators": [
        "UNUSUAL_TRANSACTION_TIME"
       ]
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
      "BEHAVIOURAL_UNUSUAL_TRANSACTION_TIME",
      "INTENT_FULL_INTENT_TRANSACTION_MATCH",
      "RECIPIENT_ORDINARY_BENIGN_ACTIVITY"
     ],
     "feature_contributions": {
      "intent": 0.04,
      "behavioural": 0.03,
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
       "description": "Behavioural signal time_deviation: contribution 0.1000"
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
       "evidence_id": "E-INV-12",
       "epistemic_status": "VERIFIED",
       "source_reference": "SAMPLE_LEDGER_A_01",
       "description": "PAID_TO: Sample settled rent payment. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-12]"
      },
      {
       "engine_source": "RECIPIENT",
       "evidence_id": "E-INV-13",
       "epistemic_status": "VERIFIED",
       "source_reference": "SAMPLE_LEDGER_B_01",
       "description": "PAID_TO: Sample settled rent payment. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-13]"
      }
     ],
     "explanation": "Unified transaction evaluation for customer 'CUST-DEMO-05' paying 'sample-landlord@okhdfc' produced composite risk score 0.07 (LOW) under policy 'PAYGUARD_UNIFIED_POLICY_V1'. Intent Correlation: Evaluated with risk tier LOW (heuristic score 0.1). Recipient Intelligence: Evaluated with risk tier LOW (score 0.0, sufficiency LIMITED). Behavioural Anomaly: Evaluated with risk tier LOW (anomaly score 0.1000, sufficiency SUFFICIENT).",
     "missing_evidence": [],
     "conflicting_signals": [],
     "data_sufficiency": "LIMITED",
     "recommended_action": "ALLOW_WITH_CAUTION",
     "policy_version": "PAYGUARD_UNIFIED_POLICY_V1",
     "model_type": "PROVISIONAL_DETERMINISTIC_MULTI_ENGINE_FUSION_V1",
     "assessment_timestamp": "2026-11-22T18:00:00Z"
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
    "summary_narrative": "PAYGUARD AI evaluated transaction 'TX-D0A4434F' for customer 'CUST-DEMO-05' transferring to 'sample-landlord@okhdfc'. Synthesized composite risk score: 0.07 (LOW). Recommended operational action: ALLOW_WITH_CAUTION (TRANSACTION_PERMITTED). Payment parameters match expected communication intent and customer historical baseline. Transaction permitted with standard security monitoring. This is a simulation; no live payment execution is performed.",
    "disclaimer": "PAYGUARD AI prototype simulation only. Payment intervention is simulated; no live banking or UPI transaction control is executed."
   }
  },
  {
   "submitted": {
    "amount": 540,
    "currency": "INR",
    "recipientId": "sample-grocer@okaxis"
   },
   "response": {
    "evaluation_id": "PPE-38154AC47DCA",
    "timestamp": "2026-11-22T12:00:00Z",
    "transaction_id": "TX-07C1E13A",
    "customer_id": "CUST-DEMO-06",
    "recipient_id": "sample-grocer@okaxis",
    "customer_consent": true,
    "intent_assessment": {
     "status": "success",
     "consent_verified": true,
     "extracted_intent": {
      "amount": 540.0,
      "amount_status": "FOUND",
      "currency": "INR",
      "recipient_id": "sample-grocer@okaxis",
      "recipient_status": "FOUND",
      "purpose": null,
      "urgency_detected": false,
      "threat_detected": false,
      "evidence_snippets": [
       {
        "field": "amount",
        "extracted_value": "INR 540.0",
        "text_snippet": "Rs 540",
        "start_char": 11,
        "end_char": 17,
        "status": "FOUND"
       },
       {
        "field": "recipient_id",
        "extracted_value": "sample-grocer@okaxis",
        "text_snippet": "sample-grocer@okaxis",
        "start_char": 21,
        "end_char": 41,
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
      "normalized_requested_recipient": "sample-grocer@okaxis",
      "normalized_transaction_recipient": "sample-grocer@okaxis",
      "summary": "Amount matches requested instruction (INR 540.00). Recipient matches requested beneficiary (sample-grocer@okaxis)."
     },
     "risk_assessment": {
      "risk_level": "LOW",
      "heuristic_score": 0.1,
      "score_type": "prototype_heuristic_score (deterministic rule-based, non-ML)",
      "reasons": [
       "Both requested amount (INR 540.00) and recipient ('sample-grocer@okaxis') match the communication instructions.",
       "No payment-instruction mismatch was identified in the available evidence.",
       "DISCLAIMER: A matching request does not establish that the communication or recipient is legitimate, verified safe, or fraud-free. Always remain alert to social engineering."
      ],
      "signals_detected": [
       "FULL_INTENT_TRANSACTION_MATCH"
      ],
      "recommended_action": "PROCEED_WITH_STANDARD_VERIFICATION"
     },
     "timestamp": "2026-11-22T12:00:00+00:00"
    },
    "behavioural_assessment": {
     "assessment_id": "ASM-2D06D6534EA2",
     "customer_id": "CUST-DEMO-06",
     "transaction_id": "TX-07C1E13A",
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
      "Amount conforms to historical distribution (robust z-score: +1.12, median: 515 INR).",
      "Familiar beneficiary: 'sample-grocer@okaxis' has received 10 prior payments (100.00% of customer history).",
      "Transaction velocity conforms to normal pacing.",
      "Payment method 'UPI' is known and previously utilized.",
      "Time of day (12:00 UTC) conforms to known customer activity corridors (shortest distance: 0 mins)."
     ],
     "data_sufficiency": "SUFFICIENT",
     "model_type": "deterministic_heuristic_anomaly_scorer (provisional v1)",
     "assessment_timestamp": "2026-11-24T15:04:10.341483Z"
    },
    "recipient_assessment": {
     "assessment_id": "RRA-466E40A37942",
     "recipient_id": "sample-grocer@okaxis",
     "graph_id": "SPEG-DEMO-INVESTIGATOR",
     "assessment_timestamp": "2026-11-22T12:00:00Z",
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
     "explanation": "Recipient 'sample-grocer@okaxis' evaluated under model 'PROVISIONAL_DETERMINISTIC_RECIPIENT_SCORER_V1' with score 0.0 (LOW). No adverse fraud filings or suspicious network associations were identified in available SPEG data.",
     "supporting_evidence": [
      {
       "edge_id": "E-INV-14",
       "source_reference": "SAMPLE_LEDGER_A_02",
       "evidence_status": "VERIFIED",
       "relationship_type": "PAID_TO",
       "observed_at": "2026-11-21T14:00:00Z",
       "source_node_id": "SAMPLE-CUST-A",
       "target_node_id": "sample-grocer@okaxis",
       "path": [
        "SAMPLE-CUST-A",
        "sample-grocer@okaxis"
       ],
       "description": "Sample settled grocery payment. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-14]"
      },
      {
       "edge_id": "E-INV-15",
       "source_reference": "SAMPLE_LEDGER_C_01",
       "evidence_status": "VERIFIED",
       "relationship_type": "PAID_TO",
       "observed_at": "2026-11-20T14:00:00Z",
       "source_node_id": "SAMPLE-CUST-C",
       "target_node_id": "sample-grocer@okaxis",
       "path": [
        "SAMPLE-CUST-C",
        "sample-grocer@okaxis"
       ],
       "description": "Sample settled grocery payment. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-15]"
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
     "unified_assessment_id": "URA-A39A943E219D",
     "transaction_id": "TX-07C1E13A",
     "customer_id": "CUST-DEMO-06",
     "recipient_id": "sample-grocer@okaxis",
     "overall_risk_score": "0.04",
     "risk_level": "LOW",
     "contributing_assessments": {
      "intent_correlation": "INTENT-2026-11-22T12:00:00+00:00",
      "behavioural_risk": "ASM-2D06D6534EA2",
      "recipient_intelligence": "RRA-466E40A37942"
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
       "description": "Extracted amount: 'Rs 540' (FOUND)"
      },
      {
       "engine_source": "INTENT",
       "evidence_id": "SNIPPET-1",
       "epistemic_status": "EXTRACTED",
       "source_reference": "COMMUNICATION_RECIPIENT_ID",
       "description": "Extracted recipient_id: 'sample-grocer@okaxis' (FOUND)"
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
       "evidence_id": "E-INV-14",
       "epistemic_status": "VERIFIED",
       "source_reference": "SAMPLE_LEDGER_A_02",
       "description": "PAID_TO: Sample settled grocery payment. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-14]"
      },
      {
       "engine_source": "RECIPIENT",
       "evidence_id": "E-INV-15",
       "epistemic_status": "VERIFIED",
       "source_reference": "SAMPLE_LEDGER_C_01",
       "description": "PAID_TO: Sample settled grocery payment. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-15]"
      }
     ],
     "explanation": "Unified transaction evaluation for customer 'CUST-DEMO-06' paying 'sample-grocer@okaxis' produced composite risk score 0.04 (LOW) under policy 'PAYGUARD_UNIFIED_POLICY_V1'. Intent Correlation: Evaluated with risk tier LOW (heuristic score 0.1). Recipient Intelligence: Evaluated with risk tier LOW (score 0.0, sufficiency LIMITED). Behavioural Anomaly: Evaluated with risk tier LOW (anomaly score 0.0000, sufficiency SUFFICIENT).",
     "missing_evidence": [],
     "conflicting_signals": [],
     "data_sufficiency": "LIMITED",
     "recommended_action": "ALLOW_WITH_CAUTION",
     "policy_version": "PAYGUARD_UNIFIED_POLICY_V1",
     "model_type": "PROVISIONAL_DETERMINISTIC_MULTI_ENGINE_FUSION_V1",
     "assessment_timestamp": "2026-11-22T12:00:00Z"
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
    "summary_narrative": "PAYGUARD AI evaluated transaction 'TX-07C1E13A' for customer 'CUST-DEMO-06' transferring to 'sample-grocer@okaxis'. Synthesized composite risk score: 0.04 (LOW). Recommended operational action: ALLOW_WITH_CAUTION (TRANSACTION_PERMITTED). Payment parameters match expected communication intent and customer historical baseline. Transaction permitted with standard security monitoring. This is a simulation; no live payment execution is performed.",
    "disclaimer": "PAYGUARD AI prototype simulation only. Payment intervention is simulated; no live banking or UPI transaction control is executed."
   }
  },
  {
   "submitted": {
    "amount": 499,
    "currency": "INR",
    "recipientId": "sample-first-time@okbank"
   },
   "response": {
    "evaluation_id": "PPE-9AE287BAC944",
    "timestamp": "2026-11-22T08:00:00Z",
    "transaction_id": "TX-635DE56E",
    "customer_id": "CUST-DEMO-07",
    "recipient_id": "sample-first-time@okbank",
    "customer_consent": true,
    "intent_assessment": null,
    "behavioural_assessment": null,
    "recipient_assessment": null,
    "unified_risk_assessment": {
     "unified_assessment_id": "URA-9B2C98D4DEC9",
     "transaction_id": "TX-635DE56E",
     "customer_id": "CUST-DEMO-07",
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
     "assessment_timestamp": "2026-11-22T08:00:00Z"
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
    "summary_narrative": "PAYGUARD AI evaluated transaction 'TX-635DE56E' for customer 'CUST-DEMO-07' transferring to 'sample-first-time@okbank'. Synthesized composite risk score: 0.0000 (UNCERTAIN). Recommended operational action: INSUFFICIENT_DATA_REVIEW (FALLBACK_CONFIRMATION). Notice: Insufficient historical or graph intelligence available to definitively score transaction safety. Please confirm you personally know and trust this recipient before proceeding. This is a simulation; no actual payment has been affected.",
    "disclaimer": "PAYGUARD AI prototype simulation only. Payment intervention is simulated; no live banking or UPI transaction control is executed."
   }
  },
  {
   "submitted": {
    "amount": 3000,
    "currency": "INR",
    "recipientId": "sample-mule@okicici"
   },
   "response": {
    "evaluation_id": "PPE-DF7FB97A72A1",
    "timestamp": "2026-11-22T04:00:00Z",
    "transaction_id": "TX-0D144C99",
    "customer_id": "CUST-DEMO-08",
    "recipient_id": "sample-mule@okicici",
    "customer_consent": true,
    "intent_assessment": {
     "status": "success",
     "consent_verified": true,
     "extracted_intent": {
      "amount": 3000.0,
      "amount_status": "FOUND",
      "currency": "INR",
      "recipient_id": "sample-mule@okicici",
      "recipient_status": "FOUND",
      "purpose": "Loan Repayment / EMI",
      "urgency_detected": false,
      "threat_detected": false,
      "evidence_snippets": [
       {
        "field": "amount",
        "extracted_value": "INR 3000.0",
        "text_snippet": "Rs 3,000",
        "start_char": 18,
        "end_char": 26,
        "status": "FOUND"
       },
       {
        "field": "recipient_id",
        "extracted_value": "sample-mule@okicici",
        "text_snippet": "sample-mule@okicici",
        "start_char": 46,
        "end_char": 65,
        "status": "FOUND"
       },
       {
        "field": "purpose",
        "extracted_value": "Loan Repayment / EMI",
        "text_snippet": "loan",
        "start_char": 82,
        "end_char": 86,
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
      "normalized_requested_recipient": "sample-mule@okicici",
      "normalized_transaction_recipient": "sample-mule@okicici",
      "summary": "Amount matches requested instruction (INR 3,000.00). Recipient matches requested beneficiary (sample-mule@okicici)."
     },
     "risk_assessment": {
      "risk_level": "LOW",
      "heuristic_score": 0.1,
      "score_type": "prototype_heuristic_score (deterministic rule-based, non-ML)",
      "reasons": [
       "Both requested amount (INR 3,000.00) and recipient ('sample-mule@okicici') match the communication instructions.",
       "No payment-instruction mismatch was identified in the available evidence.",
       "DISCLAIMER: A matching request does not establish that the communication or recipient is legitimate, verified safe, or fraud-free. Always remain alert to social engineering."
      ],
      "signals_detected": [
       "CONTEXT_PURPOSE_LOAN_REPAYMENT___EMI",
       "FULL_INTENT_TRANSACTION_MATCH"
      ],
      "recommended_action": "PROCEED_WITH_STANDARD_VERIFICATION"
     },
     "timestamp": "2026-11-22T04:00:00+00:00"
    },
    "behavioural_assessment": null,
    "recipient_assessment": {
     "assessment_id": "RRA-E796DE238FAE",
     "recipient_id": "sample-mule@okicici",
     "graph_id": "SPEG-DEMO-INVESTIGATOR",
     "assessment_timestamp": "2026-11-22T04:00:00Z",
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
     "explanation": "Recipient 'sample-mule@okicici' evaluated under model 'PROVISIONAL_DETERMINISTIC_RECIPIENT_SCORER_V1' with score 0.37 (MEDIUM). Reported allegations: Linked to 1 distinct reported source reference(s) with recent (3d ago) recency (+0.25). Inferred associations: Associated with 1 shared identifier node(s) (+0.12). Inferred associations reflect network co-occurrence and alone cannot produce HIGH risk.",
     "supporting_evidence": [
      {
       "edge_id": "E-INV-04",
       "source_reference": "SAMPLE_GRAPH_LINK_11",
       "evidence_status": "INFERRED",
       "relationship_type": "SHARES_IDENTIFIER",
       "observed_at": "2026-11-11T14:00:00Z",
       "source_node_id": "sample-mule@okicici",
       "target_node_id": "SAMPLE-PHONE-11",
       "path": [
        "sample-mule@okicici",
        "SAMPLE-PHONE-11"
       ],
       "description": "Sample phone identifier observed on this beneficiary."
      },
      {
       "edge_id": "E-INV-05",
       "source_reference": "SAMPLE_USER_COMPLAINT_303",
       "evidence_status": "REPORTED",
       "relationship_type": "REPORTED_IN_CASE",
       "observed_at": "2026-11-18T14:00:00Z",
       "source_node_id": "sample-mule@okicici",
       "target_node_id": "SAMPLE-CASE-303",
       "path": [
        "sample-mule@okicici",
        "SAMPLE-CASE-303"
       ],
       "description": "Sample customer report of an advance-fee request."
      },
      {
       "edge_id": "PATH-sample-mule@okicici-SAMPLE-PHONE-11-sample-refund-desk@ybl",
       "source_reference": "SAMPLE_GRAPH_LINK_11",
       "evidence_status": "INFERRED",
       "relationship_type": "SHARES_IDENTIFIER",
       "observed_at": "2026-11-11T14:00:00Z",
       "source_node_id": "sample-mule@okicici",
       "target_node_id": "sample-refund-desk@ybl",
       "path": [
        "sample-mule@okicici",
        "SAMPLE-PHONE-11",
        "sample-refund-desk@ybl"
       ],
       "description": "Beneficiary 'sample-mule@okicici' shares identifier node 'SAMPLE-PHONE-11' with beneficiary 'sample-refund-desk@ybl'. (Inferred association, does not prove common ownership)."
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
     "unified_assessment_id": "URA-33280CD4D0F1",
     "transaction_id": "TX-0D144C99",
     "customer_id": "CUST-DEMO-08",
     "recipient_id": "sample-mule@okicici",
     "overall_risk_score": "0.35",
     "risk_level": "MEDIUM",
     "contributing_assessments": {
      "intent_correlation": "INTENT-2026-11-22T04:00:00+00:00",
      "behavioural_risk": null,
      "recipient_intelligence": "RRA-E796DE238FAE"
     },
     "engine_signal_summary": {
      "intent_correlation": {
       "status": "EVALUATED",
       "risk_level": "LOW",
       "heuristic_score": 0.1,
       "score_type": "prototype_heuristic_score (deterministic rule-based, non-ML)",
       "indicators": [
        "CONTEXT_PURPOSE_LOAN_REPAYMENT___EMI",
        "FULL_INTENT_TRANSACTION_MATCH"
       ]
      },
      "behavioural_risk": {
       "status": "NOT_EVALUATED",
       "risk_level": "UNAVAILABLE",
       "anomaly_score": null,
       "notes": "No historical customer transaction baseline submitted."
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
      "INTENT_CONTEXT_PURPOSE_LOAN_REPAYMENT___EMI",
      "INTENT_FULL_INTENT_TRANSACTION_MATCH",
      "RECIPIENT_INFERRED_SHARED_IDENTIFIERS (1 shared identifier(s))",
      "RECIPIENT_REPORTED_FRAUD_ALLEGATIONS (1 report(s) across 1 distinct source(s))",
      "REPORTED_RECIPIENT_FRAUD_ELEVATION"
     ],
     "feature_contributions": {
      "intent": 0.0571,
      "recipient": 0.1586
     },
     "supporting_evidence": [
      {
       "engine_source": "INTENT",
       "evidence_id": "SNIPPET-0",
       "epistemic_status": "EXTRACTED",
       "source_reference": "COMMUNICATION_AMOUNT",
       "description": "Extracted amount: 'Rs 3,000' (FOUND)"
      },
      {
       "engine_source": "INTENT",
       "evidence_id": "SNIPPET-1",
       "epistemic_status": "EXTRACTED",
       "source_reference": "COMMUNICATION_RECIPIENT_ID",
       "description": "Extracted recipient_id: 'sample-mule@okicici' (FOUND)"
      },
      {
       "engine_source": "INTENT",
       "evidence_id": "SNIPPET-2",
       "epistemic_status": "EXTRACTED",
       "source_reference": "COMMUNICATION_PURPOSE",
       "description": "Extracted purpose: 'loan' (FOUND)"
      },
      {
       "engine_source": "RECIPIENT",
       "evidence_id": "E-INV-04",
       "epistemic_status": "INFERRED",
       "source_reference": "SAMPLE_GRAPH_LINK_11",
       "description": "SHARES_IDENTIFIER: Sample phone identifier observed on this beneficiary."
      },
      {
       "engine_source": "RECIPIENT",
       "evidence_id": "E-INV-05",
       "epistemic_status": "REPORTED",
       "source_reference": "SAMPLE_USER_COMPLAINT_303",
       "description": "REPORTED_IN_CASE: Sample customer report of an advance-fee request."
      },
      {
       "engine_source": "RECIPIENT",
       "evidence_id": "PATH-sample-mule@okicici-SAMPLE-PHONE-11-sample-refund-desk@ybl",
       "epistemic_status": "INFERRED",
       "source_reference": "SAMPLE_GRAPH_LINK_11",
       "description": "SHARES_IDENTIFIER: Beneficiary 'sample-mule@okicici' shares identifier node 'SAMPLE-PHONE-11' with beneficiary 'sample-refund-desk@ybl'. (Inferred association, does not prove common ownership)."
      }
     ],
     "explanation": "Unified transaction evaluation for customer 'CUST-DEMO-08' paying 'sample-mule@okicici' produced composite risk score 0.35 (MEDIUM) under policy 'PAYGUARD_UNIFIED_POLICY_V1'. Intent Correlation: Evaluated with risk tier LOW (heuristic score 0.1). Recipient Intelligence: Evaluated with risk tier MEDIUM (score 0.37, sufficiency LIMITED). Missing Streams (1): Customer behavioural history not evaluated: historical transactions unavailable.",
     "missing_evidence": [
      "Customer behavioural history not evaluated: historical transactions unavailable."
     ],
     "conflicting_signals": [],
     "data_sufficiency": "LIMITED",
     "recommended_action": "WARN_CUSTOMER",
     "policy_version": "PAYGUARD_UNIFIED_POLICY_V1",
     "model_type": "PROVISIONAL_DETERMINISTIC_MULTI_ENGINE_FUSION_V1",
     "assessment_timestamp": "2026-11-22T04:00:00Z"
    },
    "intervention_recommendation": {
     "action": "WARN_CUSTOMER",
     "severity": "MEDIUM",
     "intervention_type": "CONTEXTUAL_WARNING",
     "simulated_action_code": "DISPLAY_WARNING",
     "user_guidance_message": "Caution: The destination recipient has unconfirmed fraud complaints or incident reports in the evidence graph. Please verify recipient authenticity before confirming. This is a simulation; no actual bank or UPI payment has been paused.",
     "rationale": [
      "Recipient Intelligence: Multiple unverified reported allegations exist in the evidence graph.",
      "Customer History: Behavioural baseline history was not submitted (not evaluated)."
     ],
     "simulated_intervention_active": true,
     "disclaimer": "Simulated intervention only. No live banking, UPI blocking, or payment gateway interception is executed."
    },
    "summary_narrative": "PAYGUARD AI evaluated transaction 'TX-0D144C99' for customer 'CUST-DEMO-08' transferring to 'sample-mule@okicici'. Synthesized composite risk score: 0.35 (MEDIUM). Recommended operational action: WARN_CUSTOMER (CONTEXTUAL_WARNING). Caution: The destination recipient has unconfirmed fraud complaints or incident reports in the evidence graph. Please verify recipient authenticity before confirming. This is a simulation; no actual bank or UPI payment has been paused.",
    "disclaimer": "PAYGUARD AI prototype simulation only. Payment intervention is simulated; no live banking or UPI transaction control is executed."
   }
  },
  {
   "submitted": {
    "amount": 4200,
    "currency": "INR",
    "recipientId": "sample-refund-desk@ybl"
   },
   "response": {
    "evaluation_id": "PPE-57258985EFE1",
    "timestamp": "2026-11-21T22:00:00Z",
    "transaction_id": "TX-16F6ED05",
    "customer_id": "CUST-DEMO-09",
    "recipient_id": "sample-refund-desk@ybl",
    "customer_consent": true,
    "intent_assessment": {
     "status": "success",
     "consent_verified": true,
     "extracted_intent": {
      "amount": 4200.0,
      "amount_status": "FOUND",
      "currency": "INR",
      "recipient_id": "sample-refund-desk@ybl",
      "recipient_status": "FOUND",
      "purpose": "Refund Processing",
      "urgency_detected": false,
      "threat_detected": false,
      "evidence_snippets": [
       {
        "field": "amount",
        "extracted_value": "INR 4200.0",
        "text_snippet": "Rs 4,200",
        "start_char": 11,
        "end_char": 19,
        "status": "FOUND"
       },
       {
        "field": "recipient_id",
        "extracted_value": "sample-refund-desk@ybl",
        "text_snippet": "sample-refund-desk@ybl",
        "start_char": 23,
        "end_char": 45,
        "status": "FOUND"
       },
       {
        "field": "purpose",
        "extracted_value": "Refund Processing",
        "text_snippet": "refund",
        "start_char": 30,
        "end_char": 36,
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
      "normalized_requested_recipient": "sample-refund-desk@ybl",
      "normalized_transaction_recipient": "sample-refund-desk@ybl",
      "summary": "Amount matches requested instruction (INR 4,200.00). Recipient matches requested beneficiary (sample-refund-desk@ybl)."
     },
     "risk_assessment": {
      "risk_level": "LOW",
      "heuristic_score": 0.1,
      "score_type": "prototype_heuristic_score (deterministic rule-based, non-ML)",
      "reasons": [
       "Both requested amount (INR 4,200.00) and recipient ('sample-refund-desk@ybl') match the communication instructions.",
       "No payment-instruction mismatch was identified in the available evidence.",
       "DISCLAIMER: A matching request does not establish that the communication or recipient is legitimate, verified safe, or fraud-free. Always remain alert to social engineering."
      ],
      "signals_detected": [
       "CONTEXT_PURPOSE_REFUND_PROCESSING",
       "FULL_INTENT_TRANSACTION_MATCH"
      ],
      "recommended_action": "PROCEED_WITH_STANDARD_VERIFICATION"
     },
     "timestamp": "2026-11-21T22:00:00+00:00"
    },
    "behavioural_assessment": null,
    "recipient_assessment": {
     "assessment_id": "RRA-1E02368D1715",
     "recipient_id": "sample-refund-desk@ybl",
     "graph_id": "SPEG-DEMO-INVESTIGATOR",
     "assessment_timestamp": "2026-11-21T22:00:00Z",
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
     "explanation": "Recipient 'sample-refund-desk@ybl' evaluated under model 'PROVISIONAL_DETERMINISTIC_RECIPIENT_SCORER_V1' with score 1.0 (HIGH). Strong signal: Directly linked to 1 VERIFIED fraud case filing(s) (+0.85). Reported allegations: Linked to 1 distinct reported source reference(s) with recent (1d ago) recency (+0.25). Inferred associations: Associated with 1 shared identifier node(s) (+0.12). Inferred associations reflect network co-occurrence and alone cannot produce HIGH risk.",
     "supporting_evidence": [
      {
       "edge_id": "E-INV-01",
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
       "description": "Sample bank-confirmed case of utility impersonation. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-01]"
      },
      {
       "edge_id": "E-INV-02",
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
       "edge_id": "E-INV-03",
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
       "description": "Sample phone identifier observed on this beneficiary."
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
     "unified_assessment_id": "URA-94C4FB9EF4B9",
     "transaction_id": "TX-16F6ED05",
     "customer_id": "CUST-DEMO-09",
     "recipient_id": "sample-refund-desk@ybl",
     "overall_risk_score": "0.85",
     "risk_level": "HIGH",
     "contributing_assessments": {
      "intent_correlation": "INTENT-2026-11-21T22:00:00+00:00",
      "behavioural_risk": null,
      "recipient_intelligence": "RRA-1E02368D1715"
     },
     "engine_signal_summary": {
      "intent_correlation": {
       "status": "EVALUATED",
       "risk_level": "LOW",
       "heuristic_score": 0.1,
       "score_type": "prototype_heuristic_score (deterministic rule-based, non-ML)",
       "indicators": [
        "CONTEXT_PURPOSE_REFUND_PROCESSING",
        "FULL_INTENT_TRANSACTION_MATCH"
       ]
      },
      "behavioural_risk": {
       "status": "NOT_EVALUATED",
       "risk_level": "UNAVAILABLE",
       "anomaly_score": null,
       "notes": "No historical customer transaction baseline submitted."
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
      "INTENT_CONTEXT_PURPOSE_REFUND_PROCESSING",
      "INTENT_FULL_INTENT_TRANSACTION_MATCH",
      "RECIPIENT_INFERRED_SHARED_IDENTIFIERS (1 shared identifier(s))",
      "RECIPIENT_REPORTED_FRAUD_ALLEGATIONS (1 report(s) across 1 distinct source(s))",
      "RECIPIENT_VERIFIED_FRAUD_CASE_ASSOCIATION (1 case(s))",
      "REPORTED_RECIPIENT_FRAUD_ELEVATION",
      "VERIFIED_RECIPIENT_FRAUD_CASE_OVERRIDE"
     ],
     "feature_contributions": {
      "intent": 0.0571,
      "recipient": 0.4286
     },
     "supporting_evidence": [
      {
       "engine_source": "INTENT",
       "evidence_id": "SNIPPET-0",
       "epistemic_status": "EXTRACTED",
       "source_reference": "COMMUNICATION_AMOUNT",
       "description": "Extracted amount: 'Rs 4,200' (FOUND)"
      },
      {
       "engine_source": "INTENT",
       "evidence_id": "SNIPPET-1",
       "epistemic_status": "EXTRACTED",
       "source_reference": "COMMUNICATION_RECIPIENT_ID",
       "description": "Extracted recipient_id: 'sample-refund-desk@ybl' (FOUND)"
      },
      {
       "engine_source": "INTENT",
       "evidence_id": "SNIPPET-2",
       "epistemic_status": "EXTRACTED",
       "source_reference": "COMMUNICATION_PURPOSE",
       "description": "Extracted purpose: 'refund' (FOUND)"
      },
      {
       "engine_source": "RECIPIENT",
       "evidence_id": "E-INV-01",
       "epistemic_status": "VERIFIED",
       "source_reference": "SAMPLE_BANK_INVESTIGATION_301",
       "description": "REPORTED_IN_CASE: Sample bank-confirmed case of utility impersonation. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-01]"
      },
      {
       "engine_source": "RECIPIENT",
       "evidence_id": "E-INV-02",
       "epistemic_status": "REPORTED",
       "source_reference": "SAMPLE_USER_COMPLAINT_302",
       "description": "REPORTED_IN_CASE: Sample customer report of a disconnection threat call."
      },
      {
       "engine_source": "RECIPIENT",
       "evidence_id": "E-INV-03",
       "epistemic_status": "INFERRED",
       "source_reference": "SAMPLE_GRAPH_LINK_11",
       "description": "SHARES_IDENTIFIER: Sample phone identifier observed on this beneficiary."
      },
      {
       "engine_source": "RECIPIENT",
       "evidence_id": "PATH-sample-refund-desk@ybl-SAMPLE-PHONE-11-sample-mule@okicici",
       "epistemic_status": "INFERRED",
       "source_reference": "SAMPLE_GRAPH_LINK_11",
       "description": "SHARES_IDENTIFIER: Beneficiary 'sample-refund-desk@ybl' shares identifier node 'SAMPLE-PHONE-11' with beneficiary 'sample-mule@okicici'. (Inferred association, does not prove common ownership)."
      }
     ],
     "explanation": "Unified transaction evaluation for customer 'CUST-DEMO-09' paying 'sample-refund-desk@ybl' produced composite risk score 0.85 (HIGH) under policy 'PAYGUARD_UNIFIED_POLICY_V1'. Intent Correlation: Evaluated with risk tier LOW (heuristic score 0.1). Critical Recipient Alert: Beneficiary has direct associations with VERIFIED fraud case filings; verified evidence override applied. Missing Streams (1): Customer behavioural history not evaluated: historical transactions unavailable. Conflict Resolution: Intent-Recipient Contradiction: Customer communication matched payment parameters, but destination recipient account is associated with VERIFIED fraud records.",
     "missing_evidence": [
      "Customer behavioural history not evaluated: historical transactions unavailable."
     ],
     "conflicting_signals": [
      "Intent-Recipient Contradiction: Customer communication matched payment parameters, but destination recipient account is associated with VERIFIED fraud records."
     ],
     "data_sufficiency": "LIMITED",
     "recommended_action": "MANUAL_REVIEW",
     "policy_version": "PAYGUARD_UNIFIED_POLICY_V1",
     "model_type": "PROVISIONAL_DETERMINISTIC_MULTI_ENGINE_FUSION_V1",
     "assessment_timestamp": "2026-11-21T22:00:00Z"
    },
    "intervention_recommendation": {
     "action": "MANUAL_REVIEW",
     "severity": "HIGH",
     "intervention_type": "FRAUD_ANALYST_QUEUE",
     "simulated_action_code": "ROUTE_TO_ANALYST",
     "user_guidance_message": "High Risk Alert: The destination recipient is associated with VERIFIED external law enforcement or judicial fraud records. Simulated transfer routed for manual fraud desk investigation. This is a simulation; no actual payment has been blocked.",
     "rationale": [
      "Verified Fraud Record: Recipient node is connected to corroborated police/court fraud records.",
      "Customer History: Behavioural baseline history was not submitted (not evaluated)."
     ],
     "simulated_intervention_active": true,
     "disclaimer": "Simulated intervention only. No live banking, UPI blocking, or payment gateway interception is executed."
    },
    "summary_narrative": "PAYGUARD AI evaluated transaction 'TX-16F6ED05' for customer 'CUST-DEMO-09' transferring to 'sample-refund-desk@ybl'. Synthesized composite risk score: 0.85 (HIGH). Recommended operational action: MANUAL_REVIEW (FRAUD_ANALYST_QUEUE). High Risk Alert: The destination recipient is associated with VERIFIED external law enforcement or judicial fraud records. Simulated transfer routed for manual fraud desk investigation. This is a simulation; no actual payment has been blocked.",
    "disclaimer": "PAYGUARD AI prototype simulation only. Payment intervention is simulated; no live banking or UPI transaction control is executed."
   }
  },
  {
   "submitted": {
    "amount": 750,
    "currency": "INR",
    "recipientId": "sample-unknown-payee@okbank"
   },
   "response": {
    "evaluation_id": "PPE-24A42C9C784F",
    "timestamp": "2026-11-21T15:00:00Z",
    "transaction_id": "TX-052D53B5",
    "customer_id": "CUST-DEMO-10",
    "recipient_id": "sample-unknown-payee@okbank",
    "customer_consent": true,
    "intent_assessment": {
     "status": "success",
     "consent_verified": true,
     "extracted_intent": {
      "amount": null,
      "amount_status": "NOT_FOUND",
      "currency": null,
      "recipient_id": null,
      "recipient_status": "NOT_FOUND",
      "purpose": null,
      "urgency_detected": false,
      "threat_detected": false,
      "evidence_snippets": []
     },
     "comparison": {
      "amount_status": "NOT_FOUND",
      "amount_difference": null,
      "currency_status": "NOT_FOUND",
      "recipient_status": "NOT_FOUND",
      "normalized_requested_currency": null,
      "normalized_transaction_currency": "INR",
      "normalized_requested_recipient": null,
      "normalized_transaction_recipient": "sample-unknown-payee@okbank",
      "summary": "No explicit currency code was specified in communication text. No requested payment amount was identified in communication text. No explicit recipient identifier was identified in communication text."
     },
     "risk_assessment": {
      "risk_level": "UNCERTAIN",
      "heuristic_score": 0.5,
      "score_type": "prototype_heuristic_score (deterministic rule-based, non-ML)",
      "reasons": [
       "Insufficient payment details could be reliably extracted from the supplied communication.",
       "The system cannot establish whether the transaction matches the message intent."
      ],
      "signals_detected": [
       "INSUFFICIENT_EXTRACTION_EVIDENCE"
      ],
      "recommended_action": "REVIEW_PAYMENT_DETAILS"
     },
     "timestamp": "2026-11-21T15:00:00+00:00"
    },
    "behavioural_assessment": null,
    "recipient_assessment": null,
    "unified_risk_assessment": {
     "unified_assessment_id": "URA-D2E17143E874",
     "transaction_id": "TX-052D53B5",
     "customer_id": "CUST-DEMO-10",
     "recipient_id": "sample-unknown-payee@okbank",
     "overall_risk_score": "0.0000",
     "risk_level": "UNCERTAIN",
     "contributing_assessments": {
      "intent_correlation": "INTENT-2026-11-21T15:00:00+00:00",
      "behavioural_risk": null,
      "recipient_intelligence": null
     },
     "engine_signal_summary": {
      "intent_correlation": {
       "status": "EVALUATED",
       "risk_level": "UNCERTAIN",
       "heuristic_score": 0.5,
       "score_type": "prototype_heuristic_score (deterministic rule-based, non-ML)",
       "indicators": [
        "INSUFFICIENT_EXTRACTION_EVIDENCE"
       ]
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
      "Customer behavioural history not evaluated: historical transactions unavailable.",
      "Recipient risk intelligence not evaluated: target not queried against SPEG graph."
     ],
     "conflicting_signals": [],
     "data_sufficiency": "INSUFFICIENT",
     "recommended_action": "INSUFFICIENT_DATA_REVIEW",
     "policy_version": "PAYGUARD_UNIFIED_POLICY_V1",
     "model_type": "PROVISIONAL_DETERMINISTIC_MULTI_ENGINE_FUSION_V1",
     "assessment_timestamp": "2026-11-21T15:00:00Z"
    },
    "intervention_recommendation": {
     "action": "INSUFFICIENT_DATA_REVIEW",
     "severity": "UNCERTAIN",
     "intervention_type": "FALLBACK_CONFIRMATION",
     "simulated_action_code": "PROMPT_MANUAL_CONFIRMATION",
     "user_guidance_message": "Notice: Insufficient historical or graph intelligence available to definitively score transaction safety. Please confirm you personally know and trust this recipient before proceeding. This is a simulation; no actual payment has been affected.",
     "rationale": [
      "Customer behavioural history not evaluated: historical transactions unavailable.",
      "Recipient risk intelligence not evaluated: target not queried against SPEG graph."
     ],
     "simulated_intervention_active": true,
     "disclaimer": "Simulated intervention only. No live banking, UPI blocking, or payment gateway interception is executed."
    },
    "summary_narrative": "PAYGUARD AI evaluated transaction 'TX-052D53B5' for customer 'CUST-DEMO-10' transferring to 'sample-unknown-payee@okbank'. Synthesized composite risk score: 0.0000 (UNCERTAIN). Recommended operational action: INSUFFICIENT_DATA_REVIEW (FALLBACK_CONFIRMATION). Notice: Insufficient historical or graph intelligence available to definitively score transaction safety. Please confirm you personally know and trust this recipient before proceeding. This is a simulation; no actual payment has been affected.",
    "disclaimer": "PAYGUARD AI prototype simulation only. Payment intervention is simulated; no live banking or UPI transaction control is executed."
   }
  },
  {
   "submitted": {
    "amount": 1500,
    "currency": "INR",
    "recipientId": "sample-other-seller@ybl"
   },
   "response": {
    "evaluation_id": "PPE-B5F04D27DD9B",
    "timestamp": "2026-11-21T10:00:00Z",
    "transaction_id": "TX-3C002442",
    "customer_id": "CUST-DEMO-11",
    "recipient_id": "sample-other-seller@ybl",
    "customer_consent": true,
    "intent_assessment": {
     "status": "success",
     "consent_verified": true,
     "extracted_intent": {
      "amount": 1500.0,
      "amount_status": "FOUND",
      "currency": "INR",
      "recipient_id": "sample-other-seller@ybl",
      "recipient_status": "FOUND",
      "purpose": null,
      "urgency_detected": false,
      "threat_detected": false,
      "evidence_snippets": [
       {
        "field": "amount",
        "extracted_value": "INR 1500.0",
        "text_snippet": "Rs 1,500",
        "start_char": 4,
        "end_char": 12,
        "status": "FOUND"
       },
       {
        "field": "recipient_id",
        "extracted_value": "sample-other-seller@ybl",
        "text_snippet": "sample-other-seller@ybl",
        "start_char": 16,
        "end_char": 39,
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
      "normalized_requested_recipient": "sample-other-seller@ybl",
      "normalized_transaction_recipient": "sample-other-seller@ybl",
      "summary": "Amount matches requested instruction (INR 1,500.00). Recipient matches requested beneficiary (sample-other-seller@ybl)."
     },
     "risk_assessment": {
      "risk_level": "LOW",
      "heuristic_score": 0.1,
      "score_type": "prototype_heuristic_score (deterministic rule-based, non-ML)",
      "reasons": [
       "Both requested amount (INR 1,500.00) and recipient ('sample-other-seller@ybl') match the communication instructions.",
       "No payment-instruction mismatch was identified in the available evidence.",
       "DISCLAIMER: A matching request does not establish that the communication or recipient is legitimate, verified safe, or fraud-free. Always remain alert to social engineering."
      ],
      "signals_detected": [
       "FULL_INTENT_TRANSACTION_MATCH"
      ],
      "recommended_action": "PROCEED_WITH_STANDARD_VERIFICATION"
     },
     "timestamp": "2026-11-21T10:00:00+00:00"
    },
    "behavioural_assessment": null,
    "recipient_assessment": {
     "assessment_id": "RRA-001B995EB9CD",
     "recipient_id": "sample-other-seller@ybl",
     "graph_id": "SPEG-DEMO-INVESTIGATOR",
     "assessment_timestamp": "2026-11-21T10:00:00Z",
     "recipient_risk_score": "0.12",
     "risk_level": "LOW",
     "data_sufficiency": "LIMITED",
     "detected_indicators": [
      "INFERRED_SHARED_IDENTIFIERS (1 shared identifier(s))"
     ],
     "feature_contributions": {
      "verified_fraud_case_association": 0.0,
      "reported_fraud_case_association": 0.0,
      "inferred_shared_identifier_relationships": 0.12,
      "transaction_volume_context": 0.0
     },
     "explanation": "Recipient 'sample-other-seller@ybl' evaluated under model 'PROVISIONAL_DETERMINISTIC_RECIPIENT_SCORER_V1' with score 0.12 (LOW). Inferred associations: Associated with 1 shared identifier node(s) (+0.12). Inferred associations reflect network co-occurrence and alone cannot produce HIGH risk.",
     "supporting_evidence": [
      {
       "edge_id": "E-INV-08",
       "source_reference": "SAMPLE_GRAPH_LINK_77",
       "evidence_status": "INFERRED",
       "relationship_type": "SHARES_IDENTIFIER",
       "observed_at": "2026-11-13T14:00:00Z",
       "source_node_id": "sample-other-seller@ybl",
       "target_node_id": "SAMPLE-DEVICE-77",
       "path": [
        "sample-other-seller@ybl",
        "SAMPLE-DEVICE-77"
       ],
       "description": "Sample device identifier observed on this beneficiary."
      },
      {
       "edge_id": "PATH-sample-other-seller@ybl-SAMPLE-DEVICE-77-sample-new-seller@ybl",
       "source_reference": "SAMPLE_GRAPH_LINK_77",
       "evidence_status": "INFERRED",
       "relationship_type": "SHARES_IDENTIFIER",
       "observed_at": "2026-11-13T14:00:00Z",
       "source_node_id": "sample-other-seller@ybl",
       "target_node_id": "sample-new-seller@ybl",
       "path": [
        "sample-other-seller@ybl",
        "SAMPLE-DEVICE-77",
        "sample-new-seller@ybl"
       ],
       "description": "Beneficiary 'sample-other-seller@ybl' shares identifier node 'SAMPLE-DEVICE-77' with beneficiary 'sample-new-seller@ybl'. (Inferred association, does not prove common ownership)."
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
     "unified_assessment_id": "URA-BE5946503EDD",
     "transaction_id": "TX-3C002442",
     "customer_id": "CUST-DEMO-11",
     "recipient_id": "sample-other-seller@ybl",
     "overall_risk_score": "0.1086",
     "risk_level": "LOW",
     "contributing_assessments": {
      "intent_correlation": "INTENT-2026-11-21T10:00:00+00:00",
      "behavioural_risk": null,
      "recipient_intelligence": "RRA-001B995EB9CD"
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
       "status": "NOT_EVALUATED",
       "risk_level": "UNAVAILABLE",
       "anomaly_score": null,
       "notes": "No historical customer transaction baseline submitted."
      },
      "recipient_intelligence": {
       "status": "EVALUATED",
       "risk_level": "LOW",
       "recipient_risk_score": 0.12,
       "data_sufficiency": "LIMITED",
       "indicators": [
        "INFERRED_SHARED_IDENTIFIERS (1 shared identifier(s))"
       ]
      }
     },
     "detected_indicators": [
      "INFERRED_NETWORK_LINKS_ONLY_GUARDRAIL",
      "INTENT_FULL_INTENT_TRANSACTION_MATCH",
      "RECIPIENT_INFERRED_SHARED_IDENTIFIERS (1 shared identifier(s))"
     ],
     "feature_contributions": {
      "intent": 0.0571,
      "recipient": 0.0514
     },
     "supporting_evidence": [
      {
       "engine_source": "INTENT",
       "evidence_id": "SNIPPET-0",
       "epistemic_status": "EXTRACTED",
       "source_reference": "COMMUNICATION_AMOUNT",
       "description": "Extracted amount: 'Rs 1,500' (FOUND)"
      },
      {
       "engine_source": "INTENT",
       "evidence_id": "SNIPPET-1",
       "epistemic_status": "EXTRACTED",
       "source_reference": "COMMUNICATION_RECIPIENT_ID",
       "description": "Extracted recipient_id: 'sample-other-seller@ybl' (FOUND)"
      },
      {
       "engine_source": "RECIPIENT",
       "evidence_id": "E-INV-08",
       "epistemic_status": "INFERRED",
       "source_reference": "SAMPLE_GRAPH_LINK_77",
       "description": "SHARES_IDENTIFIER: Sample device identifier observed on this beneficiary."
      },
      {
       "engine_source": "RECIPIENT",
       "evidence_id": "PATH-sample-other-seller@ybl-SAMPLE-DEVICE-77-sample-new-seller@ybl",
       "epistemic_status": "INFERRED",
       "source_reference": "SAMPLE_GRAPH_LINK_77",
       "description": "SHARES_IDENTIFIER: Beneficiary 'sample-other-seller@ybl' shares identifier node 'SAMPLE-DEVICE-77' with beneficiary 'sample-new-seller@ybl'. (Inferred association, does not prove common ownership)."
      }
     ],
     "explanation": "Unified transaction evaluation for customer 'CUST-DEMO-11' paying 'sample-other-seller@ybl' produced composite risk score 0.1086 (LOW) under policy 'PAYGUARD_UNIFIED_POLICY_V1'. Intent Correlation: Evaluated with risk tier LOW (heuristic score 0.1). Recipient Intelligence: Evaluated with risk tier LOW (score 0.12, sufficiency LIMITED). Missing Streams (1): Customer behavioural history not evaluated: historical transactions unavailable.",
     "missing_evidence": [
      "Customer behavioural history not evaluated: historical transactions unavailable."
     ],
     "conflicting_signals": [],
     "data_sufficiency": "LIMITED",
     "recommended_action": "ALLOW_WITH_CAUTION",
     "policy_version": "PAYGUARD_UNIFIED_POLICY_V1",
     "model_type": "PROVISIONAL_DETERMINISTIC_MULTI_ENGINE_FUSION_V1",
     "assessment_timestamp": "2026-11-21T10:00:00Z"
    },
    "intervention_recommendation": {
     "action": "ALLOW_WITH_CAUTION",
     "severity": "LOW",
     "intervention_type": "TRANSACTION_PERMITTED",
     "simulated_action_code": "PERMIT",
     "user_guidance_message": "Payment parameters match communication instructions. Customer history was not evaluated. Transaction permitted in simulation with standard monitoring. This is a simulation; no live payment execution is performed.",
     "rationale": [
      "Communication Intent: Recipient handle matches extracted communication instructions.",
      "Customer History: Behavioural baseline history was not submitted (not evaluated).",
      "Recipient Evidence: No adverse fraud associations observed in evidence graph."
     ],
     "simulated_intervention_active": true,
     "disclaimer": "Simulated intervention only. No live banking, UPI blocking, or payment gateway interception is executed."
    },
    "summary_narrative": "PAYGUARD AI evaluated transaction 'TX-3C002442' for customer 'CUST-DEMO-11' transferring to 'sample-other-seller@ybl'. Synthesized composite risk score: 0.1086 (LOW). Recommended operational action: ALLOW_WITH_CAUTION (TRANSACTION_PERMITTED). Payment parameters match communication instructions. Customer history was not evaluated. Transaction permitted in simulation with standard monitoring. This is a simulation; no live payment execution is performed.",
    "disclaimer": "PAYGUARD AI prototype simulation only. Payment intervention is simulated; no live banking or UPI transaction control is executed."
   }
  },
  {
   "submitted": {
    "amount": 9000,
    "currency": "INR",
    "recipientId": "sample-landlord@okhdfc"
   },
   "response": {
    "evaluation_id": "PPE-3B3BDDC7EE63",
    "timestamp": "2026-11-23T03:00:00Z",
    "transaction_id": "TX-4A9FC6C6",
    "customer_id": "CUST-DEMO-12",
    "recipient_id": "sample-landlord@okhdfc",
    "customer_consent": true,
    "intent_assessment": {
     "status": "success",
     "consent_verified": true,
     "extracted_intent": {
      "amount": 9000.0,
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
        "extracted_value": "INR 9000.0",
        "text_snippet": "Rs 9,000",
        "start_char": 16,
        "end_char": 24,
        "status": "FOUND"
       },
       {
        "field": "recipient_id",
        "extracted_value": "sample-landlord@okhdfc",
        "text_snippet": "sample-landlord@okhdfc",
        "start_char": 41,
        "end_char": 63,
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
      "summary": "Amount matches requested instruction (INR 9,000.00). Recipient matches requested beneficiary (sample-landlord@okhdfc)."
     },
     "risk_assessment": {
      "risk_level": "LOW",
      "heuristic_score": 0.1,
      "score_type": "prototype_heuristic_score (deterministic rule-based, non-ML)",
      "reasons": [
       "Both requested amount (INR 9,000.00) and recipient ('sample-landlord@okhdfc') match the communication instructions.",
       "No payment-instruction mismatch was identified in the available evidence.",
       "DISCLAIMER: A matching request does not establish that the communication or recipient is legitimate, verified safe, or fraud-free. Always remain alert to social engineering."
      ],
      "signals_detected": [
       "FULL_INTENT_TRANSACTION_MATCH"
      ],
      "recommended_action": "PROCEED_WITH_STANDARD_VERIFICATION"
     },
     "timestamp": "2026-11-23T03:00:00+00:00"
    },
    "behavioural_assessment": {
     "assessment_id": "ASM-EEB5A0B74A1C",
     "customer_id": "CUST-DEMO-12",
     "transaction_id": "TX-4A9FC6C6",
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
      "Amount 9000.0 INR matches uniform historical baseline (9000 INR, ratio 1.00x).",
      "Familiar beneficiary: 'sample-landlord@okhdfc' has received 10 prior payments (100.00% of customer history).",
      "Transaction velocity conforms to normal pacing.",
      "Payment method 'UPI' is known and previously utilized.",
      "Time of day (03:00 UTC) conforms to known customer activity corridors (shortest distance: 120 mins)."
     ],
     "data_sufficiency": "SUFFICIENT",
     "model_type": "deterministic_heuristic_anomaly_scorer (provisional v1)",
     "assessment_timestamp": "2026-11-24T15:04:10.345044Z"
    },
    "recipient_assessment": {
     "assessment_id": "RRA-932DB6A6306B",
     "recipient_id": "sample-landlord@okhdfc",
     "graph_id": "SPEG-DEMO-INVESTIGATOR",
     "assessment_timestamp": "2026-11-23T03:00:00Z",
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
       "edge_id": "E-INV-12",
       "source_reference": "SAMPLE_LEDGER_A_01",
       "evidence_status": "VERIFIED",
       "relationship_type": "PAID_TO",
       "observed_at": "2026-10-24T14:00:00Z",
       "source_node_id": "SAMPLE-CUST-A",
       "target_node_id": "sample-landlord@okhdfc",
       "path": [
        "SAMPLE-CUST-A",
        "sample-landlord@okhdfc"
       ],
       "description": "Sample settled rent payment. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-12]"
      },
      {
       "edge_id": "E-INV-13",
       "source_reference": "SAMPLE_LEDGER_B_01",
       "evidence_status": "VERIFIED",
       "relationship_type": "PAID_TO",
       "observed_at": "2026-10-23T14:00:00Z",
       "source_node_id": "SAMPLE-CUST-B",
       "target_node_id": "sample-landlord@okhdfc",
       "path": [
        "SAMPLE-CUST-B",
        "sample-landlord@okhdfc"
       ],
       "description": "Sample settled rent payment. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-13]"
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
     "unified_assessment_id": "URA-85DF81B9E1F3",
     "transaction_id": "TX-4A9FC6C6",
     "customer_id": "CUST-DEMO-12",
     "recipient_id": "sample-landlord@okhdfc",
     "overall_risk_score": "0.04",
     "risk_level": "LOW",
     "contributing_assessments": {
      "intent_correlation": "INTENT-2026-11-23T03:00:00+00:00",
      "behavioural_risk": "ASM-EEB5A0B74A1C",
      "recipient_intelligence": "RRA-932DB6A6306B"
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
       "description": "Extracted amount: 'Rs 9,000' (FOUND)"
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
       "evidence_id": "E-INV-12",
       "epistemic_status": "VERIFIED",
       "source_reference": "SAMPLE_LEDGER_A_01",
       "description": "PAID_TO: Sample settled rent payment. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-12]"
      },
      {
       "engine_source": "RECIPIENT",
       "evidence_id": "E-INV-13",
       "epistemic_status": "VERIFIED",
       "source_reference": "SAMPLE_LEDGER_B_01",
       "description": "PAID_TO: Sample settled rent payment. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-13]"
      }
     ],
     "explanation": "Unified transaction evaluation for customer 'CUST-DEMO-12' paying 'sample-landlord@okhdfc' produced composite risk score 0.04 (LOW) under policy 'PAYGUARD_UNIFIED_POLICY_V1'. Intent Correlation: Evaluated with risk tier LOW (heuristic score 0.1). Recipient Intelligence: Evaluated with risk tier LOW (score 0.0, sufficiency LIMITED). Behavioural Anomaly: Evaluated with risk tier LOW (anomaly score 0.0000, sufficiency SUFFICIENT).",
     "missing_evidence": [],
     "conflicting_signals": [],
     "data_sufficiency": "LIMITED",
     "recommended_action": "ALLOW_WITH_CAUTION",
     "policy_version": "PAYGUARD_UNIFIED_POLICY_V1",
     "model_type": "PROVISIONAL_DETERMINISTIC_MULTI_ENGINE_FUSION_V1",
     "assessment_timestamp": "2026-11-23T03:00:00Z"
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
    "summary_narrative": "PAYGUARD AI evaluated transaction 'TX-4A9FC6C6' for customer 'CUST-DEMO-12' transferring to 'sample-landlord@okhdfc'. Synthesized composite risk score: 0.04 (LOW). Recommended operational action: ALLOW_WITH_CAUTION (TRANSACTION_PERMITTED). Payment parameters match expected communication intent and customer historical baseline. Transaction permitted with standard security monitoring. This is a simulation; no live payment execution is performed.",
    "disclaimer": "PAYGUARD AI prototype simulation only. Payment intervention is simulated; no live banking or UPI transaction control is executed."
   }
  }
 ],
 "recipients": {
  "sample-refund-desk@ybl": {
   "evidence": {
    "recipient_id": "sample-refund-desk@ybl",
    "recipient_node": {
     "node_id": "sample-refund-desk@ybl",
     "node_type": "BENEFICIARY",
     "display_label": "Sample beneficiary (refund desk)",
     "synthetic_identifier": "sample-refund-desk@ybl",
     "created_at": "2026-10-14T14:00:00Z",
     "metadata": {}
    },
    "connected_node_count": 3,
    "total_evidence_edge_count": 3,
    "verified_edge_count": 1,
    "reported_edge_count": 1,
    "inferred_edge_count": 1,
    "connected_nodes": [
     {
      "node_id": "SAMPLE-CASE-301",
      "node_type": "FRAUD_CASE",
      "display_label": "Sample case 301",
      "synthetic_identifier": "SAMPLE-CASE-301",
      "created_at": "2026-11-14T14:00:00Z",
      "metadata": {}
     },
     {
      "node_id": "SAMPLE-CASE-302",
      "node_type": "FRAUD_CASE",
      "display_label": "Sample complaint 302",
      "synthetic_identifier": "SAMPLE-CASE-302",
      "created_at": "2026-11-19T14:00:00Z",
      "metadata": {}
     },
     {
      "node_id": "SAMPLE-PHONE-11",
      "node_type": "IDENTIFIER",
      "display_label": "Sample shared phone identifier",
      "synthetic_identifier": "SAMPLE-PHONE-11",
      "created_at": "2026-11-09T14:00:00Z",
      "metadata": {}
     }
    ],
    "evidence_edges": [
     {
      "edge_id": "E-INV-01",
      "source_node_id": "sample-refund-desk@ybl",
      "target_node_id": "SAMPLE-CASE-301",
      "relationship_type": "REPORTED_IN_CASE",
      "evidence_status": "VERIFIED",
      "source_reference": "SAMPLE_BANK_INVESTIGATION_301",
      "observed_at": "2026-11-16T14:00:00Z",
      "expires_at": null,
      "confidence": null,
      "description": "Sample bank-confirmed case of utility impersonation. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-01]",
      "metadata": {
       "verification_audit": {
        "original_evidence_status": "REPORTED",
        "verified_at": "2026-11-24T15:04:10.335480Z",
        "verified_by": "SAMPLE_DEMO_AUTHORITY",
        "verification_authority_org": "INTERNAL_COMPLIANCE_OPS",
        "verification_reference": "SAMPLE_VERIFICATION_E-INV-01",
        "verification_rationale": "Sample corroboration for demo fixtures only.",
        "audit_notes": ""
       }
      },
      "verification_audit": {
       "original_evidence_status": "REPORTED",
       "verified_at": "2026-11-24T15:04:10.335480Z",
       "verified_by": "SAMPLE_DEMO_AUTHORITY",
       "verification_authority_org": "INTERNAL_COMPLIANCE_OPS",
       "verification_reference": "SAMPLE_VERIFICATION_E-INV-01",
       "verification_rationale": "Sample corroboration for demo fixtures only.",
       "audit_notes": ""
      }
     },
     {
      "edge_id": "E-INV-02",
      "source_node_id": "sample-refund-desk@ybl",
      "target_node_id": "SAMPLE-CASE-302",
      "relationship_type": "REPORTED_IN_CASE",
      "evidence_status": "REPORTED",
      "source_reference": "SAMPLE_USER_COMPLAINT_302",
      "observed_at": "2026-11-20T14:00:00Z",
      "expires_at": null,
      "confidence": null,
      "description": "Sample customer report of a disconnection threat call.",
      "metadata": {},
      "verification_audit": null
     },
     {
      "edge_id": "E-INV-03",
      "source_node_id": "sample-refund-desk@ybl",
      "target_node_id": "SAMPLE-PHONE-11",
      "relationship_type": "SHARES_IDENTIFIER",
      "evidence_status": "INFERRED",
      "source_reference": "SAMPLE_GRAPH_LINK_11",
      "observed_at": "2026-11-11T14:00:00Z",
      "expires_at": null,
      "confidence": null,
      "description": "Sample phone identifier observed on this beneficiary.",
      "metadata": {},
      "verification_audit": null
     }
    ],
    "query_reference_time": "2026-11-23T14:00:00Z",
    "expired_edges_excluded_count": 0,
    "assessment_notes": [
     "Entity 'sample-refund-desk@ybl' retrieved from SPEG graph as type 'BENEFICIARY'.",
     "Found 3 directly connected entities and 3 active evidence relationships.",
     "Evidence Status Breakdown: 1 VERIFIED, 1 REPORTED, 1 INFERRED.",
     "SPEG graph construction and provenance-aware evidence retrieval active. Recipient risk scoring and automatic fraud relationship inference are not yet implemented."
    ]
   },
   "profile": {
    "recipient_id": "sample-refund-desk@ybl",
    "graph_id": "SPEG-DEMO-INVESTIGATOR",
    "analysis_timestamp": "2026-11-23T14:00:00Z",
    "direct_customer_count": 0,
    "total_transaction_count": 0,
    "distinct_beneficiary_association_count": 1,
    "verified_evidence_count": 1,
    "reported_evidence_count": 1,
    "inferred_evidence_count": 1,
    "shared_identifier_count": 1,
    "recent_relationship_count": 3,
    "expired_relationship_count": 0,
    "evidence_summary": "Recipient intelligence profile for 'sample-refund-desk@ybl' (Sample beneficiary (refund desk)). Direct relationships: 0 distinct customers, 0 transactions. Active evidence breakdown: 1 VERIFIED, 1 REPORTED, 1 INFERRED. Network association: Connected to 1 other beneficiaries via 1 shared identifiers. (Note: Shared infrastructure does not establish common ownership or coordinated fraud). Linked to 2 distinct fraud case filings. Recipient relationship analysis active. Recipient risk scoring, ownership inference and automatic fraud classification are not yet implemented.",
    "supporting_evidence": [
     {
      "edge_id": "E-INV-01",
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
      "description": "Sample bank-confirmed case of utility impersonation. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-01]"
     },
     {
      "edge_id": "E-INV-02",
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
      "edge_id": "E-INV-03",
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
      "description": "Sample phone identifier observed on this beneficiary."
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
    "data_sufficiency": "SUFFICIENT"
   },
   "risk": {
    "assessment_id": "RRA-59376DA58114",
    "recipient_id": "sample-refund-desk@ybl",
    "graph_id": "SPEG-DEMO-INVESTIGATOR",
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
      "edge_id": "E-INV-01",
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
      "description": "Sample bank-confirmed case of utility impersonation. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-01]"
     },
     {
      "edge_id": "E-INV-02",
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
      "edge_id": "E-INV-03",
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
      "description": "Sample phone identifier observed on this beneficiary."
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
   }
  },
  "sample-mule@okicici": {
   "evidence": {
    "recipient_id": "sample-mule@okicici",
    "recipient_node": {
     "node_id": "sample-mule@okicici",
     "node_type": "BENEFICIARY",
     "display_label": "Sample beneficiary",
     "synthetic_identifier": "sample-mule@okicici",
     "created_at": "2026-10-24T14:00:00Z",
     "metadata": {}
    },
    "connected_node_count": 2,
    "total_evidence_edge_count": 2,
    "verified_edge_count": 0,
    "reported_edge_count": 1,
    "inferred_edge_count": 1,
    "connected_nodes": [
     {
      "node_id": "SAMPLE-CASE-303",
      "node_type": "FRAUD_CASE",
      "display_label": "Sample complaint 303",
      "synthetic_identifier": "SAMPLE-CASE-303",
      "created_at": "2026-11-17T14:00:00Z",
      "metadata": {}
     },
     {
      "node_id": "SAMPLE-PHONE-11",
      "node_type": "IDENTIFIER",
      "display_label": "Sample shared phone identifier",
      "synthetic_identifier": "SAMPLE-PHONE-11",
      "created_at": "2026-11-09T14:00:00Z",
      "metadata": {}
     }
    ],
    "evidence_edges": [
     {
      "edge_id": "E-INV-04",
      "source_node_id": "sample-mule@okicici",
      "target_node_id": "SAMPLE-PHONE-11",
      "relationship_type": "SHARES_IDENTIFIER",
      "evidence_status": "INFERRED",
      "source_reference": "SAMPLE_GRAPH_LINK_11",
      "observed_at": "2026-11-11T14:00:00Z",
      "expires_at": null,
      "confidence": null,
      "description": "Sample phone identifier observed on this beneficiary.",
      "metadata": {},
      "verification_audit": null
     },
     {
      "edge_id": "E-INV-05",
      "source_node_id": "sample-mule@okicici",
      "target_node_id": "SAMPLE-CASE-303",
      "relationship_type": "REPORTED_IN_CASE",
      "evidence_status": "REPORTED",
      "source_reference": "SAMPLE_USER_COMPLAINT_303",
      "observed_at": "2026-11-18T14:00:00Z",
      "expires_at": null,
      "confidence": null,
      "description": "Sample customer report of an advance-fee request.",
      "metadata": {},
      "verification_audit": null
     }
    ],
    "query_reference_time": "2026-11-23T14:00:00Z",
    "expired_edges_excluded_count": 0,
    "assessment_notes": [
     "Entity 'sample-mule@okicici' retrieved from SPEG graph as type 'BENEFICIARY'.",
     "Found 2 directly connected entities and 2 active evidence relationships.",
     "Evidence Status Breakdown: 0 VERIFIED, 1 REPORTED, 1 INFERRED.",
     "Caution: Incident relationships contain uncorroborated REPORTED allegations with zero verified fraud outcomes.",
     "SPEG graph construction and provenance-aware evidence retrieval active. Recipient risk scoring and automatic fraud relationship inference are not yet implemented."
    ]
   },
   "profile": {
    "recipient_id": "sample-mule@okicici",
    "graph_id": "SPEG-DEMO-INVESTIGATOR",
    "analysis_timestamp": "2026-11-23T14:00:00Z",
    "direct_customer_count": 0,
    "total_transaction_count": 0,
    "distinct_beneficiary_association_count": 1,
    "verified_evidence_count": 0,
    "reported_evidence_count": 1,
    "inferred_evidence_count": 1,
    "shared_identifier_count": 1,
    "recent_relationship_count": 2,
    "expired_relationship_count": 0,
    "evidence_summary": "Recipient intelligence profile for 'sample-mule@okicici' (Sample beneficiary). Direct relationships: 0 distinct customers, 0 transactions. Active evidence breakdown: 0 VERIFIED, 1 REPORTED, 1 INFERRED. Network association: Connected to 1 other beneficiaries via 1 shared identifiers. (Note: Shared infrastructure does not establish common ownership or coordinated fraud). Linked to 1 distinct fraud case filings. Caution: Incident relationships contain uncorroborated REPORTED claims with zero confirmed fraud determinations. Recipient relationship analysis active. Recipient risk scoring, ownership inference and automatic fraud classification are not yet implemented.",
    "supporting_evidence": [
     {
      "edge_id": "E-INV-04",
      "source_reference": "SAMPLE_GRAPH_LINK_11",
      "evidence_status": "INFERRED",
      "relationship_type": "SHARES_IDENTIFIER",
      "observed_at": "2026-11-11T14:00:00Z",
      "source_node_id": "sample-mule@okicici",
      "target_node_id": "SAMPLE-PHONE-11",
      "path": [
       "sample-mule@okicici",
       "SAMPLE-PHONE-11"
      ],
      "description": "Sample phone identifier observed on this beneficiary."
     },
     {
      "edge_id": "E-INV-05",
      "source_reference": "SAMPLE_USER_COMPLAINT_303",
      "evidence_status": "REPORTED",
      "relationship_type": "REPORTED_IN_CASE",
      "observed_at": "2026-11-18T14:00:00Z",
      "source_node_id": "sample-mule@okicici",
      "target_node_id": "SAMPLE-CASE-303",
      "path": [
       "sample-mule@okicici",
       "SAMPLE-CASE-303"
      ],
      "description": "Sample customer report of an advance-fee request."
     },
     {
      "edge_id": "PATH-sample-mule@okicici-SAMPLE-PHONE-11-sample-refund-desk@ybl",
      "source_reference": "SAMPLE_GRAPH_LINK_11",
      "evidence_status": "INFERRED",
      "relationship_type": "SHARES_IDENTIFIER",
      "observed_at": "2026-11-11T14:00:00Z",
      "source_node_id": "sample-mule@okicici",
      "target_node_id": "sample-refund-desk@ybl",
      "path": [
       "sample-mule@okicici",
       "SAMPLE-PHONE-11",
       "sample-refund-desk@ybl"
      ],
      "description": "Beneficiary 'sample-mule@okicici' shares identifier node 'SAMPLE-PHONE-11' with beneficiary 'sample-refund-desk@ybl'. (Inferred association, does not prove common ownership)."
     }
    ],
    "data_sufficiency": "MINIMAL"
   },
   "risk": {
    "assessment_id": "RRA-5F3482EF5E59",
    "recipient_id": "sample-mule@okicici",
    "graph_id": "SPEG-DEMO-INVESTIGATOR",
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
    "explanation": "Recipient 'sample-mule@okicici' evaluated under model 'PROVISIONAL_DETERMINISTIC_RECIPIENT_SCORER_V1' with score 0.37 (MEDIUM). Reported allegations: Linked to 1 distinct reported source reference(s) with recent (5d ago) recency (+0.25). Inferred associations: Associated with 1 shared identifier node(s) (+0.12). Inferred associations reflect network co-occurrence and alone cannot produce HIGH risk.",
    "supporting_evidence": [
     {
      "edge_id": "E-INV-04",
      "source_reference": "SAMPLE_GRAPH_LINK_11",
      "evidence_status": "INFERRED",
      "relationship_type": "SHARES_IDENTIFIER",
      "observed_at": "2026-11-11T14:00:00Z",
      "source_node_id": "sample-mule@okicici",
      "target_node_id": "SAMPLE-PHONE-11",
      "path": [
       "sample-mule@okicici",
       "SAMPLE-PHONE-11"
      ],
      "description": "Sample phone identifier observed on this beneficiary."
     },
     {
      "edge_id": "E-INV-05",
      "source_reference": "SAMPLE_USER_COMPLAINT_303",
      "evidence_status": "REPORTED",
      "relationship_type": "REPORTED_IN_CASE",
      "observed_at": "2026-11-18T14:00:00Z",
      "source_node_id": "sample-mule@okicici",
      "target_node_id": "SAMPLE-CASE-303",
      "path": [
       "sample-mule@okicici",
       "SAMPLE-CASE-303"
      ],
      "description": "Sample customer report of an advance-fee request."
     },
     {
      "edge_id": "PATH-sample-mule@okicici-SAMPLE-PHONE-11-sample-refund-desk@ybl",
      "source_reference": "SAMPLE_GRAPH_LINK_11",
      "evidence_status": "INFERRED",
      "relationship_type": "SHARES_IDENTIFIER",
      "observed_at": "2026-11-11T14:00:00Z",
      "source_node_id": "sample-mule@okicici",
      "target_node_id": "sample-refund-desk@ybl",
      "path": [
       "sample-mule@okicici",
       "SAMPLE-PHONE-11",
       "sample-refund-desk@ybl"
      ],
      "description": "Beneficiary 'sample-mule@okicici' shares identifier node 'SAMPLE-PHONE-11' with beneficiary 'sample-refund-desk@ybl'. (Inferred association, does not prove common ownership)."
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
   }
  },
  "sample-new-seller@ybl": {
   "evidence": {
    "recipient_id": "sample-new-seller@ybl",
    "recipient_node": {
     "node_id": "sample-new-seller@ybl",
     "node_type": "BENEFICIARY",
     "display_label": "Sample beneficiary (online seller)",
     "synthetic_identifier": "sample-new-seller@ybl",
     "created_at": "2026-10-29T14:00:00Z",
     "metadata": {}
    },
    "connected_node_count": 2,
    "total_evidence_edge_count": 2,
    "verified_edge_count": 0,
    "reported_edge_count": 1,
    "inferred_edge_count": 1,
    "connected_nodes": [
     {
      "node_id": "SAMPLE-CASE-201",
      "node_type": "FRAUD_CASE",
      "display_label": "Sample complaint 201",
      "synthetic_identifier": "SAMPLE-CASE-201",
      "created_at": "2026-11-15T14:00:00Z",
      "metadata": {}
     },
     {
      "node_id": "SAMPLE-DEVICE-77",
      "node_type": "IDENTIFIER",
      "display_label": "Sample shared device identifier",
      "synthetic_identifier": "SAMPLE-DEVICE-77",
      "created_at": "2026-11-11T14:00:00Z",
      "metadata": {}
     }
    ],
    "evidence_edges": [
     {
      "edge_id": "E-INV-06",
      "source_node_id": "sample-new-seller@ybl",
      "target_node_id": "SAMPLE-CASE-201",
      "relationship_type": "REPORTED_IN_CASE",
      "evidence_status": "REPORTED",
      "source_reference": "SAMPLE_USER_COMPLAINT_201",
      "observed_at": "2026-11-17T14:00:00Z",
      "expires_at": null,
      "confidence": null,
      "description": "Sample complaint: item not delivered after advance payment.",
      "metadata": {},
      "verification_audit": null
     },
     {
      "edge_id": "E-INV-07",
      "source_node_id": "sample-new-seller@ybl",
      "target_node_id": "SAMPLE-DEVICE-77",
      "relationship_type": "SHARES_IDENTIFIER",
      "evidence_status": "INFERRED",
      "source_reference": "SAMPLE_GRAPH_LINK_77",
      "observed_at": "2026-11-13T14:00:00Z",
      "expires_at": null,
      "confidence": null,
      "description": "Sample device identifier observed on this beneficiary.",
      "metadata": {},
      "verification_audit": null
     }
    ],
    "query_reference_time": "2026-11-23T14:00:00Z",
    "expired_edges_excluded_count": 0,
    "assessment_notes": [
     "Entity 'sample-new-seller@ybl' retrieved from SPEG graph as type 'BENEFICIARY'.",
     "Found 2 directly connected entities and 2 active evidence relationships.",
     "Evidence Status Breakdown: 0 VERIFIED, 1 REPORTED, 1 INFERRED.",
     "Caution: Incident relationships contain uncorroborated REPORTED allegations with zero verified fraud outcomes.",
     "SPEG graph construction and provenance-aware evidence retrieval active. Recipient risk scoring and automatic fraud relationship inference are not yet implemented."
    ]
   },
   "profile": {
    "recipient_id": "sample-new-seller@ybl",
    "graph_id": "SPEG-DEMO-INVESTIGATOR",
    "analysis_timestamp": "2026-11-23T14:00:00Z",
    "direct_customer_count": 0,
    "total_transaction_count": 0,
    "distinct_beneficiary_association_count": 1,
    "verified_evidence_count": 0,
    "reported_evidence_count": 1,
    "inferred_evidence_count": 1,
    "shared_identifier_count": 1,
    "recent_relationship_count": 2,
    "expired_relationship_count": 0,
    "evidence_summary": "Recipient intelligence profile for 'sample-new-seller@ybl' (Sample beneficiary (online seller)). Direct relationships: 0 distinct customers, 0 transactions. Active evidence breakdown: 0 VERIFIED, 1 REPORTED, 1 INFERRED. Network association: Connected to 1 other beneficiaries via 1 shared identifiers. (Note: Shared infrastructure does not establish common ownership or coordinated fraud). Linked to 1 distinct fraud case filings. Caution: Incident relationships contain uncorroborated REPORTED claims with zero confirmed fraud determinations. Recipient relationship analysis active. Recipient risk scoring, ownership inference and automatic fraud classification are not yet implemented.",
    "supporting_evidence": [
     {
      "edge_id": "E-INV-06",
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
      "description": "Sample complaint: item not delivered after advance payment."
     },
     {
      "edge_id": "E-INV-07",
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
      "description": "Sample device identifier observed on this beneficiary."
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
    "data_sufficiency": "MINIMAL"
   },
   "risk": {
    "assessment_id": "RRA-97BA3FEE5A27",
    "recipient_id": "sample-new-seller@ybl",
    "graph_id": "SPEG-DEMO-INVESTIGATOR",
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
      "edge_id": "E-INV-06",
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
      "description": "Sample complaint: item not delivered after advance payment."
     },
     {
      "edge_id": "E-INV-07",
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
      "description": "Sample device identifier observed on this beneficiary."
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
   }
  },
  "sample-other-seller@ybl": {
   "evidence": {
    "recipient_id": "sample-other-seller@ybl",
    "recipient_node": {
     "node_id": "sample-other-seller@ybl",
     "node_type": "BENEFICIARY",
     "display_label": "Sample beneficiary",
     "synthetic_identifier": "sample-other-seller@ybl",
     "created_at": "2026-10-29T14:00:00Z",
     "metadata": {}
    },
    "connected_node_count": 1,
    "total_evidence_edge_count": 1,
    "verified_edge_count": 0,
    "reported_edge_count": 0,
    "inferred_edge_count": 1,
    "connected_nodes": [
     {
      "node_id": "SAMPLE-DEVICE-77",
      "node_type": "IDENTIFIER",
      "display_label": "Sample shared device identifier",
      "synthetic_identifier": "SAMPLE-DEVICE-77",
      "created_at": "2026-11-11T14:00:00Z",
      "metadata": {}
     }
    ],
    "evidence_edges": [
     {
      "edge_id": "E-INV-08",
      "source_node_id": "sample-other-seller@ybl",
      "target_node_id": "SAMPLE-DEVICE-77",
      "relationship_type": "SHARES_IDENTIFIER",
      "evidence_status": "INFERRED",
      "source_reference": "SAMPLE_GRAPH_LINK_77",
      "observed_at": "2026-11-13T14:00:00Z",
      "expires_at": null,
      "confidence": null,
      "description": "Sample device identifier observed on this beneficiary.",
      "metadata": {},
      "verification_audit": null
     }
    ],
    "query_reference_time": "2026-11-23T14:00:00Z",
    "expired_edges_excluded_count": 0,
    "assessment_notes": [
     "Entity 'sample-other-seller@ybl' retrieved from SPEG graph as type 'BENEFICIARY'.",
     "Found 1 directly connected entities and 1 active evidence relationships.",
     "Evidence Status Breakdown: 0 VERIFIED, 0 REPORTED, 1 INFERRED.",
     "SPEG graph construction and provenance-aware evidence retrieval active. Recipient risk scoring and automatic fraud relationship inference are not yet implemented."
    ]
   },
   "profile": {
    "recipient_id": "sample-other-seller@ybl",
    "graph_id": "SPEG-DEMO-INVESTIGATOR",
    "analysis_timestamp": "2026-11-23T14:00:00Z",
    "direct_customer_count": 0,
    "total_transaction_count": 0,
    "distinct_beneficiary_association_count": 1,
    "verified_evidence_count": 0,
    "reported_evidence_count": 0,
    "inferred_evidence_count": 1,
    "shared_identifier_count": 1,
    "recent_relationship_count": 1,
    "expired_relationship_count": 0,
    "evidence_summary": "Recipient intelligence profile for 'sample-other-seller@ybl' (Sample beneficiary). Direct relationships: 0 distinct customers, 0 transactions. Active evidence breakdown: 0 VERIFIED, 0 REPORTED, 1 INFERRED. Network association: Connected to 1 other beneficiaries via 1 shared identifiers. (Note: Shared infrastructure does not establish common ownership or coordinated fraud). Recipient relationship analysis active. Recipient risk scoring, ownership inference and automatic fraud classification are not yet implemented.",
    "supporting_evidence": [
     {
      "edge_id": "E-INV-08",
      "source_reference": "SAMPLE_GRAPH_LINK_77",
      "evidence_status": "INFERRED",
      "relationship_type": "SHARES_IDENTIFIER",
      "observed_at": "2026-11-13T14:00:00Z",
      "source_node_id": "sample-other-seller@ybl",
      "target_node_id": "SAMPLE-DEVICE-77",
      "path": [
       "sample-other-seller@ybl",
       "SAMPLE-DEVICE-77"
      ],
      "description": "Sample device identifier observed on this beneficiary."
     },
     {
      "edge_id": "PATH-sample-other-seller@ybl-SAMPLE-DEVICE-77-sample-new-seller@ybl",
      "source_reference": "SAMPLE_GRAPH_LINK_77",
      "evidence_status": "INFERRED",
      "relationship_type": "SHARES_IDENTIFIER",
      "observed_at": "2026-11-13T14:00:00Z",
      "source_node_id": "sample-other-seller@ybl",
      "target_node_id": "sample-new-seller@ybl",
      "path": [
       "sample-other-seller@ybl",
       "SAMPLE-DEVICE-77",
       "sample-new-seller@ybl"
      ],
      "description": "Beneficiary 'sample-other-seller@ybl' shares identifier node 'SAMPLE-DEVICE-77' with beneficiary 'sample-new-seller@ybl'. (Inferred association, does not prove common ownership)."
     }
    ],
    "data_sufficiency": "MINIMAL"
   },
   "risk": {
    "assessment_id": "RRA-8508926A6158",
    "recipient_id": "sample-other-seller@ybl",
    "graph_id": "SPEG-DEMO-INVESTIGATOR",
    "assessment_timestamp": "2026-11-23T14:00:00Z",
    "recipient_risk_score": "0.12",
    "risk_level": "LOW",
    "data_sufficiency": "LIMITED",
    "detected_indicators": [
     "INFERRED_SHARED_IDENTIFIERS (1 shared identifier(s))"
    ],
    "feature_contributions": {
     "verified_fraud_case_association": 0.0,
     "reported_fraud_case_association": 0.0,
     "inferred_shared_identifier_relationships": 0.12,
     "transaction_volume_context": 0.0
    },
    "explanation": "Recipient 'sample-other-seller@ybl' evaluated under model 'PROVISIONAL_DETERMINISTIC_RECIPIENT_SCORER_V1' with score 0.12 (LOW). Inferred associations: Associated with 1 shared identifier node(s) (+0.12). Inferred associations reflect network co-occurrence and alone cannot produce HIGH risk.",
    "supporting_evidence": [
     {
      "edge_id": "E-INV-08",
      "source_reference": "SAMPLE_GRAPH_LINK_77",
      "evidence_status": "INFERRED",
      "relationship_type": "SHARES_IDENTIFIER",
      "observed_at": "2026-11-13T14:00:00Z",
      "source_node_id": "sample-other-seller@ybl",
      "target_node_id": "SAMPLE-DEVICE-77",
      "path": [
       "sample-other-seller@ybl",
       "SAMPLE-DEVICE-77"
      ],
      "description": "Sample device identifier observed on this beneficiary."
     },
     {
      "edge_id": "PATH-sample-other-seller@ybl-SAMPLE-DEVICE-77-sample-new-seller@ybl",
      "source_reference": "SAMPLE_GRAPH_LINK_77",
      "evidence_status": "INFERRED",
      "relationship_type": "SHARES_IDENTIFIER",
      "observed_at": "2026-11-13T14:00:00Z",
      "source_node_id": "sample-other-seller@ybl",
      "target_node_id": "sample-new-seller@ybl",
      "path": [
       "sample-other-seller@ybl",
       "SAMPLE-DEVICE-77",
       "sample-new-seller@ybl"
      ],
      "description": "Beneficiary 'sample-other-seller@ybl' shares identifier node 'SAMPLE-DEVICE-77' with beneficiary 'sample-new-seller@ybl'. (Inferred association, does not prove common ownership)."
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
   }
  },
  "sample-kyc-update@ybl": {
   "evidence": {
    "recipient_id": "sample-kyc-update@ybl",
    "recipient_node": {
     "node_id": "sample-kyc-update@ybl",
     "node_type": "BENEFICIARY",
     "display_label": "Sample beneficiary (KYC update)",
     "synthetic_identifier": "sample-kyc-update@ybl",
     "created_at": "2026-11-08T14:00:00Z",
     "metadata": {}
    },
    "connected_node_count": 3,
    "total_evidence_edge_count": 3,
    "verified_edge_count": 0,
    "reported_edge_count": 3,
    "inferred_edge_count": 0,
    "connected_nodes": [
     {
      "node_id": "SAMPLE-CASE-401",
      "node_type": "FRAUD_CASE",
      "display_label": "Sample complaint 401",
      "synthetic_identifier": "SAMPLE-CASE-401",
      "created_at": "2026-11-18T14:00:00Z",
      "metadata": {}
     },
     {
      "node_id": "SAMPLE-CASE-402",
      "node_type": "FRAUD_CASE",
      "display_label": "Sample complaint 402",
      "synthetic_identifier": "SAMPLE-CASE-402",
      "created_at": "2026-11-21T14:00:00Z",
      "metadata": {}
     },
     {
      "node_id": "SAMPLE-MSG-501",
      "node_type": "COMMUNICATION",
      "display_label": "Sample reported message",
      "synthetic_identifier": "SAMPLE-MSG-501",
      "created_at": "2026-11-19T14:00:00Z",
      "metadata": {}
     }
    ],
    "evidence_edges": [
     {
      "edge_id": "E-INV-11",
      "source_node_id": "SAMPLE-MSG-501",
      "target_node_id": "sample-kyc-update@ybl",
      "relationship_type": "MENTIONED_IN",
      "evidence_status": "REPORTED",
      "source_reference": "SAMPLE_USER_COMPLAINT_401",
      "observed_at": "2026-11-19T14:00:00Z",
      "expires_at": null,
      "confidence": null,
      "description": "Sample reported message naming this beneficiary.",
      "metadata": {},
      "verification_audit": null
     },
     {
      "edge_id": "E-INV-09",
      "source_node_id": "sample-kyc-update@ybl",
      "target_node_id": "SAMPLE-CASE-401",
      "relationship_type": "REPORTED_IN_CASE",
      "evidence_status": "REPORTED",
      "source_reference": "SAMPLE_USER_COMPLAINT_401",
      "observed_at": "2026-11-19T14:00:00Z",
      "expires_at": null,
      "confidence": null,
      "description": "Sample report of a fake KYC update request.",
      "metadata": {},
      "verification_audit": null
     },
     {
      "edge_id": "E-INV-10",
      "source_node_id": "sample-kyc-update@ybl",
      "target_node_id": "SAMPLE-CASE-402",
      "relationship_type": "REPORTED_IN_CASE",
      "evidence_status": "REPORTED",
      "source_reference": "SAMPLE_PARTNER_REPORT_402",
      "observed_at": "2026-11-22T14:00:00Z",
      "expires_at": null,
      "confidence": null,
      "description": "Sample partner report of a KYC suspension threat.",
      "metadata": {},
      "verification_audit": null
     }
    ],
    "query_reference_time": "2026-11-23T14:00:00Z",
    "expired_edges_excluded_count": 0,
    "assessment_notes": [
     "Entity 'sample-kyc-update@ybl' retrieved from SPEG graph as type 'BENEFICIARY'.",
     "Found 3 directly connected entities and 3 active evidence relationships.",
     "Evidence Status Breakdown: 0 VERIFIED, 3 REPORTED, 0 INFERRED.",
     "Caution: Incident relationships contain uncorroborated REPORTED allegations with zero verified fraud outcomes.",
     "SPEG graph construction and provenance-aware evidence retrieval active. Recipient risk scoring and automatic fraud relationship inference are not yet implemented."
    ]
   },
   "profile": {
    "recipient_id": "sample-kyc-update@ybl",
    "graph_id": "SPEG-DEMO-INVESTIGATOR",
    "analysis_timestamp": "2026-11-23T14:00:00Z",
    "direct_customer_count": 0,
    "total_transaction_count": 0,
    "distinct_beneficiary_association_count": 0,
    "verified_evidence_count": 0,
    "reported_evidence_count": 3,
    "inferred_evidence_count": 0,
    "shared_identifier_count": 0,
    "recent_relationship_count": 3,
    "expired_relationship_count": 0,
    "evidence_summary": "Recipient intelligence profile for 'sample-kyc-update@ybl' (Sample beneficiary (KYC update)). Direct relationships: 0 distinct customers, 0 transactions. Active evidence breakdown: 0 VERIFIED, 3 REPORTED, 0 INFERRED. Linked to 2 distinct fraud case filings. Caution: Incident relationships contain uncorroborated REPORTED claims with zero confirmed fraud determinations. Recipient relationship analysis active. Recipient risk scoring, ownership inference and automatic fraud classification are not yet implemented.",
    "supporting_evidence": [
     {
      "edge_id": "E-INV-11",
      "source_reference": "SAMPLE_USER_COMPLAINT_401",
      "evidence_status": "REPORTED",
      "relationship_type": "MENTIONED_IN",
      "observed_at": "2026-11-19T14:00:00Z",
      "source_node_id": "SAMPLE-MSG-501",
      "target_node_id": "sample-kyc-update@ybl",
      "path": [
       "SAMPLE-MSG-501",
       "sample-kyc-update@ybl"
      ],
      "description": "Sample reported message naming this beneficiary."
     },
     {
      "edge_id": "E-INV-09",
      "source_reference": "SAMPLE_USER_COMPLAINT_401",
      "evidence_status": "REPORTED",
      "relationship_type": "REPORTED_IN_CASE",
      "observed_at": "2026-11-19T14:00:00Z",
      "source_node_id": "sample-kyc-update@ybl",
      "target_node_id": "SAMPLE-CASE-401",
      "path": [
       "sample-kyc-update@ybl",
       "SAMPLE-CASE-401"
      ],
      "description": "Sample report of a fake KYC update request."
     },
     {
      "edge_id": "E-INV-10",
      "source_reference": "SAMPLE_PARTNER_REPORT_402",
      "evidence_status": "REPORTED",
      "relationship_type": "REPORTED_IN_CASE",
      "observed_at": "2026-11-22T14:00:00Z",
      "source_node_id": "sample-kyc-update@ybl",
      "target_node_id": "SAMPLE-CASE-402",
      "path": [
       "sample-kyc-update@ybl",
       "SAMPLE-CASE-402"
      ],
      "description": "Sample partner report of a KYC suspension threat."
     }
    ],
    "data_sufficiency": "SUFFICIENT"
   },
   "risk": {
    "assessment_id": "RRA-2CE88FA87B1C",
    "recipient_id": "sample-kyc-update@ybl",
    "graph_id": "SPEG-DEMO-INVESTIGATOR",
    "assessment_timestamp": "2026-11-23T14:00:00Z",
    "recipient_risk_score": "0.4",
    "risk_level": "MEDIUM",
    "data_sufficiency": "ADEQUATE",
    "detected_indicators": [
     "REPORTED_FRAUD_ALLEGATIONS (2 report(s) across 2 distinct source(s))"
    ],
    "feature_contributions": {
     "verified_fraud_case_association": 0.0,
     "reported_fraud_case_association": 0.4,
     "inferred_shared_identifier_relationships": 0.0,
     "transaction_volume_context": 0.0
    },
    "explanation": "Recipient 'sample-kyc-update@ybl' evaluated under model 'PROVISIONAL_DETERMINISTIC_RECIPIENT_SCORER_V1' with score 0.4 (MEDIUM). Reported allegations: Linked to 2 distinct reported source reference(s) with recent (1d ago) recency (+0.40).",
    "supporting_evidence": [
     {
      "edge_id": "E-INV-11",
      "source_reference": "SAMPLE_USER_COMPLAINT_401",
      "evidence_status": "REPORTED",
      "relationship_type": "MENTIONED_IN",
      "observed_at": "2026-11-19T14:00:00Z",
      "source_node_id": "SAMPLE-MSG-501",
      "target_node_id": "sample-kyc-update@ybl",
      "path": [
       "SAMPLE-MSG-501",
       "sample-kyc-update@ybl"
      ],
      "description": "Sample reported message naming this beneficiary."
     },
     {
      "edge_id": "E-INV-09",
      "source_reference": "SAMPLE_USER_COMPLAINT_401",
      "evidence_status": "REPORTED",
      "relationship_type": "REPORTED_IN_CASE",
      "observed_at": "2026-11-19T14:00:00Z",
      "source_node_id": "sample-kyc-update@ybl",
      "target_node_id": "SAMPLE-CASE-401",
      "path": [
       "sample-kyc-update@ybl",
       "SAMPLE-CASE-401"
      ],
      "description": "Sample report of a fake KYC update request."
     },
     {
      "edge_id": "E-INV-10",
      "source_reference": "SAMPLE_PARTNER_REPORT_402",
      "evidence_status": "REPORTED",
      "relationship_type": "REPORTED_IN_CASE",
      "observed_at": "2026-11-22T14:00:00Z",
      "source_node_id": "sample-kyc-update@ybl",
      "target_node_id": "SAMPLE-CASE-402",
      "path": [
       "sample-kyc-update@ybl",
       "SAMPLE-CASE-402"
      ],
      "description": "Sample partner report of a KYC suspension threat."
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
   }
  },
  "sample-landlord@okhdfc": {
   "evidence": {
    "recipient_id": "sample-landlord@okhdfc",
    "recipient_node": {
     "node_id": "sample-landlord@okhdfc",
     "node_type": "BENEFICIARY",
     "display_label": "Sample beneficiary (landlord)",
     "synthetic_identifier": "sample-landlord@okhdfc",
     "created_at": "2026-01-27T14:00:00Z",
     "metadata": {}
    },
    "connected_node_count": 2,
    "total_evidence_edge_count": 2,
    "verified_edge_count": 2,
    "reported_edge_count": 0,
    "inferred_edge_count": 0,
    "connected_nodes": [
     {
      "node_id": "SAMPLE-CUST-A",
      "node_type": "CUSTOMER",
      "display_label": "Sample customer A",
      "synthetic_identifier": "SAMPLE-CUST-A",
      "created_at": "2025-10-19T14:00:00Z",
      "metadata": {}
     },
     {
      "node_id": "SAMPLE-CUST-B",
      "node_type": "CUSTOMER",
      "display_label": "Sample customer B",
      "synthetic_identifier": "SAMPLE-CUST-B",
      "created_at": "2025-10-19T14:00:00Z",
      "metadata": {}
     }
    ],
    "evidence_edges": [
     {
      "edge_id": "E-INV-12",
      "source_node_id": "SAMPLE-CUST-A",
      "target_node_id": "sample-landlord@okhdfc",
      "relationship_type": "PAID_TO",
      "evidence_status": "VERIFIED",
      "source_reference": "SAMPLE_LEDGER_A_01",
      "observed_at": "2026-10-24T14:00:00Z",
      "expires_at": null,
      "confidence": null,
      "description": "Sample settled rent payment. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-12]",
      "metadata": {
       "verification_audit": {
        "original_evidence_status": "REPORTED",
        "verified_at": "2026-11-24T15:04:10.335480Z",
        "verified_by": "SAMPLE_DEMO_AUTHORITY",
        "verification_authority_org": "INTERNAL_COMPLIANCE_OPS",
        "verification_reference": "SAMPLE_VERIFICATION_E-INV-12",
        "verification_rationale": "Sample corroboration for demo fixtures only.",
        "audit_notes": ""
       }
      },
      "verification_audit": {
       "original_evidence_status": "REPORTED",
       "verified_at": "2026-11-24T15:04:10.335480Z",
       "verified_by": "SAMPLE_DEMO_AUTHORITY",
       "verification_authority_org": "INTERNAL_COMPLIANCE_OPS",
       "verification_reference": "SAMPLE_VERIFICATION_E-INV-12",
       "verification_rationale": "Sample corroboration for demo fixtures only.",
       "audit_notes": ""
      }
     },
     {
      "edge_id": "E-INV-13",
      "source_node_id": "SAMPLE-CUST-B",
      "target_node_id": "sample-landlord@okhdfc",
      "relationship_type": "PAID_TO",
      "evidence_status": "VERIFIED",
      "source_reference": "SAMPLE_LEDGER_B_01",
      "observed_at": "2026-10-23T14:00:00Z",
      "expires_at": null,
      "confidence": null,
      "description": "Sample settled rent payment. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-13]",
      "metadata": {
       "verification_audit": {
        "original_evidence_status": "REPORTED",
        "verified_at": "2026-11-24T15:04:10.335480Z",
        "verified_by": "SAMPLE_DEMO_AUTHORITY",
        "verification_authority_org": "INTERNAL_COMPLIANCE_OPS",
        "verification_reference": "SAMPLE_VERIFICATION_E-INV-13",
        "verification_rationale": "Sample corroboration for demo fixtures only.",
        "audit_notes": ""
       }
      },
      "verification_audit": {
       "original_evidence_status": "REPORTED",
       "verified_at": "2026-11-24T15:04:10.335480Z",
       "verified_by": "SAMPLE_DEMO_AUTHORITY",
       "verification_authority_org": "INTERNAL_COMPLIANCE_OPS",
       "verification_reference": "SAMPLE_VERIFICATION_E-INV-13",
       "verification_rationale": "Sample corroboration for demo fixtures only.",
       "audit_notes": ""
      }
     }
    ],
    "query_reference_time": "2026-11-23T14:00:00Z",
    "expired_edges_excluded_count": 0,
    "assessment_notes": [
     "Entity 'sample-landlord@okhdfc' retrieved from SPEG graph as type 'BENEFICIARY'.",
     "Found 2 directly connected entities and 2 active evidence relationships.",
     "Evidence Status Breakdown: 2 VERIFIED, 0 REPORTED, 0 INFERRED.",
     "SPEG graph construction and provenance-aware evidence retrieval active. Recipient risk scoring and automatic fraud relationship inference are not yet implemented."
    ]
   },
   "profile": {
    "recipient_id": "sample-landlord@okhdfc",
    "graph_id": "SPEG-DEMO-INVESTIGATOR",
    "analysis_timestamp": "2026-11-23T14:00:00Z",
    "direct_customer_count": 2,
    "total_transaction_count": 2,
    "distinct_beneficiary_association_count": 0,
    "verified_evidence_count": 2,
    "reported_evidence_count": 0,
    "inferred_evidence_count": 0,
    "shared_identifier_count": 0,
    "recent_relationship_count": 1,
    "expired_relationship_count": 0,
    "evidence_summary": "Recipient intelligence profile for 'sample-landlord@okhdfc' (Sample beneficiary (landlord)). Direct relationships: 2 distinct customers, 2 transactions. Active evidence breakdown: 2 VERIFIED, 0 REPORTED, 0 INFERRED. Recipient relationship analysis active. Recipient risk scoring, ownership inference and automatic fraud classification are not yet implemented.",
    "supporting_evidence": [
     {
      "edge_id": "E-INV-12",
      "source_reference": "SAMPLE_LEDGER_A_01",
      "evidence_status": "VERIFIED",
      "relationship_type": "PAID_TO",
      "observed_at": "2026-10-24T14:00:00Z",
      "source_node_id": "SAMPLE-CUST-A",
      "target_node_id": "sample-landlord@okhdfc",
      "path": [
       "SAMPLE-CUST-A",
       "sample-landlord@okhdfc"
      ],
      "description": "Sample settled rent payment. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-12]"
     },
     {
      "edge_id": "E-INV-13",
      "source_reference": "SAMPLE_LEDGER_B_01",
      "evidence_status": "VERIFIED",
      "relationship_type": "PAID_TO",
      "observed_at": "2026-10-23T14:00:00Z",
      "source_node_id": "SAMPLE-CUST-B",
      "target_node_id": "sample-landlord@okhdfc",
      "path": [
       "SAMPLE-CUST-B",
       "sample-landlord@okhdfc"
      ],
      "description": "Sample settled rent payment. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-13]"
     }
    ],
    "data_sufficiency": "MINIMAL"
   },
   "risk": {
    "assessment_id": "RRA-14993CFADEE0",
    "recipient_id": "sample-landlord@okhdfc",
    "graph_id": "SPEG-DEMO-INVESTIGATOR",
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
      "edge_id": "E-INV-12",
      "source_reference": "SAMPLE_LEDGER_A_01",
      "evidence_status": "VERIFIED",
      "relationship_type": "PAID_TO",
      "observed_at": "2026-10-24T14:00:00Z",
      "source_node_id": "SAMPLE-CUST-A",
      "target_node_id": "sample-landlord@okhdfc",
      "path": [
       "SAMPLE-CUST-A",
       "sample-landlord@okhdfc"
      ],
      "description": "Sample settled rent payment. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-12]"
     },
     {
      "edge_id": "E-INV-13",
      "source_reference": "SAMPLE_LEDGER_B_01",
      "evidence_status": "VERIFIED",
      "relationship_type": "PAID_TO",
      "observed_at": "2026-10-23T14:00:00Z",
      "source_node_id": "SAMPLE-CUST-B",
      "target_node_id": "sample-landlord@okhdfc",
      "path": [
       "SAMPLE-CUST-B",
       "sample-landlord@okhdfc"
      ],
      "description": "Sample settled rent payment. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-13]"
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
   }
  },
  "sample-grocer@okaxis": {
   "evidence": {
    "recipient_id": "sample-grocer@okaxis",
    "recipient_node": {
     "node_id": "sample-grocer@okaxis",
     "node_type": "BENEFICIARY",
     "display_label": "Sample beneficiary (grocer)",
     "synthetic_identifier": "sample-grocer@okaxis",
     "created_at": "2026-05-07T14:00:00Z",
     "metadata": {}
    },
    "connected_node_count": 2,
    "total_evidence_edge_count": 2,
    "verified_edge_count": 2,
    "reported_edge_count": 0,
    "inferred_edge_count": 0,
    "connected_nodes": [
     {
      "node_id": "SAMPLE-CUST-A",
      "node_type": "CUSTOMER",
      "display_label": "Sample customer A",
      "synthetic_identifier": "SAMPLE-CUST-A",
      "created_at": "2025-10-19T14:00:00Z",
      "metadata": {}
     },
     {
      "node_id": "SAMPLE-CUST-C",
      "node_type": "CUSTOMER",
      "display_label": "Sample customer C",
      "synthetic_identifier": "SAMPLE-CUST-C",
      "created_at": "2025-10-19T14:00:00Z",
      "metadata": {}
     }
    ],
    "evidence_edges": [
     {
      "edge_id": "E-INV-14",
      "source_node_id": "SAMPLE-CUST-A",
      "target_node_id": "sample-grocer@okaxis",
      "relationship_type": "PAID_TO",
      "evidence_status": "VERIFIED",
      "source_reference": "SAMPLE_LEDGER_A_02",
      "observed_at": "2026-11-21T14:00:00Z",
      "expires_at": null,
      "confidence": null,
      "description": "Sample settled grocery payment. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-14]",
      "metadata": {
       "verification_audit": {
        "original_evidence_status": "REPORTED",
        "verified_at": "2026-11-24T15:04:10.336479Z",
        "verified_by": "SAMPLE_DEMO_AUTHORITY",
        "verification_authority_org": "INTERNAL_COMPLIANCE_OPS",
        "verification_reference": "SAMPLE_VERIFICATION_E-INV-14",
        "verification_rationale": "Sample corroboration for demo fixtures only.",
        "audit_notes": ""
       }
      },
      "verification_audit": {
       "original_evidence_status": "REPORTED",
       "verified_at": "2026-11-24T15:04:10.336479Z",
       "verified_by": "SAMPLE_DEMO_AUTHORITY",
       "verification_authority_org": "INTERNAL_COMPLIANCE_OPS",
       "verification_reference": "SAMPLE_VERIFICATION_E-INV-14",
       "verification_rationale": "Sample corroboration for demo fixtures only.",
       "audit_notes": ""
      }
     },
     {
      "edge_id": "E-INV-15",
      "source_node_id": "SAMPLE-CUST-C",
      "target_node_id": "sample-grocer@okaxis",
      "relationship_type": "PAID_TO",
      "evidence_status": "VERIFIED",
      "source_reference": "SAMPLE_LEDGER_C_01",
      "observed_at": "2026-11-20T14:00:00Z",
      "expires_at": null,
      "confidence": null,
      "description": "Sample settled grocery payment. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-15]",
      "metadata": {
       "verification_audit": {
        "original_evidence_status": "REPORTED",
        "verified_at": "2026-11-24T15:04:10.336479Z",
        "verified_by": "SAMPLE_DEMO_AUTHORITY",
        "verification_authority_org": "INTERNAL_COMPLIANCE_OPS",
        "verification_reference": "SAMPLE_VERIFICATION_E-INV-15",
        "verification_rationale": "Sample corroboration for demo fixtures only.",
        "audit_notes": ""
       }
      },
      "verification_audit": {
       "original_evidence_status": "REPORTED",
       "verified_at": "2026-11-24T15:04:10.336479Z",
       "verified_by": "SAMPLE_DEMO_AUTHORITY",
       "verification_authority_org": "INTERNAL_COMPLIANCE_OPS",
       "verification_reference": "SAMPLE_VERIFICATION_E-INV-15",
       "verification_rationale": "Sample corroboration for demo fixtures only.",
       "audit_notes": ""
      }
     }
    ],
    "query_reference_time": "2026-11-23T14:00:00Z",
    "expired_edges_excluded_count": 0,
    "assessment_notes": [
     "Entity 'sample-grocer@okaxis' retrieved from SPEG graph as type 'BENEFICIARY'.",
     "Found 2 directly connected entities and 2 active evidence relationships.",
     "Evidence Status Breakdown: 2 VERIFIED, 0 REPORTED, 0 INFERRED.",
     "SPEG graph construction and provenance-aware evidence retrieval active. Recipient risk scoring and automatic fraud relationship inference are not yet implemented."
    ]
   },
   "profile": {
    "recipient_id": "sample-grocer@okaxis",
    "graph_id": "SPEG-DEMO-INVESTIGATOR",
    "analysis_timestamp": "2026-11-23T14:00:00Z",
    "direct_customer_count": 2,
    "total_transaction_count": 2,
    "distinct_beneficiary_association_count": 0,
    "verified_evidence_count": 2,
    "reported_evidence_count": 0,
    "inferred_evidence_count": 0,
    "shared_identifier_count": 0,
    "recent_relationship_count": 2,
    "expired_relationship_count": 0,
    "evidence_summary": "Recipient intelligence profile for 'sample-grocer@okaxis' (Sample beneficiary (grocer)). Direct relationships: 2 distinct customers, 2 transactions. Active evidence breakdown: 2 VERIFIED, 0 REPORTED, 0 INFERRED. Recipient relationship analysis active. Recipient risk scoring, ownership inference and automatic fraud classification are not yet implemented.",
    "supporting_evidence": [
     {
      "edge_id": "E-INV-14",
      "source_reference": "SAMPLE_LEDGER_A_02",
      "evidence_status": "VERIFIED",
      "relationship_type": "PAID_TO",
      "observed_at": "2026-11-21T14:00:00Z",
      "source_node_id": "SAMPLE-CUST-A",
      "target_node_id": "sample-grocer@okaxis",
      "path": [
       "SAMPLE-CUST-A",
       "sample-grocer@okaxis"
      ],
      "description": "Sample settled grocery payment. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-14]"
     },
     {
      "edge_id": "E-INV-15",
      "source_reference": "SAMPLE_LEDGER_C_01",
      "evidence_status": "VERIFIED",
      "relationship_type": "PAID_TO",
      "observed_at": "2026-11-20T14:00:00Z",
      "source_node_id": "SAMPLE-CUST-C",
      "target_node_id": "sample-grocer@okaxis",
      "path": [
       "SAMPLE-CUST-C",
       "sample-grocer@okaxis"
      ],
      "description": "Sample settled grocery payment. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-15]"
     }
    ],
    "data_sufficiency": "MINIMAL"
   },
   "risk": {
    "assessment_id": "RRA-4350F8796E0C",
    "recipient_id": "sample-grocer@okaxis",
    "graph_id": "SPEG-DEMO-INVESTIGATOR",
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
    "explanation": "Recipient 'sample-grocer@okaxis' evaluated under model 'PROVISIONAL_DETERMINISTIC_RECIPIENT_SCORER_V1' with score 0.0 (LOW). No adverse fraud filings or suspicious network associations were identified in available SPEG data.",
    "supporting_evidence": [
     {
      "edge_id": "E-INV-14",
      "source_reference": "SAMPLE_LEDGER_A_02",
      "evidence_status": "VERIFIED",
      "relationship_type": "PAID_TO",
      "observed_at": "2026-11-21T14:00:00Z",
      "source_node_id": "SAMPLE-CUST-A",
      "target_node_id": "sample-grocer@okaxis",
      "path": [
       "SAMPLE-CUST-A",
       "sample-grocer@okaxis"
      ],
      "description": "Sample settled grocery payment. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-14]"
     },
     {
      "edge_id": "E-INV-15",
      "source_reference": "SAMPLE_LEDGER_C_01",
      "evidence_status": "VERIFIED",
      "relationship_type": "PAID_TO",
      "observed_at": "2026-11-20T14:00:00Z",
      "source_node_id": "SAMPLE-CUST-C",
      "target_node_id": "sample-grocer@okaxis",
      "path": [
       "SAMPLE-CUST-C",
       "sample-grocer@okaxis"
      ],
      "description": "Sample settled grocery payment. [VERIFIED by SAMPLE_DEMO_AUTHORITY ref: SAMPLE_VERIFICATION_E-INV-15]"
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
   }
  }
 }
};
