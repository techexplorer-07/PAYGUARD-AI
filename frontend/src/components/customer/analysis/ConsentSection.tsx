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
        className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors ${
          checked ? 'border-primary/40 bg-primary/5' : error ? 'border-danger' : 'border-line hover:bg-muted/60'
        }`}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-describedby={[privacyId, error ? errorId : ''].filter(Boolean).join(' ')}
          aria-invalid={error ? true : undefined}
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary"
        />
        <span className="text-sm leading-6 text-ink">
          I voluntarily consent to PAYGUARD analysing the message and payment details I have
          provided for this assessment.
        </span>
      </label>

      {error && (
        <p id={errorId} className="mt-1.5 flex gap-1.5 text-sm text-danger">
          <CircleExclamationPoint className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <p id={privacyId} className="mt-3 text-sm leading-5 text-ink-muted">
        Your details are sent to the PAYGUARD analysis service only when you select Analyse payment,
        and are used for this assessment. This is a simulated check: no payment is made and your
        bank account is not accessed.
      </p>
    </FormSection>
  );
}
