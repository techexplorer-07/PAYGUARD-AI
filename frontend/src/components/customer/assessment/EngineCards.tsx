import { CircleMinus, Equal, MessageSquareText, Network, UserSearch, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type {
  BehaviouralEngineView,
  ComparisonRow,
  ComparisonState,
  EngineRiskView,
  IntentEngineView,
  NotEvaluatedEngine,
  ProvenanceKind,
  RecipientEngineView,
  SufficiencyView,
} from '../../../types/assessment';
import { formatDate } from '../../../utils/format';
import { Card } from '../CustomerPrimitives';
import { EngineRiskBadge, EvidenceProvenanceBadge } from './AssessmentBadges';
import { provenanceStyles } from './assessmentUi';
import { FindingItem } from './FindingItem';

interface EngineCardProps {
  id: string;
  icon: LucideIcon;
  title: string;
  purpose: string;
  risk?: EngineRiskView;
  children: ReactNode;
}

function EngineCard({ id, icon: Icon, title, purpose, risk, children }: EngineCardProps) {
  return (
    <Card aria-labelledby={`${id}-heading`} className="flex min-w-0 flex-col p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <h3 id={`${id}-heading`} className="text-base font-semibold text-ink">
              {title}
            </h3>
            {risk ? <EngineRiskBadge risk={risk} /> : <NotAssessedBadge />}
          </div>
          <p className="mt-0.5 text-sm text-ink-muted">{purpose}</p>
        </div>
      </div>
      <div className="mt-4 min-w-0">{children}</div>
    </Card>
  );
}

function NotAssessedBadge() {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-ink-muted">
      <CircleMinus className="size-3.5" aria-hidden="true" />
      Not assessed
    </span>
  );
}

function NotEvaluatedNote({ engine }: { engine: NotEvaluatedEngine }) {
  return <p className="rounded-lg bg-muted px-4 py-3 text-sm leading-6 text-ink-muted">{engine.note}</p>;
}

function SufficiencyNote({ sufficiency }: { sufficiency: SufficiencyView }) {
  return (
    <p className={`rounded-lg px-3.5 py-2.5 text-sm leading-5 ${sufficiency.limited ? 'bg-warning/10 text-ink' : 'bg-muted text-ink-muted'}`}>
      <span className="font-semibold text-ink">{sufficiency.label}. </span>
      {sufficiency.description}
    </p>
  );
}

const comparisonStyles: Record<ComparisonState, { label: string; icon: LucideIcon; className: string }> = {
  match: { label: 'Matches', icon: Equal, className: 'bg-success/10 text-success' },
  mismatch: { label: 'Differs', icon: X, className: 'bg-danger/10 text-danger' },
  'not-found': { label: 'Not in message', icon: CircleMinus, className: 'bg-muted text-ink-muted' },
  uncertain: { label: 'Unclear', icon: CircleMinus, className: 'bg-muted text-ink' },
};

