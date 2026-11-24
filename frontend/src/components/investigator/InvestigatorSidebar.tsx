import { ArrowLeft, ClockFading, FileStack, LayoutDashboard, ShieldCheck, Share2, Siren, UserCog, Users, X } from 'lucide-react';
import { Link, NavLink } from 'react-router';

const navItems = [
  { to: '/investigator/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/investigator/alerts', label: 'Alert queue', icon: Siren },
  { to: '/investigator/assessments', label: 'Assessments', icon: FileStack },
  { to: '/investigator/recipients', label: 'Recipient intelligence', icon: Users },
  { to: '/investigator/graph', label: 'Evidence graph', icon: Share2 },
  { to: '/investigator/history', label: 'Investigation history', icon: ClockFading },
];

interface InvestigatorSidebarProps {
  onNavigate?: () => void;
  onClose?: () => void;
}

export function InvestigatorSidebar({ onNavigate, onClose }: InvestigatorSidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-line px-5 py-4">
        <Link to="/investigator/overview" onClick={onNavigate} className="flex min-w-0 items-center gap-2.5 rounded-md">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
            <ShieldCheck className="size-[18px]" aria-hidden="true" strokeWidth={2.25} />
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-bold leading-5 tracking-tight text-ink">
              PAYGUARD <span className="font-semibold text-primary">AI</span>
            </span>
            <span className="block text-xs font-medium text-ink-muted">Fraud Intelligence Centre</span>
          </span>
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            autoFocus
            className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-ink-muted hover:bg-muted"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <nav aria-label="Investigator" className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-ink-muted hover:bg-muted hover:text-ink'
                  }`
                }
              >
                <Icon className="size-[18px] shrink-0" aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-3 border-t border-line px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-ink-muted">
            <UserCog className="size-[18px]" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">Prototype analyst</p>
            <p className="text-xs text-ink-muted">Not signed in · no roles</p>
          </div>
        </div>
        <Link
          to="/"
          onClick={onNavigate}
          className="inline-flex items-center gap-1.5 rounded text-xs font-medium text-primary hover:text-primary-hover"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Customer app
        </Link>
      </div>
    </div>
  );
}
