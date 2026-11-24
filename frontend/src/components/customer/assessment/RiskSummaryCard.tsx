import { ArrowRight } from 'lucide-react';
import type { AlertPlayback, AssessmentView } from '../../../types/assessment';
import { formatDateTime, formatMoney } from '../../../utils/format';
import { Card } from '../CustomerPrimitives';
import { AudibleWarningControl } from './AlertSoundControls';
import { verdictStyles } from './assessmentUi';

interface RiskSummaryCardProps {
  view: AssessmentView;
  alertPlayback: AlertPlayback | null;
}

export function RiskSummaryCard({ view, alertPlayback }: RiskSummaryCardProps) {
  const { verdict, transaction, intervention } = view;
  const style = verdictStyles[verdict.kind];
  const Icon = style.icon;
  const isHigh = verdict.kind === 'high';

  const facts = [
    {
      label: 'Amount',
      value:
        transaction.amount !== null && transaction.currency
          ? formatMoney(transaction.amount, transaction.currency)
          : 'Not available',
    },
    { label: 'Currency', value: transaction.currency ?? 'Not available' },
    { label: 'Recipient UPI ID', value: transaction.recipientId },
    { label: 'Status', value: view.source === 'demo' ? 'Demo assessment' : 'Assessment completed' },
    { label: 'Assessed', value: formatDateTime(view.completedAt) },
  ];

  return (
    <Card aria-labelledby="verdict-heading" className="overflow-hidden">
      <div className={`h-1.5 ${style.accentClass}`} aria-hidden="true" />

      <div
        role={isHigh ? 'alert' : undefined}
        className={`p-5 sm:p-6 ${isHigh ? 'border-b border-danger/20 bg-danger/5' : ''}`}
      >
        <div className="flex items-start gap-4">
          <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${style.iconClass}`}>
            <Icon className="size-6" aria-hidden="true" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <p className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${style.badgeClass}`}>
              {verdict.label}
            </p>
            <h2
              id="verdict-heading"
              className={`mt-2 text-xl font-bold tracking-tight sm:text-2xl ${style.headlineClass}`}
            >
              {verdict.headline}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-ink sm:text-base">{verdict.explanation}</p>
          </div>
        </div>

        {view.keyConcerns.length > 0 && (
          <div className="mt-4 sm:pl-16">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Main warning signs</p>
            <ul className="mt-1.5 flex flex-wrap gap-2">
              {view.keyConcerns.map((concern) => (
                <li key={concern} className="rounded-md border border-line bg-surface px-2.5 py-1 text-sm text-ink">
                  {concern}
                </li>
              ))}
            </ul>
          </div>
        )}

        {isHigh && (
          <div className="mt-4 space-y-3 sm:pl-16">
            <p className="flex items-start gap-2 text-sm font-medium text-ink">
              <ArrowRight className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
              Recommended next step: {intervention.summary}
            </p>
            <AudibleWarningControl initialPlayback={alertPlayback} />
          </div>
        )}
      </div>

      <dl className="grid grid-cols-1 gap-x-6 border-t border-line px-5 py-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-5">
        {facts.map(({ label, value }) => (
          <div key={label} className="flex justify-between gap-4 py-1.5 sm:block">
            <dt className="text-xs font-medium text-ink-muted">{label}</dt>
            <dd className="min-w-0 break-all text-right text-sm font-semibold text-ink sm:mt-0.5 sm:text-left">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
