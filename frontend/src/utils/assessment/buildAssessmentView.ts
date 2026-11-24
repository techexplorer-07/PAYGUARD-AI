/**
 * Maps a validated backend PaymentProtectionResponse onto the results-page
 * presentation model. Everything shown to the customer is derived from fields
 * the backend returned; nothing is inferred from the overall risk tier alone.
 */
import type {
  AssessmentFinding,
  AssessmentSource,
  AssessmentView,
  BehaviouralEngineView,
  ComparisonRow,
  ComparisonState,
  EngineKey,
  IntentEngineView,
  NotEvaluatedEngine,
  ProvenanceKind,
  RecipientEngineView,
  SubmittedTransaction,
  SufficiencyView,
  TechnicalView,
} from '../../types/assessment';
import type {
  BehaviouralAssessment,
  DecimalValue,
  IntentAssessment,
  PaymentProtectionResponse,
  RecipientAssessment,
} from '../../types/paymentProtection';
import { formatMoney } from '../format';
import { describeIndicator, parseIndicator } from './indicators';
import { deriveVerdictKind, engineRiskView, interventionView, verdictCopy } from './verdict';

const toneOrder = { concern: 0, info: 1, reassurance: 2 } as const;

export function provenanceKind(status: string): ProvenanceKind {
  switch (status.toUpperCase()) {
    case 'VERIFIED':
      return 'verified';
    case 'REPORTED':
      return 'reported';
    case 'INFERRED':
      return 'inferred';
    case 'EXTRACTED':
      return 'extracted';
    case 'STATISTICAL':
      return 'statistical';
    default:
      return 'unknown';
  }
}

function comparisonState(status: string): ComparisonState {
  switch (status.toUpperCase()) {
    case 'MATCH':
      return 'match';
    case 'MISMATCH':
      return 'mismatch';
    case 'NOT_FOUND':
      return 'not-found';
    default:
      return 'uncertain';
  }
}

function quoteSnippets(intent: IntentAssessment | null, field: string): string[] {
  if (!intent) return [];
  const seen = new Set<string>();
  for (const snippet of intent.extracted_intent.evidence_snippets) {
    if (snippet.field === field && snippet.text_snippet.trim()) seen.add(snippet.text_snippet.trim());
  }
  return [...seen].map((text) => `“${text}”`);
}

function money(amount: number | null, currency: string | null): string | null {
  return amount === null ? null : formatMoney(amount, currency ?? 'INR');
}

/** Backend-supplied evidence lines for a finding, phrased for display. */
function evidenceFor(
  code: string,
  detail: string | null,
  intent: IntentAssessment | null,
  submitted: SubmittedTransaction | null,
): string[] {
  const lines: string[] = [];
  const comparison = intent?.comparison;
  const extracted = intent?.extracted_intent;
  switch (code) {
    case 'URGENCY_LANGUAGE_DETECTED': {
      const quotes = quoteSnippets(intent, 'urgency');
      if (quotes.length) lines.push(`Found in the message: ${quotes.join(', ')}`);
      break;
    }
    case 'COERCIVE_THREAT_LANGUAGE_DETECTED': {
      const quotes = quoteSnippets(intent, 'threat');
      if (quotes.length) lines.push(`Found in the message: ${quotes.join(', ')}`);
      break;
    }
    case 'AMOUNT_MISMATCH':
    case 'HIGH_COERCION_AMOUNT_MISMATCH': {
      const requested = money(extracted?.amount ?? null, extracted?.currency ?? comparison?.normalized_requested_currency ?? null);
      const entered = submitted ? formatMoney(submitted.amount, submitted.currency) : null;
      if (requested && entered) lines.push(`Message asked for ${requested}; you entered ${entered}.`);
      else if (requested) lines.push(`Message asked for ${requested}.`);
      break;
    }
    case 'RECIPIENT_MISMATCH':
    case 'AMOUNT_MATCH_WITH_RECIPIENT_DIVERSION':
      if (comparison?.normalized_requested_recipient) {
        lines.push(
          `Message named ${comparison.normalized_requested_recipient}; you entered ${comparison.normalized_transaction_recipient}.`,
        );
      }
      break;
    case 'CURRENCY_MISMATCH':
      if (comparison?.normalized_requested_currency) {
        lines.push(
          `Message used ${comparison.normalized_requested_currency}; you selected ${comparison.normalized_transaction_currency}.`,
        );
      }
      break;
    default:
      break;
  }
  if (detail) lines.push(detail.charAt(0).toUpperCase() + detail.slice(1) + '.');
  return lines;
}

