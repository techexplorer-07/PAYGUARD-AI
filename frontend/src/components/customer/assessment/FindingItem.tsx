import { CircleCheck, Info, TriangleExclamationPoint } from 'lucide-react';
import type { AssessmentFinding, FindingTone } from '../../../types/assessment';
import { EvidenceProvenanceBadge } from './AssessmentBadges';
import { engineNames } from './assessmentUi';

const toneStyles: Record<FindingTone, { label: string; icon: typeof Info; className: string }> = {
  concern: { label: 'Warning sign', icon: TriangleExclamationPoint, className: 'text-warning-strong' },
  info: { label: 'Context', icon: Info, className: 'text-ink-muted' },
  reassurance: { label: 'Consistent', icon: CircleCheck, className: 'text-success' },
};

export function FindingItem({ finding, showEngine = true }: { finding: AssessmentFinding; showEngine?: boolean }) {
  const tone = toneStyles[finding.tone];
  const Icon = tone.icon;
  return (
    <li className="flex gap-3 py-3.5 first:pt-0 last:pb-0">
      <Icon className={`mt-0.5 size-5 shrink-0 ${tone.className}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-sm font-semibold text-ink">{finding.title}</p>
          <span className={`text-xs font-medium ${tone.className}`}>
            <span className="sr-only">(</span>
            {tone.label}
            <span className="sr-only">)</span>
          </span>
        </div>
        <p className="mt-0.5 text-sm leading-6 text-ink-muted">{finding.description}</p>
        {finding.evidence.length > 0 && (
          <ul className="mt-1.5 space-y-1">
            {finding.evidence.map((line) => (
              <li key={line} className="break-words rounded-md bg-muted px-2.5 py-1.5 text-sm text-ink">
                {line}
              </li>
            ))}
          </ul>
        )}
        {(finding.provenance || (showEngine && finding.engine)) && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {finding.provenance && <EvidenceProvenanceBadge provenance={finding.provenance} />}
            {showEngine && finding.engine && (
              <span className="text-xs text-ink-muted">Source: {engineNames[finding.engine]} intelligence</span>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
