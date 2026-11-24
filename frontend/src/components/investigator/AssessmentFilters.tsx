import { useState } from 'react';
import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ProvenanceFilter, RiskFilter, RowFilters, SortKey } from '../../utils/investigator/records';
import { interventionLabel } from '../../utils/investigator/records';
import { inputBaseClass } from './investigatorUi';

interface AssessmentFiltersProps {
  filters: RowFilters;
  sort: SortKey;
  actions: string[];
  activeCount: number;
  onChange: (patch: Partial<RowFilters>) => void;
  onSort: (sort: SortKey) => void;
  onReset: () => void;
}

const riskOptions: { value: RiskFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'attention', label: 'Needs attention (not low)' },
  { value: 'high', label: 'High risk' },
  { value: 'medium', label: 'Medium risk' },
  { value: 'low', label: 'Low risk' },
  { value: 'uncertain', label: 'Uncertain' },
  { value: 'insufficient', label: 'Insufficient data' },
];

const provenanceOptions: { value: ProvenanceFilter; label: string }[] = [
  { value: 'all', label: 'Any evidence' },
  { value: 'verified', label: 'Has verified evidence' },
  { value: 'reported', label: 'Has reported evidence' },
  { value: 'inferred', label: 'Has inferred links' },
];

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'risk', label: 'Highest risk' },
  { value: 'latest', label: 'Latest assessment' },
  { value: 'amount', label: 'Transaction amount' },
];

function Field({ id, label, children, className = '' }: { id: string; label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-xs font-medium text-ink-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

const selectClass = `${inputBaseClass} w-full cursor-pointer`;

export function AssessmentFilters({ filters, sort, actions, activeCount, onChange, onSort, onReset }: AssessmentFiltersProps) {
  const [showMore, setShowMore] = useState(false);
  return (
    <div className="grid grid-cols-1 gap-3 border-b border-line px-4 py-4 sm:grid-cols-2 sm:px-5 lg:grid-cols-4 2xl:grid-cols-7">
      <Field id="filter-query" label="Search" className="sm:col-span-2 lg:col-span-2 2xl:col-span-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
          <input
            id="filter-query"
            type="search"
            value={filters.query}
            onChange={(event) => onChange({ query: event.target.value })}
            placeholder="Assessment ID, transaction ID or recipient UPI ID"
            className={`${inputBaseClass} w-full pl-9`}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </Field>
      <button
        type="button"
        aria-expanded={showMore}
        aria-controls="more-filters"
        onClick={() => setShowMore((value) => !value)}
        className="inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink hover:bg-muted md:hidden"
      >
        <SlidersHorizontal className="size-4" aria-hidden="true" />
        {showMore ? 'Hide filters' : 'Filters and sorting'}
      </button>
      <div id="more-filters" className={showMore ? 'contents' : 'hidden md:contents'}>
      <Field id="filter-risk" label="Risk classification">
        <select id="filter-risk" value={filters.risk} onChange={(event) => onChange({ risk: event.target.value as RiskFilter })} className={selectClass}>
          {riskOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
      <Field id="filter-action" label="Recommendation">
        <select id="filter-action" value={filters.action} onChange={(event) => onChange({ action: event.target.value })} className={selectClass}>
          <option value="all">All recommendations</option>
          {actions.map((action) => (
            <option key={action} value={action}>
              {interventionLabel(action)}
            </option>
          ))}
        </select>
      </Field>
      <Field id="filter-provenance" label="Evidence provenance">
        <select
          id="filter-provenance"
          value={filters.provenance}
          onChange={(event) => onChange({ provenance: event.target.value as ProvenanceFilter })}
          className={selectClass}
        >
          {provenanceOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
      <Field id="filter-sort" label="Sort by">
        <select id="filter-sort" value={sort} onChange={(event) => onSort(event.target.value as SortKey)} className={selectClass}>
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-2 2xl:col-span-2">
        <Field id="filter-from" label="From date">
          <input id="filter-from" type="date" value={filters.from} max={filters.to || undefined} onChange={(event) => onChange({ from: event.target.value })} className={`${inputBaseClass} w-full`} />
        </Field>
        <Field id="filter-to" label="To date">
          <input id="filter-to" type="date" value={filters.to} min={filters.from || undefined} onChange={(event) => onChange({ to: event.target.value })} className={`${inputBaseClass} w-full`} />
        </Field>
      </div>
      </div>
      <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-2 2xl:col-span-3">
        <button
          type="button"
          onClick={onReset}
          disabled={activeCount === 0}
          className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink hover:bg-muted disabled:cursor-default disabled:opacity-50"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Reset filters
        </button>
        <span role="status" className="pb-2.5 text-xs text-ink-muted">
          {activeCount === 0 ? 'No filters applied' : `${activeCount} filter${activeCount === 1 ? '' : 's'} applied`}
        </span>
      </div>
    </div>
  );
}