function buildFindings(
  indicators: string[],
  defaultEngine: EngineKey | null,
  intent: IntentAssessment | null,
  submitted: SubmittedTransaction | null,
  includePolicy = false,
): AssessmentFinding[] {
  const seen = new Set<string>();
  const findings: AssessmentFinding[] = [];
  for (const raw of indicators) {
    const parsed = parseIndicator(raw, defaultEngine);
    const description = describeIndicator(parsed, intent?.extracted_intent.purpose ?? null);
    if (description.policy && !includePolicy) continue;
    const evidence = evidenceFor(parsed.code.replace(/_ZERO_MAD$/, ''), parsed.detail, intent, submitted);
    // Skip repeats: same title, or identical supporting evidence (e.g. RECIPIENT_MISMATCH alongside
    // AMOUNT_MATCH_WITH_RECIPIENT_DIVERSION). All raw codes remain listed in the technical details.
    const key = `${parsed.engine ?? 'unified'}:${description.title}`;
    const evidenceKey = evidence.length > 0 ? `${parsed.engine ?? 'unified'}:evidence:${evidence.join('|')}` : null;
    if (seen.has(key) || (evidenceKey && seen.has(evidenceKey))) continue;
    seen.add(key);
    if (evidenceKey) seen.add(evidenceKey);
    findings.push({
      id: `${parsed.engine ?? 'unified'}-${parsed.code}`,
      code: parsed.raw,
      engine: parsed.engine,
      title: description.title,
      description: description.description,
      tone: description.tone,
      evidence,
      provenance: description.provenance,
    });
  }
  return findings.sort((a, b) => toneOrder[a.tone] - toneOrder[b.tone]);
}

function intentView(intent: IntentAssessment | null, submitted: SubmittedTransaction | null): IntentEngineView | NotEvaluatedEngine {
  if (!intent) {
    return {
      status: 'not-evaluated',
      note: 'Message-based intent assessment was not available because no payment request message was submitted.',
    };
  }
  const { extracted_intent: extracted, comparison } = intent;
  const enteredAmount = submitted
    ? formatMoney(submitted.amount, submitted.currency)
    : comparison.amount_difference !== null && extracted.amount !== null
      ? formatMoney(extracted.amount + comparison.amount_difference, comparison.normalized_transaction_currency)
      : '—';

  const comparisons: ComparisonRow[] = [
    {
      label: 'Amount',
      requested: money(extracted.amount, extracted.currency ?? comparison.normalized_requested_currency),
      entered: enteredAmount,
      state: comparisonState(comparison.amount_status),
    },
    {
      label: 'Recipient',
      requested: comparison.normalized_requested_recipient,
      entered: comparison.normalized_transaction_recipient,
      state: comparisonState(comparison.recipient_status),
    },
    {
      label: 'Currency',
      requested: comparison.normalized_requested_currency,
      entered: comparison.normalized_transaction_currency,
      state: comparisonState(comparison.currency_status),
    },
  ];

  return {
    status: 'evaluated',
    risk: engineRiskView(intent.risk_assessment.risk_level),
    comparisons,
    urgencyDetected: extracted.urgency_detected,
    urgencyEvidence: quoteSnippets(intent, 'urgency'),
    threatDetected: extracted.threat_detected,
    threatEvidence: quoteSnippets(intent, 'threat'),
    purpose: extracted.purpose,
    reasons: intent.risk_assessment.reasons,
  };
}

