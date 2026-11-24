import { useEffect, useState } from 'react';
import { ArrowLeft, Share2 } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router';
import { DemoTag, PageHeader } from '../../components/investigator/InvestigatorPrimitives';
import { RecipientIntelView } from '../../components/investigator/RecipientIntelView';
import { useInvestigatorData } from '../../hooks/useInvestigatorData';
import { recordInvestigatorView } from '../../hooks/useInvestigatorStores';
import { useRecipientIntel } from '../../hooks/useRecipientIntel';

export function RecipientDetailPage() {
  const { recipientId = '' } = useParams();
  const [params] = useSearchParams();
  const graphId = params.get('graph') ?? '';
  const { rows, source, refreshToken } = useInvestigatorData();
  const [retry, setRetry] = useState(0);
  const state = useRecipientIntel(recipientId, graphId, refreshToken + retry);
  const related = rows.filter((row) => row.recipientId === recipientId);

  useEffect(() => {
    if (recipientId) recordInvestigatorView({ kind: 'recipient', id: recipientId, label: recipientId, source });
  }, [recipientId, source]);

  const graphHref = `/investigator/graph?recipient=${encodeURIComponent(recipientId)}${graphId ? `&graph=${encodeURIComponent(graphId)}` : ''}`;

  return (
    <div className="space-y-6">
      <Link to="/investigator/recipients" className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-primary hover:text-primary-hover">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Recipient intelligence
      </Link>
      <PageHeader
        title="Recipient"
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="break-all font-mono text-sm text-ink">{recipientId}</span>
            {source === 'demo' && <DemoTag />}
            {graphId && <span className="text-xs">Graph: <span className="font-mono">{graphId}</span></span>}
          </span>
        }
        actions={
          <Link to={graphHref} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink hover:bg-muted">
            <Share2 className="size-4" aria-hidden="true" />
            View in evidence graph
          </Link>
        }
      />
      <p className="text-sm leading-6 text-ink-muted">
        Recipient with available risk indicators. Reported and inferred evidence is unconfirmed and does not by itself
        establish that this recipient is fraudulent.
      </p>
      <RecipientIntelView state={state} related={related} demo={source === 'demo'} onRetry={() => setRetry((value) => value + 1)} />
    </div>
  );
}