function ComparisonTable({ rows }: { rows: ComparisonRow[] }) {
  return (
    <div className="rounded-lg border border-line">
      <div className="hidden grid-cols-[6rem_minmax(0,1fr)_minmax(0,1fr)_7.5rem] gap-3 border-b border-line bg-muted/60 px-4 py-2 text-xs font-medium text-ink-muted sm:grid">
        <span>Detail</span>
        <span>In the message</span>
        <span>You entered</span>
        <span>Result</span>
      </div>
      <ul className="divide-y divide-line">
        {rows.map((row) => {
          const style = comparisonStyles[row.state];
          const Icon = style.icon;
          return (
            <li
              key={row.label}
              className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 px-4 py-3 text-sm sm:grid-cols-[6rem_minmax(0,1fr)_minmax(0,1fr)_7.5rem] sm:items-center"
            >
              <span className="font-medium text-ink">{row.label}</span>
              <span className="row-span-3 self-start justify-self-end sm:order-last sm:row-span-1 sm:justify-self-start">
                <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold ${style.className}`}>
                  <Icon className="size-3.5" aria-hidden="true" />
                  {style.label}
                </span>
              </span>
              <span className="min-w-0 break-all text-ink-muted sm:text-ink">
                <span className="text-ink-muted sm:sr-only">Message: </span>
                {row.requested ?? <span className="text-ink-muted">Not found</span>}
              </span>
              <span className="min-w-0 break-all text-ink-muted sm:text-ink">
                <span className="text-ink-muted sm:sr-only">You entered: </span>
                {row.entered}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SignalLine({ label, detected, evidence }: { label: string; detected: boolean; evidence: string[] }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
      <span className="font-medium text-ink">{label}:</span>
      <span className={detected ? 'font-semibold text-danger' : 'text-ink-muted'}>
        {detected ? 'Detected' : 'Not detected'}
      </span>
      {detected && evidence.length > 0 && (
        <span className="min-w-0 break-words text-ink-muted">({evidence.join(', ')})</span>
      )}
    </div>
  );
}

export function IntentAssessmentCard({ engine }: { engine: IntentEngineView | NotEvaluatedEngine }) {
  return (
    <EngineCard
      id="intent-card"
      icon={MessageSquareText}
      title="Payment intent intelligence"
      purpose="Checks whether the message is pressuring you, and whether your payment matches what it asked for."
      risk={engine.status === 'evaluated' ? engine.risk : undefined}
    >
      {engine.status === 'not-evaluated' ? (
        <NotEvaluatedNote engine={engine} />
      ) : (
        <div className="space-y-4">
          <ComparisonTable rows={engine.comparisons} />
          <div className="space-y-1.5">
            <SignalLine label="Urgency" detected={engine.urgencyDetected} evidence={engine.urgencyEvidence} />
            <SignalLine label="Threat language" detected={engine.threatDetected} evidence={engine.threatEvidence} />
            {engine.purpose && (
              <p className="text-sm">
                <span className="font-medium text-ink">Stated purpose: </span>
                <span className="text-ink-muted">{engine.purpose}</span>
              </p>
            )}
          </div>
          {engine.reasons.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-ink">What the intent check found</h4>
              <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-6 text-ink-muted">
                {engine.reasons.map((reason) => (
                  <li key={reason} className="break-words">
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </EngineCard>
  );
}

export function BehaviouralAssessmentCard({ engine }: { engine: BehaviouralEngineView | NotEvaluatedEngine }) {
  return (
    <EngineCard
      id="behaviour-card"
      icon={UserSearch}
      title="Behavioural intelligence"
      purpose="Compares this payment with your available payment history."
      risk={engine.status === 'evaluated' ? engine.risk : undefined}
    >
      {engine.status === 'not-evaluated' ? (
        <NotEvaluatedNote engine={engine} />
      ) : (
        <div className="space-y-4">
          <SufficiencyNote sufficiency={engine.sufficiency} />
          {engine.findings.length > 0 ? (
            <ul className="divide-y divide-line">
              {engine.findings.map((finding) => (
                <FindingItem key={finding.id} finding={finding} showEngine={false} />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">No behavioural findings were returned.</p>
          )}
          {engine.explanation.length > 0 && (
            <details className="group rounded-lg border border-line">
              <summary className="cursor-pointer list-none rounded-lg px-4 py-2.5 text-sm font-medium text-primary hover:bg-muted/60">
                <span className="group-open:hidden">Show behaviour check notes</span>
                <span className="hidden group-open:inline">Hide behaviour check notes</span>
              </summary>
              <ul className="list-disc space-y-1 border-t border-line py-3 pr-4 pl-9 text-sm leading-6 text-ink-muted">
                {engine.explanation.map((line) => (
                  <li key={line} className="break-words">
                    {line}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </EngineCard>
  );
}

const provenanceOrder: ProvenanceKind[] = ['verified', 'reported', 'inferred', 'extracted', 'statistical', 'unknown'];

export function RecipientAssessmentCard({ engine }: { engine: RecipientEngineView | NotEvaluatedEngine }) {
  return (
    <EngineCard
      id="recipient-card"
      icon={Network}
      title="Recipient risk intelligence"
      purpose="Looks for risk indicators linked to the recipient in PAYGUARD’s evidence records."
      risk={engine.status === 'evaluated' ? engine.risk : undefined}
    >
      {engine.status === 'not-evaluated' ? (
        <NotEvaluatedNote engine={engine} />
      ) : (
        <div className="space-y-4">
          <SufficiencyNote sufficiency={engine.sufficiency} />
          {engine.findings.length > 0 && (
            <ul className="divide-y divide-line">
              {engine.findings.map((finding) => (
                <FindingItem key={finding.id} finding={finding} showEngine={false} />
              ))}
            </ul>
          )}

          {engine.evidence.length > 0 ? (
            <div>
              <h4 className="text-sm font-semibold text-ink">Evidence about this recipient</h4>
              <ul className="mt-2 space-y-2">
                {[...engine.evidence]
                  .sort((a, b) => provenanceOrder.indexOf(a.provenance) - provenanceOrder.indexOf(b.provenance))
                  .map((item) => (
                    <li key={item.id} className="rounded-lg border border-line p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <EvidenceProvenanceBadge provenance={item.provenance} />
                        <span className="text-xs text-ink-muted">Observed {formatDate(item.observedAt)}</span>
                      </div>
                      <p className="mt-1.5 break-words text-sm leading-6 text-ink">{item.description}</p>
                      <p className="mt-1 break-all text-xs text-ink-muted">Source: {item.sourceReference}</p>
                    </li>
                  ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-ink-muted">No recipient evidence items were returned.</p>
          )}

          <div className="rounded-lg bg-muted p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">How to read evidence labels</p>
            <ul className="mt-2 space-y-1.5">
              {(['verified', 'reported', 'inferred'] as const).map((kind) => (
                <li key={kind} className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
                  <EvidenceProvenanceBadge provenance={kind} />
                  <span>{provenanceStyles[kind].meaning}</span>
                </li>
              ))}
            </ul>
          </div>

          {engine.limitations.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-xs leading-5 text-ink-muted">
              {engine.limitations.map((limitation) => (
                <li key={limitation} className="break-words">
                  {limitation}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </EngineCard>
  );
}
