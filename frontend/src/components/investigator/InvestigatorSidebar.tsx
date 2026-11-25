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
    <div className="flex h-full flex-col bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-line px-5 py-4">
        <Link to="/investigator/overview" onClick={onNavigate} className="group flex min-w-0 items-center gap-2.5 rounded-lg">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-tr from-sky-600 to-cyan-500 text-white shadow-xs group-hover:scale-105 transition-transform duration-150">
            <ShieldCheck className="size-5" aria-hidden="true" strokeWidth={2.25} />
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-bold leading-5 tracking-tight text-ink">
              PAYGUARD <span className="font-semibold text-primary">AI</span>
            </span>
            <span className="block text-xs font-semibold text-sky-700">Fraud Intelligence Centre</span>
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

      <nav aria-label="Investigator" className="flex-1 overflow-y-auto px-3.5 py-4">
        <ul className="space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `group flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-sky-50 text-sky-800 shadow-2xs border border-sky-200/80'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                  }`
                }
              >
                <Icon className="size-4.5 shrink-0 transition-colors" aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-3 border-t border-line px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 ring-1 ring-slate-900/5">
            <UserCog className="size-4.5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Prototype analyst</p>
            <p className="text-xs text-ink-muted">Fraud Intelligence Workspace</p>
          </div>
        </div>
        <Link
          to="/"
          onClick={onNavigate}
          className="inline-flex items-center gap-1.5 rounded-md text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Return to Customer App
        </Link>
      </div>
    </div>
  );
}
