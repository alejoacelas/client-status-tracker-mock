import { TODAY } from '../data/mock';

export const parse = (iso: string) => new Date(iso + 'T00:00:00');
export const toIso = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
export const today = () => parse(TODAY);
export const addDays = (iso: string, n: number) => {
  const d = parse(iso);
  d.setDate(d.getDate() + n);
  return toIso(d);
};
export const diffDays = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const monthShort = (i: number) => MONTHS[i];

/** Asana-style short date: "Today", "Tomorrow", "Yesterday", "27 Aug", "22 Oct, 2025". */
export function fmtDate(iso: string | null | undefined, opts: { relative?: boolean } = {}) {
  if (!iso) return '';
  const rel = opts.relative !== false;
  const delta = diffDays(TODAY, iso);
  if (rel) {
    if (delta === 0) return 'Today';
    if (delta === 1) return 'Tomorrow';
    if (delta === -1) return 'Yesterday';
  }
  const d = parse(iso);
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return d.getFullYear() === today().getFullYear() ? base : `${base}, ${d.getFullYear()}`;
}

export function fmtRange(start: string | null, due: string | null) {
  if (start && due) return `${fmtDate(start)} – ${fmtDate(due)}`;
  if (due) return fmtDate(due);
  if (start) return `${fmtDate(start)} –`;
  return '';
}

/** "3 days ago" style used next to status chips for recent updates. */
export function fmtAgo(iso: string) {
  const delta = diffDays(iso, TODAY);
  if (delta === 0) return 'Today';
  if (delta === 1) return 'Yesterday';
  if (delta < 7) return `${delta} days ago`;
  return fmtDate(iso);
}

export function fmtLong(iso: string) {
  const d = parse(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
}

export const isOverdue = (iso: string | null) => !!iso && diffDays(TODAY, iso) < 0;
