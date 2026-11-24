import { useRef } from 'react';
import { X } from 'lucide-react';
import { MESSAGE_MAX_LENGTH } from '../../../utils/paymentAnalysisValidation';
import { FormField } from '../FormField';
import { inputClass } from '../customerUi';
import { FormSection } from './FormSection';

interface PaymentRequestSectionProps {
  id: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

export function PaymentRequestSection({ id, value, error, onChange, onBlur }: PaymentRequestSectionProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const length = value.length;
  const counterId = `${id}-count`;
  const counterTone =
    length > MESSAGE_MAX_LENGTH
      ? 'text-danger font-medium'
      : length >= MESSAGE_MAX_LENGTH * 0.9
        ? 'text-warning-strong'
        : 'text-ink-muted';

  const clear = () => {
    onChange('');
    textareaRef.current?.focus();
  };

  return (
    <FormSection
      id="payment-request"
      step={1}
      title="Payment request"
      description="Paste the message or payment instructions you received."
    >
      <FormField
        id={id}
        label="Message or payment instructions"
        optional
        hint="Only share messages relevant to this payment. Do not include passwords, OTPs or UPI PINs."
        error={error}
        metaId={counterId}
        labelAction={
          <button
            type="button"
            onClick={clear}
            disabled={length === 0}
            aria-label="Clear message"
            className="-my-1 inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-md px-2 text-sm font-medium text-primary transition-colors hover:bg-muted hover:text-primary-hover disabled:cursor-default disabled:text-ink-muted/60 disabled:hover:bg-transparent"
          >
            <X className="size-4" aria-hidden="true" />
            Clear
          </button>
        }
        meta={
          <p id={counterId} className={`shrink-0 text-xs tabular-nums ${counterTone}`}>
            <span className="sr-only">Characters used: </span>
            {length.toLocaleString('en-IN')} / {MESSAGE_MAX_LENGTH.toLocaleString('en-IN')}
          </p>
        }
      >
        {(control) => (
          <textarea
            {...control}
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onBlur={onBlur}
            rows={6}
            placeholder="Paste the SMS, WhatsApp message or payment instructions here..."
            autoComplete="off"
            className={`${inputClass} min-h-36 resize-y py-3 leading-6`}
          />
        )}
      </FormField>
      {length === 0 && (
        <p className="mt-3 rounded-lg bg-muted px-3.5 py-2.5 text-sm leading-5 text-ink-muted">
          Adding the message lets PAYGUARD compare what you were asked to pay with the payment you
          intend to make. You can still analyse the payment details without it.
        </p>
      )}
    </FormSection>
  );
}
