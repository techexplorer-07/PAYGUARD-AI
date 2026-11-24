import { useState } from 'react';
import { Inbox } from 'lucide-react';
import { Card, DemoDataTag } from '../../components/customer/CustomerPrimitives';
import { EvaluationItem } from '../../components/customer/EvaluationItem';
import { riskLevels, riskPresentation } from '../../components/customer/customerUi';
import { demoEvaluations } from '../../data/customerDemoData';
import type { RiskLevel } from '../../types/customer';

type RiskFilter = 'all' | RiskLevel;

const filters: { value: RiskFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  ...[...riskLevels].reverse().map((level) => ({ value: level, label: riskPresentation[level].label })),
];

export function CustomerActivity() {
  const [filter, setFilter] = useState<RiskFilter>('all');
  const records =
    filter === 'all' ? demoEvaluations : demoEvaluations.filter((record) => record.riskLevel === filter);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Activity</h1>
          <DemoDataTag />
        </div>
        <p className="mt-1 text-sm text-ink-muted">Payments you have submitted for assessment.</p>
      </div>

      <div role="group" aria-label="Filter by risk level" className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {filters.map(({ value, label }) => {
          const active = filter === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(value)}
              className={`h-9 shrink-0 cursor-pointer rounded-full border px-4 text-sm font-medium transition-colors ${
                active
                  ? 'border-primary bg-primary text-white'
                  : 'border-line bg-surface text-ink hover:bg-muted'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <Card aria-label="Assessments">
        {records.length > 0 ? (
          <ul className="divide-y divide-line">
            {records.map((record) => (
              <EvaluationItem key={record.id} record={record} />
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <Inbox className="size-8 text-ink-muted" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-ink">No assessments match this filter</p>
          </div>
        )}
        <p className="border-t border-line px-4 py-3 text-xs text-ink-muted sm:px-6">
          Illustrative sample records. These are not real transactions or model predictions.
        </p>
      </Card>
    </div>
  );
}
