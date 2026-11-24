import { FlaskConical } from 'lucide-react';
import type { ComponentProps } from 'react';
import type { RiskLevel } from '../../types/customer';
import { riskPresentation } from './customerUi';

export function Card({ className = '', ...rest }: ComponentProps<'section'>) {
  return (
    <section
      className={`rounded-xl border border-line bg-surface shadow-card ${className}`}
      {...rest}
    />
  );
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const { label, icon: Icon, badgeClass } = riskPresentation[level];
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold ${badgeClass}`}
    >
      <Icon className="size-3.5" aria-hidden="true" strokeWidth={2.25} />
      {label}
    </span>
  );
}

export function Avatar({ initials, size = 'sm' }: { initials: string; size?: 'sm' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'size-14 text-lg' : 'size-8 text-sm';
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary ${sizeClass}`}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

export function DemoDataTag({ label = 'Demo data' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-line bg-muted px-2 py-0.5 text-xs font-medium text-ink-muted">
      <FlaskConical className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
