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
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    fillClass: 'bg-success',
    textClass: 'text-success',
  },
  medium: {
    label: 'Medium risk',
    icon: TriangleExclamationPoint,
    badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200/80',
    fillClass: 'bg-warning',
    textClass: 'text-warning-strong',
  },
  high: {
    label: 'High risk',
    icon: OctagonExclamationPoint,
    badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200/80',
    fillClass: 'bg-danger',
    textClass: 'text-danger',
  },
};

const buttonBase =
  'inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 select-none';

export const primaryButtonClass = `${buttonBase} bg-primary text-white shadow-sm hover:bg-primary-hover active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-primary/20`;

export const secondaryButtonClass = `${buttonBase} border border-line bg-surface text-ink shadow-sm hover:bg-muted hover:border-slate-300 active:scale-[0.99]`;

/** Shared text input / select / textarea styling. 16px text prevents iOS zoom on focus. */
export const inputClass =
  'block w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-ink-muted/70 transition-all duration-150 shadow-xs hover:border-slate-300 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none aria-invalid:border-danger aria-invalid:focus-visible:border-danger aria-invalid:focus-visible:ring-danger/20 disabled:cursor-not-allowed disabled:bg-muted disabled:text-ink-muted';
