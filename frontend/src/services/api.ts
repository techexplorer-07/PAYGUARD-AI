/**
 * API service layer for PAYGUARD AI backend communication.
 */
import type { HealthResponse } from '../types';

// Deployed builds set VITE_API_BASE_URL (see docs/DEPLOYMENT.md); local development falls back to the default backend port.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: Failed to reach health endpoint`);
  }

  const data: HealthResponse = await response.json();
  return data;
}

export { API_BASE_URL };
