/**
 * Shared, non-component UI configuration for the customer area:
 * navigation destinations, risk presentation and button styles.
 */
import {
  CircleCheck,
  House,
  OctagonExclamationPoint,
  ReceiptText,
  ScanSearch,
  TriangleExclamationPoint,
  UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { RiskLevel } from '../../types/customer';

export interface CustomerNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Only mark active on an exact path match. */
  end?: boolean;
}

export const customerNavItems: CustomerNavItem[] = [
  { to: '/', label: 'Dashboard', icon: House, end: true },
  { to: '/analyse', label: 'Analyse', icon: ScanSearch },
  { to: '/activity', label: 'Activity', icon: ReceiptText },
  { to: '/profile', label: 'Profile', icon: UserRound },
];

export const riskLevels: RiskLevel[] = ['low', 'medium', 'high'];

interface RiskPresentation {
  label: string;
  icon: LucideIcon;
  /** Badge colours: tinted background with an AA-contrast text colour. */
  badgeClass: string;
  /** Solid fill used for distribution bars. */
  fillClass: string;
  /** Foreground colour for icons and text on white. */
  textClass: string;
}

export const riskPresentation: Record<RiskLevel, RiskPresentation> = {
  low: {
    label: 'Low risk',
    icon: CircleCheck,
    badgeClass: 'bg-success/10 text-success',
    fillClass: 'bg-success',
    textClass: 'text-success',
  },
  medium: {
    label: 'Medium risk',
    icon: TriangleExclamationPoint,
    badgeClass: 'bg-warning/12 text-warning-strong',
    fillClass: 'bg-warning',
    textClass: 'text-warning-strong',
  },
  high: {
    label: 'High risk',
    icon: OctagonExclamationPoint,
    badgeClass: 'bg-danger/10 text-danger',
    fillClass: 'bg-danger',
    textClass: 'text-danger',
  },
};

const buttonBase =
  'inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50';

export const primaryButtonClass = `${buttonBase} bg-primary text-white hover:bg-primary-hover`;

export const secondaryButtonClass = `${buttonBase} border border-line bg-surface text-ink hover:bg-muted`;

/** Shared text input / select / textarea styling. 16px text prevents iOS zoom on focus. */
export const inputClass =
  'block w-full rounded-lg border border-line bg-surface px-3.5 text-base text-ink placeholder:text-ink-muted transition-colors hover:border-ink-muted/40 focus-visible:border-primary focus-visible:outline-offset-0 aria-invalid:border-danger aria-invalid:focus-visible:border-danger aria-invalid:focus-visible:outline-dangerdisabled:cursor-not-allowed disabled:bg-muted disabled:text-ink-muted';
