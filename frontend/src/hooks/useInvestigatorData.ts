import { createContext, useContext } from 'react';
import { parseEvidenceSummary, parseRecipientProfile, parseRecipientRisk } from '../services/investigatorApi';
import { parsePaymentProtectionResponse } from '../services/paymentProtectionParser';
import type { AssessmentRecord, AssessmentRow, DataSource, RecipientIntel } from '../types/investigator';

export interface DemoDataset {
  graphId: string;
  records: AssessmentRecord[];
  recipients: Map<string, RecipientIntel>;
  /** Fixture entries that failed validation (expected to be zero). */
  rejected: number;
}

export interface InvestigatorData {
  source: DataSource;
  setSource: (source: DataSource) => void;
  /** True while the demo dataset is being loaded on demand. */
  loading: boolean;
  records: AssessmentRecord[];
  rows: AssessmentRow[];
  demo: DemoDataset | null;
  /** Incremented by the header Refresh action so live views refetch. */
  refreshToken: number;
}

export const InvestigatorDataContext = createContext<InvestigatorData | null>(null);

export function useInvestigatorData(): InvestigatorData {
  const value = useContext(InvestigatorDataContext);
  if (!value) throw new Error('useInvestigatorData must be used inside InvestigatorLayout');
  return value;
}

const SOURCE_KEY = 'payguard.investigator.source';

export function readStoredSource(): DataSource {
  try {
    return window.sessionStorage.getItem(SOURCE_KEY) === 'demo' ? 'demo' : 'session';
  } catch {
    return 'session';
  }
}

export function storeSource(source: DataSource): void {
  try {
    window.sessionStorage.setItem(SOURCE_KEY, source);
  } catch {
    // Non-essential preference.
  }
}

let demoPromise: Promise<DemoDataset> | null = null;

/** Loads and validates the demo dataset once, on demand, through the same parsers as live data. */
export function loadDemoDataset(): Promise<DemoDataset> {
  demoPromise ??= import('../data/demoInvestigation').then(({ demoInvestigationDataset: raw }) => {
    let rejected = 0;
    const records: AssessmentRecord[] = [];
    for (const entry of raw.assessments) {
      const response = parsePaymentProtectionResponse(entry.response);
      if (!response) {
        rejected += 1;
        continue;
      }
      records.push({ response, submitted: entry.submitted, recordedAt: response.timestamp });
    }
    const recipients = new Map<string, RecipientIntel>();
    for (const [recipientId, intel] of Object.entries(raw.recipients)) {
      recipients.set(recipientId, {
        recipientId,
        evidence: parseEvidenceSummary(intel.evidence),
        profile: parseRecipientProfile(intel.profile),
        risk: parseRecipientRisk(intel.risk),
      });
    }
    return { graphId: raw.graphId, records, recipients, rejected };
  });
  return demoPromise;
}
