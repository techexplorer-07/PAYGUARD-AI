/**
 * Row mapping, filtering, sorting and counting for investigator assessment records.
 * Every figure is derived from the records actually loaded; nothing is estimated.
 */
import type { VerdictKind } from '../../types/assessment';
import type { DecimalValue } from '../../types/paymentProtection';
import type { AssessmentRecord, AssessmentRow } from '../../types/investigator';
import { buildAssessmentView, provenanceKind } from '../assessment/buildAssessmentView';
import { deriveVerdictKind } from '../assessment/verdict';

export const interventionLabels: Record<string, string> = {
  ALLOW_WITH_CAUTION: 'Allow with caution',
  WARN_CUSTOMER: 'Warn customer',
  STEP_UP_VERIFICATION: 'Step-up verification',
  PAUSE_AND_VERIFY: 'Pause and verify',
  MANUAL_REVIEW: 'Manual review',
  INSUFFICIENT_DATA_REVIEW: 'Insufficient-data review',
};

export function interventionLabel(action: string): string {
  const known = interventionLabels[action.toUpperCase()];
  if (known) return known;
  const words = action.toLowerCase().replace(/_+/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export const verdictLabels: Record<VerdictKind, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  uncertain: 'Uncertain',
  insufficient: 'Insufficient data',
};

export const verdictOrder: VerdictKind[] = ['high', 'medium', 'uncertain', 'insufficient', 'low'];

const verdictRank: Record<VerdictKind, number> = { high: 4, medium: 3, uncertain: 2, insufficient: 2, low: 1 };

function toNumber(value: string | number): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function toRow(record: AssessmentRecord): AssessmentRow {
  const { response, submitted } = record;
  const unified = response.unified_risk_assessment;
  const view = buildAssessmentView(response, submitted, 'live');
  const firstConcern = view.findings.find((finding) => finding.tone === 'concern');
  const provenance = { verified: 0, reported: 0, inferred: 0 };
  for (const item of unified.supporting_evidence) {
    const kind = provenanceKind(item.epistemic_status);
    if (kind === 'verified' || kind === 'reported' || kind === 'inferred') provenance[kind] += 1;
  }
  return {
    id: response.evaluation_id,
    transactionId: response.transaction_id,
    recipientId: response.recipient_id,
    amount: submitted?.amount ?? null,
    currency: submitted?.currency ?? response.intent_assessment?.comparison.normalized_transaction_currency ?? null,
    verdict: deriveVerdictKind(unified),
    score: toNumber(unified.overall_risk_score),
    mainReason: firstConcern?.title ?? view.findings[0]?.title ?? null,
    action: unified.recommended_action,
    actionLabel: interventionLabel(response.intervention_recommendation.action),
    timestamp: response.timestamp,
    provenance,
    record,
  };
}

export type RiskFilter = 'all' | 'attention' | VerdictKind;
export type ProvenanceFilter = 'all' | 'verified' | 'reported' | 'inferred';
export type SortKey = 'latest' | 'risk' | 'amount';

export interface RowFilters {
  query: string;
  risk: RiskFilter;
  action: string;
  provenance: ProvenanceFilter;
  /** yyyy-mm-dd, inclusive, local time. */
  from: string;
  to: string;
}

export const emptyFilters: RowFilters = { query: '', risk: 'all', action: 'all', provenance: 'all', from: '', to: '' };

function localDateKey(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function filterRows(rows: AssessmentRow[], filters: RowFilters): AssessmentRow[] {
  const query = filters.query.trim().toLowerCase();
  return rows.filter((row) => {
    if (query && ![row.id, row.transactionId, row.recipientId].some((value) => value.toLowerCase().includes(query))) {
      return false;
    }
    if (filters.risk === 'attention' && row.verdict === 'low') return false;
    if (filters.risk !== 'all' && filters.risk !== 'attention' && row.verdict !== filters.risk) return false;
    if (filters.action !== 'all' && row.action !== filters.action) return false;
    if (filters.provenance !== 'all' && row.provenance[filters.provenance] === 0) return false;
    const day = localDateKey(row.timestamp);
    if (filters.from && day < filters.from) return false;
    if (filters.to && day > filters.to) return false;
    return true;
  });
}

export function sortRows(rows: AssessmentRow[], key: SortKey): AssessmentRow[] {
  const byTime = (a: AssessmentRow, b: AssessmentRow) => Date.parse(b.timestamp) - Date.parse(a.timestamp);
  const sorted = [...rows];
  if (key === 'latest') sorted.sort(byTime);
  if (key === 'risk') {
    sorted.sort(
      (a, b) =>
        verdictRank[b.verdict] - verdictRank[a.verdict] || (b.score ?? -1) - (a.score ?? -1) || byTime(a, b),
    );
  }
  if (key === 'amount') sorted.sort((a, b) => (b.amount ?? -1) - (a.amount ?? -1) || byTime(a, b));
  return sorted;
}

export function countBy<T extends string>(items: T[]): Map<T, number> {
  const counts = new Map<T, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  return counts;
}

export function activeFilterCount(filters: RowFilters, defaults: RowFilters): number {
  return (Object.keys(filters) as (keyof RowFilters)[]).filter((key) => filters[key] !== defaults[key]).length;
}

/** Formats a backend 0–1 heuristic score. Never presented as a probability. */
export function scoreLabel(value: DecimalValue | null | undefined): string {
  if (value === null || value === undefined) return 'Not available';
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? `${n.toFixed(2)} / 1.00` : 'Not available';
}
