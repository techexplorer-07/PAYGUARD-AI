import { ChevronDown, KeyRound, Link2, PhoneCall, UserCheck } from 'lucide-react';
import { Link } from 'react-router';
import { Card } from '../CustomerPrimitives';
import { primaryButtonClass, secondaryButtonClass } from '../customerUi';
import { ASSESSMENT_DETAILS_ID } from './AssessmentDetails';

const verificationTips = [
  {
    icon: PhoneCall,
    title: 'Contact the organisation yourself',
    body: 'Use its official website or a number you already trust.',
  },
  {
    icon: Link2,
    title: 'Ignore contact details in the message',
    body: 'Do not call numbers or open links supplied in a suspicious message.',
  },
  {
    icon: KeyRound,
    title: 'Never share your UPI PIN or OTP',
    body: 'No genuine organisation will ask for them.',
  },
  {
    icon: UserCheck,
    title: 'Confirm the recipient independently',
    body: 'Check that the name and UPI ID belong to who you expect to pay.',
  },
];

interface AssessmentActionsProps {
  detailsOpen: boolean;
  onToggleDetails: () => void;
}

export function AssessmentActions({ detailsOpen, onToggleDetails }: AssessmentActionsProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <Card aria-labelledby="next-steps-heading" className="p-5 sm:p-6">
        <h2 id="next-steps-heading" className="text-base font-semibold text-ink">
          What would you like to do?
        </h2>
        <div className="mt-4 flex flex-col gap-3">
          <Link to="/analyse" className={`${primaryButtonClass} w-full`}>
            Analyse another payment
          </Link>
          <Link to="/" className={`${secondaryButtonClass} w-full`}>
            Back to dashboard
          </Link>
          <button
            type="button"
            aria-expanded={detailsOpen}
            aria-controls={`${ASSESSMENT_DETAILS_ID}-panel`}
            onClick={onToggleDetails}
            className={`${secondaryButtonClass} w-full`}
          >
            {detailsOpen ? 'Hide assessment details' : 'View assessment details'}
            <ChevronDown
              className={`size-4 transition-transform motion-reduce:transition-none ${detailsOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>
        </div>
        <p className="mt-4 text-xs leading-5 text-ink-muted">
          PAYGUARD does not make, block or approve payments. You decide whether to proceed in your
          own payment app.
        </p>
      </Card>

      <Card aria-labelledby="verify-heading" className="p-5 sm:p-6">
        <h2 id="verify-heading" className="text-base font-semibold text-ink">
          Verify independently
        </h2>
        <ul className="mt-4 space-y-4">
          {verificationTips.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{title}</p>
                <p className="mt-0.5 text-sm leading-5 text-ink-muted">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
