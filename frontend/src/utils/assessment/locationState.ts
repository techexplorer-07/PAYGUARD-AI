import { parsePaymentProtectionResponse } from '../../services/paymentProtectionParser';
import type { AlertPlayback, SubmittedTransaction } from '../../types/assessment';
import type { PaymentProtectionResponse } from '../../types/paymentProtection';

const alertPlaybackValues: AlertPlayback[] = ['played', 'blocked', 'muted', 'unsupported', 'not-applicable'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function readAlertPlayback(state: unknown): AlertPlayback | null {
  if (!isRecord(state)) return null;
  const value = state.alertPlayback;
  return typeof value === 'string' && (alertPlaybackValues as string[]).includes(value) ? (value as AlertPlayback) : null;
}

function readSubmitted(value: unknown): SubmittedTransaction | null {
  if (!isRecord(value)) return null;
  const { amount, currency, recipientId } = value;
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) return null;
  if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) return null;
  if (typeof recipientId !== 'string' || recipientId === '') return null;
  return { amount, currency, recipientId };
}

export type ResultStateRead =
  | { status: 'missing' }
  | { status: 'unexpected' }
  | {
      status: 'ok';
      assessment: PaymentProtectionResponse;
      submitted: SubmittedTransaction | null;
      alertPlayback: AlertPlayback | null;
    };

/** Validates router state for /analyse/result. History state survives refresh, so this also covers reopened results. */
export function readResultLocationState(state: unknown): ResultStateRead {
  if (!isRecord(state) || !('assessment' in state)) return { status: 'missing' };
  const assessment = parsePaymentProtectionResponse(state.assessment);
  if (!assessment) return { status: 'unexpected' };
  return {
    status: 'ok',
    assessment,
    submitted: readSubmitted(state.submitted),
    alertPlayback: readAlertPlayback(state),
  };
}