const behaviouralSufficiency: Record<string, SufficiencyView> = {
  SUFFICIENT: {
    label: 'Enough history',
    description: 'Compared with 10 or more of your earlier payments.',
    limited: false,
  },
  MINIMAL: {
    label: 'Limited history',
    description: 'Compared with only a few earlier payments (3 to 9), so results are less certain.',
    limited: true,
  },
  INSUFFICIENT: {
    label: 'Not enough history',
    description:
      'There were too few earlier payments to compare with. This does not mean anything suspicious was found.',
    limited: true,
  },
};

const recipientSufficiency: Record<string, SufficiencyView> = {
  ADEQUATE: {
    label: 'Adequate evidence',
    description: 'Enough evidence about this recipient was available for an assessment.',
    limited: false,
  },
  LIMITED: {
    label: 'Limited evidence',
    description: 'Only some evidence about this recipient was available, so results are less certain.',
    limited: true,
  },
  INSUFFICIENT: {
    label: 'Not enough evidence',
    description: 'Too little evidence about this recipient was available to draw conclusions.',
    limited: true,
  },
};

function sufficiency(table: Record<string, SufficiencyView>, value: string): SufficiencyView {
  return (
    table[value.toUpperCase()] ?? {
      label: 'Unknown data coverage',
      description: 'PAYGUARD did not report how much data was available.',
      limited: true,
    }
  );
}

function behaviouralView(
  behavioural: BehaviouralAssessment | null,
): BehaviouralEngineView | NotEvaluatedEngine {
  if (!behavioural) {
    return {
      status: 'not-evaluated',
      note: 'Your payment history was not part of this assessment, so PAYGUARD could not compare this payment with your usual behaviour. This does not indicate any risk.',
    };
  }
  return {
    status: 'evaluated',
    risk: engineRiskView(behavioural.risk_level),
    sufficiency: sufficiency(behaviouralSufficiency, behavioural.data_sufficiency),
    findings: buildFindings(behavioural.detected_indicators, 'behavioural', null, null),
    explanation: behavioural.explanation,
  };
}

function recipientView(
  recipient: RecipientAssessment | null,
): RecipientEngineView | NotEvaluatedEngine {
  if (!recipient) {
    return {
      status: 'not-evaluated',
      note: 'PAYGUARD’s evidence records did not include this recipient, so no recipient-specific assessment was made. This does not mean the recipient is safe or unsafe.',
    };
  }
  return {
    status: 'evaluated',
    risk: engineRiskView(recipient.risk_level),
    sufficiency: sufficiency(recipientSufficiency, recipient.data_sufficiency),
    findings: buildFindings(recipient.detected_indicators, 'recipient', null, null),
    evidence: recipient.supporting_evidence.map((item) => ({
      id: item.edge_id,
      provenance: provenanceKind(item.evidence_status),
      description: item.description,
      relationship: item.relationship_type,
      observedAt: item.observed_at,
      sourceReference: item.source_reference,
    })),
    limitations: recipient.assessment_limitations,
  };
}

function scoreText(value: DecimalValue | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? `${numeric.toFixed(2)} on a 0–1 scale` : null;
}

