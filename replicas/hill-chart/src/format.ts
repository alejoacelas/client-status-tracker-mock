const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const parse = (iso: string) => {
  // Treat date-only and timezone-less strings as local time.
  const [d, tm = '00:00'] = iso.split('T');
  const [y, m, day] = d.split('-').map(Number);
  const [hh, mm, ss = 0] = tm.split(':').map(Number);
  return new Date(y, m - 1, day, hh, mm, ss);
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const dayDiff = (a: Date, b: Date) => Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86400000);

/** "1:38pm" */
export function clock(d: Date) {
  const h = d.getHours() % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, '0')}${d.getHours() < 12 ? 'am' : 'pm'}`;
}

/** "Sep 6" or "Sep 6, 2025" */
export function shortDate(d: Date, now = new Date()) {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}${d.getFullYear() !== now.getFullYear() ? `, ${d.getFullYear()}` : ''}`;
}

/** Text after "Updated": "a second ago", "Monday at 1:38pm", "on Sep 6". */
export function updatedPhrase(iso: string, now = new Date()) {
  const d = parse(iso);
  const secs = (now.getTime() - d.getTime()) / 1000;
  if (secs < 45) return 'a second ago';
  if (secs < 3600) {
    const m = Math.max(1, Math.round(secs / 60));
    return `${m} minute${m === 1 ? '' : 's'} ago`;
  }
  const diff = dayDiff(now, d);
  if (diff === 0) return `today at ${clock(d)}`;
  if (diff === 1) return `yesterday at ${clock(d)}`;
  if (diff > 1 && diff < 7) return `${DAYS[d.getDay()]} at ${clock(d)}`;
  return `on ${shortDate(d, now)}`;
}

/** "Oct 05, 2026 at 1:38 PM" as on the hill chart history cards */
export function historyStamp(iso: string) {
  const d = parse(iso);
  const h = d.getHours() % 12 || 12;
  return `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()} at ${h}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() < 12 ? 'AM' : 'PM'}`;
}

/** Day heading for history: "Today", "Yesterday", "Monday", "Thursday, Sep 24" */
export function dayHeading(iso: string, now = new Date()) {
  const d = parse(iso);
  const diff = dayDiff(now, d);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff > 1 && diff < 7) return DAYS[d.getDay()];
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}${d.getFullYear() !== now.getFullYear() ? `, ${d.getFullYear()}` : ''}`;
}

export const dayKey = (iso: string) => iso.slice(0, 10);

/** "Fri, Oct 9" */
export function dueLabel(ymd: string) {
  const d = parse(ymd);
  return `${DAYS[d.getDay()].slice(0, 3)}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function monthTitle(d: Date) {
  return `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

export const monthShort = (d: Date) => MONTHS[d.getMonth()];

export function daysSince(iso: string, now = new Date()) {
  return dayDiff(now, parse(iso));
}
