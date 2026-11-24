import { ChevronRight, FileStack, ShieldQuestionMark, Siren, TriangleExclamationPoint, Users } from 'lucide-react';
import { CircleCheck, ListChecks } from 'lucide-react';
import { Link } from 'react-router';
import { DataSourceNotice, RecordsGate } from '../../components/investigator/DataSourceNotice';
import { verdictFill } from '../../components/investigator/investigatorUi';
import { DemoTag, PageHeader, Panel, PanelHeader, VerdictBadge } from '../../components/investigator/InvestigatorPrimitives';
import { DistributionChart, OverviewMetricCard } from '../../components/investigator/OverviewCharts';
import { useInvestigatorData } from '../../hooks/useInvestigatorData';
import { formatDateTime } from '../../utils/format';
import { countBy, interventionLabel, verdictLabels, verdictOrder } from '../../utils/investigator/records';

export function InvestigatorOverview() {
  const { rows, records, source } = useInvestigatorData();
  const verdictCounts = countBy(rows.map((row) => row.verdict));
  const actionCounts = countBy(rows.map((row) => row.action));
  const provenanceTotals = rows.reduce(
    (totals, row) => ({
      verified: totals.verified + row.provenance.verified,
      reported: totals.reported + row.provenance.reported,
      inferred: totals.inferred + row.provenance.inferred,
    }),
    { verified: 0, reported: 0, inferred: 0 },
  );
  const recipientsWithIndicators = new Set(
    records
      .filter(({ response }) => {
        const level = response.recipient_assessment?.risk_level.toUpperCase();
        return level === 'HIGH' || level === 'MEDIUM';
      })
      .map(({ response }) => response.recipient_id),
  );
  const inconclusive = (verdictCounts.get('uncertain') ?? 0) + (verdictCounts.get('insufficient') ?? 0);
  const recent = [...rows].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)).slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations overview"
        description="Summary of the assessment records currently loaded. PAYGUARD evaluates payments when they are submitted for assessment; it does not continuously monitor accounts."
      />
      <DataSourceNotice />
      <RecordsGate />

      {rows.length > 0 && (
        <>
          <section aria-label="Key figures" className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
            <OverviewMetricCard label="Assessments" value={rows.length} icon={FileStack} iconClass="bg-primary/10 text-primary" hint="Records loaded" />
            <OverviewMetricCard label="High risk" value={verdictCounts.get('high') ?? 0} icon={Siren} iconClass="bg-danger/10 text-danger" hint="Unified risk level HIGH" />
            <OverviewMetricCard label="Medium risk" value={verdictCounts.get('medium') ?? 0} icon={TriangleExclamationPoint} iconClass="bg-warning/12 text-warning-strong" hint="Unified risk level MEDIUM" />
            <OverviewMetricCard label="Low risk" value={verdictCounts.get('low') ?? 0} icon={CircleCheck} iconClass="bg-success/10 text-success" hint="Unified risk level LOW" />
            <OverviewMetricCard label="Inconclusive" value={inconclusive} icon={ShieldQuestionMark} iconClass="bg-muted text-ink-muted" hint="Uncertain or insufficient data" />
            <OverviewMetricCard
              label="Manual review recommended"
              value={actionCounts.get('MANUAL_REVIEW') ?? 0}
              icon={ListChecks}
              iconClass="bg-muted text-ink"
              hint="Recommendation only; no case workflow exists"
            />
          </section>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
            <DistributionChart
              id="risk-distribution"
              title="Risk distribution"
              description="Unified risk classification of loaded assessments."
              unit="assessments"
              emptyText="No assessments to chart."
              items={verdictOrder.map((verdict) => ({
                key: verdict,
                label: verdictLabels[verdict],
                count: verdictCounts.get(verdict) ?? 0,
                fillClass: verdictFill[verdict],
              }))}
            />
            <DistributionChart
              id="intervention-distribution"
              title="Recommended interventions"
              description="Advisory recommendations from the Payment Protection Orchestrator."
              unit="assessments"
              emptyText="No recommendations to chart."
              items={[...actionCounts.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([action, count]) => ({ key: action, label: interventionLabel(action), count, fillClass: 'bg-primary' }))}
            />
            <DistributionChart
              id="provenance-distribution"
              title="Evidence provenance"
              description="Recipient evidence items cited by loaded assessments, by provenance."
              unit="evidence items"
              emptyText="No recipient evidence was cited by these assessments."
              items={[
                { key: 'verified', label: 'Verified', count: provenanceTotals.verified, fillClass: 'bg-danger' },
                { key: 'reported', label: 'Reported (unconfirmed)', count: provenanceTotals.reported, fillClass: 'bg-warning' },
                { key: 'inferred', label: 'Inferred (not proof)', count: provenanceTotals.inferred, fillClass: 'bg-ink-muted' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
            <Panel aria-labelledby="recent-activity" className="xl:col-span-2">
              <PanelHeader
                id="recent-activity"
                title="Recent assessments"
                description="Latest completed assessments in the loaded records."
                actions={
                  <Link to="/investigator/assessments" className="rounded text-xs font-semibold text-primary hover:text-primary-hover">
                    View all
                  </Link>
                }
              />
              <ul className="divide-y divide-line">
                {recent.map((row) => (
                  <li key={row.id}>
                    <Link
                      to={`/investigator/assessments/${encodeURIComponent(row.id)}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 focus-visible:-outline-offset-2 sm:px-5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="font-medium text-ink">Assessment completed</span>
                          <span className="font-mono text-xs text-ink-muted">{row.id}</span>
                          {source === 'demo' && <DemoTag />}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-ink-muted">
                          {row.recipientId} · {formatDateTime(row.timestamp)}
                        </p>
                      </div>
                      <VerdictBadge verdict={row.verdict} />
                      <ChevronRight className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel aria-labelledby="recipient-indicators">
              <PanelHeader
                id="recipient-indicators"
                title="Recipients with risk indicators"
                description="Distinct recipients whose recipient assessment was MEDIUM or HIGH in these records. Indicators are not proof of fraud."
              />
              <div className="px-4 py-4 sm:px-5">
                <p className="flex items-center gap-2 text-2xl font-bold tabular-nums text-ink">
                  <Users className="size-5 text-ink-muted" aria-hidden="true" />
                  {recipientsWithIndicators.size}
                </p>
                <Link
                  to="/investigator/recipients"
                  className="mt-3 inline-flex rounded text-sm font-semibold text-primary hover:text-primary-hover"
                >
                  Open recipient intelligence
                </Link>
              </div>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
