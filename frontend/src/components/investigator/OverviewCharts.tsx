import type { LucideIcon } from 'lucide-react';
import { Panel, PanelHeader } from './InvestigatorPrimitives';

interface OverviewMetricCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  iconClass: string;
  hint: string;
}

export function OverviewMetricCard({ label, value, icon: Icon, iconClass, hint }: OverviewMetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-surface p-4 sm:p-5 shadow-card transition-all hover:shadow-card-hover hover:border-slate-300">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <span className={`flex size-9 items-center justify-center rounded-xl shadow-2xs ${iconClass}`}>
          <Icon className="size-4.5" aria-hidden="true" strokeWidth={2} />
        </span>
      </div>
      <p className="mt-2.5 text-2xl font-extrabold tracking-tight tabular-nums text-slate-900 sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs leading-4 text-slate-500">{hint}</p>
    </div>
  );
}

export interface DistributionItem {
  key: string;
  label: string;
  count: number;
  fillClass: string;
}

interface DistributionChartProps {
  id: string;
  title: string;
  description: string;
  unit: string;
  items: DistributionItem[];
  emptyText: string;
}

/**
 * Horizontal bar distribution with visible counts and percentages, a hover/focus
 * tooltip per bar, and a screen-reader text alternative.
 */
export function DistributionChart({ id, title, description, unit, items, emptyText }: DistributionChartProps) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const max = Math.max(1, ...items.map((item) => item.count));
  const summary = items.map((item) => `${item.label}: ${item.count}`).join(', ');

  return (
    <Panel aria-labelledby={`${id}-title`}>
      <PanelHeader id={`${id}-title`} title={title} description={description} />
      <div className="px-4 py-4 sm:px-5">
        {total === 0 ? (
          <p className="py-6 text-center text-sm text-ink-muted">{emptyText}</p>
        ) : (
          <figure>
            <figcaption className="sr-only">
              {title}. {total} {unit} in total. {summary}.
            </figcaption>
            <ul className="space-y-3" aria-hidden="true">
              {items.map((item) => {
                const percent = Math.round((item.count / total) * 100);
                const tip = `${item.label}: ${item.count} of ${total} ${unit} (${percent}%)`;
                return (
                  <li key={item.key} className="group relative">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-ink">{item.label}</span>
                      <span className="tabular-nums text-ink-muted">
                        <span className="font-semibold text-ink">{item.count}</span> · {percent}%
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-muted" title={tip}>
                      <div
                        className={`h-2 rounded-full ${item.fillClass}`}
                        style={{ width: `${item.count === 0 ? 0 : Math.max(2, (item.count / max) * 100)}%` }}
                      />
                    </div>
                    <span className="pointer-events-none absolute -top-8 right-0 z-10 hidden whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs text-white shadow-popover group-hover:block">
                      {tip}
                    </span>
                  </li>
                );
              })}
            </ul>
          </figure>
        )}
      </div>
    </Panel>
  );
}
