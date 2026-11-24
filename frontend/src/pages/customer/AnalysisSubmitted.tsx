import { CircleCheck, Info } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { Card } from '../../components/customer/CustomerPrimitives';
import { primaryButtonClass, secondaryButtonClass } from '../../components/customer/customerUi';
import { isPaymentProtectionResponse } from '../../services/paymentProtection';
import { formatDateTime } from '../../utils/format';

/**
 * Navigation boundary between the analysis form (Module 2) and the detailed
 * results view (Module 3). It confirms the backend response was received and
 * carries it in router state, but deliberately does not render risk findings
 * yet — that belongs to the results module.
 */
export function AnalysisSubmitted() {
  const location = useLocation();
  const state: unknown = location.state;
  const assessment =
    typeof state === 'object' && state !== null && 'assessment' in state && isPaymentProtectionResponse(state.assessment)
      ? state.assessment
      : null;

  if (!assessment) {
    return (
      <Card className="mx-auto max-w-xl p-6 text-center sm:p-10">
        <h1 className="text-lg font-semibold text-ink">No assessment to show</h1>
        <p className="mt-1 text-sm text-ink-muted">Start a new payment analysis to see an assessment here.</p>
        <Link to="/analyse" className={`${primaryButtonClass} mt-6`}>
          Analyse a payment
        </Link>
      </Card>
    );
  }

  const details = [
    { label: 'Evaluation reference', value: assessment.evaluation_id },
    { label: 'Completed', value: formatDateTime(assessment.timestamp) },
    { label: 'Recipient', value: assessment.recipient_id },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card aria-labelledby="submitted-heading">
        <div className="p-5 sm:p-6">
          <span className="flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
            <CircleCheck className="size-6" aria-hidden="true" />
          </span>
          <h1 id="submitted-heading" className="mt-4 text-xl font-semibold text-ink">
            Assessment received
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-ink-muted">
            PAYGUARD has completed its analysis of this payment. The detailed results view is being
            built and will be available in an upcoming update.
          </p>
        </div>

        <dl className="divide-y divide-line border-t border-line">
          {details.map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5 px-5 py-3 sm:flex-row sm:justify-between sm:px-6">
              <dt className="text-sm text-ink-muted">{label}</dt>
              <dd className="break-all text-sm font-medium text-ink sm:text-right">{value}</dd>
            </div>
          ))}
        </dl>

        <p className="flex gap-2 border-t border-line px-5 py-4 text-xs leading-5 text-ink-muted sm:px-6">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {assessment.disclaimer}
        </p>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link to="/analyse" className={primaryButtonClass}>
          Analyse another payment
        </Link>
        <Link to="/" className={secondaryButtonClass}>
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
