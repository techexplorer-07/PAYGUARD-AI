import { ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { EngineRiskBadge } from '../../components/customer/assessment/AssessmentBadges';
import { DataSourceNotice } from '../../components/investigator/DataSourceNotice';
import { DemoTag, InvestigatorEmptyState, InvestigatorLoadingState, PageHeader, Panel, PanelHeader } from '../../components/investigator/InvestigatorPrimitives';
import { RecipientLookup } from '../../components/investigator/RecipientLookup';
import { useInvestigatorData } from '../../hooks/useInvestigatorData';
import type { EngineRiskView } from '../../types/assessment';
import { formatDateTime } from '../../utils/format';
import { provenanceKind } from '../../utils/assessment/buildAssessmentView';
import { engineRiskView } from '../../utils/assessment/verdict';
import { scoreLabel } from '../../utils/investigator/records';

interface RecipientRow {
  recipientId: string;
  risk: EngineRiskView | null;
  score: string;
  verified: number;
  reported: number;
  inferred: number;
  related: string[];
  latestEvidence: string | null;
  basis: string;
}

function latest(timestamps: string[]): string | null {
  return timestamps.length ? timestamps.reduce((a, b) => (Date.parse(a) > Date.parse(b) ? a : b)) : null;
}

export function RecipientIntelligencePage() {
  const navigate = useNavigate();
  const { source, rows, records, demo, loading } = useInvestigatorData();

  const related = new Map<string, string[]>();
  for (const row of rows) related.set(row.recipientId, [...(related.get(row.recipientId) ?? []), row.id]);

  let recipientRows: RecipientRow[] = [];
  if (source === 'demo' && demo) {
    recipientRows = [...demo.recipients.values()].map((intel) => {
      const edges = intel.evidence?.evidence_edges ?? [];
      return {
        recipientId: intel.recipientId,
        risk: intel.risk ? engineRiskView(intel.risk.risk_level) : null,
        score: scoreLabel(intel.risk?.recipient_risk_score),
        verified: intel.profile?.verified_evidence_count ?? 0,
        reported: intel.profile?.reported_evidence_count ?? 0,
        inferred: intel.profile?.inferred_evidence_count ?? 0,
        related: related.get(intel.recipientId) ?? [],
        latestEvidence: latest(edges.map((edge) => edge.observed_at)),
        basis: 'Demo recipient profile',
      };
    });
  } else if (source === 'session') {
    // Latest assessment per recipient: use the recipient assessment embedded in that real response.
    const byRecipient = new Map<string, (typeof records)[number]>();
    for (const record of records) {
      const existing = byRecipient.get(record.response.recipient_id);
      if (!existing || Date.parse(record.response.timestamp) > Date.parse(existing.response.timestamp)) {
        byRecipient.set(record.response.recipient_id, record);
      }
    }
    recipientRows = [...byRecipient.values()].map(({ response }) => {
      const assessment = response.recipient_assessment;
      const items = assessment?.supporting_evidence ?? [];
      const count = (kind: string) => items.filter((item) => provenanceKind(item.evidence_status) === kind).length;
      return {
        recipientId: response.recipient_id,
        risk: assessment ? engineRiskView(assessment.risk_level) : null,
        score: scoreLabel(assessment?.recipient_risk_score),
        verified: count('verified'),
        reported: count('reported'),
        inferred: count('inferred'),
        related: related.get(response.recipient_id) ?? [],
        latestEvidence: latest(items.map((item) => item.observed_at)),
        basis: assessment ? `From assessment ${response.evaluation_id}` : 'Not in evidence records at assessment time',
      };
    });
  }
  const rank = (row: RecipientRow) => ({ high: 4, medium: 3, uncertain: 2, low: 1 })[row.risk?.kind ?? 'low'] + (row.risk ? 0 : -1);
  recipientRows.sort((a, b) => rank(b) - rank(a) || b.verified + b.reported - (a.verified + a.reported));

  const open = (recipientId: string, graphId: string) =>
    navigate(`/investigator/recipients/${encodeURIComponent(recipientId)}${graphId ? `?graph=${encodeURIComponent(graphId)}` : ''}`);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recipient intelligence"
        description="Risk indicators available for payment recipients. A recipient with reported or inferred indicators is not confirmed to be fraudulent."
      />
      <DataSourceNotice />

      <Panel aria-labelledby="lookup-title">
        <PanelHeader
          id="lookup-title"
          title="Look up a recipient"
          description={
            source === 'session'
              ? 'Queries the live recipient-intelligence endpoints (evidence, profile and risk assessment).'
              : 'Searches the demo evidence graph.'
          }
        />
        <div className="px-4 py-4 sm:px-5">
          <RecipientLookup submitLabel="Open recipient" onSubmit={open} />
        </div>
      </Panel>

      <Panel aria-labelledby="recipients-title">
        <PanelHeader
          id="recipients-title"
          title={source === 'demo' ? 'Recipients in the demo evidence graph' : 'Recipients in this session’s assessments'}
          description={
            source === 'session'
              ? 'The backend cannot list recipients, so this shows recipients from assessments received in this session.'
              : undefined
          }
        />
        {loading ? (
          <InvestigatorLoadingState />
        ) : recipientRows.length === 0 ? (
          <InvestigatorEmptyState title="No recipients to show">
            Run an assessment or use the lookup above to query a specific recipient.
          </InvestigatorEmptyState>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <caption className="sr-only">Recipients and their available risk indicators</caption>
              <thead className="border-b border-line bg-muted/60 text-xs text-ink-muted">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">Recipient</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Risk indicators</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Recipient score</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Verified</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Reported</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Inferred</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Related assessments</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Latest evidence</th>
                  <th scope="col" className="px-4 py-2.5"><span className="sr-only">Action</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recipientRows.map((row) => (
                  <tr key={row.recipientId} className="align-top hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <p className="break-all font-medium text-ink">{row.recipientId}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">{row.basis}</p>
                    </td>
                    <td className="px-3 py-3">
                      {row.risk ? <EngineRiskBadge risk={row.risk} /> : <span className="text-xs text-ink-muted">Not assessed</span>}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-ink">{row.score}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-ink">{row.verified}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-ink">{row.reported}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-ink">{row.inferred}</td>
                    <td className="px-3 py-3">
                      {row.related.length === 0 ? (
                        <span className="text-xs text-ink-muted">None loaded</span>
                      ) : (
                        <ul className="space-y-0.5">
                          {row.related.slice(0, 3).map((id) => (
                            <li key={id}>
                              <Link to={`/investigator/assessments/${encodeURIComponent(id)}`} className="rounded font-mono text-xs text-primary hover:text-primary-hover">
                                {id}
                              </Link>
                            </li>
                          ))}
                          {row.related.length > 3 && <li className="text-xs text-ink-muted">+{row.related.length - 3} more</li>}
                        </ul>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-ink-muted">{row.latestEvidence ? formatDateTime(row.latestEvidence) : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-2">
                        {source === 'demo' && <DemoTag />}
                        <Link
                          to={`/investigator/recipients/${encodeURIComponent(row.recipientId)}`}
                          aria-label={`View recipient ${row.recipientId}`}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-line px-2.5 text-xs font-semibold text-ink hover:bg-muted"
                        >
                          View
                          <ChevronRight className="size-3.5" aria-hidden="true" />
                        </Link>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
