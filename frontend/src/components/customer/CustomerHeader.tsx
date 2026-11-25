import { useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router';
import { Bell, ChevronDown, MonitorCog, ReceiptText, ShieldCheck, UserRound } from 'lucide-react';
import { demoCustomer, demoNotifications } from '../../data/customerDemoData';
import { useDismiss } from '../../hooks/useDismiss';
import { Avatar } from './CustomerPrimitives';
import { customerNavItems } from './customerUi';

export function CustomerHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-surface/90 backdrop-blur-md transition-shadow">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <BrandLink />

        <nav aria-label="Primary" className="hidden h-full md:flex">
          <ul className="flex h-full items-stretch gap-1">
            {customerNavItems.map((item) => (
              <li key={item.to} className="flex">
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `-mb-px flex items-center border-b-2 px-3 text-sm transition-colors ${
                      isActive
                        ? 'border-primary text-primary font-semibold'
                        : 'border-transparent text-ink-muted hover:text-ink hover:border-slate-300 font-medium'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
          <NotificationsMenu />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}

function BrandLink() {
  return (
    <Link to="/" className="group flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20" aria-label="PAYGUARD AI home">
      <span className="flex size-9 items-center justify-center rounded-xl bg-linear-to-tr from-sky-600 to-cyan-500 text-white shadow-xs transition-transform duration-150 group-hover:scale-105">
        <ShieldCheck className="size-5" aria-hidden="true" strokeWidth={2.25} />
      </span>
      <span className="text-[17px] font-bold tracking-tight text-ink">
        PAYGUARD <span className="font-semibold text-primary">AI</span>
      </span>
    </Link>
  );
}

interface HeaderDropdownProps {
  /** Accessible label for the trigger button. */
  label: string;
  trigger: ReactNode;
  triggerClassName: string;
  panelClassName?: string;
  children: (close: () => void) => ReactNode;
}

/**
 * Disclosure-style dropdown: a trigger button that toggles a panel.
 * Closes on outside click, on Escape (returning focus to the trigger) and
 * whenever a child calls `close`.
 */
function HeaderDropdown({ label, trigger, triggerClassName, panelClassName = '', children }: HeaderDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const close = () => setOpen(false);

  useDismiss(containerRef, open, (reason) => {
    setOpen(false);
    if (reason === 'escape') triggerRef.current?.focus();
  });

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open && (
        <div
          id={panelId}
          className={`fixed inset-x-4 top-[4.5rem] z-50 rounded-2xl border border-slate-200/90 bg-surface shadow-popover ring-1 ring-slate-900/5 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2.5 ${panelClassName}`}
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}

function NotificationsMenu() {
  const [hasUnread, setHasUnread] = useState(true);
  const unreadCount = hasUnread ? demoNotifications.length : 0;

  return (
    <HeaderDropdown
      label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      triggerClassName="relative flex size-10 cursor-pointer items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-muted hover:text-ink"
      panelClassName="sm:w-96"
      trigger={
        <>
          <Bell className="size-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-4 text-white ring-2 ring-surface">
              {unreadCount}
            </span>
          )}
        </>
      }
    >
      {() => (
        <div role="region" aria-label="Notifications">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Notifications</h2>
            <button
              type="button"
              onClick={() => setHasUnread(false)}
              disabled={!hasUnread}
              className="cursor-pointer rounded text-xs font-medium text-primary hover:text-primary-hover disabled:cursor-default disabled:text-ink-muted"
            >
              {hasUnread ? 'Mark all as read' : 'All caught up'}
            </button>
          </div>
          <ul className="max-h-[60vh] divide-y divide-line overflow-y-auto">
            {demoNotifications.map((note) => (
              <li key={note.id} className="flex gap-3 px-4 py-3">
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${hasUnread ? 'bg-primary' : 'bg-transparent'}`}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">
                    {note.title}
                    {hasUnread && <span className="sr-only"> (unread)</span>}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-muted">{note.body}</p>
                  <p className="mt-1 text-xs text-ink-muted">{note.timeLabel}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="border-t border-line bg-muted/60 px-4 py-2.5 text-xs text-ink-muted rounded-b-xl">
            Notifications in this prototype are illustrative samples.
          </p>
        </div>
      )}
    </HeaderDropdown>
  );
}

const profileLinks = [
  { to: '/profile', label: 'Your profile', icon: UserRound },
  { to: '/activity', label: 'Activity', icon: ReceiptText },
  { to: '/system', label: 'System diagnostics', icon: MonitorCog },
];

function ProfileMenu() {
  return (
    <HeaderDropdown
      label={`Account menu for ${demoCustomer.displayName}`}
      triggerClassName="flex h-10 cursor-pointer items-center gap-2 rounded-full p-1 transition-colors hover:bg-muted sm:pr-2.5 md:pr-1 lg:pr-2.5"
      panelClassName="sm:w-64"
      trigger={
        <>
          <Avatar initials={demoCustomer.initials} />
          <span className="hidden text-sm font-medium text-ink sm:inline md:hidden lg:inline">{demoCustomer.displayName}</span>
          <ChevronDown className="hidden size-4 text-ink-muted sm:block md:hidden lg:block" aria-hidden="true" />
        </>
      }
    >
      {(close) => (
        <nav aria-label="Account">
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <Avatar initials={demoCustomer.initials} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{demoCustomer.displayName}</p>
              <p className="text-xs text-ink-muted">Demo profile</p>
            </div>
          </div>
          <ul className="py-1.5">
            {profileLinks.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  onClick={close}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink transition-colors hover:bg-muted"
                >
                  <Icon className="size-4 text-ink-muted" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </HeaderDropdown>
  );
}
