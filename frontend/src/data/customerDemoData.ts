/**
 * ILLUSTRATIVE DEMO DATA — NOT REAL CUSTOMER DATA.
 *
 * Every record below is a frontend-only sample used to prototype the customer
 * dashboard. None of it comes from the backend, a bank account, a payment rail
 * or a model prediction. Replace these exports with API-backed data once the
 * backend contracts are integrated.
 */
import type {
  CustomerNotification,
  CustomerProfile,
  EvaluationRecord,
  RiskSummaryCounts,
  SafetyTip,
} from '../types/customer';

export const demoCustomer: CustomerProfile = {
  displayName: 'Ramanathan',
  initials: 'R',
};

export const demoEvaluations: EvaluationRecord[] = [
  {
    id: 'demo-001',
    description: 'Electricity bill payment',
    amount: 8500,
    recipient: 'sample-electricity@upi',
    evaluatedAt: '2026-11-22T19:42:00+05:30',
    riskLevel: 'high',
    summary:
      'Sample scenario: the request warned of immediate power disconnection and asked for payment to a personal UPI ID rather than the utility provider.',
  },
  {
    id: 'demo-002',
    description: 'Monthly rent payment',
    amount: 12000,
    recipient: 'sample-landlord@upi',
    evaluatedAt: '2026-11-20T09:15:00+05:30',
    riskLevel: 'low',
    summary:
      'Sample scenario: a recurring payment to a recipient paid on a similar date and amount in previous months.',
  },
  {
    id: 'demo-003',
    description: 'Online purchase',
    amount: 2499,
    recipient: 'sample-store@upi',
    evaluatedAt: '2026-11-18T16:05:00+05:30',
    riskLevel: 'medium',
    summary:
      'Sample scenario: first payment to a new merchant ID, with a request to complete payment within a short time window.',
  },
  {
    id: 'demo-004',
    description: 'Mobile recharge',
    amount: 299,
    recipient: 'sample-telecom@upi',
    evaluatedAt: '2026-11-15T11:30:00+05:30',
    riskLevel: 'low',
    summary: 'Sample scenario: a small, routine payment to a frequently used recipient.',
  },
  {
    id: 'demo-005',
    description: 'Parcel redelivery fee',
    amount: 49,
    recipient: 'sample-courier@upi',
    evaluatedAt: '2026-11-12T20:10:00+05:30',
    riskLevel: 'high',
    summary:
      'Sample scenario: an unsolicited message asked for a small fee via a link, a pattern commonly used to collect payment details.',
  },
  {
    id: 'demo-006',
    description: 'Shared dinner split',
    amount: 1150,
    recipient: 'sample-friend@upi',
    evaluatedAt: '2026-11-09T22:48:00+05:30',
    riskLevel: 'low',
    summary: 'Sample scenario: a payment to a known contact matching a typical amount for this category.',
  },
];

/** Illustrative classification totals for the last 30 days. */
export const demoRiskSummary: RiskSummaryCounts = {
  low: 12,
  medium: 5,
  high: 3,
};

export const demoNotifications: CustomerNotification[] = [
  {
    id: 'note-001',
    title: 'Sample: high-risk assessment',
    body: 'An illustrative electricity bill request was rated high risk. Review the assessment before paying.',
    timeLabel: '2 days ago',
  },
  {
    id: 'note-002',
    title: 'Safety reminder',
    body: 'PAYGUARD will never ask for your UPI PIN, OTP or card details.',
    timeLabel: '5 days ago',
  },
  {
    id: 'note-003',
    title: 'You are viewing demo data',
    body: 'Assessments shown in this prototype are illustrative samples, not real transactions.',
    timeLabel: 'This week',
  },
];

export const safetyTips: SafetyTip[] = [
  {
    id: 'tip-pin',
    title: 'Never share your UPI PIN',
    body: 'You only enter your PIN to send money, never to receive it.',
  },
  {
    id: 'tip-urgent',
    title: 'Verify urgent requests independently',
    body: 'Call the organisation on a number you already trust, not one in the message.',
  },
  {
    id: 'tip-recipient',
    title: 'Check the recipient before you pay',
    body: 'Confirm the name and UPI ID match who you expect to pay.',
  },
  {
    id: 'tip-threats',
    title: 'Be wary of threats',
    body: 'Messages about account blocking or service disconnection are a common scam tactic.',
  },
];
