/**
 * Customer-friendly descriptions for backend indicator codes.
 *
 * Codes come from the backend engines (risk_assessor.py, behavioural_risk_scorer.py,
 * recipient_risk_scorer.py, unified_risk_assessor.py). The unified assessment
 * prefixes engine codes with INTENT_, BEHAVIOURAL_ or RECIPIENT_, and recipient
 * codes may carry a parenthesised count, e.g. "REPORTED_FRAUD_ALLEGATIONS (2 report(s) ...)".
 *
 * Only indicators the backend actually returns are ever displayed; this catalog
 * only supplies wording. Unknown codes are shown with a neutral, humanised title.
 */
import type { EngineKey, FindingTone, ProvenanceKind } from '../../types/assessment';

export interface ParsedIndicator {
  raw: string;
  engine: EngineKey | null;
  code: string;
  detail: string | null;
}

const ENGINE_PREFIXES: [string, EngineKey][] = [
  ['INTENT_', 'intent'],
  ['BEHAVIOURAL_', 'behavioural'],
  ['RECIPIENT_', 'recipient'],
];

/** "1 report(s) across 2 distinct source(s)" -> "1 report across 2 distinct sources" */
function pluraliseCounts(text: string): string {
  return text.replace(/(\d+)(\s+(?:[a-z]+\s+)*?)([a-z]+)\(s\)/gi, (_, count: string, middle: string, noun: string) =>
    `${count}${middle}${noun}${Number(count) === 1 ? '' : 's'}`,
  );
}

const normaliseCode = (code: string) => code.replace(/_ZERO_MAD$/, '');
const isCatalogued = (code: string) => catalog[normaliseCode(code)] !== undefined;

export function parseIndicator(raw: string, defaultEngine: EngineKey | null = null): ParsedIndicator {
  const match = /^([A-Z0-9_]+)(?:\s*\((.*)\))?\s*$/.exec(raw.trim());
  let code = match ? match[1] : raw.trim();
  const detail = match?.[2] ? pluraliseCounts(match[2]) : null;
  let engine = defaultEngine;

  // A full code match wins (e.g. RECIPIENT_MISMATCH is an intent code, not a RECIPIENT_ prefix).
  if (!isCatalogued(code)) {
    const prefixed = ENGINE_PREFIXES.find(([prefix]) => code.startsWith(prefix));
    if (prefixed) {
      code = code.slice(prefixed[0].length);
      engine = prefixed[1];
    }
  }
  if (engine === null) engine = catalog[normaliseCode(code)]?.engine ?? null;
  return { raw, engine, code, detail };
}

interface IndicatorCopy {
  engine: EngineKey | null;
  title: string;
  description: string;
  tone: FindingTone;
  provenance?: ProvenanceKind;
  /** Policy/guardrail codes explain the decision process; they are listed in technical details only. */
  policy?: boolean;
}

