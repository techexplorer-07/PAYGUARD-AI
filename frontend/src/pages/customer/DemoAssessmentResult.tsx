import { ArrowLeft, FlaskConical } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router';
import { AssessmentReport } from '../../components/customer/assessment/AssessmentReport';
import { AssessmentStatePanel } from '../../components/customer/assessment/AssessmentStatePanel';
import { demoScenarios, isDemoScenarioId } from '../../data/demoAssessments';
import { parsePaymentProtectionResponse } from '../../services/paymentProtectionParser';
import { buildAssessmentView } from '../../utils/assessment/buildAssessmentView';
import { readAlertPlayback } from '../../utils/assessment/locationState';

/** A clearly labelled demo result. Demo data is only ever read here, never mixed with live results. */
export function DemoAssessmentResult() {
  const { scenarioId } = useParams();
  const location = useLocation();

  if (!isDemoScenarioId(scenarioId)) return <AssessmentStatePanel kind="missing" />;

  const scenario = demoScenarios[scenarioId];
  const response = parsePaymentProtectionResponse(scenario.response);
  if (!response) return <AssessmentStatePanel kind="unexpected" />;

  const view = buildAssessmentView(response, scenario.submitted, 'demo');

  return (
    <div className="space-y-4 sm:space-y-6">
      <div
        role="note"
        className="flex flex-col gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="flex gap-2.5 text-sm leading-5 text-ink">
          <FlaskConical className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <span>
            <span className="font-semibold">Demo assessment: {scenario.title}.</span> Sample data processed by the
            PAYGUARD engines for demonstration. Not a real payment, customer or live prediction.
          </span>
        </p>
        <Link
          to="/analyse/demo"
          className="inline-flex shrink-0 items-center gap-1.5 rounded text-sm font-medium text-primary hover:text-primary-hover"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          All demo results
        </Link>
      </div>
      <AssessmentReport view={view} alertPlayback={readAlertPlayback(location.state)} />
    </div>
  );
}
