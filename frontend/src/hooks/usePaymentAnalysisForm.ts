import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router';
import { evaluatePayment, PaymentProtectionApiError } from '../services/paymentProtection';
import type { AssessmentResultLocationState } from '../types/assessment';
import type { ApiValidationIssue } from '../types/paymentProtection';
import { announceAssessment } from '../utils/assessment/highRiskAlert';
import { recordSessionAssessment } from './useInvestigatorStores';
import { deriveVerdictKind } from '../utils/assessment/verdict';
import {
  fieldForApiLocation,
  initialPaymentAnalysisValues,
  toPaymentProtectionRequest,
  validatePaymentAnalysis,
} from '../utils/paymentAnalysisValidation';
import type {
  PaymentAnalysisErrors,
  PaymentAnalysisField,
  PaymentAnalysisValues,
} from '../utils/paymentAnalysisValidation';

/** DOM ids for each form control, used for labels and focus management. */
export const paymentFieldIds: Record<PaymentAnalysisField, string> = {
  message: 'analysis-message',
  amount: 'analysis-amount',
  currency: 'analysis-currency',
  recipient: 'analysis-recipient',
  consent: 'analysis-consent',
};

const fieldOrder: PaymentAnalysisField[] = ['message', 'amount', 'currency', 'recipient', 'consent'];

export type SubmissionState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'error'; error: PaymentProtectionApiError; unmappedIssues: ApiValidationIssue[] };

export function usePaymentAnalysisForm() {
  const navigate = useNavigate();
  const [values, setValues] = useState<PaymentAnalysisValues>(initialPaymentAnalysisValues);
  const [touched, setTouched] = useState<Partial<Record<PaymentAnalysisField, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<PaymentAnalysisErrors>({});
  const [submission, setSubmission] = useState<SubmissionState>({ status: 'idle' });
  const inFlightRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);

  // Abort an in-flight request if the customer leaves the page, so a late
  // response cannot navigate them away from wherever they went.
  useEffect(() => () => controllerRef.current?.abort(), []);

  const clientErrors = validatePaymentAnalysis(values);
  const isComplete = Object.keys(clientErrors).length === 0;
  const isSubmitting = submission.status === 'submitting';

  const errorFor = (field: PaymentAnalysisField): string | undefined => {
    if (serverErrors[field]) return serverErrors[field];
    // Over-length messages are flagged immediately; other fields once visited.
    if (field === 'message' || touched[field]) return clientErrors[field];
    return undefined;
  };

  const setField = <K extends PaymentAnalysisField>(field: K, value: PaymentAnalysisValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setServerErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const markTouched = (field: PaymentAnalysisField) => {
    setTouched((current) => (current[field] ? current : { ...current, [field]: true }));
  };

  const focusField = (field: PaymentAnalysisField) => {
    document.getElementById(paymentFieldIds[field])?.focus();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inFlightRef.current) return;

    if (!isComplete) {
      setTouched({ message: true, amount: true, currency: true, recipient: true, consent: true });
      const firstInvalid = fieldOrder.find((field) => clientErrors[field]);
      if (firstInvalid) focusField(firstInvalid);
      return;
    }

    inFlightRef.current = true;
    const controller = new AbortController();
    controllerRef.current = controller;
    setServerErrors({});
    setSubmission({ status: 'submitting' });

    try {
      const request = toPaymentProtectionRequest(values);
      // evaluatePayment returns only responses that passed runtime validation.
      const assessment = await evaluatePayment(request, controller.signal);

      // One-time audible alert for this newly completed assessment. Triggered here,
      // in the submission handler, so it can never replay from a render, effect or refresh.
      const alertPlayback = await announceAssessment(deriveVerdictKind(assessment.unified_risk_assessment));
      if (controller.signal.aborted) return;

      const state: AssessmentResultLocationState = {
        assessment,
        // The response does not echo amount or currency, so carry what the customer entered.
        // The message text is deliberately not carried forward.
        submitted: {
          amount: request.simulated_transaction.amount,
          currency: request.simulated_transaction.currency,
          recipientId: request.simulated_transaction.recipient_id,
        },
        alertPlayback,
      };
      // Make the real response available to the investigator prototype for this tab (memory only).
      recordSessionAssessment(assessment, state.submitted);
      navigate('/analyse/result', { state });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;

      const apiError =
        error instanceof PaymentProtectionApiError
          ? error
          : new PaymentProtectionApiError('server', 'Something went wrong while preparing the analysis.');

      const mapped: PaymentAnalysisErrors = {};
      const unmappedIssues: ApiValidationIssue[] = [];
      for (const issue of apiError.issues) {
        const field = fieldForApiLocation(issue.loc);
        if (field && !mapped[field]) mapped[field] = issue.msg;
        else if (!field) unmappedIssues.push(issue);
      }
      // Commit synchronously so the fieldset is re-enabled before moving focus.
      flushSync(() => {
        setServerErrors(mapped);
        setSubmission({ status: 'error', error: apiError, unmappedIssues });
      });

      const firstMapped = fieldOrder.find((field) => mapped[field]);
      if (firstMapped) focusField(firstMapped);
    } finally {
      inFlightRef.current = false;
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  };

  return {
    values,
    setField,
    markTouched,
    errorFor,
    isComplete,
    isSubmitting,
    submission,
    handleSubmit,
  };
}
