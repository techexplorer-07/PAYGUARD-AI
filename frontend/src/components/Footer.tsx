import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950/60 mt-auto py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:flex sm:justify-between sm:items-center">
        <p className="text-xs text-slate-400">
          PAYGUARD AI &mdash; Intent-Aware Real-Time Financial Scam Prevention and Payment Intervention System.
        </p>
        <p className="text-xs text-slate-400 mt-2 sm:mt-0 font-mono">
          Prototype &bull; Visionet Talent Quest 2026 – Techthon
        </p>
      </div>
    </footer>
  );
};
