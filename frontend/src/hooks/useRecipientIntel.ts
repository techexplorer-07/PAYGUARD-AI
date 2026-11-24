import { useEffect, useState } from 'react';
import {
  fetchRecipientEvidence,
  fetchRecipientProfile,
  fetchRecipientRisk,
  InvestigatorApiError,
} from '../services/investigatorApi';
import type { RecipientIntel } from '../types/investigator';
import { useInvestigatorData } from './useInvestigatorData';

export type IntelPart = 'evidence' | 'profile' | 'risk';

export type RecipientIntelState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; intel: RecipientIntel; notFound: string | null; partErrors: Partial<Record<IntelPart, InvestigatorApiError>> }
  | { status: 'error'; error: InvestigatorApiError };

interface LiveResult {
  key: string;
  state: RecipientIntelState;
}

function toApiError(reason: unknown): InvestigatorApiError {
  return reason instanceof InvestigatorApiError
    ? reason
    : new InvestigatorApiError('network', 'The PAYGUARD service could not be reached.');
}

/**
 * Recipient intelligence for one recipient.
 * - Session source: calls the three real GET endpoints (evidence, profile, risk-assessment).
 * - Demo source: reads the labelled demo fixtures. Never falls back from one to the other.
 */
export function useRecipientIntel(recipientId: string | null, graphId = '', refreshToken = 0): RecipientIntelState {
  const { source, demo } = useInvestigatorData();
  const key = `${recipientId ?? ''}|${graphId}|${refreshToken}`;
  const [live, setLive] = useState<LiveResult | null>(null);
  const liveEnabled = source === 'session' && recipientId !== null && recipientId !== '';

  useEffect(() => {
    if (!liveEnabled || !recipientId) return;
    const controller = new AbortController();
    const query = { graphId: graphId || undefined, signal: controller.signal };
    Promise.allSettled([
      fetchRecipientEvidence(recipientId, query),
      fetchRecipientProfile(recipientId, query),
      fetchRecipientRisk(recipientId, query),
    ]).then(([evidence, profile, risk]) => {
      if (controller.signal.aborted) return;
      const results = { evidence, profile, risk };
      const partErrors: Partial<Record<IntelPart, InvestigatorApiError>> = {};
      for (const part of ['evidence', 'profile', 'risk'] as const) {
        const result = results[part];
        if (result.status === 'rejected') partErrors[part] = toApiError(result.reason);
      }
      const errors = Object.values(partErrors);
      const allFailed = errors.length === 3;
      const notFound = errors.find((error) => error.kind === 'not-found');
      let state: RecipientIntelState;
      if (allFailed && !notFound) {
        state = { status: 'error', error: errors[0] };
      } else {
        state = {
          status: 'ready',
          intel: {
            recipientId,
            evidence: evidence.status === 'fulfilled' ? evidence.value : null,
            profile: profile.status === 'fulfilled' ? profile.value : null,
            risk: risk.status === 'fulfilled' ? risk.value : null,
          },
          notFound: notFound?.message ?? null,
          partErrors,
        };
      }
      setLive({ key, state });
    });
    return () => controller.abort();
  }, [key, liveEnabled, recipientId, graphId]);

  if (!recipientId) return { status: 'idle' };

  if (source === 'demo') {
    if (!demo) return { status: 'loading' };
    const intel = demo.recipients.get(recipientId);
    return intel
      ? { status: 'ready', intel, notFound: null, partErrors: {} }
      : {
          status: 'ready',
          intel: { recipientId, evidence: null, profile: null, risk: null },
          notFound: `Recipient '${recipientId}' is not in the demo evidence graph.`,
          partErrors: {},
        };
  }

  return live && live.key === key ? live.state : { status: 'loading' };
}
