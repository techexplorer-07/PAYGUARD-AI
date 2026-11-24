import { ArrowLeft, LoaderCircle, LockKeyhole } from 'lucide-react';
import { Link } from 'react-router';
import { AnalysisGuidance } from '../../components/customer/analysis/AnalysisGuidance';
import { ConsentSection } from '../../components/customer/analysis/ConsentSection';
import { PaymentDetailsSection } from '../../components/customer/analysis/PaymentDetailsSection';
import { PaymentRequestSection } from '../../components/customer/analysis/PaymentRequestSection';
import { SubmissionError } from '../../components/customer/analysis/SubmissionError';
import { primaryButtonClass } from '../../components/customer/customerUi';
import { paymentFieldIds, usePaymentAnalysisForm } from '../../hooks/usePaymentAnalysisForm';

const STATUS_ID = 'analysis-submit-status';

export function AnalysePayment() {
  const { values, setField, markTouched, errorFor, isComplete, isSubmitting, submission, handleSubmit } =
    usePaymentAnalysisForm();

  const statusText = isSubmitting
    ? 'Analysing your payment. This usually takes a few seconds.'
    : isComplete
      ? 'Ready to analyse.'
      : !values.consent && values.amount && values.recipient
        ? 'Give your consent to continue.'
        : 'Enter the amount and recipient UPI ID, and give your consent to continue.';

  return (
    <div className="space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-primary hover:text-primary-hover"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to dashboard
      </Link>

      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">Analyse a payment</h1>
        <p className="mt-1.5 text-sm leading-6 text-ink-muted sm:text-base">
          Review a payment request before proceeding. PAYGUARD analyses the message context,
          transaction behaviour and recipient risk indicators.
        </p>
        <p className="mt-3 inline-flex items-start gap-1.5 rounded-md bg-success/10 px-2.5 py-1 text-xs font-medium leading-5 text-success">
          <LockKeyhole className="mt-[3px] size-3.5 shrink-0" aria-hidden="true" />
          Your information is analysed only after your consent.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <form
          noValidate
          onSubmit={handleSubmit}
          aria-busy={isSubmitting}
          aria-label="Payment analysis"
          className="lg:col-span-2"
        >
          <fieldset disabled={isSubmitting} className="min-w-0 space-y-4 sm:space-y-6">
            <PaymentRequestSection
              id={paymentFieldIds.message}
              value={values.message}
              error={errorFor('message')}
              onChange={(value) => setField('message', value)}
              onBlur={() => markTouched('message')}
            />

            <PaymentDetailsSection
              amount={{
                id: paymentFieldIds.amount,
                value: values.amount,
                error: errorFor('amount'),
                onChange: (value) => setField('amount', value),
                onBlur: () => markTouched('amount'),
              }}
              currency={{
                id: paymentFieldIds.currency,
                value: values.currency,
                error: errorFor('currency'),
                onChange: (value) => setField('currency', value),
                onBlur: () => markTouched('currency'),
              }}
              recipient={{
                id: paymentFieldIds.recipient,
                value: values.recipient,
                error: errorFor('recipient'),
                onChange: (value) => setField('recipient', value),
                onBlur: () => markTouched('recipient'),
              }}
            />

            <ConsentSection
              id={paymentFieldIds.consent}
              checked={values.consent}
              error={errorFor('consent')}
              onChange={(checked) => setField('consent', checked)}
            />

            {submission.status === 'error' && (
              <SubmissionError error={submission.error} unmappedIssues={submission.unmappedIssues} />
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <button
                type="submit"
                disabled={!isComplete || isSubmitting}
                aria-describedby={STATUS_ID}
                className={`${primaryButtonClass} w-full sm:w-auto sm:min-w-48 ${
                  isSubmitting ? 'disabled:cursor-progress disabled:opacity-100' : ''
                }`}
              >
                {isSubmitting && <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden="true" />}
                {isSubmitting ? 'Analysing…' : 'Analyse payment'}
              </button>
              <p id={STATUS_ID} role="status" className="text-center text-sm text-ink-muted sm:text-left">
                {statusText}
              </p>
            </div>
          </fieldset>
        </form>

        <aside className="lg:sticky lg:top-24">
          <AnalysisGuidance />
        </aside>
      </div>
    </div>
  );
}
