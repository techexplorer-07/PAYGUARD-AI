import { Outlet, ScrollRestoration } from 'react-router';
import { CustomerBottomNav } from '../components/customer/CustomerBottomNav';
import { CustomerHeader } from '../components/customer/CustomerHeader';

export function CustomerLayout() {
  return (
    <div className="relative flex min-h-screen flex-col bg-canvas text-ink">
      {/* Option A: Atmospheric ambient lighting mesh */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(2,132,199,0.12),rgba(255,255,255,0))] blur-2xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed -bottom-40 -right-40 -z-10 size-96 rounded-full bg-linear-to-tr from-sky-400/10 to-indigo-500/10 blur-3xl"
        aria-hidden="true"
      />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-popover"
      >
        Skip to content
      </a>
      <CustomerHeader />
      <main
        id="main-content"
        className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-28 sm:px-6 sm:pt-8 md:pb-12 lg:px-8"
      >
        <Outlet />
      </main>
      <CustomerBottomNav />
      <ScrollRestoration />
    </div>
  );
}
