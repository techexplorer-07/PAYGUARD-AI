import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { useInvestigatorData } from '../../hooks/useInvestigatorData';
import type { ProvenanceFilter, RiskFilter, RowFilters, SortKey } from '../../utils/investigator/records';
import { activeFilterCount, filterRows, sortRows } from '../../utils/investigator/records';
import { AssessmentFilters } from './AssessmentFilters';
import { AssessmentTable } from './AssessmentTable';
import { InvestigatorEmptyState, Panel, PanelHeader } from './InvestigatorPrimitives';

const PAGE_SIZE = 10;
const riskValues: RiskFilter[] = ['all', 'attention', 'high', 'medium', 'low', 'uncertain', 'insufficient'];
const provenanceValues: ProvenanceFilter[] = ['all', 'verified', 'reported', 'inferred'];
const sortValues: SortKey[] = ['latest', 'risk', 'amount'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

interface AssessmentExplorerProps {
  title: string;
  description: string;
  defaults: RowFilters;
  defaultSort: SortKey;
}

/** Search, filter, sort and paginate assessment rows. State lives in the URL so it survives navigation. */
export function AssessmentExplorer({ title, description, defaults, defaultSort }: AssessmentExplorerProps) {
  const { rows } = useInvestigatorData();
  const [params, setParams] = useSearchParams();

  const pick = <T extends string>(key: string, allowed: T[], fallback: T): T => {
    const value = params.get(key);
    return value !== null && (allowed as string[]).includes(value) ? (value as T) : fallback;
  };
  const filters: RowFilters = {
    query: params.get('q') ?? defaults.query,
    risk: pick('risk', riskValues, defaults.risk),
    action: params.get('action') ?? defaults.action,
    provenance: pick('provenance', provenanceValues, defaults.provenance),
    from: DATE.test(params.get('from') ?? '') ? (params.get('from') as string) : defaults.from,
    to: DATE.test(params.get('to') ?? '') ? (params.get('to') as string) : defaults.to,
  };
  const sort = pick('sort', sortValues, defaultSort);

  const actions = [...new Set(rows.map((row) => row.action))].sort();
  const visible = sortRows(filterRows(rows, filters), sort);
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(params.get('page')) || 1), pageCount);
  const pageRows = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeCount = activeFilterCount(filters, defaults) + (sort === defaultSort ? 0 : 1);

  const keyFor: Record<keyof RowFilters, string> = { query: 'q', risk: 'risk', action: 'action', provenance: 'provenance', from: 'from', to: 'to' };

  const update = (mutate: (next: URLSearchParams) => void) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        mutate(next);
        return next;
      },
      { replace: true },
    );
  };

  const onChange = (patch: Partial<RowFilters>) =>
    update((next) => {
      for (const [key, value] of Object.entries(patch) as [keyof RowFilters, string][]) {
        if (value === defaults[key]) next.delete(keyFor[key]);
        else next.set(keyFor[key], value);
      }
      next.delete('page');
    });

  const onSort = (value: SortKey) =>
    update((next) => {
      if (value === defaultSort) next.delete('sort');
      else next.set('sort', value);
      next.delete('page');
    });

  const goToPage = (target: number) =>
    update((next) => {
      if (target <= 1) next.delete('page');
      else next.set('page', String(target));
    });

  const first = visible.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, visible.length);

  return (
    <Panel aria-labelledby="explorer-title">
      <PanelHeader id="explorer-title" title={title} description={description} />
      <AssessmentFilters
        filters={filters}
        sort={sort}
        actions={actions}
        activeCount={activeCount}
        onChange={onChange}
        onSort={onSort}
        onReset={() => setParams(new URLSearchParams(), { replace: true })}
      />
      <p role="status" className="px-4 pt-3 text-xs text-ink-muted sm:px-5">
        {visible.length === 0
          ? 'No assessments match the current filters.'
          : `Showing ${first}–${last} of ${visible.length} matching assessment${visible.length === 1 ? '' : 's'} (${rows.length} loaded).`}
      </p>
      {visible.length === 0 ? (
        <InvestigatorEmptyState title="No matching assessments">Adjust or reset the filters to see more records.</InvestigatorEmptyState>
      ) : (
        <div className="mt-3">
          <AssessmentTable rows={pageRows} caption={title} />
        </div>
      )}
      {pageCount > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-lg border border-line px-3 text-sm font-medium text-ink hover:bg-muted disabled:cursor-default disabled:opacity-40"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            Previous
          </button>
          <span className="text-xs text-ink-muted">
            Page {page} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={page >= pageCount}
            className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-lg border border-line px-3 text-sm font-medium text-ink hover:bg-muted disabled:cursor-default disabled:opacity-40"
          >
            Next
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </nav>
      )}
    </Panel>
  );
}
