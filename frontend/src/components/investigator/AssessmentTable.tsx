import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import type { AssessmentRow } from '../../types/investigator';
import { formatDateTime, formatMoney } from '../../utils/format';
import { VerdictBadge } from './InvestigatorPrimitives';

function amountText(row: AssessmentRow): string {
  return row.amount !== null && row.currency ? formatMoney(row.amount, row.currency) : '—';
}

const detailHref = (row: AssessmentRow) => `/investigator/assessments/${encodeURIComponent(row.id)}`;

/** Dense table on wider screens; stacked cards on small screens. */
export function AssessmentTable({ rows, caption }: { rows: AssessmentRow[]; caption: string }) {
  return (
    <>
      <div className="relative hidden overflow-x-auto md:block">
        <table className="w-full min-w-[960px] text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="border-b border-line bg-muted/60 text-xs font-medium text-ink-muted">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-medium">Assessment</th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">Amount</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Recipient</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Risk</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Main reason</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Recommendation</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Assessed</th>
              <th scope="col" className="px-4 py-2.5 font-medium"><span className="sr-only">Action</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={row.id} className="align-top hover:bg-muted/40">
                <td className="px-4 py-3">
                  <Link to={detailHref(row)} className="rounded font-mono text-xs font-semibold text-primary hover:text-primary-hover">
                    {row.id}
                  </Link>
                  <p className="mt-0.5 font-mono text-xs text-ink-muted">{row.transactionId}</p>
                </td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums text-ink">{amountText(row)}</td>
                <td className="max-w-48 break-all px-3 py-3 text-ink">{row.recipientId}</td>
                <td className="px-3 py-3"><VerdictBadge verdict={row.verdict} /></td>
                <td className="max-w-56 px-3 py-3 text-ink-muted">{row.mainReason ?? '—'}</td>
                <td className="px-3 py-3 text-ink">{row.actionLabel}</td>
                <td className="whitespace-nowrap px-3 py-3 text-ink-muted">{formatDateTime(row.timestamp)}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to={detailHref(row)}
                    aria-label={`Investigate ${row.id}`}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-line px-2.5 text-xs font-semibold text-ink hover:bg-muted"
                  >
                    Investigate
                    <ChevronRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-line md:hidden" aria-label={caption}>
        {rows.map((row) => (
          <li key={row.id}>
            <Link to={detailHref(row)} className="block px-4 py-3.5 hover:bg-muted/40 focus-visible:-outline-offset-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs font-semibold text-primary">{row.id}</p>
                  <p className="mt-1 break-all text-sm font-medium text-ink">{row.recipientId}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="text-sm font-semibold tabular-nums text-ink">{amountText(row)}</span>
                  <VerdictBadge verdict={row.verdict} />
                </div>
              </div>
              {row.mainReason && <p className="mt-2 text-sm text-ink-muted">{row.mainReason}</p>}
              <p className="mt-1.5 text-xs text-ink-muted">
                {row.actionLabel} · {formatDateTime(row.timestamp)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
