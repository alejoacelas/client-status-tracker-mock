// Dates are stored as ISO day strings ("2026-10-08") and handled as whole UTC
// day numbers so time zones never shift a bar by a day.

const DAY_MS = 86400000

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3))
export const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function toDay(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS)
}

export function toIso(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10)
}

export function parts(day: number) {
  const d = new Date(day * DAY_MS)
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), wd: d.getUTCDay() }
}

export function dayOf(y: number, m: number, d = 1): number {
  return Math.round(Date.UTC(y, m, d) / DAY_MS)
}

/** "Mon, Oct 12" or "Mon, Oct 12 2026" */
export function fmtWeekday(day: number, withYear = false): string {
  const p = parts(day)
  return `${WEEKDAYS_SHORT[p.wd]}, ${MONTHS_SHORT[p.m]} ${p.d}${withYear ? ' ' + p.y : ''}`
}

/** "Oct 12, 2026" */
export function fmtShort(day: number): string {
  const p = parts(day)
  return `${MONTHS_SHORT[p.m]} ${p.d}, ${p.y}`
}

export function fmtIsoShort(iso?: string | null): string {
  return iso ? fmtShort(toDay(iso)) : ''
}

/** Range label used on group pills and drag tooltips: "Fri, Mar 22 - Sun, Sep 7 2025". */
export function fmtRange(start: number, end: number, today: number): string {
  const ps = parts(start)
  const pe = parts(end)
  const ty = parts(today).y
  if (start === end) return fmtWeekday(start, ps.y !== ty)
  const showYear = ps.y !== pe.y || pe.y !== ty
  return `${fmtWeekday(start, ps.y !== pe.y)} - ${fmtWeekday(end, showYear)}`
}

export function addDays(iso: string, n: number): string {
  return toIso(toDay(iso) + n)
}
