import React, { useState, useEffect } from 'react';
import { fetchHealth, API_BASE_URL } from '../services/api';
import type { HealthState, PhaseInfo } from '../types';
import { Activity, CheckCircle2, ShieldCheck, RefreshCw, Server } from 'lucide-react';

export const LandingPage: React.FC = () => {
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
      name: 'Intent & Behavioural Engine',
      status: 'completed',
      description: 'Linguistic intent extraction, robust z-score baseline scoring, and isolation forest anomaly benchmarks.',
    },
    {
      phase: 3,
      name: 'SPEG Graph & Recipient Risk',
      status: 'completed',
      description: 'MultiDiGraph evidence network, verified/reported trust boundaries, and recipient relationship scoring.',
    },
    {
      phase: 4,
      name: 'Unified Risk & Intervention',
      status: 'completed',
      description: 'Dynamic multi-stream weighted fusion, PAUSE_AND_VERIFY directives, and customer protection UI.',
    },
  ];

  return (
    <div className="space-y-10">
      {/* Hero Header */}
      <section className="text-center space-y-4 pt-4 pb-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          <span>Visionet Talent Quest 2026 – Techthon Prototype</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-ink max-w-3xl mx-auto">
          System Diagnostics &{' '}
          <span className="text-primary">
            Architecture Status
          </span>
        </h1>

        <p className="text-sm sm:text-base text-ink-muted max-w-2xl mx-auto leading-relaxed">
          Verify runtime health, API connectivity, and modular pipeline status for PAYGUARD AI's intent, behavioural, and recipient graph intelligence engines.
        </p>
      </section>

      {/* Backend Health Check Widget */}
      <section className="max-w-2xl mx-auto p-6 rounded-2xl bg-surface border border-slate-200/90 shadow-card">
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <Server className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-bold text-ink">API Gateway Health</h2>
              <p className="text-xs text-ink-muted">Verifying communication with local FastAPI engine</p>
            </div>
          </div>
          <button
            onClick={checkBackendHealth}
            disabled={health.status === 'loading'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${health.status === 'loading' ? 'animate-spin' : ''}`} aria-hidden="true" />
            {health.status === 'loading' ? 'Probing...' : 'Refresh'}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Target Endpoint</span>
            <span className="text-xs font-mono text-slate-800 break-all">{API_BASE_URL}/health</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Connectivity Status</span>
            {health.status === 'healthy' && (
              <span className="inline-flex items-center text-xs font-bold text-emerald-700">
                <CheckCircle2 className="size-4 mr-1.5 text-emerald-600" />
                Online ({health.service})
              </span>
            )}
            {health.status === 'loading' && (
              <span className="inline-flex items-center text-xs font-bold text-amber-700">
                <Activity className="size-4 mr-1.5 text-amber-600 animate-pulse" />
                Probing Gateway...
              </span>
            )}
            {health.status === 'unreachable' && (
              <span className="inline-flex items-center text-xs font-bold text-rose-700">
                <span className="size-2 rounded-full bg-rose-600 mr-2" />
                Offline (:8000 unreachable)
              </span>
            )}
            {health.status === 'idle' && (
              <span className="text-xs text-slate-500">Ready</span>
            )}
          </div>
        </div>

        {health.lastChecked && (
          <p className="text-[11px] text-slate-400 mt-4 text-right">
            Last health probe: {health.lastChecked}
          </p>
        )}
      </section>

      {/* Roadmap Architecture Cards */}
      <section className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-ink tracking-tight">Multi-Engine System Topology</h2>
          <p className="text-xs text-ink-muted mt-1">Modular pipeline progression for Visionet Techthon 2026</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {phases.map((p) => (
            <div
              key={p.phase}
              className="p-5 rounded-2xl border border-slate-200/80 bg-surface shadow-card transition-all hover:shadow-card-hover"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold text-primary">
                  PHASE 0{p.phase}
                </span>
                <span className="inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                  {p.status}
                </span>
              </div>
              <h3 className="text-sm font-bold text-ink mb-1.5">{p.name}</h3>
              <p className="text-xs leading-5 text-ink-muted">{p.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
