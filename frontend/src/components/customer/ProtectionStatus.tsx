import { Info, ShieldCheck } from 'lucide-react';
import { Card } from './CustomerPrimitives';

export function ProtectionStatus({ className = '' }: { className?: string }) {
  return (
    <Card aria-labelledby="protection-heading" className={`flex flex-col p-5 sm:p-6 bg-surface ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 id="protection-heading" className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
          Payment Protection
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 shadow-2xs">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          Active Ready
        </span>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/70">
          <ShieldCheck className="size-6" aria-hidden="true" strokeWidth={2.25} />
        </span>
        <div>
          <p className="text-base font-bold text-ink">Protection Engine Active</p>
          <p className="text-xs text-ink-muted">On-demand intent & graph inspection</p>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-ink-muted">
        Multi-engine correlation runs instantly upon submission to evaluate payment context, recipient graph signals, and customer velocity baselines.
      </p>

      <div className="mt-auto pt-4">
        <p className="flex gap-2 border-t border-line pt-4 text-xs leading-5 text-ink-muted">
          <Info className="mt-0.5 size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          Zero automated banking hooks: PAYGUARD operates strictly on customer-submitted payment parameters.
        </p>
      </div>
    </Card>
  );
}
