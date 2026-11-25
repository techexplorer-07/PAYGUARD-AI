import { Ban, KeyRound, PhoneCall, UserCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SafetyTip } from '../../types/customer';
import { Card } from './CustomerPrimitives';

const tipIcons: Record<string, LucideIcon> = {
  'tip-pin': KeyRound,
  'tip-urgent': PhoneCall,
  'tip-recipient': UserCheck,
  'tip-threats': Ban,
};

export function SafetyGuidance({ tips }: { tips: SafetyTip[] }) {
  return (
    <Card aria-labelledby="safety-heading" className="p-5 sm:p-6 bg-surface">
      <div className="flex items-center justify-between border-b border-line pb-3.5">
        <div>
          <h2 id="safety-heading" className="text-base font-bold tracking-tight text-ink">
            Payment Security Best Practices
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">Guarding against social engineering and authorized push payment fraud</p>
        </div>
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tips.map((tip) => {
          const Icon = tipIcons[tip.id] ?? UserCheck;
          return (
            <li key={tip.id} className="flex gap-3.5 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 transition-colors hover:bg-slate-50 hover:border-slate-200">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-sky-700 shadow-2xs border border-slate-200/60">
                <Icon className="size-4.5" aria-hidden="true" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{tip.title}</p>
                <p className="mt-1 text-xs leading-5 text-ink-muted">{tip.body}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
