/**
 * Investigator workspace types.
 *
 * API types mirror backend/app/schemas/recipient.py for the three read-only
 * recipient-intelligence endpoints that exist today:
 *   GET /api/v1/recipient-intelligence/recipients/{id}/evidence         -> RecipientEvidenceSummary
 *   GET /api/v1/recipient-intelligence/recipients/{id}/profile          -> RecipientIntelligenceProfile
 *   GET /api/v1/recipient-intelligence/recipients/{id}/risk-assessment  -> RecipientRiskAssessment (types/paymentProtection)
 *
 * The backend has no endpoints for listing assessments, reading assessment
 * details, reading the whole SPEG graph, aggregate statistics or case history.
 */
import type { SubmittedTransaction, VerdictKind } from './assessment';
import type { PaymentProtectionResponse, RecipientAssessment, RecipientEvidenceItem } from './paymentProtection';

// ---------------------------------------------------------------------------
// API types (recipient.py)
// ---------------------------------------------------------------------------

/** CUSTOMER | BENEFICIARY | TRANSACTION | COMMUNICATION | FRAUD_CASE | IDENTIFIER */
export type EvidenceNodeType = string;

/** backend EvidenceNode */
export interface EvidenceNode {
  node_id: string;
  node_type: EvidenceNodeType;
  display_label: string;
  synthetic_identifier: string;
  created_at: string;
  metadata: Record<string, unknown>;
}

/** backend VerificationAuditRecord */
export interface VerificationAudit {
  original_evidence_status: string;
  verified_at: string;
  verified_by: string;
  verification_authority_org: string;
  verification_reference: string;
  verification_rationale: string;
  audit_notes: string | null;
}

/** backend EvidenceEdge */
export interface EvidenceEdge {
  edge_id: string;
  source_node_id: string;
  target_node_id: string;
  /** INITIATED_TRANSACTION | PAID_TO | MENTIONED_IN | REPORTED_IN_CASE | ASSOCIATED_WITH | SHARES_IDENTIFIER */
  relationship_type: string;
  /** VERIFIED | REPORTED | INFERRED */
  evidence_status: string;
  source_reference: string;
  observed_at: string;
  expires_at: string | null;
  confidence: number | null;
  description: string;
  metadata: Record<string, unknown>;
  verification_audit: VerificationAudit | null;
}

/** backend RecipientEvidenceSummary (direct, one-hop neighbourhood) */
export interface RecipientEvidenceSummary {
  recipient_id: string;
  recipient_node: EvidenceNode | null;
  connected_node_count: number;
  total_evidence_edge_count: number;
  verified_edge_count: number;
  reported_edge_count: number;
  inferred_edge_count: number;
  connected_nodes: EvidenceNode[];
  evidence_edges: EvidenceEdge[];
  query_reference_time: string | null;
  expired_edges_excluded_count: number;
  assessment_notes: string[];
}

/** backend RecipientIntelligenceProfile */
export interface RecipientIntelligenceProfile {
  recipient_id: string;
  graph_id: string;
  analysis_timestamp: string;
  direct_customer_count: number;
  total_transaction_count: number;
  distinct_beneficiary_association_count: number;
  verified_evidence_count: number;
  reported_evidence_count: number;
  inferred_evidence_count: number;
  shared_identifier_count: number;
  recent_relationship_count: number;
  expired_relationship_count: number;
  evidence_summary: string;
  /** Includes multi-hop inferred paths (item.path). */
  supporting_evidence: RecipientEvidenceItem[];
  data_sufficiency: string;
}

// ---------------------------------------------------------------------------
// Workspace / presentation types
// ---------------------------------------------------------------------------

/** Where the workspace's assessment records come from. Never mixed. */
export type DataSource = 'session' | 'demo';

/** One assessment record: a real backend response plus what the customer submitted. */
export interface AssessmentRecord {
  response: PaymentProtectionResponse;
  submitted: SubmittedTransaction | null;
  /** When the frontend recorded it (session) or the dataset timestamp (demo). */
  recordedAt: string;
}

/** Flattened row used by tables, filters and charts. */
export interface AssessmentRow {
  id: string;
  transactionId: string;
  recipientId: string;
  amount: number | null;
  currency: string | null;
  verdict: VerdictKind;
  /** 0–1 heuristic severity from the unified assessment, or null. */
  score: number | null;
  mainReason: string | null;
  action: string;
  actionLabel: string;
  timestamp: string;
  provenance: Record<'verified' | 'reported' | 'inferred', number>;
  record: AssessmentRecord;
}

/** Recipient intelligence bundle, from live endpoints or demo fixtures. */
export interface RecipientIntel {
  recipientId: string;
  evidence: RecipientEvidenceSummary | null;
  profile: RecipientIntelligenceProfile | null;
  risk: RecipientAssessment | null;
}
