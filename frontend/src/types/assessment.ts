/**
 * Presentation model for the customer risk assessment results page.
 *
 * These types describe what the UI renders. They are produced from the backend
 * `PaymentProtectionResponse` by the adapter in utils/assessment and are never
 * sent back to the API.
 */
import type { PaymentProtectionResponse } from './paymentProtection';

/** Customer-facing verdict tiers. `insufficient` is never collapsed into `low`. */
export type VerdictKind = 'low' | 'medium' | 'high' | 'uncertain' | 'insufficient';

/** Engine-level tier shown on intelligence cards. */
export type EngineRiskKind = 'low' | 'medium' | 'high' | 'uncertain';

export type AssessmentSource = 'live' | 'demo';

/** Outcome of the one-time high-risk sound attempt made when an assessment completes. */
export type AlertPlayback = 'played' | 'blocked' | 'muted' | 'unsupported' | 'not-applicable';

/** What the customer entered on the Analyse form (the response does not echo amount or currency). */
export interface SubmittedTransaction {
  amount: number;
  currency: string;
  recipientId: string;
}

/** Router state handed from the Analyse form to the results route. Contains no message text. */
export interface AssessmentResultLocationState {
  assessment: PaymentProtectionResponse;
  submitted: SubmittedTransaction;
  alertPlayback: AlertPlayback;
}

/** Router state handed from the demo picker to a demo result. */
export interface DemoResultLocationState {
  alertPlayback: AlertPlayback;
}

export type EngineKey = 'intent' | 'behavioural' | 'recipient';

/** How a finding should read: a warning sign, neutral context, or a consistent/reassuring signal. */
export type FindingTone = 'concern' | 'info' | 'reassurance';

export type ProvenanceKind = 'verified' | 'reported' | 'inferred' | 'extracted' | 'statistical' | 'unknown';

export interface AssessmentFinding {
  id: string;
  /** Raw backend indicator code, kept for traceability. */
  code: string;
  engine: EngineKey | null;
  title: string;
  description: string;
  tone: FindingTone;
  /** Backend-supplied evidence supporting this finding, already phrased for display. */
  evidence: string[];
  provenance?: ProvenanceKind;
}

export interface EngineRiskView {
  kind: EngineRiskKind;
  label: string;
}

export interface SufficiencyView {
  label: string;
  description: string;
  limited: boolean;
}

export type ComparisonState = 'match' | 'mismatch' | 'not-found' | 'uncertain';

export interface ComparisonRow {
  label: string;
  requested: string | null;
  entered: string;
  state: ComparisonState;
}

export interface NotEvaluatedEngine {
  status: 'not-evaluated';
  note: string;
}

export interface IntentEngineView {
  status: 'evaluated';
  risk: EngineRiskView;
  comparisons: ComparisonRow[];
  urgencyEvidence: string[];
  urgencyDetected: boolean;
  threatEvidence: string[];
  threatDetected: boolean;
  purpose: string | null;
  reasons: string[];
}

export interface BehaviouralEngineView {
  status: 'evaluated';
  risk: EngineRiskView;
  sufficiency: SufficiencyView;
  findings: AssessmentFinding[];
  explanation: string[];
}

export interface RecipientEvidenceView {
  id: string;
  provenance: ProvenanceKind;
  description: string;
  relationship: string;
  observedAt: string;
  sourceReference: string;
}

export interface RecipientEngineView {
  status: 'evaluated';
  risk: EngineRiskView;
  sufficiency: SufficiencyView;
  findings: AssessmentFinding[];
  evidence: RecipientEvidenceView[];
  limitations: string[];
}

export interface InterventionView {
  action: string;
  known: boolean;
  title: string;
  summary: string;
  guidance: string;
  rationale: string[];
  disclaimer: string;
}

export interface LabelledValue {
  label: string;
  value: string;
}

export interface TechnicalEvidenceRow {
  id: string;
  engine: string;
  provenance: ProvenanceKind;
  provenanceRaw: string;
  sourceReference: string;
  description: string;
}

export interface TechnicalView {
  identifiers: LabelledValue[];
  overallScore: string;
  engineScores: LabelledValue[];
  dataSufficiency: string;
  indicators: string[];
  evidence: TechnicalEvidenceRow[];
  intervention: LabelledValue[];
  model: LabelledValue[];
  unifiedExplanation: string;
  recipientExplanation: string | null;
}

export interface AssessmentView {
  source: AssessmentSource;
  evaluationId: string;
  completedAt: string;
  verdict: {
    kind: VerdictKind;
    label: string;
    headline: string;
    explanation: string;
  };
  transaction: {
    amount: number | null;
    currency: string | null;
    recipientId: string;
  };
  /** Titles of the most important warning signs, for the summary card. */
  keyConcerns: string[];
  intervention: InterventionView;
  findings: AssessmentFinding[];
  intent: IntentEngineView | NotEvaluatedEngine;
  behavioural: BehaviouralEngineView | NotEvaluatedEngine;
  recipient: RecipientEngineView | NotEvaluatedEngine;
  missingEvidence: string[];
  conflictingSignals: string[];
  technical: TechnicalView;
  disclaimer: string;
}
