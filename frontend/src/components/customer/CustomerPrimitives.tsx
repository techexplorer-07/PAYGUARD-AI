import { FlaskConical } from 'lucide-react';
import type { ComponentProps } from 'react';
import type { RiskLevel } from '../../types/customer';
import { riskPresentation } from './customerUi';

export function Card({ className = '', ...rest }: ComponentProps<'section'>) {
  return (
    <section
      className={`glass-panel rounded-2xl transition-all duration-200 ${className}`}
      {...rest}
    />
  );
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const { label, icon: Icon, badgeClass } = riskPresentation[level];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-2xs ${badgeClass}`}
    >
      <Icon className="size-3.5" aria-hidden="true" strokeWidth={2.25} />
      {label}
    </span>
  );
}

export function Avatar({ initials, size = 'sm' }: { initials: string; size?: 'sm' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'size-14 text-lg' : 'size-8 text-xs';
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-linear-to-tr from-sky-50 to-sky-100 font-semibold text-sky-800 ring-1 ring-sky-200/80 ${sizeClass}`}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

export function DemoDataTag({ label = 'Demo data' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-200/90 bg-slate-50/80 px-2 py-0.5 text-xs font-medium text-slate-500 shadow-2xs">
      <FlaskConical className="size-3.5 text-slate-400" aria-hidden="true" />
      {label}
    </span>
  );
}
