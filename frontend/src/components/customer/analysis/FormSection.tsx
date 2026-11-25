import type { ReactNode } from 'react';
import { Card } from '../CustomerPrimitives';

interface FormSectionProps {
  id: string;
  step: number;
  title: string;
  description: string;
  children: ReactNode;
}

/** A numbered card grouping related form controls under a heading. */
export function FormSection({ id, step, title, description, children }: FormSectionProps) {
  const headingId = `${id}-heading`;
  return (
    <Card aria-labelledby={headingId} className="p-5 sm:p-7 bg-surface shadow-xs">
      <div className="flex items-start gap-3.5">
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-linear-to-tr from-sky-600 to-cyan-500 text-xs font-bold text-white shadow-2xs"
          aria-hidden="true"
        >
          {step}
        </span>
        <div className="min-w-0">
          <h2 id={headingId} className="text-base font-bold tracking-tight text-ink sm:text-lg">
            {title}
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-ink-muted">{description}</p>
        </div>
      </div>
      <div className="mt-5 sm:mt-6">{children}</div>
    </Card>
  );
}
