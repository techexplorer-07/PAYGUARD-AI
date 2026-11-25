import { CircleExclamationPoint } from 'lucide-react';
import { FormSection } from './FormSection';

interface ConsentSectionProps {
  id: string;
  checked: boolean;
  error?: string;
  onChange: (checked: boolean) => void;
}

export function ConsentSection({ id, checked, error, onChange }: ConsentSectionProps) {
  const privacyId = `${id}-privacy`;
  const errorId = `${id}-error`;

  return (
    <FormSection
      id="consent"
      step={3}
      title="Your consent"
      description="PAYGUARD only analyses your details when you explicitly agree."
    >
      <label
        htmlFor={id}
        className={`flex cursor-pointer items-start gap-3.5 rounded-xl border p-4.5 transition-all ${
          checked
            ? 'border-sky-300 bg-sky-50/50 ring-2 ring-sky-500/10'
            : error
              ? 'border-rose-300 bg-rose-50/30 ring-2 ring-rose-500/10'
              : 'border-slate-200/90 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-300'
        }`}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-describedby={[privacyId, error ? errorId : ''].filter(Boolean).join(' ')}
          aria-invalid={error ? true : undefined}
          className="mt-1 size-4.5 shrink-0 cursor-pointer accent-primary rounded"
        />
        <div className="min-w-0">
          <span className="text-sm font-semibold text-ink">
            I voluntarily consent to PAYGUARD analysing the message and payment details I have provided for this assessment.
          </span>
          <p id={privacyId} className="mt-1 text-xs leading-5 text-ink-muted">
            Your details are sent to the PAYGUARD analysis service only when you select Analyse payment, and are used for this assessment. This is a simulated check: no payment is made and your bank account is not accessed.
          </p>
        </div>
      </label>

      {error && (
        <p id={errorId} className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
          <CircleExclamationPoint className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </FormSection>
  );
}
