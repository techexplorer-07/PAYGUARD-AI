import { Info, ShieldCheck } from 'lucide-react';
import { Card } from './CustomerPrimitives';

export function ProtectionStatus({ className = '' }: { className?: string }) {
  return (
    <Card aria-labelledby="protection-heading" className={`flex flex-col p-5 sm:p-6 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 id="protection-heading" className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
          Payment protection
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
          <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
          Available
        </span>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </span>
        <p className="text-base font-semibold text-ink">Protection services are available.</p>
      </div>

      <p className="mt-3 text-sm leading-6 text-ink-muted">
        PAYGUARD analysis is available when you submit a payment for assessment.
      </p>

      <div className="mt-auto pt-4">
        <p className="flex gap-2 border-t border-line pt-4 text-xs leading-5 text-ink-muted">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          PAYGUARD does not connect to your bank account or monitor payments automatically.
        </p>
      </div>
    </Card>
  );
}
