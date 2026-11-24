/** Shared labels and styles for the Fraud Intelligence Centre. Colour always accompanies a text label. */
import type { VerdictKind } from '../../types/assessment';

export const nodeTypeLabels: Record<string, string> = {
  CUSTOMER: 'Customer',
  BENEFICIARY: 'Beneficiary',
  TRANSACTION: 'Transaction',
  COMMUNICATION: 'Communication',
  FRAUD_CASE: 'Case / report',
  IDENTIFIER: 'Shared identifier',
};

export function nodeTypeLabel(type: string | null): string {
  if (!type) return 'Entity on inferred path (type not returned)';
  return nodeTypeLabels[type] ?? type;
}

export const relationshipLabels: Record<string, string> = {
  INITIATED_TRANSACTION: 'Initiated transaction',
  PAID_TO: 'Paid to',
  MENTIONED_IN: 'Mentioned in',
  REPORTED_IN_CASE: 'Named in case / report',
  ASSOCIATED_WITH: 'Associated with',
  SHARES_IDENTIFIER: 'Shares identifier',
};

export function relationshipLabel(type: string): string {
  return relationshipLabels[type] ?? type;
}

export const verdictChipStyles: Record<VerdictKind, string> = {
  high: 'bg-danger/10 text-danger',
  medium: 'bg-warning/12 text-warning-strong',
  low: 'bg-success/10 text-success',
  uncertain: 'bg-muted text-ink',
  insufficient: 'bg-muted text-ink',
};

/** Distribution bar fill per verdict (paired with labels and counts). */
export const verdictFill: Record<VerdictKind, string> = {
  high: 'bg-danger',
  medium: 'bg-warning',
  low: 'bg-success',
  uncertain: 'bg-ink-muted',
  insufficient: 'bg-ink-muted/50',
};

export const panelClass = 'rounded-xl border border-line bg-surface shadow-card';

export const inputBaseClass =
  'h-10 rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-muted hover:border-ink-muted/40 focus-visible:border-primary focus-visible:outline-offset-0';
