import { useEffect } from 'react';
import { ArrowLeft, Share2, Users } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { EvidenceTimeline } from '../../components/investigator/EvidenceTimeline';
import {
  BehaviouralPanel,
  Facts,
  IntentPanel,
  PaymentProtectionPanel,
  RecipientPanel,
  UnifiedPanel,
} from '../../components/investigator/InvestigationPanels';
import {
  DemoTag,
  InvestigatorEmptyState,
  InvestigatorLoadingState,
  PageHeader,
  Panel,
  PanelHeader,
  VerdictBadge,
} from '../../components/investigator/InvestigatorPrimitives';
import { useInvestigatorData } from '../../hooks/useInvestigatorData';
import { recordInvestigatorView } from '../../hooks/useInvestigatorStores';
import { formatDateTime, formatMoney } from '../../utils/format';
import { evidenceFromAssessment } from '../../utils/investigator/evidence';
import { scoreLabel } from '../../utils/investigator/records';
import { secondaryButtonClass } from '../../components/customer/customerUi';

const linkClass =
  'inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink hover:bg-muted';

export function InvestigationDetailPage() {
  const { evaluationId = '' } = useParams();
  const { rows, source, loading } = useInvestigatorData();
  const row = rows.find((candidate) => candidate.id === evaluationId);

  useEffect(() => {
    if (row) recordInvestigatorView({ kind: 'assessment', id: row.id, label: `${row.id} · ${row.recipientId}`, source });
  }, [row, source]);

  const back = (
    <Link to="/investigator/alerts" className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-primary hover:text-primary-hover">
      <ArrowLeft className="size-4" aria-hidden="true" />
      Alert queue
    </Link>
  );

  if (loading) return <Panel><InvestigatorLoadingState /></Panel>;

  if (!row) {
    return (
      <div className="space-y-6">
        {back}
        <Panel>
          <InvestigatorEmptyState
            title="Assessment not available"
            actions={<Link to="/investigator/assessments" className={secondaryButtonClass}>Browse assessments</Link>}
          >
            <span className="break-all font-mono text-xs">{evaluationId}</span> is not in the{' '}
            {source === 'demo' ? 'demo dataset' : 'assessments received in this browser session'}. The backend has no endpoint
            for retrieving an assessment by ID, and session records clear when the page is reloaded.
          </InvestigatorEmptyState>
        </Panel>
      </div>
    );
  }

  const { response } = row.record;
  const recipientHref = `/investigator/recipients/${encodeURIComponent(row.recipientId)}`;
  const graphHref = `/investigator/graph?recipient=${encodeURIComponent(row.recipientId)}`;

  return (
    <div className="space-y-6">
      {back}
      <PageHeader
        title="Investigation"
        description={<span className="break-all font-mono text-xs">{row.id}</span>}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to={recipientHref} className={linkClass}>
              <Users className="size-4" aria-hidden="true" />
              Recipient intelligence
            </Link>
            <Link to={graphHref} className={linkClass}>
              <Share2 className="size-4" aria-hidden="true" />
              Evidence graph
            </Link>
          </div>
        }
      />

      <Panel aria-labelledby="panel-summary">
        <PanelHeader
          id="panel-summary"
          title="Assessment summary"
          actions={
            <div className="flex items-center gap-2">
              {source === 'demo' && <DemoTag />}
              <VerdictBadge verdict={row.verdict} />
            </div>
          }
        />
        <div className="px-4 py-4 sm:px-5">
          <Facts
            items={[
              { label: 'Assessment reference', value: <span className="break-all font-mono text-xs">{row.id}</span> },
              { label: 'Transaction reference', value: <span className="break-all font-mono text-xs">{row.transactionId}</span> },
              { label: 'Amount', value: row.amount !== null && row.currency ? formatMoney(row.amount, row.currency) : 'Not available' },
              { label: 'Recipient', value: <span className="break-all">{row.recipientId}</span> },
              { label: 'Unified score', value: <span title="Heuristic severity, not a probability of fraud">{scoreLabel(response.unified_risk_assessment.overall_risk_score)}</span> },
              { label: 'Recommended intervention', value: row.actionLabel },
              { label: 'Assessed', value: formatDateTime(row.timestamp) },
              { label: 'Customer', value: <span className="break-all font-mono text-xs">{response.customer_id}</span> },
              { label: 'Consent recorded', value: response.customer_consent ? 'Yes' : 'No' },
            ]}
          />
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 2xl:grid-cols-2">
        <IntentPanel response={response} />
        <BehaviouralPanel response={response} />
        <RecipientPanel
          response={response}
          actions={
            <Link to={recipientHref} className="inline-flex rounded text-sm font-semibold text-primary hover:text-primary-hover">
              Open recipient profile
            </Link>
          }
        />
        <PaymentProtectionPanel response={response} />
      </div>

      <UnifiedPanel response={response} />

      <Panel aria-labelledby="panel-evidence">
        <PanelHeader
          id="panel-evidence"
          title="Evidence review"
          description="Evidence cited by this assessment, with provenance and source references. Reported and inferred evidence is not proof of fraud."
        />
        <EvidenceTimeline
          id="assessment-evidence"
          items={evidenceFromAssessment(response)}
          demo={source === 'demo'}
          emptyText="This assessment did not cite any evidence items."
        />
      </Panel>

      <p className="text-xs text-ink-muted">Recorded {formatDateTime(row.record.recordedAt)} · {response.disclaimer}</p>
    </div>
  );
}