function technicalView(response: PaymentProtectionResponse): TechnicalView {
  const unified = response.unified_risk_assessment;
  const intervention = response.intervention_recommendation;
  const engineScores = [
    { label: 'Payment intent', value: scoreText(response.intent_assessment?.risk_assessment.heuristic_score) },
    { label: 'Behaviour', value: scoreText(response.behavioural_assessment?.anomaly_score) },
    { label: 'Recipient', value: scoreText(response.recipient_assessment?.recipient_risk_score) },
  ].map(({ label, value }) => ({ label, value: value ?? 'Not evaluated' }));

  return {
    identifiers: [
      { label: 'Evaluation reference', value: response.evaluation_id },
      { label: 'Unified assessment', value: unified.unified_assessment_id },
      { label: 'Transaction reference', value: response.transaction_id },
    ],
    overallScore: scoreText(unified.overall_risk_score) ?? 'Not available',
    engineScores,
    dataSufficiency: unified.data_sufficiency,
    indicators: unified.detected_indicators,
    evidence: unified.supporting_evidence.map((item) => ({
      id: `${item.engine_source}-${item.evidence_id}`,
      engine: item.engine_source,
      provenance: provenanceKind(item.epistemic_status),
      provenanceRaw: item.epistemic_status,
      sourceReference: item.source_reference,
      description: item.description,
    })),
    intervention: [
      { label: 'Recommended action', value: intervention.action },
      { label: 'Recommendation level', value: intervention.severity },
      { label: 'Intervention category', value: intervention.intervention_type },
      { label: 'Simulated action code', value: intervention.simulated_action_code },
      { label: 'Simulation only', value: intervention.simulated_intervention_active ? 'Yes' : 'No' },
    ],
    model: [
      { label: 'Decision policy', value: unified.policy_version },
      { label: 'Assessment model', value: unified.model_type },
    ],
    unifiedExplanation: unified.explanation,
    recipientExplanation: response.recipient_assessment?.explanation ?? null,
  };
}

/** Plain-language wording for the backend's known missing-evidence disclosures; unknown text is shown as returned. */
const NO_MESSAGE = 'No payment request message was provided, so the message could not be checked.';
const NO_HISTORY = 'Your payment history was not part of this assessment.';
const NO_RECIPIENT_RECORD = 'This recipient was not found in PAYGUARD’s evidence records.';

/** Known "engine not evaluated" phrasings from the backend (missing_evidence and intervention rationale). */
const engineNotEvaluatedCopy: [prefix: string, text: string][] = [
  ['Intent correlation not evaluated', NO_MESSAGE],
  ['Customer behavioural history not evaluated', NO_HISTORY],
  ['Customer History: Behavioural baseline history was not submitted', NO_HISTORY],
  ['Recipient risk intelligence not evaluated', NO_RECIPIENT_RECORD],
  ['Recipient Intelligence: Target recipient was not queried', NO_RECIPIENT_RECORD],
  ['Recipient Intelligence: Recipient was not queried', NO_RECIPIENT_RECORD],
];

function friendlyEngineNote(text: string): string {
  return engineNotEvaluatedCopy.find(([prefix]) => text.startsWith(prefix))?.[1] ?? text;
}

const uniqueFriendly = (lines: string[]) => [...new Set(lines.map(friendlyEngineNote))];

export function buildAssessmentView(
  response: PaymentProtectionResponse,
  submitted: SubmittedTransaction | null,
  source: AssessmentSource,
): AssessmentView {
  const unified = response.unified_risk_assessment;
  const kind = deriveVerdictKind(unified);
  const findings = buildFindings(unified.detected_indicators, null, response.intent_assessment, submitted);

  return {
    source,
    evaluationId: response.evaluation_id,
    completedAt: response.timestamp,
    verdict: { kind, ...verdictCopy[kind] },
    transaction: {
      amount: submitted?.amount ?? null,
      currency: submitted?.currency ?? response.intent_assessment?.comparison.normalized_transaction_currency ?? null,
      recipientId: response.recipient_id,
    },
    keyConcerns: findings.filter((finding) => finding.tone === 'concern').slice(0, 3).map((finding) => finding.title),
    intervention: (() => {
      const view = interventionView(response.intervention_recommendation);
      return { ...view, rationale: uniqueFriendly(view.rationale) };
    })(),
    findings,
    intent: intentView(response.intent_assessment, submitted),
    behavioural: behaviouralView(response.behavioural_assessment),
    recipient: recipientView(response.recipient_assessment),
    missingEvidence: uniqueFriendly(unified.missing_evidence),
    conflictingSignals: unified.conflicting_signals,
    technical: technicalView(response),
    disclaimer: response.disclaimer,
  };
}
