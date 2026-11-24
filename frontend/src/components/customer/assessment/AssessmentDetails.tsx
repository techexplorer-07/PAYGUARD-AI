import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import type { LabelledValue, TechnicalView } from '../../../types/assessment';
import { Card } from '../CustomerPrimitives';
import { EvidenceProvenanceBadge } from './AssessmentBadges';

export const ASSESSMENT_DETAILS_ID = 'assessment-details';

interface AssessmentDetailsProps {
  technical: TechnicalView;
  open: boolean;
  onToggle: () => void;
}

function ValueList({ items }: { items: LabelledValue[] }) {
  return (
    <dl className="divide-y divide-line rounded-lg border border-line">
      {items.map(({ label, value }) => (
        <div key={label} className="flex flex-col gap-0.5 px-4 py-2.5 sm:flex-row sm:justify-between sm:gap-4">
          <dt className="text-sm text-ink-muted">{label}</dt>
          <dd className="min-w-0 break-all text-sm font-medium text-ink sm:text-right">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export function AssessmentDetails({ technical, open, onToggle }: AssessmentDetailsProps) {
  const panelId = `${ASSESSMENT_DETAILS_ID}-panel`;
  return (
    <Card id={ASSESSMENT_DETAILS_ID} aria-labelledby={`${ASSESSMENT_DETAILS_ID}-heading`} className="scroll-mt-24">
      <h2 id={`${ASSESSMENT_DETAILS_ID}-heading`}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-5 py-4 text-left hover:bg-muted/50 focus-visible:-outline-offset-2 sm:px-6"
        >
          <span>
            <span className="block text-base font-semibold text-ink">Detailed assessment information</span>
            <span className="block text-sm font-normal text-ink-muted">
              Scores, identifiers and evidence references from the assessment.
            </span>
          </span>
          <ChevronDown
            className={`size-5 shrink-0 text-ink-muted transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      </h2>

      {open && (
        <div id={panelId} className="space-y-6 border-t border-line px-5 py-5 sm:px-6">
          <Section title="Scores">
            <p className="mb-2 text-sm leading-6 text-ink-muted">
              PAYGUARD scores are heuristic severity indicators on a 0–1 scale. They are not
              probabilities of fraud.
            </p>
            <ValueList
              items={[
                { label: 'Overall severity score', value: technical.overallScore },
                ...technical.engineScores.map(({ label, value }) => ({ label: `${label} score`, value })),
                { label: 'Overall data coverage', value: technical.dataSufficiency },
              ]}
            />
          </Section>

          <Section title="Recommendation">
            <ValueList items={technical.intervention} />
          </Section>

          {technical.evidence.length > 0 && (
            <Section title="Evidence references">
              <ul className="divide-y divide-line rounded-lg border border-line">
                {technical.evidence.map((row) => (
                  <li key={row.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <EvidenceProvenanceBadge provenance={row.provenance} />
                      <span className="text-xs font-medium text-ink-muted">{row.engine}</span>
                    </div>
                    <p className="mt-1 break-words text-sm text-ink">{row.description}</p>
                    <p className="mt-0.5 break-all text-xs text-ink-muted">{row.sourceReference}</p>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Risk indicators">
            {technical.indicators.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5">
                {technical.indicators.map((indicator) => (
                  <li key={indicator} className="break-all rounded-md bg-muted px-2 py-1 font-mono text-xs text-ink">
                    {indicator}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">No indicators were returned.</p>
            )}
          </Section>

          <Section title="Assessment explanation">
            <p className="break-words text-sm leading-6 text-ink-muted">{technical.unifiedExplanation}</p>
            {technical.recipientExplanation && (
              <p className="mt-2 break-words text-sm leading-6 text-ink-muted">{technical.recipientExplanation}</p>
            )}
          </Section>

          <Section title="Identifiers">
            <ValueList items={[...technical.identifiers, ...technical.model]} />
          </Section>
        </div>
      )}
    </Card>
  );
}
