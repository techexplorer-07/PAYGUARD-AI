import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useInvestigatorData } from '../../hooks/useInvestigatorData';
import { fetchHealth } from '../../services/api';
import type { DataSource } from '../../types/investigator';

type Health = { state: 'checking' } | { state: 'online'; service: string; at: string } | { state: 'offline'; at: string };

const sources: { value: DataSource; label: string }[] = [
  { value: 'session', label: 'Session data' },
  { value: 'demo', label: 'Demo dataset' },
];

function probe(): Promise<Health> {
  const at = new Date().toLocaleTimeString();
  return fetchHealth().then(
    (data) => ({ state: 'online', service: data.service, at }) as const,
    () => ({ state: 'offline', at }) as const,
  );
}

export function InvestigatorHeaderControls({ onRefresh }: { onRefresh: () => void }) {
  const { source, setSource } = useInvestigatorData();
  const [health, setHealth] = useState<Health>({ state: 'checking' });

  // Initial status probe of the real GET /health endpoint.
  useEffect(() => {
    let active = true;
    probe().then((result) => {
      if (active) setHealth(result);
    });
    return () => {
      active = false;
    };
  }, []);

  const refresh = async () => {
    setHealth({ state: 'checking' });
    onRefresh();
    setHealth(await probe());
  };

  return (
    <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
      <div role="radiogroup" aria-label="Data source" className="flex rounded-lg border border-line bg-muted p-0.5">
        {sources.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={source === value}
            onClick={() => setSource(value)}
            className={`h-8 cursor-pointer rounded-md px-3 text-xs font-semibold transition-colors ${
              source === value ? 'bg-surface text-ink shadow-card' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <span
        role="status"
        title={health.state === 'checking' ? undefined : `Last checked ${health.at}`}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs font-medium text-ink"
      >
        <span
          className={`size-2 rounded-full ${
            health.state === 'online' ? 'bg-success' : health.state === 'offline' ? 'bg-danger' : 'bg-ink-muted'
          }`}
          aria-hidden="true"
        />
        {health.state === 'online' ? 'Service online' : health.state === 'offline' ? 'Service unavailable' : 'Checking service…'}
      </span>

      <button
        type="button"
        onClick={refresh}
        disabled={health.state === 'checking'}
        className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-semibold text-ink hover:bg-muted disabled:cursor-wait disabled:opacity-60"
      >
        <RefreshCw className="size-3.5" aria-hidden="true" />
        Refresh
      </button>
    </div>
  );
}
