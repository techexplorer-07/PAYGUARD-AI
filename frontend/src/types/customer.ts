/**
 * Customer-facing domain types.
 *
 * These describe what the customer UI needs to render. They are intentionally
 * independent of backend response schemas; an adapter will map API responses
 * onto these shapes once the backend OpenAPI contracts have been reviewed.
 */

export type RiskLevel = 'low' | 'medium' | 'high';

export interface CustomerProfile {
  displayName: string;
  initials: string;
}

export interface EvaluationRecord {
  id: string;
  description: string;
  /** Amount in Indian rupees. */
  amount: number;
  recipient: string;
  /** ISO 8601 timestamp of when the assessment was made. */
  evaluatedAt: string;
  riskLevel: RiskLevel;
  /** Plain-language explanation shown on the assessment detail view. */
  summary: string;
}

export type RiskSummaryCounts = Record<RiskLevel, number>;

export interface CustomerNotification {
  id: string;
  title: string;
  body: string;
  timeLabel: string;
}

export interface SafetyTip {
  id: string;
  title: string;
  body: string;
}
