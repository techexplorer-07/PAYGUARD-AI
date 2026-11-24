import { useRef, useState } from 'react';
import { ArrowLeft, ChevronRight, FlaskConical } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { AlertSoundToggle } from '../../components/customer/assessment/AlertSoundControls';
import { verdictStyles } from '../../components/customer/assessment/assessmentUi';
import { Card } from '../../components/customer/CustomerPrimitives';
import { demoScenarioIds, demoScenarios } from '../../data/demoAssessments';
import type { DemoScenarioId } from '../../data/demoAssessments';
import { parsePaymentProtectionResponse } from '../../services/paymentProtectionParser';
import type { DemoResultLocationState, VerdictKind } from '../../types/assessment';
import { announceAssessment } from '../../utils/assessment/highRiskAlert';
import { deriveVerdictKind, verdictCopy } from '../../utils/assessment/verdict';

function verdictFor(id: DemoScenarioId): VerdictKind | null {
  const response = parsePaymentProtectionResponse(demoScenarios[id].response);
  return response ? deriveVerdictKind(response.unified_risk_assessment) : null;
}

/** Entry point for clearly labelled demo results covering each risk state. */
export function DemoAssessments() {
  const navigate = useNavigate();
  const [opening, setOpening] = useState<DemoScenarioId | null>(null);
  const openingRef = useRef(false);

  const open = async (id: DemoScenarioId) => {
    if (openingRef.current) return;
    openingRef.current = true;
    setOpening(id);
    const kind = verdictFor(id);
    // Selecting a demo counts as a newly completed assessment, so a HIGH demo plays the warning once.
    const alertPlayback = kind ? await announceAssessment(kind) : 'not-applicable';
    const state: DemoResultLocationState = { alertPlayback };
    navigate(`/analyse/demo/${id}`, { state });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        to="/analyse"
        className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-primary hover:text-primary-hover"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Analyse
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">Demo assessment results</h1>
        <p className="mt-1.5 text-sm leading-6 text-ink-muted sm:text-base">
          Preview how PAYGUARD presents each risk level. These samples were produced by running the
          PAYGUARD engines on synthetic data. They are not real payments, customers or live predictions.
        </p>
      </div>

      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <p className="text-sm text-ink-muted">
          Opening the high-risk demo plays the warning sound once, if alert sound is on.
        </p>
        <AlertSoundToggle showTest />
      </Card>

      <ul className="space-y-3" aria-label="Demo scenarios">
        {demoScenarioIds.map((id) => {
          const scenario = demoScenarios[id];
          const kind = verdictFor(id);
          const style = kind ? verdictStyles[kind] : null;
          const Icon = style?.icon ?? FlaskConical;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => open(id)}
                disabled={opening !== null}
                className="flex w-full cursor-pointer items-center gap-4 rounded-xl border border-line bg-surface p-4 text-left shadow-card transition-colors hover:bg-muted/50 disabled:cursor-wait sm:p-5"
              >
                <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${style?.iconClass ?? 'bg-muted text-ink-muted'}`}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-semibold text-ink">{scenario.title}</span>
                    {kind && (
                      <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${verdictStyles[kind].badgeClass}`}>
                        {verdictCopy[kind].label}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-sm leading-5 text-ink-muted">{scenario.description}</span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-ink-muted" aria-hidden="true" />
                {opening === id && <span className="sr-only">Opening…</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
