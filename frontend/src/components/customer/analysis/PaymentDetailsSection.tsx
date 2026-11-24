import { ChevronDown } from 'lucide-react';
import { SUPPORTED_CURRENCIES } from '../../../utils/paymentAnalysisValidation';
import type { CurrencyCode } from '../../../utils/paymentAnalysisValidation';
import { FormField } from '../FormField';
import { inputClass } from '../customerUi';
import { FormSection } from './FormSection';

interface FieldState<T> {
  id: string;
  value: T;
  error?: string;
  onChange: (value: T) => void;
  onBlur: () => void;
}

interface PaymentDetailsSectionProps {
  amount: FieldState<string>;
  currency: FieldState<CurrencyCode>;
  recipient: FieldState<string>;
}

function isCurrencyCode(value: string): value is CurrencyCode {
  return SUPPORTED_CURRENCIES.some((currency) => currency.code === value);
}

export function PaymentDetailsSection({ amount, currency, recipient }: PaymentDetailsSectionProps) {
  return (
    <FormSection
      id="payment-details"
      step={2}
      title="Payment details"
      description="Enter the transaction information you intend to use."
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[minmax(0,1fr)_14rem]">
        <FormField id={amount.id} label="Amount" error={amount.error}>
          {(control) => (
            <input
              {...control}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              value={amount.value}
              onChange={(event) => amount.onChange(event.target.value)}
              onBlur={amount.onBlur}
              className={`${inputClass} h-11 tabular-nums`}
            />
          )}
        </FormField>

        <FormField id={currency.id} label="Currency" error={currency.error}>
          {(control) => (
            <div className="relative">
              <select
                {...control}
                value={currency.value}
                onChange={(event) => {
                  if (isCurrencyCode(event.target.value)) currency.onChange(event.target.value);
                }}
                onBlur={currency.onBlur}
                className={`${inputClass} h-11 cursor-pointer appearance-none pr-10`}
              >
                {SUPPORTED_CURRENCIES.map(({ code, label }) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
                aria-hidden="true"
              />
            </div>
          )}
        </FormField>

        <FormField
          id={recipient.id}
          label="Recipient UPI ID"
          hint="The UPI ID you have been asked to pay, for example name@okbank."
          error={recipient.error}
          className="sm:col-span-2"
        >
          {(control) => (
            <input
              {...control}
              type="text"
              inputMode="email"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="name@provider"
              value={recipient.value}
              onChange={(event) => recipient.onChange(event.target.value)}
              onBlur={recipient.onBlur}
              className={`${inputClass} h-11`}
            />
          )}
        </FormField>
      </div>
    </FormSection>
  );
}
