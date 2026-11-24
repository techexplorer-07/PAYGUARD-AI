import type { RiskSummaryCounts } from '../../types/customer';
import { Card, DemoDataTag } from './CustomerPrimitives';
import { riskLevels, riskPresentation } from './customerUi';

export function RiskSummary({ counts }: { counts: RiskSummaryCounts }) {
  const total = riskLevels.reduce((sum, level) => sum + counts[level], 0);
  const percentOf = (value: number) => (total === 0 ? 0 : Math.round((value / total) * 100));
  const description = riskLevels
    .map((level) => `${riskPresentation[level].label}: ${counts[level]}`)
    .join(', ');

  return (
    <Card aria-labelledby="summary-heading" className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="summary-heading" className="text-base font-semibold text-ink">
            Risk summary
          </h2>
          <p className="mt-0.5 text-sm text-ink-muted">Last 30 days</p>
        </div>
        <DemoDataTag label="Illustrative" />
      </div>

      <p className="mt-4 text-sm text-ink-muted">
        <span className="text-2xl font-bold tabular-nums text-ink">{total}</span> assessments
      </p>

      <div
        role="img"
        aria-label={`Distribution of ${total} assessments. ${description}.`}
        className="mt-3 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-muted"
      >
        {riskLevels.map((level) =>
          counts[level] > 0 ? (
            <span
              key={level}
              className={riskPresentation[level].fillClass}
              style={{ width: `${(counts[level] / total) * 100}%` }}
            />
          ) : null,
        )}
      </div>

      <ul className="mt-4 space-y-2.5">
        {riskLevels.map((level) => {
          const { label, icon: Icon, textClass } = riskPresentation[level];
          return (
            <li key={level} className="flex items-center gap-2.5 text-sm">
              <Icon className={`size-4 shrink-0 ${textClass}`} aria-hidden="true" strokeWidth={2.25} />
              <span className="flex-1 text-ink">{label}</span>
              <span className="font-semibold tabular-nums text-ink">{counts[level]}</span>
              <span className="w-10 text-right tabular-nums text-ink-muted">{percentOf(counts[level])}%</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
