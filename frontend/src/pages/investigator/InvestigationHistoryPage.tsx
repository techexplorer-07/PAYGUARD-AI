import { ChevronRight, FileStack, Share2, Users } from 'lucide-react';
import { Link } from 'react-router';
import { DemoTag, InvestigatorEmptyState, PageHeader, Panel, PanelHeader } from '../../components/investigator/InvestigatorPrimitives';
import { clearInvestigatorViews, useInvestigatorViews } from '../../hooks/useInvestigatorStores';
import type { ViewedItem } from '../../hooks/useInvestigatorStores';
import { formatDateTime } from '../../utils/format';

const kindMeta = {
  assessment: { label: 'Assessment', icon: FileStack, href: (id: string) => `/investigator/assessments/${encodeURIComponent(id)}` },
  recipient: { label: 'Recipient', icon: Users, href: (id: string) => `/investigator/recipients/${encodeURIComponent(id)}` },
  graph: { label: 'Evidence graph', icon: Share2, href: (id: string) => `/investigator/graph?recipient=${encodeURIComponent(id)}` },
} as const;

export function InvestigationHistoryPage() {
  const views = useInvestigatorViews();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Investigation history"
        description="Items you opened in this browser tab. The backend has no case-management or audit-log endpoint, so this history is not saved, shared or attributed to an analyst."
      />
      <Panel aria-labelledby="history-title">
        <PanelHeader
          id="history-title"
          title="Recently viewed"
          actions={
            views.length > 0 && (
              <button
                type="button"
                onClick={clearInvestigatorViews}
                className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-line px-2.5 text-xs font-semibold text-ink hover:bg-muted"
              >
                Clear history
              </button>
            )
          }
        />
        {views.length === 0 ? (
          <InvestigatorEmptyState title="Nothing viewed yet">Assessments, recipients and graphs you open will be listed here.</InvestigatorEmptyState>
        ) : (
          <ol className="divide-y divide-line">
            {views.map((item: ViewedItem) => {
              const meta = kindMeta[item.kind];
              const Icon = meta.icon;
              return (
                <li key={`${item.source}-${item.kind}-${item.id}`}>
                  <Link to={meta.href(item.id)} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 focus-visible:-outline-offset-2 sm:px-5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-ink-muted">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-medium text-ink">{meta.label}</span>
                        {item.source === 'demo' && <DemoTag />}
                      </span>
                      <span className="block break-all text-xs text-ink-muted">{item.label}</span>
                    </span>
                    <span className="hidden whitespace-nowrap text-xs text-ink-muted sm:block">{formatDateTime(item.viewedAt)}</span>
                    <ChevronRight className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </Panel>
    </div>
  );
}
