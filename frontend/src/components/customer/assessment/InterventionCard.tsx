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
  return (
    <Card aria-labelledby="intervention-heading" className="p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">PAYGUARD recommends</p>
      <div className="mt-2 flex items-start gap-3">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${style.iconClass}`}>
          <ListChecks className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 id="intervention-heading" className="text-lg font-semibold text-ink">
            {intervention.title}
          </h2>
          <p className="mt-0.5 text-sm text-ink">{intervention.summary}</p>
        </div>
      </div>

      {intervention.guidance && (
        <p className="mt-4 rounded-lg bg-muted px-4 py-3 text-sm leading-6 text-ink">{intervention.guidance}</p>
      )}

      {intervention.rationale.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-ink">Why PAYGUARD recommends this</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-ink-muted marker:text-ink-muted">
            {intervention.rationale.map((reason) => (
              <li key={reason} className="break-words">
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-4 flex gap-2 border-t border-line pt-4 text-xs leading-5 text-ink-muted">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        This is a recommendation only. PAYGUARD has not blocked, paused or approved any payment.{' '}
        {intervention.disclaimer}
      </p>
    </Card>
  );
}
