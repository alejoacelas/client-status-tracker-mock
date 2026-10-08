import { useEffect, useState, useSyncExternalStore } from 'react';

// Ephemeral UI state shared across components (not persisted, except the details pane).
interface UI {
  cmdk: boolean;
  toast: string | null;
  details: boolean;
  sidebarOpen: boolean;
  composeFor: string | null; // project/initiative id whose composer should open
}

const DETAILS_KEY = 'fw-linear-details';
let ui: UI = {
  cmdk: false,
  toast: null,
  details: (() => {
    try {
      return localStorage.getItem(DETAILS_KEY) !== '0';
    } catch {
      return true;
    }
  })(),
  sidebarOpen: false,
  composeFor: null,
};
const ls = new Set<() => void>();
export function setUI(p: Partial<UI>) {
  ui = { ...ui, ...p };
  if (p.details !== undefined) {
    try {
      localStorage.setItem(DETAILS_KEY, p.details ? '1' : '0');
    } catch {
      /* ignore */
    }
  }
  ls.forEach((l) => l());
}
export const getUI = () => ui;
export function useUI<T>(sel: (u: UI) => T): T {
  return useSyncExternalStore(
    (cb) => {
      ls.add(cb);
      return () => ls.delete(cb);
    },
    () => sel(ui),
  );
}

let toastTimer: number | undefined;
export function toast(msg: string) {
  setUI({ toast: msg });
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => setUI({ toast: null }), 2200);
}

// ---- hash router ----
export function useRoute(): string[] {
  const get = () => (window.location.hash.replace(/^#\/?/, '') || '').split('/').filter(Boolean);
  const [r, setR] = useState(get);
  useEffect(() => {
    const on = () => setR(get());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return r;
}
export function go(path: string) {
  window.location.hash = '#/' + path.replace(/^\//, '');
  setUI({ sidebarOpen: false });
}
export const href = (path: string) => '#/' + path.replace(/^\//, '');
