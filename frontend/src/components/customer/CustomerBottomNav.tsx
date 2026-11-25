import { NavLink } from 'react-router';
import { customerNavItems } from './customerUi';

export function CustomerBottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-surface/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden shadow-lg"
    >
      <ul className="grid grid-cols-4">
        {customerNavItems.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition-all ${
                  isActive ? 'text-primary font-semibold' : 'text-ink-muted hover:text-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`absolute inset-x-5 top-0 h-0.75 rounded-b-full transition-all ${isActive ? 'bg-primary' : 'bg-transparent'}`}
                    aria-hidden="true"
                  />
                  <span className={`flex size-8 items-center justify-center rounded-xl transition-colors ${isActive ? 'bg-primary/10' : ''}`}>
                    <Icon className="size-5" aria-hidden="true" strokeWidth={isActive ? 2.25 : 1.75} />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
