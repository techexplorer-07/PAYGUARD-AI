import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router';
import { Card } from './CustomerPrimitives';
import { primaryButtonClass } from './customerUi';

const checks = ['Payment intent', 'Unusual behaviour', 'Recipient risk'];

export function PrimaryAnalysisAction({ className = '' }: { className?: string }) {
  return (
    <Card aria-labelledby="analyse-heading" className={`relative flex flex-col p-5 sm:p-7 bg-linear-to-br from-surface via-surface to-slate-50/60 overflow-hidden ${className}`}>
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-tr from-sky-600 to-cyan-500 text-white shadow-sm ring-4 ring-sky-50">
          <ShieldCheck className="size-6" aria-hidden="true" strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 id="analyse-heading" className="text-lg font-bold tracking-tight text-ink sm:text-xl">
              Analyse a payment
            </h2>
            <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 border border-sky-200/60">
              Live Shield
            </span>
          </div>
          <p className="mt-1 text-sm leading-6 text-ink-muted">
            Check any payment request for deceptive intent, behavioral velocity anomalies, and recipient fraud records before irreversible money transfer.
          </p>
        </div>
      </div>

      <ul className="mt-5 flex flex-wrap gap-2" aria-label="What the analysis checks">
        {checks.map((check) => (
          <li
            key={check}
            className="inline-flex items-center rounded-lg border border-slate-200/80 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-2xs"
          >
            <span className="mr-1.5 size-1.5 rounded-full bg-sky-500" aria-hidden="true" />
            {check}
          </li>
        ))}
      </ul>

      <div className="mt-6 sm:mt-auto sm:pt-6">
        <Link to="/analyse" className={`${primaryButtonClass} group w-full sm:w-auto shadow-md shadow-sky-600/10`}>
          <span>Start payment analysis</span>
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>
    </Card>
  );
}
