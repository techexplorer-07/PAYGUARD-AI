import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ProvenanceKind } from '../../types/assessment';
import { formatDateTime } from '../../utils/format';
import type { EvidenceReviewItem } from '../../utils/investigator/evidence';
import { isSampleReference } from '../../utils/investigator/evidence';
import { EvidenceProvenanceBadge } from '../customer/assessment/AssessmentBadges';
import { provenanceStyles } from '../customer/assessment/assessmentUi';
import { DemoTag } from './InvestigatorPrimitives';
import { relationshipLabel } from './investigatorUi';

const provenanceNotes: Partial<Record<ProvenanceKind, string>> = {
  verified: 'Formally corroborated through the backend’s internal verification process.',
  reported: 'Unconfirmed report or allegation. It has not been corroborated and is not proof of fraud.',
  inferred: 'Derived from graph proximity or shared identifiers. It does not prove common ownership or criminal activity.',
  extracted: 'Text extracted from the customer-provided message.',
  statistical: 'Derived statistically from the customer’s payment history.',
};

const order: ProvenanceKind[] = ['verified', 'reported', 'inferred', 'extracted', 'statistical', 'unknown'];

interface EvidenceTimelineProps {
  id: string;
  items: EvidenceReviewItem[];
  demo: boolean;
  emptyText: string;
}

/** Provenance-aware evidence review list with filtering and expandable details. */
export function EvidenceTimeline({ id, items, demo, emptyText }: EvidenceTimelineProps) {
  const [filter, setFilter] = useState<ProvenanceKind | 'all'>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const present = order.filter((kind) => items.some((item) => item.provenance === kind));
  const visible = items
    .filter((item) => filter === 'all' || item.provenance === filter)
    .sort((a, b) => order.indexOf(a.provenance) - order.indexOf(b.provenance) || (b.observedAt ?? '').localeCompare(a.observedAt ?? ''));

  const toggle = (itemId: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });

  if (items.length === 0) return <p className="px-4 py-6 text-center text-sm text-ink-muted sm:px-5">{emptyText}</p>;

  return (
    <div>
      <div role="group" aria-label="Filter evidence by provenance" className="flex flex-wrap gap-2 px-4 pt-4 sm:px-5">
        {(['all', ...present] as const).map((kind) => {
          const count = kind === 'all' ? items.length : items.filter((item) => item.provenance === kind).length;
          return (
            <button
              key={kind}
              type="button"
              aria-pressed={filter === kind}
              onClick={() => setFilter(kind)}
              className={`h-8 cursor-pointer rounded-full border px-3 text-xs font-semibold transition-colors ${
                filter === kind ? 'border-primary bg-primary text-white' : 'border-line bg-surface text-ink hover:bg-muted'
              }`}
            >
              {kind === 'all' ? 'All' : provenanceStyles[kind].label} ({count})
            </button>
          );
        })}
      </div>
      <ul className="space-y-2 px-4 py-4 sm:px-5">
        {visible.map((item) => {
          const open = expanded.has(item.id);
          const detailsId = `${id}-${item.id}`;
          const sample = demo || isSampleReference(item.sourceReference);
          return (
            <li key={item.id} className="rounded-lg border border-line">
              <button
                type="button"
                aria-expanded={open}
                aria-controls={detailsId}
                onClick={() => toggle(item.id)}
                className="flex w-full cursor-pointer items-start gap-3 rounded-lg px-3.5 py-3 text-left hover:bg-muted/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <EvidenceProvenanceBadge provenance={item.provenance} />
                    <span className="text-xs font-medium text-ink-muted">{item.engine}</span>
                    {item.relationship && <span className="text-xs text-ink-muted">· {relationshipLabel(item.relationship)}</span>}
                    {sample && <DemoTag />}
                  </div>
                  <p className="mt-1.5 break-words text-sm text-ink">{item.description}</p>
                </div>
                <ChevronDown
                  className={`mt-1 size-4 shrink-0 text-ink-muted transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
              {open && (
                <dl id={detailsId} className="grid grid-cols-1 gap-x-6 gap-y-2 border-t border-line px-3.5 py-3 text-sm sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium text-ink-muted">What this provenance means</dt>
                    <dd className="text-ink">{provenanceNotes[item.provenance] ?? `Provenance reported as ${item.provenanceRaw}.`}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-ink-muted">Source reference{sample ? ' (demo)' : ''}</dt>
                    <dd className="break-all font-mono text-xs text-ink">{item.sourceReference}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-ink-muted">Observed</dt>
                    <dd className="text-ink">{item.observedAt ? formatDateTime(item.observedAt) : 'Not provided by the backend'}</dd>
                  </div>
                  {item.path && (
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-medium text-ink-muted">Relationship path</dt>
                      <dd className="break-all font-mono text-xs text-ink">{item.path.join(' → ')}</dd>
                    </div>
                  )}
                  {item.verification && (
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-medium text-ink-muted">Verification record</dt>
                      <dd className="break-words text-ink">
                        Verified by {item.verification.verified_by} ({item.verification.verification_authority_org}) on{' '}
                        {formatDateTime(item.verification.verified_at)}. Reference{' '}
                        <span className="break-all font-mono text-xs">{item.verification.verification_reference}</span>.
                      </dd>
                    </div>
                  )}
                </dl>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
