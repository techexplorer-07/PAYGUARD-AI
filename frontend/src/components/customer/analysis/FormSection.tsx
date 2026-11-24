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
    <Card aria-labelledby={headingId} className="p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
          aria-hidden="true"
        >
          {step}
        </span>
        <div className="min-w-0">
          <h2 id={headingId} className="text-base font-semibold text-ink">
            {title}
          </h2>
          <p className="mt-0.5 text-sm text-ink-muted">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </Card>
  );
}
