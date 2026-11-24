/**
 * Verdict and intervention presentation rules.
 *
 * Safety rules (see Module 3 brief):
 * - HIGH and MEDIUM are never downgraded.
 * - Insufficient-data signals are never shown as LOW.
 * - Any unrecognised backend value maps to `uncertain`, never to `low`.
 */
import type { EngineRiskKind, EngineRiskView, InterventionView, VerdictKind } from '../../types/assessment';
import type { InterventionRecommendation, UnifiedRiskAssessment } from '../../types/paymentProtection';

export function deriveVerdictKind(
  unified: Pick<UnifiedRiskAssessment, 'risk_level' | 'data_sufficiency' | 'recommended_action'>,
): VerdictKind {
  const level = unified.risk_level.toUpperCase();
  if (level === 'HIGH') return 'high';
  if (level === 'MEDIUM') return 'medium';

  const insufficient =
    unified.data_sufficiency.toUpperCase() === 'INSUFFICIENT' ||
    unified.recommended_action.toUpperCase() === 'INSUFFICIENT_DATA_REVIEW';
  if (insufficient) return 'insufficient';

  if (level === 'LOW') return 'low';
  return 'uncertain';
}

export const verdictCopy: Record<VerdictKind, { label: string; headline: string; explanation: string }> = {
  high: {
    label: 'High risk',
    headline: 'HIGH RISK DETECTED',
    explanation:
      'This payment shows significant warning signs. Pause and independently verify the request before proceeding.',
  },
  medium: {
    label: 'Medium risk',
    headline: 'Some warning signs found',
    explanation:
      'Review the warning signs below and verify the request carefully before you decide whether to pay.',
  },
  low: {
    label: 'Low risk',
    headline: 'No significant warning signs found',
    explanation:
      'PAYGUARD did not find significant warning signs in the information available. A low rating does not guarantee that a payment is safe, so stay alert.',
  },
  uncertain: {
    label: 'Uncertain',
    headline: 'PAYGUARD could not reach a confident result',
    explanation:
      'The available information was not complete or consistent enough for a confident assessment. Treat this payment with caution.',
  },
  insufficient: {
    label: 'Insufficient data',
    headline: 'Not enough information to assess this payment',
    explanation:
      'PAYGUARD did not have enough information to assess this payment. This is not a low-risk result. Only proceed if you personally know and trust the recipient.',
  },
};

export function engineRiskView(level: string): EngineRiskView {
  const upper = level.toUpperCase();
  const kind: EngineRiskKind =
    upper === 'HIGH' ? 'high' : upper === 'MEDIUM' ? 'medium' : upper === 'LOW' ? 'low' : 'uncertain';
  const labels: Record<EngineRiskKind, string> = {
    high: 'High concern',
    medium: 'Some concern',
    low: 'Low concern',
    uncertain: 'Inconclusive',
  };
  return { kind, label: labels[kind] };
}

const interventionCopy: Record<string, { title: string; summary: string }> = {
  ALLOW_WITH_CAUTION: {
    title: 'Proceed with caution',
    summary: 'Proceed only after reviewing the payment details.',
  },
  WARN_CUSTOMER: {
    title: 'Review the warning signs',
    summary: 'Review the warning signs before proceeding.',
  },
  STEP_UP_VERIFICATION: {
    title: 'Verify before you pay',
    summary: 'Additional verification is recommended.',
  },
  PAUSE_AND_VERIFY: {
    title: 'Pause and verify',
    summary: 'Pause and independently verify this payment.',
  },
  MANUAL_REVIEW: {
    title: 'Further review recommended',
    summary: 'Further review is recommended before proceeding.',
  },
  INSUFFICIENT_DATA_REVIEW: {
    title: 'More information needed',
    summary: 'More information is needed to assess this payment.',
  },
};

export function interventionView(recommendation: InterventionRecommendation): InterventionView {
  const copy = interventionCopy[recommendation.action.toUpperCase()];
  return {
    action: recommendation.action,
    known: Boolean(copy),
    title: copy?.title ?? 'Review this payment carefully',
    summary: copy?.summary ?? 'Review the guidance below before deciding whether to proceed.',
    guidance: recommendation.user_guidance_message,
    rationale: recommendation.rationale,
    disclaimer: recommendation.disclaimer,
  };
}
