import type { EngineRiskView, ProvenanceKind } from '../../../types/assessment';
import { engineRiskStyles, provenanceStyles } from './assessmentUi';

export function EngineRiskBadge({ risk }: { risk: EngineRiskView }) {
  const { icon: Icon, className } = engineRiskStyles[risk.kind];
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold ${className}`}>
      <Icon className="size-3.5" aria-hidden="true" strokeWidth={2.25} />
      {risk.label}
    </span>
  );
}

export function EvidenceProvenanceBadge({ provenance }: { provenance: ProvenanceKind }) {
  const { label, meaning, icon: Icon, className } = provenanceStyles[provenance];
  return (
    <span
      title={meaning}
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-xs font-medium ${className}`}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
