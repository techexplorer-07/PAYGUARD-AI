import { ArrowUpRight, ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import type { EvaluationRecord } from '../../types/customer';
import { formatDate, formatInr } from '../../utils/format';
import { RiskBadge } from './CustomerPrimitives';

export function EvaluationItem({ record }: { record: EvaluationRecord }) {
  return (
    <li>
      <Link
        to={`/activity/${record.id}`}
        className="group flex items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/60 focus-visible:-outline-offset-2 sm:gap-4 sm:px-6"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors group-hover:bg-sky-50 group-hover:text-sky-700">
          <ArrowUpRight className="size-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{record.description}</p>
          <p className="mt-0.5 truncate text-sm text-ink-muted">
            <span className="sr-only">Recipient: </span>
            {record.recipient}
          </p>
          <p className="mt-0.5 text-xs text-ink-muted">
            <time dateTime={record.evaluatedAt}>{formatDate(record.evaluatedAt)}</time>
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <p className="text-sm font-semibold tabular-nums text-ink">{formatInr(record.amount)}</p>
          <RiskBadge level={record.riskLevel} />
        </div>

        <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary">
          <span className="hidden lg:inline">View</span>
          <span className="sr-only"> assessment</span>
          <ChevronRight className="size-4 text-ink-muted group-hover:text-primary" aria-hidden="true" />
        </span>
      </Link>
    </li>
  );
}
