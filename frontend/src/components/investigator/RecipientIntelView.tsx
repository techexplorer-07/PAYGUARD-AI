import { Link } from 'react-router';
import type { RecipientIntelState } from '../../hooks/useRecipientIntel';
import type { AssessmentRow, RecipientIntel } from '../../types/investigator';
import { formatDateTime } from '../../utils/format';
import { describeIndicator, parseIndicator } from '../../utils/assessment/indicators';
import { evidenceFromRecipient } from '../../utils/investigator/evidence';
import { scoreLabel } from '../../utils/investigator/records';
import { EvidenceProvenanceBadge } from '../customer/assessment/AssessmentBadges';
import { provenanceKind } from '../../utils/assessment/buildAssessmentView';
import { EvidenceTimeline } from './EvidenceTimeline';
import { Facts } from './InvestigationPanels';
import { InvestigatorEmptyState, InvestigatorErrorState, InvestigatorLoadingState, Panel, PanelHeader, VerdictBadge } from './InvestigatorPrimitives';
import { nodeTypeLabel, relationshipLabel } from './investigatorUi';

const partLabels = { evidence: 'Evidence summary', profile: 'Relationship profile', risk: 'Risk assessment' } as const;

interface RecipientIntelViewProps {
  state: RecipientIntelState;
  related: AssessmentRow[];
  demo: boolean;
  onRetry: () => void;
}

