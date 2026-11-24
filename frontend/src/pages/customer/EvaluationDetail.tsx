import { ArrowLeft, Info } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { Card, DemoDataTag, RiskBadge } from '../../components/customer/CustomerPrimitives';
import { primaryButtonClass, secondaryButtonClass } from '../../components/customer/customerUi';
import { demoEvaluations } from '../../data/customerDemoData';
import { formatDateTime, formatInr } from '../../utils/format';

const backLinkClass =
  'inline-flex items-center gap-1.5 rounded text-sm font-medium text-primary hover:text-primary-hover';

export function EvaluationDetail() {
  const { evaluationId } = useParams();
  const record = demoEvaluations.find((item) => item.id === evaluationId);

  if (!record) {
    return (
      <div className="space-y-6">
        <Link to="/activity" className={backLinkClass}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to activity
        </Link>
        <Card className="p-6 text-center sm:p-10">
          <h1 className="text-lg font-semibold text-ink">Assessment not found</h1>
          <p className="mt-1 text-sm text-ink-muted">This assessment does not exist or is no longer available.</p>
        </Card>
      </div>
    );
  }

  const details = [
    { label: 'Recipient', value: record.recipient },
    { label: 'Assessed on', value: formatDateTime(record.evaluatedAt) },
    { label: 'Reference', value: record.id },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link to="/activity" className={backLinkClass}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to activity
      </Link>

      <Card aria-labelledby="detail-heading">
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <RiskBadge level={record.riskLevel} />
            <DemoDataTag />
          </div>
          <h1 id="detail-heading" className="mt-3 text-xl font-semibold text-ink">
            {record.description}
          </h1>
          <p className="mt-1 text-3xl font-bold tabular-nums text-ink">{formatInr(record.amount)}</p>
        </div>

        <dl className="divide-y divide-line border-t border-line">
          {details.map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5 px-5 py-3 sm:flex-row sm:justify-between sm:px-6">
              <dt className="text-sm text-ink-muted">{label}</dt>
              <dd className="break-all text-sm font-medium text-ink sm:text-right">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="border-t border-line p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-ink">About this assessment</h2>
          <p className="mt-1.5 text-sm leading-6 text-ink-muted">{record.summary}</p>
          <p className="mt-4 flex gap-2 rounded-lg bg-muted p-3 text-xs leading-5 text-ink-muted">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            This is an illustrative sample. It is not a real transaction or an actual PAYGUARD model
            prediction.
          </p>
        </div>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link to="/analyse" className={primaryButtonClass}>
          Analyse a new payment
        </Link>
        <Link to="/" className={secondaryButtonClass}>
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
