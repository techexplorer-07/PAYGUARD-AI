/**
 * Integration boundary for the backend Payment Protection endpoint.
 * All network details for payment analysis live here; UI code only sees
 * `evaluatePayment` and `PaymentProtectionApiError`.
 */
import type {
  ApiValidationIssue,
  PaymentProtectionRequest,
  PaymentProtectionResponse,
} from '../types/paymentProtection';
import { API_BASE_URL } from './api';
import { parsePaymentProtectionResponse } from './paymentProtectionParser';

export const PAYMENT_PROTECTION_ENDPOINT = `${API_BASE_URL}/api/v1/payment-protection/evaluate`;

/** Upper bound on how long the customer waits before we stop and report a timeout. */
export const PAYMENT_PROTECTION_TIMEOUT_MS = 30_000;

export type PaymentProtectionErrorKind =
  | 'validation'
  | 'rejected'
  | 'server'
  | 'network'
  | 'timeout'
  | 'invalid-response';

export class PaymentProtectionApiError extends Error {
  readonly kind: PaymentProtectionErrorKind;
  readonly status?: number;
  readonly issues: ApiValidationIssue[];

  constructor(kind: PaymentProtectionErrorKind, message: string, status?: number, issues: ApiValidationIssue[] = []) {
    super(message);
    this.name = 'PaymentProtectionApiError';
    this.kind = kind;
    this.status = status;
    this.issues = issues;
  }
}

function isValidationIssue(value: unknown): value is ApiValidationIssue {
  if (typeof value !== 'object' || value === null) return false;
  const issue = value as Record<string, unknown>;
  return Array.isArray(issue.loc) && typeof issue.msg === 'string';
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function evaluatePayment(
  request: PaymentProtectionRequest,
  signal?: AbortSignal,
): Promise<PaymentProtectionResponse> {
  const timeout = AbortSignal.timeout(PAYMENT_PROTECTION_TIMEOUT_MS);
  const combinedSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;

  let response: Response;
  try {
    response = await fetch(PAYMENT_PROTECTION_ENDPOINT, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: combinedSignal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new PaymentProtectionApiError('timeout', 'The analysis service took too long to respond.');
    }
    throw new PaymentProtectionApiError('network', 'The analysis service could not be reached.');
  }

  const body = await readJson(response);

  if (response.ok) {
    const parsed = parsePaymentProtectionResponse(body);
    if (!parsed) {
      throw new PaymentProtectionApiError('invalid-response', 'The analysis service returned an unexpected response.', response.status);
    }
    return parsed;
  }

  const detail = (body as { detail?: unknown } | null)?.detail;

  if (response.status === 422 && Array.isArray(detail)) {
    throw new PaymentProtectionApiError(
      'validation',
      'Some details were not accepted by the analysis service.',
      422,
      detail.filter(isValidationIssue),
    );
  }

  if (response.status >= 400 && response.status < 500) {
    const message = typeof detail === 'string' ? detail : 'The analysis request was not accepted.';
    throw new PaymentProtectionApiError('rejected', message, response.status);
  }

  throw new PaymentProtectionApiError('server', 'The analysis service encountered a problem.', response.status);
}
