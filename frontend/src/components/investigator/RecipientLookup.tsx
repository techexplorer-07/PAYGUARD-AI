import { useState } from 'react';
import type { FormEvent } from 'react';
import { Search } from 'lucide-react';
import { useInvestigatorData } from '../../hooks/useInvestigatorData';
import { inputBaseClass } from './investigatorUi';

interface RecipientLookupProps {
  initialRecipient?: string;
  initialGraph?: string;
  submitLabel: string;
  onSubmit: (recipientId: string, graphId: string) => void;
}

/** Look up any recipient by UPI ID, with the backend's optional graph_id query parameter. */
export function RecipientLookup({ initialRecipient = '', initialGraph = '', submitLabel, onSubmit }: RecipientLookupProps) {
  const { source, rows, demo } = useInvestigatorData();
  const [recipient, setRecipient] = useState(initialRecipient);
  const [graph, setGraph] = useState(initialGraph);
  const known = [...new Set([...rows.map((row) => row.recipientId), ...(source === 'demo' ? [...(demo?.recipients.keys() ?? [])] : [])])].sort();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = recipient.trim();
    if (value) onSubmit(value, graph.trim());
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,14rem)_auto] sm:items-end">
      <div className="flex min-w-0 flex-col gap-1">
        <label htmlFor="lookup-recipient" className="text-xs font-medium text-ink-muted">
          Recipient UPI ID or entity ID
        </label>
        <input
          id="lookup-recipient"
          list="known-recipients"
          value={recipient}
          onChange={(event) => setRecipient(event.target.value)}
          placeholder="name@provider"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          className={`${inputBaseClass} w-full`}
        />
        <datalist id="known-recipients">
          {known.map((id) => (
            <option key={id} value={id} />
          ))}
        </datalist>
      </div>
      {source === 'session' && (
        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor="lookup-graph" className="text-xs font-medium text-ink-muted">
            Graph ID (optional)
          </label>
          <input
            id="lookup-graph"
            value={graph}
            onChange={(event) => setGraph(event.target.value)}
            placeholder="Backend default graph"
            autoComplete="off"
            spellCheck={false}
            className={`${inputBaseClass} w-full`}
          />
        </div>
      )}
      <button
        type="submit"
        disabled={!recipient.trim()}
        className="inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Search className="size-4" aria-hidden="true" />
        {submitLabel}
      </button>
    </form>
  );
}
