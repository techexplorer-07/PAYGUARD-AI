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

  const cardTone = isHigh
    ? 'border-rose-300/80 bg-linear-to-b from-rose-50/50 via-white/90 to-white shadow-glow-rose ring-2 ring-rose-500/20'
    : verdict.kind === 'medium'
      ? 'border-amber-300/80 bg-linear-to-b from-amber-50/50 via-white/90 to-white shadow-lg ring-2 ring-amber-500/20'
      : verdict.kind === 'low'
        ? 'border-emerald-300/80 bg-linear-to-b from-emerald-50/50 via-white/90 to-white shadow-glow-emerald ring-2 ring-emerald-500/20'
        : 'border-slate-200/90 bg-white/90 shadow-md';

  return (
    <Card aria-labelledby="verdict-heading" className={`overflow-hidden ${cardTone}`}>
      <div
        role={isHigh ? 'alert' : undefined}
        className={`p-5 sm:p-7 ${isHigh ? 'border-b border-rose-200/60 bg-rose-50/20' : ''}`}
      >
        <div className="flex items-start gap-4">
          <span className={`flex size-13 shrink-0 items-center justify-center rounded-2xl shadow-xs ring-4 ring-white ${style.iconClass}`}>
            <Icon className="size-7" aria-hidden="true" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wide shadow-2xs ${style.badgeClass}`}>
              <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
              {verdict.label}
            </span>
            <h2
              id="verdict-heading"
              className={`mt-2 text-xl font-extrabold tracking-tight sm:text-2xl ${style.headlineClass}`}
            >
              {verdict.headline}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-700 sm:text-base">{verdict.explanation}</p>
          </div>
        </div>

        {view.keyConcerns.length > 0 && (
          <div className="mt-5 sm:pl-17">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Key Warning Flags Detected</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {view.keyConcerns.map((concern) => (
                <li key={concern} className="inline-flex items-center rounded-lg border border-slate-200/90 bg-white/95 px-3 py-1 text-xs font-semibold text-slate-800 shadow-2xs">
                  <span className="mr-1.5 size-1.5 rounded-full bg-rose-500" aria-hidden="true" />
                  {concern}
                </li>
              ))}
            </ul>
          </div>
        )}

        {isHigh && (
          <div className="mt-5 space-y-3 rounded-xl border border-rose-200/70 bg-rose-50/70 p-4 sm:ml-17">
            <p className="flex items-start gap-2 text-sm font-bold text-rose-900">
              <ArrowRight className="mt-0.5 size-4 shrink-0 text-rose-600" aria-hidden="true" />
              Recommended action: {intervention.summary}
            </p>
            <AudibleWarningControl initialPlayback={alertPlayback} />
          </div>
        )}
      </div>

      <dl className="grid grid-cols-1 gap-x-6 border-t border-slate-200/80 bg-slate-50/40 px-5 py-4 sm:grid-cols-2 sm:px-7 lg:grid-cols-5">
        {facts.map(({ label, value }) => (
          <div key={label} className="flex justify-between gap-4 py-1.5 sm:block">
            <dt className="text-xs font-medium text-slate-500">{label}</dt>
            <dd className="min-w-0 break-all text-right text-sm font-semibold tabular-nums text-slate-900 sm:mt-1 sm:text-left">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
