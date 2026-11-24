import { FileSearch, FileExclamationPoint } from 'lucide-react';
import { Link } from 'react-router';
import { Card } from '../CustomerPrimitives';
import { primaryButtonClass, secondaryButtonClass } from '../customerUi';

type PanelKind = 'missing' | 'unexpected';

const copy: Record<PanelKind, { title: string; body: string; icon: typeof FileSearch }> = {
  missing: {
    title: 'Assessment details are unavailable.',
    body: 'Please submit a new payment assessment.',
    icon: FileSearch,
  },
  unexpected: {
    title: 'This assessment could not be displayed',
    body: 'The assessment data was not in the expected format, so PAYGUARD is not showing a result. Please submit a new payment assessment.',
    icon: FileExclamationPoint,
  },
};

/** Recovery state for missing or malformed assessment data. Never shows a fabricated result. */
export function AssessmentStatePanel({ kind }: { kind: PanelKind }) {
  const { title, body, icon: Icon } = copy[kind];
  return (
    <Card className="mx-auto max-w-xl p-6 text-center sm:p-10">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-ink-muted">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-lg font-semibold text-ink">{title}</h1>
      <p className="mt-1.5 text-sm leading-6 text-ink-muted">{body}</p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link to="/analyse" className={primaryButtonClass}>
          Analyse a payment
        </Link>
        <Link to="/" className={secondaryButtonClass}>
          Back to dashboard
        </Link>
      </div>
    </Card>
  );
}