const catalog: Record<string, IndicatorCopy> = {
  // Intent correlation engine
  URGENCY_LANGUAGE_DETECTED: {
    engine: 'intent',
    title: 'Urgent payment demand',
    description: 'The message pressures you to pay quickly. Scammers use urgency to stop you from checking.',
    tone: 'concern',
  },
  COERCIVE_THREAT_LANGUAGE_DETECTED: {
    engine: 'intent',
    title: 'Threatening language',
    description: 'The message threatens consequences such as disconnection, blocking or legal action.',
    tone: 'concern',
  },
  AMOUNT_MISMATCH: {
    engine: 'intent',
    title: 'Amount differs from the request',
    description: 'The amount you entered does not match the amount in the message.',
    tone: 'concern',
  },
  RECIPIENT_MISMATCH: {
    engine: 'intent',
    title: 'Different recipient from the request',
    description: 'The UPI ID you entered is not the one named in the message.',
    tone: 'concern',
  },
  AMOUNT_MATCH_WITH_RECIPIENT_DIVERSION: {
    engine: 'intent',
    title: 'Payment redirected to another recipient',
    description: 'The amount matches the message, but the money would go to a different UPI ID.',
    tone: 'concern',
  },
  CURRENCY_MISMATCH: {
    engine: 'intent',
    title: 'Currency differs from the request',
    description: 'The currency you selected is not the one in the message.',
    tone: 'concern',
  },
  HIGH_COERCION_AMOUNT_MISMATCH: {
    engine: 'intent',
    title: 'Pressure combined with an amount mismatch',
    description: 'The message uses pressure or threats and the amount does not match the request.',
    tone: 'concern',
  },
  AMBIGUOUS_AMOUNT_DETECTED: {
    engine: 'intent',
    title: 'More than one amount in the message',
    description: 'The message mentions several amounts, so PAYGUARD could not tell which one is requested.',
    tone: 'info',
  },
  AMBIGUOUS_RECIPIENT_DETECTED: {
    engine: 'intent',
    title: 'More than one recipient in the message',
    description: 'The message mentions several payment IDs, so PAYGUARD could not tell which one is intended.',
    tone: 'info',
  },
  INSUFFICIENT_EXTRACTION_EVIDENCE: {
    engine: 'intent',
    title: 'Few payment details in the message',
    description: 'PAYGUARD could not find enough payment details in the message to compare with your payment.',
    tone: 'info',
  },
  AMOUNT_MATCH_UNSPECIFIED_RECIPIENT: {
    engine: 'intent',
    title: 'Amount matches, recipient not stated',
    description: 'The amount matches the message, but the message did not name a recipient to compare with.',
    tone: 'info',
  },
  FULL_INTENT_TRANSACTION_MATCH: {
    engine: 'intent',
    title: 'Payment matches the request',
    description:
      'The amount and recipient you entered match the message. This does not confirm the message itself is genuine.',
    tone: 'reassurance',
  },
  UNRESOLVED_CORRELATION_STATE: {
    engine: 'intent',
    title: 'Message could not be fully compared',
    description: 'PAYGUARD could not reach a clear comparison between the message and your payment.',
    tone: 'info',
  },

  // Behavioural anomaly engine
  MODERATE_AMOUNT_DEVIATION: {
    engine: 'behavioural',
    title: 'Amount differs from your usual payments',
    description: 'This amount is noticeably different from the payments in the history provided.',
    tone: 'concern',
  },
  HIGH_AMOUNT_DEVIATION: {
    engine: 'behavioural',
    title: 'Amount differs significantly from your usual payments',
    description: 'This amount is well outside the range of the payments in the history provided.',
    tone: 'concern',
  },
  EXTREME_AMOUNT_DEVIATION: {
    engine: 'behavioural',
    title: 'Amount is far outside your usual payments',
    description: 'This amount is far outside the range of the payments in the history provided.',
    tone: 'concern',
  },
  NEW_BENEFICIARY: {
    engine: 'behavioural',
    title: 'First payment to this recipient',
    description:
      'This UPI ID does not appear in the payment history provided. Paying someone new is common and is not a sign of fraud on its own.',
    tone: 'info',
  },
  COMPOUND_NOVEL_BENEFICIARY_AMOUNT_SPIKE: {
    engine: 'behavioural',
    title: 'Unusual amount to a new recipient',
    description: 'An unusually large amount is going to a recipient you have not paid before.',
    tone: 'concern',
  },
  HIGH_VELOCITY_SURGE: {
    engine: 'behavioural',
    title: 'Many payments in a short time',
    description: 'There are many more recent payments than usual in the history provided.',
    tone: 'concern',
  },
  MODERATE_VELOCITY_ELEVATION: {
    engine: 'behavioural',
    title: 'More recent payments than usual',
    description: 'Recent payment activity is higher than usual in the history provided.',
    tone: 'concern',
  },
  NEW_PAYMENT_METHOD: {
    engine: 'behavioural',
    title: 'Payment method not used before',
    description: 'This payment method does not appear in the history provided.',
    tone: 'info',
  },
  UNUSUAL_TRANSACTION_TIME: {
    engine: 'behavioural',
    title: 'Unusual time of day',
    description: 'This payment is at a time of day that differs from your usual payment activity.',
    tone: 'concern',
  },
  FIRST_TIME_TRANSFER: {
    engine: 'behavioural',
    title: 'First recorded transfer',
    description: 'There is no earlier payment activity to compare with.',
    tone: 'info',
  },
  ORDINARY_BENIGN_TRANSACTION: {
    engine: 'behavioural',
    title: 'In line with your usual payments',
    description: 'This payment is consistent with the payment history provided.',
    tone: 'reassurance',
  },

  // Recipient risk intelligence engine
  VERIFIED_FRAUD_CASE_ASSOCIATION: {
    engine: 'recipient',
    title: 'Linked to a verified fraud case',
    description: 'Formally corroborated evidence links this recipient to a fraud case.',
    tone: 'concern',
    provenance: 'verified',
  },
  REPORTED_FRAUD_ALLEGATIONS: {
    engine: 'recipient',
    title: 'Unconfirmed reports about this recipient',
    description: 'Reports or complaints mention this recipient. They have not been confirmed.',
    tone: 'concern',
    provenance: 'reported',
  },
  INFERRED_SHARED_IDENTIFIERS: {
    engine: 'recipient',
    title: 'Indirect links to other accounts',
    description:
      'This recipient shares identifiers with other accounts. This is an inferred association and does not prove common ownership.',
    tone: 'info',
    provenance: 'inferred',
  },
  HIGH_TRANSACTION_ACTIVITY_MERCHANT: {
    engine: 'recipient',
    title: 'Receives many payments',
    description: 'This recipient receives a high volume of payments, which is typical of a business.',
    tone: 'info',
  },
  HISTORICAL_EXPIRED_EVIDENCE_EXCLUDED: {
    engine: 'recipient',
    title: 'Older evidence excluded',
    description: 'Some older evidence about this recipient was outside the time window and was not used.',
    tone: 'info',
  },
  ORDINARY_BENIGN_ACTIVITY: {
    engine: 'recipient',
    title: 'No concerning recipient activity found',
    description: 'The available evidence about this recipient shows ordinary activity only.',
    tone: 'reassurance',
  },
  INSUFFICIENT_GRAPH_DATA: {
    engine: 'recipient',
    title: 'Limited recipient information',
    description: 'There was too little evidence about this recipient to draw conclusions.',
    tone: 'info',
  },

  // Unified policy and guardrail markers (technical details only)
  DESTINATION_INTENT_DIVERGENCE_OVERRIDE: { engine: null, title: 'Recipient diversion rule applied', description: '', tone: 'concern', policy: true },
  VERIFIED_RECIPIENT_FRAUD_CASE_OVERRIDE: { engine: null, title: 'Verified fraud case rule applied', description: '', tone: 'concern', policy: true },
  REPORTED_RECIPIENT_FRAUD_ELEVATION: { engine: null, title: 'Reported evidence rule applied', description: '', tone: 'concern', policy: true },
  ELEVATED_BEHAVIOURAL_ANOMALY_OVERRIDE: { engine: null, title: 'Behavioural anomaly rule applied', description: '', tone: 'concern', policy: true },
  NEW_BENEFICIARY_GUARDRAIL_APPLIED: { engine: null, title: 'New recipient safeguard applied', description: '', tone: 'info', policy: true },
  INFERRED_NETWORK_LINKS_ONLY_GUARDRAIL: { engine: null, title: 'Inferred links safeguard applied', description: '', tone: 'info', policy: true },
  INSUFFICIENT_MULTI_ENGINE_DATA: { engine: null, title: 'Insufficient data across engines', description: '', tone: 'info', policy: true },
};

function humanise(code: string): string {
  const words = code.toLowerCase().replace(/_+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export interface IndicatorDescription {
  title: string;
  description: string;
  tone: FindingTone;
  provenance?: ProvenanceKind;
  policy: boolean;
}

export function describeIndicator(parsed: ParsedIndicator, purpose: string | null = null): IndicatorDescription {
  if (parsed.code.startsWith('CONTEXT_PURPOSE_')) {
    const label = purpose ?? humanise(parsed.code.slice('CONTEXT_PURPOSE_'.length));
    return {
      title: 'Payment purpose identified',
      description: `The message appears to be about: ${label}.`,
      tone: 'info',
      policy: false,
    };
  }

  // The zero-MAD variants describe the same customer-facing finding as their base codes.
  const copy = catalog[normaliseCode(parsed.code)];
  if (copy) {
    return {
      title: copy.title,
      description: copy.description,
      tone: copy.tone,
      provenance: copy.provenance,
      policy: Boolean(copy.policy),
    };
  }

  return {
    title: humanise(parsed.code),
    description: 'Reported by the PAYGUARD assessment.',
    tone: 'info',
    policy: false,
  };
}
