/**
 * Validation and request mapping for the Payment Analysis form.
 * Limits mirror the backend contract (see types/paymentProtection.ts) and are
 * kept here as named constants so they can be updated in one place.
 */
import type { PaymentProtectionRequest } from '../types/paymentProtection';

/** backend PaymentProtectionRequest.communication_text max_length */
export const MESSAGE_MAX_LENGTH = 5000;

/** backend SimulatedTransaction.recipient_id min_length / max_length */
export const RECIPIENT_MIN_LENGTH = 3;
export const RECIPIENT_MAX_LENGTH = 120;

/**
 * The backend accepts any ^[A-Z]{3}$ code (default INR). These are the codes its
 * intent extractor recognises in message text, so they compare meaningfully.
 */
export const SUPPORTED_CURRENCIES = [
  { code: 'INR', label: 'INR – Indian rupee' },
  { code: 'USD', label: 'USD – US dollar' },
  { code: 'EUR', label: 'EUR – Euro' },
  { code: 'GBP', label: 'GBP – British pound' },
  { code: 'CAD', label: 'CAD – Canadian dollar' },
  { code: 'AUD', label: 'AUD – Australian dollar' },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]['code'];
export const DEFAULT_CURRENCY: CurrencyCode = 'INR';

export interface PaymentAnalysisValues {
  message: string;
  amount: string;
  currency: CurrencyCode;
  recipient: string;
  consent: boolean;
}

export type PaymentAnalysisField = keyof PaymentAnalysisValues;
export type PaymentAnalysisErrors = Partial<Record<PaymentAnalysisField, string>>;

export const initialPaymentAnalysisValues: PaymentAnalysisValues = {
  message: '',
  amount: '',
  currency: DEFAULT_CURRENCY,
  recipient: '',
  consent: false,
};

/** Up to 12 integer digits and 2 decimal places; thousands separators allowed. */
const AMOUNT_PATTERN = /^\d{1,12}(\.\d{1,2})?$/;

/**
 * Deliberately permissive UPI-style check: a handle, "@", and a provider.
 * Allows letters, digits, dots, hyphens and underscores without assuming
 * specific bank handles.
 */
const UPI_PATTERN = /^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+$/;

export function normaliseAmount(raw: string): string {
  return raw.replace(/[,\s]/g, '');
}

export function parseAmount(raw: string): number | null {
  const normalised = normaliseAmount(raw);
  if (!AMOUNT_PATTERN.test(normalised)) return null;
  const value = Number(normalised);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function validateMessage(message: string): string | undefined {
  if (message.length > MESSAGE_MAX_LENGTH) {
    const over = message.length - MESSAGE_MAX_LENGTH;
    return `Message is ${over.toLocaleString('en-IN')} character${over === 1 ? '' : 's'} over the ${MESSAGE_MAX_LENGTH.toLocaleString('en-IN')} limit. Remove anything not related to this payment.`;
  }
  return undefined;
}

export function validateAmount(amount: string): string | undefined {
  const normalised = normaliseAmount(amount);
  if (normalised === '') return 'Enter the amount you intend to pay.';
  if (!/^\d*\.?\d*$/.test(normalised)) return 'Enter the amount using numbers only, for example 8500 or 8500.50.';
  if (/\.\d{3,}$/.test(normalised)) return 'Use no more than 2 decimal places.';
  if (normalised.split('.')[0].length > 12) return 'Enter a smaller amount.';
  if (parseAmount(amount) === null) return 'Enter an amount greater than zero.';
  return undefined;
}

export function validateRecipient(recipient: string): string | undefined {
  const value = recipient.trim();
  if (value === '') return 'Enter the recipient’s UPI ID.';
  if (value.length < RECIPIENT_MIN_LENGTH) return `UPI ID must be at least ${RECIPIENT_MIN_LENGTH} characters.`;
  if (value.length > RECIPIENT_MAX_LENGTH) return `UPI ID must be ${RECIPIENT_MAX_LENGTH} characters or fewer.`;
  if (!UPI_PATTERN.test(value)) return 'Enter a UPI ID in the format name@provider, for example name@okbank.';
  return undefined;
}

export function validatePaymentAnalysis(values: PaymentAnalysisValues): PaymentAnalysisErrors {
  const errors: PaymentAnalysisErrors = {};
  const message = validateMessage(values.message);
  const amount = validateAmount(values.amount);
  const recipient = validateRecipient(values.recipient);
  if (message) errors.message = message;
  if (amount) errors.amount = amount;
  if (recipient) errors.recipient = recipient;
  if (!values.consent) errors.consent = 'Select the consent box to continue.';
  return errors;
}

/**
 * Maps validated form values to the backend request. Callers must validate
 * first; this throws if the amount is not parseable.
 */
export function toPaymentProtectionRequest(values: PaymentAnalysisValues): PaymentProtectionRequest {
  const amount = parseAmount(values.amount);
  if (amount === null) throw new Error('toPaymentProtectionRequest called with an invalid amount');
  const message = values.message.trim();
  return {
    customer_consent: values.consent,
    communication_text: message === '' ? null : message,
    simulated_transaction: {
      amount,
      currency: values.currency,
      recipient_id: values.recipient.trim(),
    },
  };
}

/** Maps a backend 422 `loc` path to the form field it concerns, if any. */
export function fieldForApiLocation(loc: (string | number)[]): PaymentAnalysisField | undefined {
  const path = loc.join('.');
  if (path.endsWith('communication_text')) return 'message';
  if (path.endsWith('simulated_transaction.amount')) return 'amount';
  if (path.endsWith('simulated_transaction.currency')) return 'currency';
  if (path.endsWith('simulated_transaction.recipient_id') || path.endsWith('body.recipient_id')) return 'recipient';
  if (path.endsWith('customer_consent')) return 'consent';
  return undefined;
}
