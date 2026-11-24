import type { AssessmentFinding } from '../../../types/assessment';
import { Card } from '../CustomerPrimitives';
import { FindingItem } from './FindingItem';

interface RiskExplanationListProps {
  findings: AssessmentFinding[];
  missingEvidence: string[];
  conflictingSignals: string[];
}

export function RiskExplanationList({ findings, missingEvidence, conflictingSignals }: RiskExplanationListProps) {
  const concerns = findings.filter((finding) => finding.tone === 'concern').length;
  return (
    <Card aria-labelledby="why-heading" className="p-5 sm:p-6">
      <h2 id="why-heading" className="text-lg font-semibold text-ink">
        Why PAYGUARD reached this result
      </h2>
      <p className="mt-0.5 text-sm text-ink-muted">
        {findings.length === 0
          ? 'PAYGUARD did not return specific findings for this payment.'
          : concerns > 0
            ? `${concerns} warning sign${concerns === 1 ? '' : 's'} and ${findings.length - concerns} other finding${findings.length - concerns === 1 ? '' : 's'} from the assessment.`
            : 'No warning signs were returned. These are the findings from the assessment.'}
      </p>

      {findings.length > 0 && (
        <ul className="mt-4 divide-y divide-line">
          {findings.map((finding) => (
            <FindingItem key={finding.id} finding={finding} />
          ))}
        </ul>
      )}

      {conflictingSignals.length > 0 && (
        <div className="mt-5 rounded-lg border border-line p-4">
          <h3 className="text-sm font-semibold text-ink">Signals that disagree</h3>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-6 text-ink-muted">
            {conflictingSignals.map((signal) => (
              <li key={signal} className="break-words">
                {signal}
              </li>
            ))}
          </ul>
        </div>
      )}

      {missingEvidence.length > 0 && (
        <div className="mt-5 rounded-lg bg-muted p-4">
          <h3 className="text-sm font-semibold text-ink">Information that was not available</h3>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-6 text-ink-muted">
            {missingEvidence.map((item) => (
              <li key={item} className="break-words">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
