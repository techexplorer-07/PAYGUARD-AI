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
    <Card aria-labelledby="safety-heading" className="p-5 sm:p-6">
      <h2 id="safety-heading" className="text-base font-semibold text-ink">
        Stay one step ahead of scams
      </h2>
      <ul className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
        {tips.map((tip) => {
          const Icon = tipIcons[tip.id] ?? UserCheck;
          return (
            <li key={tip.id} className="flex gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{tip.title}</p>
                <p className="mt-0.5 text-sm leading-5 text-ink-muted">{tip.body}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
