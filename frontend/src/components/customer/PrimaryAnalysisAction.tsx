import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router';
import { Card } from './CustomerPrimitives';
import { primaryButtonClass } from './customerUi';

const checks = ['Payment intent', 'Unusual behaviour', 'Recipient risk'];

export function PrimaryAnalysisAction({ className = '' }: { className?: string }) {
  return (
    <Card aria-labelledby="analyse-heading" className={`flex flex-col p-5 sm:p-6 ${className}`}>
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 id="analyse-heading" className="text-lg font-semibold text-ink">
            Analyse a payment
          </h2>
          <p className="mt-1 text-sm leading-6 text-ink-muted">
            Check a payment request for suspicious intent, unusual behaviour and recipient risk
            before proceeding.
          </p>
        </div>
      </div>

      <ul className="mt-5 flex flex-wrap gap-2" aria-label="What the analysis checks">
        {checks.map((check) => (
          <li
            key={check}
            className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-ink-muted"
          >
            {check}
          </li>
        ))}
      </ul>

      <div className="mt-6 sm:mt-auto sm:pt-6">
        <Link to="/analyse" className={`${primaryButtonClass} w-full sm:w-auto`}>
          Start payment analysis
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </Card>
  );
}
