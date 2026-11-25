import { Info, ListChecks } from 'lucide-react';
import type { InterventionView, VerdictKind } from '../../../types/assessment';
import { Card } from '../CustomerPrimitives';
import { verdictStyles } from './assessmentUi';

interface InterventionCardProps {
  intervention: InterventionView;
  verdictKind: VerdictKind;
}

export function InterventionCard({ intervention, verdictKind }: InterventionCardProps) {
  const style = verdictStyles[verdictKind];
  const isHigh = verdictKind === 'high';
  const isMedium = verdictKind === 'medium';

  const containerTone = isHigh
    ? 'border-rose-300/80 bg-linear-to-b from-rose-50/30 to-surface'
    : isMedium
      ? 'border-amber-300/80 bg-linear-to-b from-amber-50/30 to-surface'
      : 'border-slate-200/90 bg-surface';

  return (
    <Card aria-labelledby="intervention-heading" className={`p-5 sm:p-7 shadow-xs ${containerTone}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Payment Protection Recommendation
        </span>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${style.badgeClass}`}>
          {intervention.title}
        </span>
      </div>

      <div className="mt-3 flex items-start gap-3.5">
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-2xs ${style.iconClass}`}>
          <ListChecks className="size-6" aria-hidden="true" strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="intervention-heading" className="text-lg font-bold tracking-tight text-ink sm:text-xl">
            {intervention.title}
          </h2>
          <p className="mt-0.5 text-sm font-medium text-slate-700">{intervention.summary}</p>
        </div>
      </div>

      {intervention.guidance && (
        <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/90 p-4 text-sm font-medium leading-6 text-slate-800 shadow-2xs">
          <p className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-1">Recommended User Guidance</p>
          {intervention.guidance}
        </div>
      )}

      {intervention.rationale.length > 0 && (
        <div className="mt-4.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Engine Findings & Rationale</h3>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
            {intervention.rationale.map((reason) => (
              <li key={reason} className="flex items-start gap-2 rounded-lg border border-slate-100 bg-white p-2.5 shadow-2xs">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden="true" />
                <span className="min-w-0 break-words">{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-5 flex items-start gap-2 border-t border-slate-200/70 pt-4 text-xs leading-5 text-slate-500">
        <Info className="mt-0.5 size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
        <span>
          <strong>Advisory Notice:</strong> PAYGUARD provides explainable decision support. No actual bank or UPI payment has been paused, blocked, or altered.{' '}
          {intervention.disclaimer}
        </span>
      </p>
    </Card>
  );
}
