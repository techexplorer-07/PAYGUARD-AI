import { useState } from 'react';
import type { AlertPlayback, AssessmentView } from '../../../types/assessment';
import { AlertSoundToggle } from './AlertSoundControls';
import { AssessmentActions } from './AssessmentActions';
import { ASSESSMENT_DETAILS_ID, AssessmentDetails } from './AssessmentDetails';
import { BehaviouralAssessmentCard, IntentAssessmentCard, RecipientAssessmentCard } from './EngineCards';
import { InterventionCard } from './InterventionCard';
import { RiskExplanationList } from './RiskExplanationList';
import { RiskSummaryCard } from './RiskSummaryCard';

interface AssessmentReportProps {
  view: AssessmentView;
  alertPlayback: AlertPlayback | null;
}

/** Full results layout shared by live and demo assessments. */
export function AssessmentReport({ view, alertPlayback }: AssessmentReportProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const toggleDetails = () => {
    const next = !detailsOpen;
    setDetailsOpen(next);
    if (next) {
      requestAnimationFrame(() => {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        document
          .getElementById(ASSESSMENT_DETAILS_ID)
          ?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">Assessment result</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Reference <span className="break-all font-medium text-ink">{view.evaluationId}</span>
          </p>
        </div>
        <AlertSoundToggle />
      </div>

      <RiskSummaryCard view={view} alertPlayback={alertPlayback} />

      <div className="grid grid-cols-1 items-start gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 sm:space-y-6 lg:col-span-2">
          <InterventionCard intervention={view.intervention} verdictKind={view.verdict.kind} />
          <RiskExplanationList
            findings={view.findings}
            missingEvidence={view.missingEvidence}
            conflictingSignals={view.conflictingSignals}
          />

          <section aria-labelledby="engines-heading" className="space-y-4 sm:space-y-6">
            <div>
              <h2 id="engines-heading" className="text-lg font-semibold text-ink">
                What each intelligence check found
              </h2>
              <p className="mt-0.5 text-sm text-ink-muted">
                PAYGUARD combines three independent checks. Some checks only run when the
                information they need is available.
              </p>
            </div>
            <IntentAssessmentCard engine={view.intent} />
            <BehaviouralAssessmentCard engine={view.behavioural} />
            <RecipientAssessmentCard engine={view.recipient} />
          </section>

          <AssessmentDetails technical={view.technical} open={detailsOpen} onToggle={toggleDetails} />
        </div>

        <aside className="min-w-0 lg:sticky lg:top-24">
          <AssessmentActions detailsOpen={detailsOpen} onToggleDetails={toggleDetails} />
        </aside>
      </div>

      <p className="text-xs leading-5 text-ink-muted">{view.disclaimer}</p>
    </div>
  );
}
