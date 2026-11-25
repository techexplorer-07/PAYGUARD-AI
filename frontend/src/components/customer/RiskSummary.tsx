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
    <Card aria-labelledby="summary-heading" className="p-5 sm:p-6 bg-surface">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="summary-heading" className="text-base font-bold tracking-tight text-ink">
            Risk summary
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">Past 30-day activity profile</p>
        </div>
        <DemoDataTag label="Sample Data" />
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold tracking-tight tabular-nums text-ink">{total}</span>
        <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">total evaluated</span>
      </div>

      <div
        role="img"
        aria-label={`Distribution of ${total} assessments. ${description}.`}
        className="mt-3.5 flex h-2.5 gap-1 overflow-hidden rounded-full bg-slate-100 p-0.5 ring-1 ring-slate-900/5"
      >
        {riskLevels.map((level) =>
          counts[level] > 0 ? (
            <span
              key={level}
              className={`rounded-full transition-all duration-300 ${riskPresentation[level].fillClass}`}
              style={{ width: `${(counts[level] / total) * 100}%` }}
            />
          ) : null,
        )}
      </div>

      <ul className="mt-4.5 space-y-2.5">
        {riskLevels.map((level) => {
          const { label, icon: Icon, textClass, badgeClass } = riskPresentation[level];
          return (
            <li key={level} className="flex items-center gap-2.5 text-sm rounded-lg p-1.5 transition-colors hover:bg-slate-50">
              <span className={`flex size-6 items-center justify-center rounded-md ${badgeClass}`}>
                <Icon className={`size-3.5 ${textClass}`} aria-hidden="true" strokeWidth={2.25} />
              </span>
              <span className="flex-1 font-medium text-ink">{label}</span>
              <span className="font-semibold tabular-nums text-ink">{counts[level]}</span>
              <span className="w-10 text-right text-xs font-medium tabular-nums text-ink-muted">{percentOf(counts[level])}%</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
