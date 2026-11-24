import { Outlet, ScrollRestoration } from 'react-router';
import { CustomerBottomNav } from '../components/customer/CustomerBottomNav';
import { CustomerHeader } from '../components/customer/CustomerHeader';

export function CustomerLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
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
