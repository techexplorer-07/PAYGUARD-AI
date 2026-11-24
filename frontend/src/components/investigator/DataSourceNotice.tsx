import { FlaskConical, Info } from 'lucide-react';
import { Link } from 'react-router';
import { useInvestigatorData } from '../../hooks/useInvestigatorData';
import { primaryButtonClass, secondaryButtonClass } from '../customer/customerUi';
import { InvestigatorEmptyState, InvestigatorLoadingState, Panel } from './InvestigatorPrimitives';

/** States exactly where the records on screen come from. */
export function DataSourceNotice() {
  const { source, records, demo } = useInvestigatorData();
  if (source === 'demo') {
    return (
      <p role="note" className="flex gap-2.5 rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm leading-5 text-ink">
        <FlaskConical className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <span>
          <span className="font-semibold">Demo dataset.</span> {demo ? `${demo.records.length} sample assessments` : 'Sample assessments'}{' '}
          produced by running the PAYGUARD engines on synthetic data and a sample evidence graph. Not real customers,
          payments, cases or operational statistics.
        </span>
      </p>
    );
  }
  return (
    <p role="note" className="flex gap-2.5 rounded-lg border border-line bg-surface px-4 py-3 text-sm leading-5 text-ink-muted">
      <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <span>
        <span className="font-semibold text-ink">Session data: {records.length} real assessment{records.length === 1 ? '' : 's'}</span>{' '}
        returned by the PAYGUARD service to this browser tab. The backend does not store or list assessments, so this is
        not a complete record and it clears when the page is reloaded.
      </span>
    </p>
  );
}

/** Loading / empty handling shared by pages that list assessment records. Returns null when records exist. */
export function RecordsGate() {
  const { source, loading, records, setSource } = useInvestigatorData();
  if (loading) {
    return (
      <Panel>
        <InvestigatorLoadingState label="Loading demo dataset…" />
      </Panel>
    );
  }
  if (records.length > 0) return null;
  return (
    <Panel>
      <InvestigatorEmptyState
        title={source === 'session' ? 'No assessments in this session yet' : 'The demo dataset is empty'}
        actions={
          source === 'session' && (
            <>
              <Link to="/analyse" className={primaryButtonClass}>
                Run a payment assessment
              </Link>
              <button type="button" onClick={() => setSource('demo')} className={secondaryButtonClass}>
                Switch to demo dataset
              </button>
            </>
          )
        }
      >
        {source === 'session'
          ? 'Assessments appear here after a payment is analysed on the customer Analyse page in this browser tab.'
          : null}
      </InvestigatorEmptyState>
    </Panel>
  );
}