/** Recipient detail content shared by the recipient page. Shows only what the endpoints (or demo fixtures) returned. */
export function RecipientIntelView({ state, related, demo, onRetry }: RecipientIntelViewProps) {
  if (state.status === 'idle') return null;
  if (state.status === 'loading') return <Panel><InvestigatorLoadingState label="Querying recipient intelligence…" /></Panel>;
  if (state.status === 'error') {
    return (
      <Panel>
        <InvestigatorErrorState
          title={state.error.kind === 'unauthorized' ? 'Not authorised' : 'Recipient intelligence is unavailable'}
          actions={<button type="button" onClick={onRetry} className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-line px-3 text-sm font-medium text-ink hover:bg-muted">Try again</button>}
        >
          {state.error.message}
        </InvestigatorErrorState>
      </Panel>
    );
  }

  const { intel, notFound, partErrors } = state;
  const nothing = !intel.evidence && !intel.profile && !intel.risk;
  if (nothing) {
    return (
      <Panel>
        <InvestigatorEmptyState title="No recipient intelligence available">
          <p>{notFound ?? 'The backend returned no information for this recipient.'}</p>
          <p className="mt-2">
            Recipient intelligence depends on an evidence graph loaded in the backend. Absence from the graph does not mean the
            recipient is safe or unsafe.
          </p>
        </InvestigatorEmptyState>
        <RelatedAssessments related={related} />
      </Panel>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {Object.keys(partErrors).length > 0 && (
        <p role="status" className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-2.5 text-sm text-ink">
          Some information could not be loaded:{' '}
          {Object.entries(partErrors)
            .map(([part, error]) => `${partLabels[part as keyof typeof partLabels]} (${error.message})`)
            .join('; ')}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
        <RiskPanel intel={intel} />
        <ProfilePanel intel={intel} />
      </div>
      <RelationshipsPanel intel={intel} />
      <Panel aria-labelledby="recipient-evidence">
        <PanelHeader id="recipient-evidence" title="Evidence review" description="Stored evidence edges and multi-hop inferred paths for this recipient." />
        <EvidenceTimeline id="recipient-evidence" items={evidenceFromRecipient(intel.evidence, intel.profile)} demo={demo} emptyText="No evidence items were returned for this recipient." />
      </Panel>
      <Panel aria-labelledby="related-title">
        <PanelHeader id="related-title" title="Related assessments" description="Loaded assessments with this recipient." />
        <RelatedAssessments related={related} />
      </Panel>
    </div>
  );
}

function RiskPanel({ intel }: { intel: RecipientIntel }) {
  const risk = intel.risk;
  return (
    <Panel aria-labelledby="recipient-risk">
      <PanelHeader id="recipient-risk" title="Recipient risk assessment" description="Heuristic score on a 0–1 scale; not a probability of fraud." />
      <div className="space-y-4 px-4 py-4 sm:px-5">
        {!risk ? (
          <p className="text-sm text-ink-muted">Not returned.</p>
        ) : (
          <>
            <Facts
              items={[
                { label: 'Risk level', value: risk.risk_level },
                { label: 'Recipient score', value: scoreLabel(risk.recipient_risk_score) },
                { label: 'Data sufficiency', value: risk.data_sufficiency },
                { label: 'Engine recommendation', value: risk.recommended_action },
                { label: 'Assessed', value: formatDateTime(risk.assessment_timestamp) },
                { label: 'Graph', value: <span className="break-all font-mono text-xs">{risk.graph_id}</span> },
              ]}
            />
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Indicators</h3>
              <ul className="mt-1.5 space-y-1">
                {risk.detected_indicators.map((code) => {
                  const parsed = parseIndicator(code, 'recipient');
                  const description = describeIndicator(parsed);
                  return (
                    <li key={code} className="text-sm">
                      <span className="font-medium text-ink">{description.title}</span>
                      {parsed.detail && <span className="text-ink-muted"> · {parsed.detail}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
            <p className="break-words text-sm leading-6 text-ink-muted">{risk.explanation}</p>
          </>
        )}
      </div>
    </Panel>
  );
}

function ProfilePanel({ intel }: { intel: RecipientIntel }) {
  const profile = intel.profile;
  const node = intel.evidence?.recipient_node;
  return (
    <Panel aria-labelledby="recipient-profile">
      <PanelHeader id="recipient-profile" title="Identifiers and relationship profile" />
      <div className="space-y-4 px-4 py-4 sm:px-5">
        {node && (
          <Facts
            items={[
              { label: 'Entity ID', value: <span className="break-all font-mono text-xs">{node.node_id}</span> },
              { label: 'Entity type', value: nodeTypeLabel(node.node_type) },
              { label: 'Display label', value: node.display_label },
              { label: 'Identifier', value: <span className="break-all font-mono text-xs">{node.synthetic_identifier}</span> },
              { label: 'First recorded', value: formatDateTime(node.created_at) },
            ]}
          />
        )}
        {profile ? (
          <>
            <Facts
              items={[
                { label: 'Verified evidence', value: profile.verified_evidence_count },
                { label: 'Reported evidence', value: profile.reported_evidence_count },
                { label: 'Inferred relationships', value: profile.inferred_evidence_count },
                { label: 'Shared identifiers', value: profile.shared_identifier_count },
                { label: 'Paying customers', value: profile.direct_customer_count },
                { label: 'Recorded transactions', value: profile.total_transaction_count },
                { label: 'Linked beneficiaries', value: profile.distinct_beneficiary_association_count },
                { label: 'Recent relationships', value: profile.recent_relationship_count },
                { label: 'Data sufficiency', value: profile.data_sufficiency },
              ]}
            />
            <p className="break-words text-sm leading-6 text-ink-muted">{profile.evidence_summary}</p>
          </>
        ) : (
          <p className="text-sm text-ink-muted">Relationship profile not returned.</p>
        )}
      </div>
    </Panel>
  );
}

function RelationshipsPanel({ intel }: { intel: RecipientIntel }) {
  const nodes = new Map((intel.evidence?.connected_nodes ?? []).map((node) => [node.node_id, node]));
  const edges = intel.evidence?.evidence_edges ?? [];
  const paths = (intel.profile?.supporting_evidence ?? []).filter((item) => item.path && item.path.length > 2);
  return (
    <Panel aria-labelledby="recipient-relationships">
      <PanelHeader
        id="recipient-relationships"
        title="Direct relationships and shared identifier associations"
        description="Shared identifiers indicate a possible association only; they do not prove common ownership."
      />
      <div className="space-y-5 px-4 py-4 sm:px-5">
        {edges.length === 0 ? (
          <p className="text-sm text-ink-muted">No direct relationships were returned.</p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <caption className="sr-only">Direct relationships</caption>
              <thead className="text-xs text-ink-muted">
                <tr className="border-b border-line">
                  <th scope="col" className="py-2 pr-3 font-medium">Related entity</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Relationship</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Provenance</th>
                  <th scope="col" className="py-2 font-medium">Observed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {edges.map((edge) => {
                  const otherId = edge.source_node_id === intel.recipientId ? edge.target_node_id : edge.source_node_id;
                  const other = nodes.get(otherId);
                  const outgoing = edge.source_node_id === intel.recipientId;
                  return (
                    <tr key={edge.edge_id} className="align-top">
                      <td className="py-2 pr-3">
                        <p className="break-all text-ink">{other?.display_label ?? otherId}</p>
                        <p className="text-xs text-ink-muted">{nodeTypeLabel(other?.node_type ?? null)}</p>
                      </td>
                      <td className="py-2 pr-3 text-ink">
                        {outgoing ? 'Recipient → ' : '→ Recipient · '}
                        {relationshipLabel(edge.relationship_type)}
                      </td>
                      <td className="py-2 pr-3"><EvidenceProvenanceBadge provenance={provenanceKind(edge.evidence_status)} /></td>
                      <td className="whitespace-nowrap py-2 text-xs text-ink-muted">{formatDateTime(edge.observed_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {paths.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Multi-hop associations</h3>
            <ul className="mt-2 space-y-2">
              {paths.map((item) => (
                <li key={item.edge_id} className="rounded-lg border border-line p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <EvidenceProvenanceBadge provenance={provenanceKind(item.evidence_status)} />
                    <span className="break-all font-mono text-xs text-ink">{item.path?.join(' → ')}</span>
                  </div>
                  <p className="mt-1 break-words text-sm text-ink-muted">{item.description}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Panel>
  );
}

function RelatedAssessments({ related }: { related: AssessmentRow[] }) {
  if (related.length === 0) return <p className="px-4 py-4 text-sm text-ink-muted sm:px-5">No loaded assessments involve this recipient.</p>;
  return (
    <ul className="divide-y divide-line">
      {related.map((row) => (
        <li key={row.id}>
          <Link to={`/investigator/assessments/${encodeURIComponent(row.id)}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-muted/40 sm:px-5">
            <span className="font-mono text-xs font-semibold text-primary">{row.id}</span>
            <VerdictBadge verdict={row.verdict} />
            <span className="text-xs text-ink-muted">{formatDateTime(row.timestamp)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
