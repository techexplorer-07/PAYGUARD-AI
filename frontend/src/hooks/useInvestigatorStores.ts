import { useSyncExternalStore } from 'react';
import type { SubmittedTransaction } from '../types/assessment';
import type { AssessmentRecord } from '../types/investigator';
import type { PaymentProtectionResponse } from '../types/paymentProtection';

/**
 * In-memory stores for the investigator prototype.
 *
 * The backend has no endpoint to list or re-read assessments, so the workspace
 * can only show real assessments this browser tab received from
 * POST /payment-protection/evaluate. They are kept in memory (never in browser
 * storage, because responses can contain fragments of the customer's message)
 * and disappear when the tab is reloaded.
 */

function createStore<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (next: T) => {
      value = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const MAX_SESSION_RECORDS = 200;
const sessionAssessments = createStore<AssessmentRecord[]>([]);

/** Called by the customer Analyse flow after a successful, validated backend response. */
export function recordSessionAssessment(response: PaymentProtectionResponse, submitted: SubmittedTransaction): void {
  const existing = sessionAssessments.get().filter((record) => record.response.evaluation_id !== response.evaluation_id);
  sessionAssessments.set(
    [{ response, submitted, recordedAt: new Date().toISOString() }, ...existing].slice(0, MAX_SESSION_RECORDS),
  );
}

export function useSessionAssessments(): AssessmentRecord[] {
  return useSyncExternalStore(sessionAssessments.subscribe, sessionAssessments.get, sessionAssessments.get);
}

export interface ViewedItem {
  kind: 'assessment' | 'recipient' | 'graph';
  id: string;
  label: string;
  source: 'session' | 'demo';
  viewedAt: string;
}

const viewHistory = createStore<ViewedItem[]>([]);

export function recordInvestigatorView(item: Omit<ViewedItem, 'viewedAt'>): void {
  const rest = viewHistory.get().filter((entry) => !(entry.kind === item.kind && entry.id === item.id && entry.source === item.source));
  viewHistory.set([{ ...item, viewedAt: new Date().toISOString() }, ...rest].slice(0, 50));
}

export function clearInvestigatorViews(): void {
  viewHistory.set([]);
}

export function useInvestigatorViews(): ViewedItem[] {
  return useSyncExternalStore(viewHistory.subscribe, viewHistory.get, viewHistory.get);
}
