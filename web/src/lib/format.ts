/** Parses a YYYY-MM-DD date as a local calendar date (no timezone shift). */
function parseDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDate(day: string | null, opts: { year?: boolean } = {}): string {
  if (!day) return '—';
  const date = parseDay(day);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: opts.year || !sameYear ? 'numeric' : undefined,
  });
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Whole days from today to the given date (negative when in the past). */
export function daysUntil(day: string): number {
  const today = parseDay(todayISO());
  return Math.round((parseDay(day).getTime() - today.getTime()) / 86_400_000);
}

export function dueLabel(day: string | null): string {
  if (!day) return 'No due date';
  const n = daysUntil(day);
  if (n === 0) return 'Due today';
  if (n === 1) return 'Due tomorrow';
  if (n > 1 && n <= 14) return `Due in ${n} days`;
  if (n < 0) return `${-n} day${n === -1 ? '' : 's'} overdue`;
  return `Due ${formatDate(day)}`;
}

export function relativeTime(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return rtf.format(-Math.round(seconds / size), unit);
  }
  return 'just now';
}

/** Random URL-safe token, 12 characters, for client share links. */
export function newShareToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_');
}

export function statusSlug(status: string): string {
  return status.toLowerCase().replace(/\s+/g, '-');
}
