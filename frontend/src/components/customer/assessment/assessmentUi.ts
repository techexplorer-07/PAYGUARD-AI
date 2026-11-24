/** Visual treatment for verdicts, engine tiers and evidence provenance. Text labels always accompany colour. */
import {
  BadgeCheck,
  ChartNoAxesColumn,
  CircleCheck,
  CircleQuestionMark,
  Flag,
  MessageSquareText,
  OctagonExclamationPoint,
  ShieldCheck,
  ShieldEllipsis,
  ShieldExclamationPoint,
  ShieldQuestionMark,
  TriangleExclamationPoint,
  Waypoints,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { EngineKey, EngineRiskKind, ProvenanceKind, VerdictKind } from '../../../types/assessment';

export const engineNames: Record<EngineKey, string> = {
  intent: 'Payment intent',
  behavioural: 'Behaviour',
  recipient: 'Recipient',
};

interface VerdictStyle {
  icon: LucideIcon;
  /** Icon tile background + colour. */
  iconClass: string;
  /** Pill badge. */
  badgeClass: string;
  /** Top accent bar on the summary card. */
  accentClass: string;
  /** Headline colour. */
  headlineClass: string;
}

export const verdictStyles: Record<VerdictKind, VerdictStyle> = {
  high: {
    icon: ShieldExclamationPoint,
    iconClass: 'bg-danger/10 text-danger',
    badgeClass: 'bg-danger/10 text-danger',
    accentClass: 'bg-danger',
    headlineClass: 'text-danger',
  },
  medium: {
    icon: TriangleExclamationPoint,
    iconClass: 'bg-warning/12 text-warning-strong',
    badgeClass: 'bg-warning/12 text-warning-strong',
    accentClass: 'bg-warning',
    headlineClass: 'text-ink',
  },
  low: {
    icon: ShieldCheck,
    iconClass: 'bg-success/10 text-success',
    badgeClass: 'bg-success/10 text-success',
    accentClass: 'bg-success',
    headlineClass: 'text-ink',
  },
  uncertain: {
    icon: ShieldQuestionMark,
    iconClass: 'bg-muted text-ink-muted',
    badgeClass: 'bg-muted text-ink',
    accentClass: 'bg-ink-muted',
    headlineClass: 'text-ink',
  },
  insufficient: {
    icon: ShieldEllipsis,
    iconClass: 'bg-muted text-ink-muted',
    badgeClass: 'bg-muted text-ink',
    accentClass: 'bg-ink-muted',
    headlineClass: 'text-ink',
  },
};

export const engineRiskStyles: Record<EngineRiskKind, { icon: LucideIcon; className: string }> = {
  high: { icon: OctagonExclamationPoint, className: 'bg-danger/10 text-danger' },
  medium: { icon: TriangleExclamationPoint, className: 'bg-warning/12 text-warning-strong' },
  low: { icon: CircleCheck, className: 'bg-success/10 text-success' },
  uncertain: { icon: CircleQuestionMark, className: 'bg-muted text-ink' },
};

interface ProvenanceStyle {
  label: string;
  /** One-line meaning shown in legends and tooltips. */
  meaning: string;
  icon: LucideIcon;
  className: string;
}

export const provenanceStyles: Record<ProvenanceKind, ProvenanceStyle> = {
  verified: {
    label: 'Verified',
    meaning: 'Formally corroborated evidence.',
    icon: BadgeCheck,
    className: 'border-danger/30 bg-danger/10 text-danger',
  },
  reported: {
    label: 'Reported · unconfirmed',
    meaning: 'An unconfirmed report or allegation. Not proof of fraud.',
    icon: Flag,
    className: 'border-warning/40 bg-warning/12 text-warning-strong',
  },
  inferred: {
    label: 'Inferred · not proof',
    meaning: 'A link derived from shared identifiers or network proximity. Not proof of fraud.',
    icon: Waypoints,
    className: 'border-dashed border-ink-muted/50 bg-surface text-ink-muted',
  },
  extracted: {
    label: 'From your message',
    meaning: 'Text found in the message you provided.',
    icon: MessageSquareText,
    className: 'border-line bg-muted text-ink-muted',
  },
  statistical: {
    label: 'Statistical',
    meaning: 'Derived from comparing payment history.',
    icon: ChartNoAxesColumn,
    className: 'border-line bg-muted text-ink-muted',
  },
  unknown: {
    label: 'Unclassified',
    meaning: 'The evidence category was not specified.',
    icon: CircleQuestionMark,
    className: 'border-line bg-muted text-ink-muted',
  },
};
