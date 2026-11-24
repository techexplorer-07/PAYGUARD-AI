import { CircleExclamationPoint } from 'lucide-react';
import type { PaymentProtectionApiError } from '../../../services/paymentProtection';
import type { ApiValidationIssue } from '../../../types/paymentProtection';

const titles: Record<PaymentProtectionApiError['kind'], string> = {
  validation: 'Some details need attention',
  rejected: 'The analysis request was not accepted',
  network: 'We couldn’t reach the analysis service',
  timeout: 'The analysis is taking too long',
  server: 'The analysis couldn’t be completed',
  'invalid-response': 'The analysis couldn’t be completed',
};

const guidance: Record<PaymentProtectionApiError['kind'], string> = {
  validation: 'Review the highlighted fields and try again.',
  rejected: 'Check your details and try again.',
  network: 'Check your internet connection and try again. Your details are still filled in.',
  timeout: 'Please try again in a moment. Your details are still filled in.',
  server: 'Please try again in a moment. Your details are still filled in.',
  'invalid-response': 'Please try again in a moment. Your details are still filled in.',
};

interface SubmissionErrorProps {
  error: PaymentProtectionApiError;
  unmappedIssues: ApiValidationIssue[];
}

export function SubmissionError({ error, unmappedIssues }: SubmissionErrorProps) {
  const showServerMessage = error.kind === 'rejected';
  return (
    <div role="alert" className="flex gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4">
      <CircleExclamationPoint className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden="true" />
      <div className="min-w-0 text-sm">
        <p className="font-semibold text-ink">{titles[error.kind]}</p>
        {showServerMessage && <p className="mt-1 text-ink">{error.message}</p>}
        <p className="mt-1 text-ink-muted">{guidance[error.kind]}</p>
        {unmappedIssues.length > 0 && (
          <ul className="mt-2 list-disc space-y-0.5 pl-5 text-ink-muted">
            {unmappedIssues.map((issue) => (
              <li key={`${issue.loc.join('.')}-${issue.msg}`}>{issue.msg}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
