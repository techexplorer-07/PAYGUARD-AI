/** Normalises evidence from assessments and recipient intelligence into one reviewable list. */
import type { ProvenanceKind } from '../../types/assessment';
import type { RecipientEvidenceSummary, RecipientIntelligenceProfile, VerificationAudit } from '../../types/investigator';
import type { PaymentProtectionResponse, RecipientEvidenceItem } from '../../types/paymentProtection';
import { provenanceKind } from '../assessment/buildAssessmentView';

export interface EvidenceReviewItem {
  id: string;
  provenance: ProvenanceKind;
  provenanceRaw: string;
  engine: string;
  description: string;
  sourceReference: string;
  observedAt: string | null;
  relationship: string | null;
  path: string[] | null;
  verification: VerificationAudit | null;
}

function fromRecipientItem(item: RecipientEvidenceItem): EvidenceReviewItem {
  return {
    id: `RECIPIENT-${item.edge_id}`,
    provenance: provenanceKind(item.evidence_status),
    provenanceRaw: item.evidence_status,
    engine: 'RECIPIENT',
    description: item.description,
    sourceReference: item.source_reference,
    observedAt: item.observed_at,
    relationship: item.relationship_type,
    path: item.path && item.path.length > 2 ? item.path : null,
    verification: null,
  };
}

/** Evidence cited by one assessment: recipient items (with timestamps/paths) plus intent and behavioural items from the unified assessment. */
export function evidenceFromAssessment(response: PaymentProtectionResponse): EvidenceReviewItem[] {
  const recipientItems = (response.recipient_assessment?.supporting_evidence ?? []).map(fromRecipientItem);
  const recipientIds = new Set(response.recipient_assessment?.supporting_evidence.map((item) => item.edge_id) ?? []);
  const otherItems = response.unified_risk_assessment.supporting_evidence
    .filter((item) => !(item.engine_source.toUpperCase() === 'RECIPIENT' && recipientIds.has(item.evidence_id)))
    .map<EvidenceReviewItem>((item) => ({
      id: `${item.engine_source}-${item.evidence_id}`,
      provenance: provenanceKind(item.epistemic_status),
      provenanceRaw: item.epistemic_status,
      engine: item.engine_source,
      description: item.description,
      sourceReference: item.source_reference,
      observedAt: null,
      relationship: null,
      path: null,
      verification: null,
    }));
  return [...recipientItems, ...otherItems];
}

/** Evidence about one recipient: stored edges (with verification audit) plus multi-hop inferred paths from the profile. */
export function evidenceFromRecipient(
  evidence: RecipientEvidenceSummary | null,
  profile: RecipientIntelligenceProfile | null,
): EvidenceReviewItem[] {
  const items: EvidenceReviewItem[] = (evidence?.evidence_edges ?? []).map((edge) => ({
    id: `EDGE-${edge.edge_id}`,
    provenance: provenanceKind(edge.evidence_status),
    provenanceRaw: edge.evidence_status,
    engine: 'RECIPIENT',
    description: edge.description,
    sourceReference: edge.source_reference,
    observedAt: edge.observed_at,
    relationship: edge.relationship_type,
    path: [edge.source_node_id, edge.target_node_id],
    verification: edge.verification_audit,
  }));
  const known = new Set((evidence?.evidence_edges ?? []).map((edge) => edge.edge_id));
  for (const item of profile?.supporting_evidence ?? []) {
    if (!known.has(item.edge_id) && item.path && item.path.length > 2) items.push(fromRecipientItem(item));
  }
  return items;
}

/** Demo fixtures use SAMPLE_ references; never present them as real sources. */
export function isSampleReference(reference: string): boolean {
  return reference.toUpperCase().startsWith('SAMPLE');
}
