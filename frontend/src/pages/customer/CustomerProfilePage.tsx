import { ChevronRight, MonitorCog, ReceiptText, ScanEye } from 'lucide-react';
import { Link } from 'react-router';
import { Avatar, Card, DemoDataTag } from '../../components/customer/CustomerPrimitives';
import { AlertSoundToggle } from '../../components/customer/assessment/AlertSoundControls';
import { demoCustomer } from '../../data/customerDemoData';

const links = [
  { to: '/activity', label: 'Activity', description: 'Payments you have submitted for assessment', icon: ReceiptText },
  { to: '/system', label: 'System diagnostics', description: 'Check the connection to the PAYGUARD service', icon: MonitorCog },
  { to: '/investigator', label: 'Fraud Intelligence Centre', description: 'Investigator workspace prototype (no access control)', icon: ScanEye },
];

export function CustomerProfilePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Profile</h1>

      <Card className="flex items-center gap-4 p-5 sm:p-6">
        <Avatar initials={demoCustomer.initials} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-ink">{demoCustomer.displayName}</p>
          <div className="mt-1">
            <DemoDataTag label="Demo profile" />
          </div>
        </div>
      </Card>

      <p className="text-sm leading-6 text-ink-muted">
        This prototype uses a sample profile. No personal, bank or contact details are collected or
        stored.
      </p>

      <Card aria-labelledby="alert-sound-heading" className="p-5 sm:p-6">
        <h2 id="alert-sound-heading" className="text-base font-semibold text-ink">
          Alert sounds
        </h2>
        <p className="mt-0.5 mb-4 text-sm leading-5 text-ink-muted">
          Play a short warning sound when a new assessment finds high risk. Only this setting is
          saved on this device.
        </p>
        <AlertSoundToggle showTest />
      </Card>

      <Card aria-label="More">
        <ul className="divide-y divide-line">
          {links.map(({ to, label, description, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/60 focus-visible:-outline-offset-2 sm:px-6"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-ink-muted">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink">{label}</span>
                  <span className="block text-sm text-ink-muted">{description}</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
