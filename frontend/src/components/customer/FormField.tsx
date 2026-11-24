import { CircleExclamationPoint } from 'lucide-react';
import type { ReactNode } from 'react';

export interface FieldControlProps {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
}

interface FormFieldProps {
  id: string;
  label: string;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
  /** Rendered at the right of the label row, e.g. a Clear button. */
  labelAction?: ReactNode;
  /** Rendered at the right of the message row, e.g. a character counter. */
  meta?: ReactNode;
  metaId?: string;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
}

/**
 * Label, hint, control and error message wired together with matching ids so
 * assistive technology announces the hint and any error with the control.
 */
export function FormField({
  id,
  label,
  optional = false,
  hint,
  error,
  labelAction,
  meta,
  metaId,
  className = '',
  children,
}: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId, metaId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <div className="flex items-end justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
          {optional && <span className="ml-1.5 font-normal text-ink-muted">(optional)</span>}
        </label>
        {labelAction}
      </div>
      {hint && (
        <p id={hintId} className="mt-1 text-sm leading-5 text-ink-muted">
          {hint}
        </p>
      )}
      <div className="mt-2">
        {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      </div>
      {(error || meta) && (
        <div className="mt-1.5 flex items-start justify-between gap-3">
          {error ? (
            <p id={errorId} className="flex gap-1.5 text-sm text-danger">
              <CircleExclamationPoint className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          ) : (
            <span />
          )}
          {meta}
        </div>
      )}
    </div>
  );
}
