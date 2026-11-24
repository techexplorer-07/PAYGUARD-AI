import { CircleSlash, CloudOff, FlaskConical, LoaderCircle } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import type { VerdictKind } from '../../types/assessment';
import { verdictStyles } from '../customer/assessment/assessmentUi';
import { verdictLabels } from '../../utils/investigator/records';
import { panelClass, verdictChipStyles } from './investigatorUi';

export function Panel({ className = '', ...rest }: ComponentProps<'section'>) {
  return <section className={`${panelClass} ${className}`} {...rest} />;
}

interface PanelHeaderProps {
  id?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}

export function PanelHeader({ id, title, description, actions }: PanelHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
      <div className="min-w-0">
        <h2 id={id} className="text-sm font-semibold text-ink">
          {title}
        </h2>
        {description && <p className="mt-0.5 text-xs leading-5 text-ink-muted">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm leading-6 text-ink-muted">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export function VerdictBadge({ verdict }: { verdict: VerdictKind }) {
  const Icon = verdictStyles[verdict].icon;
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold ${verdictChipStyles[verdict]}`}>
      <Icon className="size-3.5" aria-hidden="true" strokeWidth={2.25} />
      {verdictLabels[verdict]}
    </span>
  );
}

export function DemoTag() {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-primary/30 bg-primary/5 px-1.5 py-0.5 text-xs font-medium text-primary">
      <FlaskConical className="size-3.5" aria-hidden="true" />
      Demo
    </span>
  );
}

interface StateProps {
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}

export function InvestigatorEmptyState({ title, children, actions }: StateProps) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-muted text-ink-muted">
        <CircleSlash className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-3 text-sm font-semibold text-ink">{title}</p>
      {children && <div className="mt-1 max-w-md text-sm leading-6 text-ink-muted">{children}</div>}
      {actions && <div className="mt-4 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}

export function InvestigatorLoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-ink-muted">
      <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}

export function InvestigatorErrorState({ title, children, actions }: StateProps) {
  return (
    <div role="alert" className="flex flex-col items-center px-6 py-12 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-danger/10 text-danger">
        <CloudOff className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-3 text-sm font-semibold text-ink">{title}</p>
      {children && <div className="mt-1 max-w-md text-sm leading-6 text-ink-muted">{children}</div>}
      {actions && <div className="mt-4 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}
