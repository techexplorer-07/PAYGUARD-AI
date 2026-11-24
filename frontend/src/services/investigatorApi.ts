/**
 * Read-only API service for the Fraud Intelligence Centre.
 *
 * Integrates only endpoints verified in the backend OpenAPI document:
 *   GET /health
 *   GET /api/v1/recipient-intelligence/recipients/{recipient_id}/evidence
 *   GET /api/v1/recipient-intelligence/recipients/{recipient_id}/profile
 *   GET /api/v1/recipient-intelligence/recipients/{recipient_id}/risk-assessment
 * All three recipient endpoints accept optional `graph_id` and `as_of` query parameters.
 *
 * The write endpoint POST /recipient-intelligence/graph/build is intentionally
 * not used: the investigator workspace is read-only.
 */
import type { RecipientAssessment } from '../types/paymentProtection';
import type {
  EvidenceEdge,
  EvidenceNode,
  RecipientEvidenceSummary,
  RecipientIntelligenceProfile,
} from '../types/investigator';
import { API_BASE_URL } from './api';
import {
  hasFields,
  isArrayOf,
  isNullable,
  isNumber,
  isRecord,
  isString,
} from './guards';
import { isRecipientAssessment, isRecipientEvidenceItem } from './paymentProtectionParser';

const RECIPIENT_BASE = `${API_BASE_URL}/api/v1/recipient-intelligence/recipients`;
const TIMEOUT_MS = 20_000;

export type InvestigatorErrorKind = 'not-found' | 'unauthorized' | 'network' | 'timeout' | 'server' | 'invalid-response';

export class InvestigatorApiError extends Error {
  readonly kind: InvestigatorErrorKind;
  readonly status?: number;

  constructor(kind: InvestigatorErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'InvestigatorApiError';
    this.kind = kind;
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

const isEvidenceNode = (v: unknown): v is EvidenceNode =>
  hasFields(v, {
    node_id: isString,
    node_type: isString,
    display_label: isString,
    created_at: isString,
  });

const isEvidenceEdge = (v: unknown): v is EvidenceEdge =>
  hasFields(v, {
    edge_id: isString,
    source_node_id: isString,
    target_node_id: isString,
    relationship_type: isString,
    evidence_status: isString,
    source_reference: isString,
    observed_at: isString,
    expires_at: isNullable(isString),
    confidence: isNullable(isNumber),
    description: isString,
  });

function normaliseEdge(edge: EvidenceEdge): EvidenceEdge {
  return {
    ...edge,
    metadata: isRecord(edge.metadata) ? edge.metadata : {},
    verification_audit: isRecord(edge.verification_audit) ? edge.verification_audit : null,
  };
}

export function parseEvidenceSummary(value: unknown): RecipientEvidenceSummary | null {
  const valid = hasFields(value, {
    recipient_id: isString,
    recipient_node: isNullable(isEvidenceNode),
    connected_node_count: isNumber,
    total_evidence_edge_count: isNumber,
    verified_edge_count: isNumber,
    reported_edge_count: isNumber,
    inferred_edge_count: isNumber,
    connected_nodes: isArrayOf(isEvidenceNode),
    evidence_edges: isArrayOf(isEvidenceEdge),
    assessment_notes: (v: unknown) => Array.isArray(v) && v.every(isString),
  });
  if (!valid) return null;
  const summary = value as unknown as RecipientEvidenceSummary;
  return { ...summary, recipient_node: summary.recipient_node ?? null, evidence_edges: summary.evidence_edges.map(normaliseEdge) };
}

export function parseRecipientProfile(value: unknown): RecipientIntelligenceProfile | null {
  const valid = hasFields(value, {
    recipient_id: isString,
    graph_id: isString,
    analysis_timestamp: isString,
    direct_customer_count: isNumber,
    total_transaction_count: isNumber,
    verified_evidence_count: isNumber,
    reported_evidence_count: isNumber,
    inferred_evidence_count: isNumber,
    shared_identifier_count: isNumber,
    evidence_summary: isString,
    supporting_evidence: isArrayOf(isRecipientEvidenceItem),
    data_sufficiency: isString,
  });
  return valid ? (value as unknown as RecipientIntelligenceProfile) : null;
}

export function parseRecipientRisk(value: unknown): RecipientAssessment | null {
  return isRecipientAssessment(value) ? value : null;
}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

export interface RecipientQuery {
  graphId?: string;
  signal?: AbortSignal;
}

async function getJson<T>(url: string, parse: (value: unknown) => T | null, signal?: AbortSignal): Promise<T> {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new InvestigatorApiError('timeout', 'The PAYGUARD service took too long to respond.');
    }
    throw new InvestigatorApiError('network', 'The PAYGUARD service could not be reached.');
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (response.ok) {
    const parsed = parse(body);
    if (parsed === null) throw new InvestigatorApiError('invalid-response', 'The service returned an unexpected response.', response.status);
    return parsed;
  }
  if (response.status === 404) {
    // FastAPI 404 detail is a short, non-sensitive explanation (e.g. "No active SPEG graph found in memory registry.").
    const detail = isRecord(body) && isString(body.detail) ? body.detail : 'Not found.';
    throw new InvestigatorApiError('not-found', detail, 404);
  }
  if (response.status === 401 || response.status === 403) {
    throw new InvestigatorApiError('unauthorized', 'You are not authorised to view this information.', response.status);
  }
  // Never surface server exception details to the analyst UI.
  throw new InvestigatorApiError('server', 'The PAYGUARD service encountered a problem.', response.status);
}

function recipientUrl(recipientId: string, resource: 'evidence' | 'profile' | 'risk-assessment', graphId?: string): string {
  const url = new URL(`${RECIPIENT_BASE}/${encodeURIComponent(recipientId)}/${resource}`);
  if (graphId) url.searchParams.set('graph_id', graphId);
  return url.toString();
}

export function fetchRecipientEvidence(recipientId: string, { graphId, signal }: RecipientQuery = {}) {
  return getJson(recipientUrl(recipientId, 'evidence', graphId), parseEvidenceSummary, signal);
}

export function fetchRecipientProfile(recipientId: string, { graphId, signal }: RecipientQuery = {}) {
  return getJson(recipientUrl(recipientId, 'profile', graphId), parseRecipientProfile, signal);
}

export function fetchRecipientRisk(recipientId: string, { graphId, signal }: RecipientQuery = {}) {
  return getJson(recipientUrl(recipientId, 'risk-assessment', graphId), parseRecipientRisk, signal);
}
