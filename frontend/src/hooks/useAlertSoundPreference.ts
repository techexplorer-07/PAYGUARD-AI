import { useSyncExternalStore } from 'react';

/**
 * The customer's alert-sound preference. Only this on/off flag is stored in
 * localStorage; no assessment, message or payment data is ever persisted.
 */
const STORAGE_KEY = 'payguard.alertSound';
const listeners = new Set<() => void>();

export function isAlertSoundEnabled(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setAlertSoundEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
  } catch {
    // Storage unavailable (private mode, quota): keep the in-memory notification only.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function useAlertSoundPreference(): [boolean, (enabled: boolean) => void] {
  const enabled = useSyncExternalStore(subscribe, isAlertSoundEnabled, () => true);
  return [enabled, setAlertSoundEnabled];
}
