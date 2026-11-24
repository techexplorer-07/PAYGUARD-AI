import { MousePointerClick } from 'lucide-react';
import type { EvidenceGraphModel } from '../../utils/investigator/graphModel';
import { formatDateTime } from '../../utils/format';
import { EvidenceProvenanceBadge } from '../customer/assessment/AssessmentBadges';
import { provenanceStyles } from '../customer/assessment/assessmentUi';
import type { GraphSelection } from './EvidenceGraph';
import { Facts } from './InvestigationPanels';
import { nodeTypeLabel, relationshipLabel } from './investigatorUi';

interface GraphSelectionPanelProps {
  model: EvidenceGraphModel;
  selection: GraphSelection;
  onSelect: (selection: GraphSelection) => void;
}

/** Details for the selected node or edge, using only fields present in the backend data. */
export function GraphSelectionPanel({ model, selection, onSelect }: GraphSelectionPanelProps) {
  if (!selection) {
    return (
      <div className="flex flex-col items-center px-5 py-10 text-center text-sm text-ink-muted">
        <MousePointerClick className="size-6" aria-hidden="true" />
        <p className="mt-2">Select an entity or relationship to see its details.</p>
      </div>
    );
  }

  if (selection.kind === 'node') {
    const node = model.nodes.find((candidate) => candidate.id === selection.id);
    if (!node) return null;
    const edges = model.edges.filter((edge) => edge.source === node.id || edge.target === node.id);
    return (
      <div className="space-y-4 px-4 py-4 sm:px-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{nodeTypeLabel(node.type)}</p>
          <h3 className="mt-1 break-all text-base font-semibold text-ink">{node.label}</h3>
        </div>
        <Facts
          items={[
            { label: 'Entity ID', value: <span className="break-all font-mono text-xs">{node.id}</span> },
            { label: 'Role in this view', value: node.role === 'focus' ? 'Selected recipient' : node.role === 'direct' ? 'Directly connected' : 'Reached via an inferred path' },
            { label: 'First recorded', value: node.createdAt ? formatDateTime(node.createdAt) : 'Not returned for path entities' },
          ]}
        />
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Relationships ({edges.length})</h4>
          <ul className="mt-2 space-y-1.5">
            {edges.map((edge) => (
              <li key={edge.id}>
                <button
                  type="button"
                  onClick={() => onSelect({ kind: 'edge', id: edge.id })}
                  className="flex w-full cursor-pointer flex-wrap items-center gap-2 rounded-lg border border-line px-3 py-2 text-left text-sm hover:bg-muted/50"
                >
                  <EvidenceProvenanceBadge provenance={edge.provenance} />
                  <span className="text-ink">{relationshipLabel(edge.relationship)}</span>
                  <span className="break-all text-xs text-ink-muted">
                    {edge.source === node.id ? `→ ${edge.target}` : `← ${edge.source}`}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  const edge = model.edges.find((candidate) => candidate.id === selection.id);
  if (!edge) return null;
  return (
    <div className="space-y-4 px-4 py-4 sm:px-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Relationship</p>
        <h3 className="mt-1 text-base font-semibold text-ink">{relationshipLabel(edge.relationship)}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <EvidenceProvenanceBadge provenance={edge.provenance} />
          <span className="text-xs text-ink-muted">{provenanceStyles[edge.provenance].meaning}</span>
        </div>
      </div>
      <Facts
        items={[
          { label: 'From', value: <span className="break-all font-mono text-xs">{edge.source}</span> },
          { label: 'To', value: <span className="break-all font-mono text-xs">{edge.target}</span> },
          { label: 'Evidence reference', value: <span className="break-all font-mono text-xs">{edge.id.split('#')[0]}</span> },
          { label: 'Source reference', value: <span className="break-all font-mono text-xs">{edge.sourceReference}</span> },
          { label: 'Observed', value: edge.observedAt ? formatDateTime(edge.observedAt) : 'Not returned' },
          { label: 'Expires', value: edge.expiresAt ? formatDateTime(edge.expiresAt) : 'No expiry recorded' },
        ]}
      />
      {edge.path && (
        <p className="break-all rounded-lg bg-muted px-3 py-2 font-mono text-xs text-ink">Path: {edge.path.join(' → ')}</p>
      )}
      <p className="break-words text-sm leading-6 text-ink">{edge.description}</p>
      {edge.verification && (
        <p className="break-words text-sm leading-6 text-ink-muted">
          Verified by {edge.verification.verified_by} ({edge.verification.verification_authority_org}) on{' '}
          {formatDateTime(edge.verification.verified_at)}, reference{' '}
          <span className="font-mono text-xs">{edge.verification.verification_reference}</span>.
        </p>
      )}
      <p className="text-xs leading-5 text-ink-muted">
        {edge.origin === 'path'
          ? 'This segment comes from an inferred multi-hop path in the recipient profile. Direction is shown as stored; shared identifiers do not prove common ownership.'
          : 'A relationship in the evidence graph is not proof of criminal activity.'}
      </p>
    </div>
  );
}
