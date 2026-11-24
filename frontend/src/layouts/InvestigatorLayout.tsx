import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, ScrollRestoration } from 'react-router';
import { Menu } from 'lucide-react';
import { InvestigatorHeaderControls } from '../components/investigator/InvestigatorHeaderControls';
import { InvestigatorSidebar } from '../components/investigator/InvestigatorSidebar';
import { useSessionAssessments } from '../hooks/useInvestigatorStores';
import {
  InvestigatorDataContext,
  loadDemoDataset,
  readStoredSource,
  storeSource,
} from '../hooks/useInvestigatorData';
import type { DemoDataset, InvestigatorData } from '../hooks/useInvestigatorData';
import type { DataSource } from '../types/investigator';
import { toRow } from '../utils/investigator/records';

export function InvestigatorLayout() {
  const [source, setSourceState] = useState<DataSource>(readStoredSource);
  const [demo, setDemo] = useState<DemoDataset | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sessionRecords = useSessionAssessments();

  // Load the demo dataset only when the analyst explicitly selects it.
  useEffect(() => {
    if (source !== 'demo' || demo) return;
    let active = true;
    loadDemoDataset().then((dataset) => {
      if (active) setDemo(dataset);
    });
    return () => {
      active = false;
    };
  }, [source, demo]);

  const data = useMemo<InvestigatorData>(() => {
    const records = source === 'demo' ? (demo?.records ?? []) : sessionRecords;
    return {
      source,
      setSource: (next: DataSource) => {
        storeSource(next);
        setSourceState(next);
      },
      loading: source === 'demo' && demo === null,
      records,
      rows: records.map(toRow),
      demo,
      refreshToken,
    };
  }, [source, demo, sessionRecords, refreshToken]);

  const closeDrawer = () => {
    setDrawerOpen(false);
    menuButtonRef.current?.focus();
  };

  return (
    <InvestigatorDataContext.Provider value={data}>
      <div className="min-h-screen bg-canvas text-ink">
        <a
          href="#investigator-main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-popover"
        >
          Skip to content
        </a>

        {/* Desktop sidebar */}
        <div className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-surface lg:block">
          <InvestigatorSidebar />
        </div>

        {/* Tablet / mobile drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Investigator navigation">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={closeDrawer}
              className="absolute inset-0 cursor-default bg-ink/30"
            />
            <div
              className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-line bg-surface shadow-popover"
              onKeyDown={(event) => {
                if (event.key === 'Escape') closeDrawer();
              }}
            >
              <InvestigatorSidebar onNavigate={closeDrawer} onClose={closeDrawer} />
            </div>
          </div>
        )}

        <div className="lg:pl-64">
          <header className="sticky top-0 z-20 border-b border-line bg-surface">
            <div className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 sm:px-6">
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open navigation"
                aria-expanded={drawerOpen}
                className="flex size-10 cursor-pointer items-center justify-center rounded-lg text-ink-muted hover:bg-muted hover:text-ink lg:hidden"
              >
                <Menu className="size-5" aria-hidden="true" />
              </button>
              <p className="text-sm font-semibold text-ink lg:hidden">Fraud Intelligence Centre</p>
              <InvestigatorHeaderControls onRefresh={() => setRefreshToken((value) => value + 1)} />
            </div>
          </header>

          <p className="border-b border-warning/30 bg-warning/10 px-4 py-2 text-xs leading-5 text-ink sm:px-6">
            <span className="font-semibold">Prototype workspace.</span> No sign-in or role-based access control is
            implemented, so this route is not protected. Investigation views are read-only.
          </p>

          <main id="investigator-main" className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:py-8">
            <Outlet />
          </main>
        </div>
        <ScrollRestoration />
      </div>
    </InvestigatorDataContext.Provider>
  );
}
