import { Link } from 'react-router';
import type { EvaluationRecord } from '../../types/customer';
import { Card, DemoDataTag } from './CustomerPrimitives';
import { EvaluationItem } from './EvaluationItem';

interface RecentEvaluationsProps {
  records: EvaluationRecord[];
  className?: string;
}

export function RecentEvaluations({ records, className = '' }: RecentEvaluationsProps) {
  return (
    <Card aria-labelledby="recent-heading" className={className}>
      <div className="flex items-center justify-between gap-3 px-4 pt-5 pb-3 sm:px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2 id="recent-heading" className="text-base font-semibold text-ink">
            Recent evaluations
          </h2>
          <DemoDataTag />
        </div>
        <Link
          to="/activity"
          className="shrink-0 rounded text-sm font-medium text-primary hover:text-primary-hover"
        >
          View all
        </Link>
      </div>

      <ul className="divide-y divide-line border-t border-line">
        {records.map((record) => (
          <EvaluationItem key={record.id} record={record} />
        ))}
      </ul>

      <p className="border-t border-line px-4 py-3 text-xs text-ink-muted sm:px-6">
        Illustrative sample records. These are not real transactions or model predictions.
      </p>
    </Card>
  );
}
