import React from 'react';
import { Link } from 'react-router';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="border-b border-line bg-surface/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="flex size-9 items-center justify-center rounded-xl bg-linear-to-tr from-sky-600 to-cyan-500 text-white shadow-xs group-hover:scale-105 transition-transform">
              <ShieldCheck className="size-5" aria-hidden="true" strokeWidth={2.25} />
            </span>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-lg font-bold tracking-tight text-ink">PAYGUARD</span>
                <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-ink-muted font-medium uppercase tracking-wider">
                System Diagnostics
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-sky-700 rounded-lg border border-slate-200 bg-surface px-3 py-1.5 shadow-2xs transition-colors"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Customer App
          </Link>
          <Link
            to="/investigator/overview"
            className="hidden sm:inline-flex items-center text-xs font-semibold text-sky-700 hover:text-sky-800 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 shadow-2xs transition-colors"
          >
            Investigator Desk
          </Link>
        </div>
      </div>
    </header>
  );
};
