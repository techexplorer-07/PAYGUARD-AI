import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { EvidenceProvenanceBadge } from '../../components/customer/assessment/AssessmentBadges';
import { DataSourceNotice } from '../../components/investigator/DataSourceNotice';
import { EvidenceGraph, GraphLegend } from '../../components/investigator/EvidenceGraph';
import type { GraphSelection } from '../../components/investigator/EvidenceGraph';
import { GraphSelectionPanel } from '../../components/investigator/GraphSelectionPanel';
import {
  DemoTag,
  InvestigatorEmptyState,
  InvestigatorErrorState,
  InvestigatorLoadingState,
  PageHeader,
  Panel,
  PanelHeader,
} from '../../components/investigator/InvestigatorPrimitives';
import { relationshipLabel } from '../../components/investigator/investigatorUi';
import { RecipientLookup } from '../../components/investigator/RecipientLookup';
import { useInvestigatorData } from '../../hooks/useInvestigatorData';
import { recordInvestigatorView } from '../../hooks/useInvestigatorStores';
import { useRecipientIntel } from '../../hooks/useRecipientIntel';
import { buildEvidenceGraph } from '../../utils/investigator/graphModel';

export function EvidenceGraphPage() {
  const [params, setParams] = useSearchParams();
  const recipientId = params.get('recipient') ?? '';
  const graphId = params.get('graph') ?? '';
  const { source, refreshToken } = useInvestigatorData();
  const [retry, setRetry] = useState(0);
  const [selection, setSelection] = useState<{ key: string; value: GraphSelection }>({ key: '', value: null });
  const state = useRecipientIntel(recipientId || null, graphId, refreshToken + retry);
  const selectionKey = `${source}|${recipientId}|${graphId}`;
  const selected = selection.key === selectionKey ? selection.value : null;
  const select = (value: GraphSelection) => setSelection({ key: selectionKey, value });

  const model =
    state.status === 'ready' && state.intel.evidence ? buildEvidenceGraph(state.intel.evidence, state.intel.profile) : null;

  const hasGraph = model !== null;
  useEffect(() => {
    if (hasGraph) recordInvestigatorView({ kind: 'graph', id: recipientId, label: `Graph · ${recipientId}`, source });
  }, [hasGraph, recipientId, source]);

  const lookup = (recipient: string, graph: string) => {
    const next = new URLSearchParams();
    next.set('recipient', recipient);
    if (graph) next.set('graph', graph);
    setParams(next);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="SPEG evidence graph"
        description="Scam-to-Payment Evidence Graph neighbourhood for one recipient: its directly connected entities, plus entities reached through inferred multi-hop paths. The backend does not expose the full graph."
      />
      <DataSourceNotice />

      <Panel aria-labelledby="graph-lookup">
        <PanelHeader id="graph-lookup" title="Choose a recipient" />
        <div className="px-4 py-4 sm:px-5">
          <RecipientLookup key={`${source}|${recipientId}|${graphId}`} initialRecipient={recipientId} initialGraph={graphId} submitLabel="Show graph" onSubmit={lookup} />
        </div>
      </Panel>

      {!recipientId ? (
        <Panel>
          <InvestigatorEmptyState title="No recipient selected">Choose a recipient above to explore its evidence relationships.</InvestigatorEmptyState>
        </Panel>
      ) : state.status === 'loading' ? (
        <Panel>
          <InvestigatorLoadingState label="Loading evidence graph…" />
        </Panel>
      ) : state.status === 'error' ? (
        <Panel>
          <InvestigatorErrorState
            title="The evidence graph could not be loaded"
            actions={<button type="button" onClick={() => setRetry((value) => value + 1)} className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-line px-3 text-sm font-medium text-ink hover:bg-muted">Try again</button>}
          >
            {state.error.message}
          </InvestigatorErrorState>
        </Panel>
      ) : !model ? (
        <Panel>
          <InvestigatorEmptyState title="No graph data for this recipient">
            <p>{state.status === 'ready' && state.notFound ? state.notFound : 'The backend returned no evidence relationships for this recipient.'}</p>
            <p className="mt-2">Nothing is drawn rather than inventing relationships.</p>
          </InvestigatorEmptyState>
        </Panel>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
            <Panel aria-labelledby="graph-title" className="min-w-0 xl:col-span-2">
              <PanelHeader
                id="graph-title"
                title={`Neighbourhood of ${model.focusId}`}
                description={`${model.nodes.length} entities · ${model.edges.length} relationships`}
                actions={source === 'demo' ? <DemoTag /> : undefined}
              />
              <div className="p-3 sm:p-4">
                <EvidenceGraph model={model} selection={selected} onSelect={select} />
              </div>
              <div className="border-t border-line px-4 py-4 sm:px-5">
                <GraphLegend />
              </div>
            </Panel>
            <Panel aria-labelledby="graph-details" className="min-w-0 xl:sticky xl:top-20 xl:self-start">
              <PanelHeader id="graph-details" title="Details" />
              <div aria-live="polite">
                <GraphSelectionPanel model={model} selection={selected} onSelect={select} />
              </div>
            </Panel>
          </div>

          <Panel aria-labelledby="graph-list">
            <PanelHeader id="graph-list" title="Relationships (text view)" description="Every relationship drawn in the graph above." />
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <caption className="sr-only">Relationships in the evidence graph</caption>
                <thead className="border-b border-line bg-muted/60 text-xs text-ink-muted">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-medium">From</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Relationship</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">To</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Provenance</th>
                    <th scope="col" className="px-4 py-2.5"><span className="sr-only">Select</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {model.edges.map((edge) => (
                    <tr key={edge.id}>
                      <td className="break-all px-4 py-2.5 font-mono text-xs text-ink">{edge.source}</td>
                      <td className="px-3 py-2.5 text-ink">{relationshipLabel(edge.relationship)}{edge.origin === 'path' ? ' (path)' : ''}</td>
                      <td className="break-all px-3 py-2.5 font-mono text-xs text-ink">{edge.target}</td>
                      <td className="px-3 py-2.5"><EvidenceProvenanceBadge provenance={edge.provenance} /></td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => select({ kind: 'edge', id: edge.id })}
                          className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-line px-2.5 text-xs font-semibold text-ink hover:bg-muted"
                        >
                          Show
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
