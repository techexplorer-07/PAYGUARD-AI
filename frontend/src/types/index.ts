/**
 * Core type definitions for PAYGUARD AI frontend.
 */

export interface HealthResponse {
  status: string;
  service: string;
}

export interface HealthState {
  status: 'idle' | 'loading' | 'healthy' | 'unreachable';
  service?: string;
  lastChecked?: string;
  errorMessage?: string;
}

export interface PhaseInfo {
  phase: number;
  name: string;
  status: 'completed' | 'in-progress' | 'planned';
  description: string;
}
