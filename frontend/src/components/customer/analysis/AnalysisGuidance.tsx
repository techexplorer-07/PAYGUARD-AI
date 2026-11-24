import { Info } from 'lucide-react';
import { Card } from '../CustomerPrimitives';

const steps = [
  {
    title: 'You share what you received',
    body: 'Nothing is sent until you give consent and select Analyse payment.',
  },
  {
    title: 'PAYGUARD reviews the request',
    body: 'The message is compared with the payment details, alongside available risk indicators for the recipient.',
  },
  {
    title: 'You decide what to do',
    body: 'PAYGUARD never makes the payment for you.',
  },
];

export function AnalysisGuidance() {
  return (
    <Card aria-labelledby="guidance-heading" className="p-5 sm:p-6">
      <h2 id="guidance-heading" className="text-base font-semibold text-ink">
        How it works
      </h2>
      <ol className="mt-4 space-y-4">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-ink-muted"
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">{step.title}</p>
              <p className="mt-0.5 text-sm leading-5 text-ink-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-5 flex gap-2 border-t border-line pt-4 text-xs leading-5 text-ink-muted">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        This is a simulated assessment. PAYGUARD does not connect to your bank account or UPI app.
      </p>
    </Card>
  );
}
