import React, { useState, useEffect } from 'react';
import { fetchHealth, API_BASE_URL } from '../services/api';
import type { HealthState, PhaseInfo } from '../types';

export const LandingPage: React.FC = () => {
  // Starts in 'loading' because the initial probe runs on mount.
  const [health, setHealth] = useState<HealthState>({ status: 'loading' });

  const probeBackendHealth = async (): Promise<HealthState> => {
    try {
      const data = await fetchHealth();
      return { status: 'healthy', service: data.service, lastChecked: new Date().toLocaleTimeString() };
    } catch (err: unknown) {
      return {
        status: 'unreachable',
        lastChecked: new Date().toLocaleTimeString(),
        errorMessage: err instanceof Error ? err.message : 'Backend unreachable',
      };
    }
  };

  const checkBackendHealth = async () => {
    setHealth({ status: 'loading' });
    setHealth(await probeBackendHealth());
  };

  useEffect(() => {
    let active = true;
    probeBackendHealth().then((result) => {
      if (active) setHealth(result);
    });
    return () => {
      active = false;
    };
  }, []);

  const phases: PhaseInfo[] = [
    {
      phase: 1,
      name: 'Architecture & Foundation',
      status: 'completed',
      description: 'Project topology, React/Vite/Tailwind setup, FastAPI core, CORS, and health check validation.',
    },
    {
      phase: 2,
      name: 'Intent & Scam Detection Engine',
      status: 'planned',
      description: 'Semantic intent scoring, urgency analysis, coercion heuristics, and composite risk assessment API.',
    },
    {
      phase: 3,
      name: 'Real-Time Payment Intervention',
      status: 'planned',
      description: 'Dynamic cognitive friction challenges, cooling-off modal flows, and interactive scam simulator.',
    },
    {
      phase: 4,
      name: 'Persistence & Compliance Audit',
      status: 'planned',
      description: 'PostgreSQL async storage, simulated transaction ledger, and immutable intervention audit trail.',
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-6 pb-2">
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/60 text-cyan-400 border border-cyan-800/60 mb-2">
          <span>Visionet Talent Quest 2026 – Techthon Prototype</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto">
          Intent-Aware Real-Time{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">
            Scam Prevention
          </span>
        </h1>

        <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          PAYGUARD AI analyzes the psychological and semantic intent behind payment requests
          to stop Authorized Push Payment (APP) scams and coercion before funds leave the account.
        </p>

        {/* Phase 1 Status Banner */}
        <div className="max-w-xl mx-auto p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
              Current Implementation Status
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">
              Phase 1 Active
            </span>
          </div>
          <p className="text-sm text-slate-300">
            Application foundation and environment setup complete. Core fraud detection engine, database, and payment simulation modules will be introduced in subsequent phases per roadmap.
          </p>
        </div>
      </section>

      {/* Backend Health Check Widget */}
      <section className="max-w-2xl mx-auto p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-white">System Diagnostics</h2>
            <p className="text-xs text-slate-400">Verifying API communication with FastAPI backend</p>
          </div>
          <button
            onClick={checkBackendHealth}
            disabled={health.status === 'loading'}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer disabled:opacity-50"
          >
            {health.status === 'loading' ? 'Checking...' : 'Refresh Status'}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <span className="text-xs text-slate-400 block mb-1">Backend Endpoint</span>
            <span className="text-xs font-mono text-cyan-400 break-all">{API_BASE_URL}/health</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <span className="text-xs text-slate-400 block mb-1">Connection State</span>
            {health.status === 'healthy' && (
              <span className="inline-flex items-center text-xs font-semibold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2"></span>
                Connected ({health.service})
              </span>
            )}
            {health.status === 'loading' && (
              <span className="inline-flex items-center text-xs font-semibold text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 mr-2 animate-ping"></span>
                Probing Backend...
              </span>
            )}
            {health.status === 'unreachable' && (
              <span className="inline-flex items-center text-xs font-semibold text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-400 mr-2"></span>
                Offline (Start backend at :8000)
              </span>
            )}
            {health.status === 'idle' && (
              <span className="text-xs text-slate-400">Ready</span>
            )}
          </div>
        </div>

        {health.lastChecked && (
          <p className="text-[11px] text-slate-400 mt-3 text-right">
            Last diagnostic probe: {health.lastChecked}
          </p>
        )}
      </section>

      {/* Roadmap Architecture Cards */}
      <section className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white tracking-tight">Structured Development Roadmap</h2>
          <p className="text-xs text-slate-400 mt-1">Modular staging for the Visionet Talent Quest prototype</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {phases.map((p) => (
            <div
              key={p.phase}
              className={`p-5 rounded-xl border transition ${
                p.status === 'completed'
                  ? 'bg-slate-900/70 border-cyan-500/30'
                  : 'bg-slate-900/30 border-slate-800/70 opacity-80'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold text-cyan-400">
                  PHASE 0{p.phase}
                </span>
                <span
                  className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                    p.status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {p.status}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">{p.name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
