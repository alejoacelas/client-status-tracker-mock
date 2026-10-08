// Times in the data are London wall-clock strings ('YYYY-MM-DDTHH:MM').
// They are parsed as if UTC so formatting never depends on the viewer's zone,
// and labelled BST or GMT by date.

import { NOW } from '../data/statusData'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export const MINUTE = 60_000
export const DAY = 86_400_000

export function parse(s: string): number {
  const [d, t = '00:00'] = s.split('T')
  const [y, m, day] = d.split('-').map(Number)
  const [hh, mm] = t.split(':').map(Number)
  return Date.UTC(y, m - 1, day, hh, mm)
}

export const now = parse(NOW)

/** Midnight (as a timestamp) of the day containing t. */
export function dayStart(t: number): number {
  return Math.floor(t / DAY) * DAY
}

export const today = dayStart(now)

function lastSunday(year: number, month: number): number {
  const d = new Date(Date.UTC(year, month + 1, 0))
  d.setUTCDate(d.getUTCDate() - d.getUTCDay())
  return d.getTime()
}

/** UK summer time runs from 01:00 on the last Sunday in March to the last Sunday in October. */
export function tz(t: number): string {
  const y = new Date(t).getUTCFullYear()
  const start = lastSunday(y, 2) + 60 * MINUTE
  const end = lastSunday(y, 9) + 60 * MINUTE
  return t >= start && t < end ? 'BST' : 'GMT'
}

const pad = (n: number) => String(n).padStart(2, '0')

function parts(t: number) {
  const d = new Date(t)
  return {
    y: d.getUTCFullYear(),
    m: d.getUTCMonth(),
    d: d.getUTCDate(),
    time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
  }
}

/** "Oct 7, 13:55 BST" — update timestamps in the past-incidents list. */
export function fmtShort(t: number): string {
  const p = parts(t)
  return `${MONTHS[p.m]} ${p.d}, ${p.time} ${tz(t)}`
}

/** "Oct 07, 2026 - 19:40 BST" — unresolved incidents and incident pages. */
export function fmtLong(t: number): string {
  const p = parts(t)
  return `${MONTHS[p.m]} ${pad(p.d)}, ${p.y} - ${p.time} ${tz(t)}`
}

/** "Sep 15, 2026 - 16:36 BST" — "Posted on" lines of scheduled maintenance. */
export function fmtPosted(t: number): string {
  const p = parts(t)
  return `${MONTHS[p.m]} ${p.d}, ${p.y} - ${p.time} ${tz(t)}`
}

/** "Oct 8, 2026 09:00 - Oct 9, 2026 21:30 BST" — scheduled maintenance windows. */
export function fmtWindow(a: number, b: number): string {
  const pa = parts(a)
  const pb = parts(b)
  const left = `${MONTHS[pa.m]} ${pa.d}, ${pa.y} ${pa.time}`
  const right = `${MONTHS[pb.m]} ${pb.d}, ${pb.y} ${pb.time}`
  if (tz(a) !== tz(b)) return `${left} ${tz(a)} - ${right} ${tz(b)}`
  return `${left} - ${right} ${tz(b)}`
}

/** "Oct 8, 09:00 BST  -  Oct 9, 21:30 BST" — incident page subheader for upcoming maintenance. */
export function fmtWindowShort(a: number, b: number): string {
  const pa = parts(a)
  const pb = parts(b)
  return `${MONTHS[pa.m]} ${pa.d}, ${pa.time} ${tz(a)}  -  ${MONTHS[pb.m]} ${pb.d}, ${pb.time} ${tz(b)}`
}

/** "Oct 1, 12:48 - 13:52 BST" — incident rows on the history page. */
export function fmtRange(a: number, b: number | null): string {
  const pa = parts(a)
  const start = `${MONTHS[pa.m]} ${pa.d}, ${pa.time}`
  if (b === null) return `${start} ${tz(a)} - Ongoing`
  const pb = parts(b)
  const sameDay = dayStart(a) === dayStart(b)
  const end = sameDay ? pb.time : `${MONTHS[pb.m]} ${pb.d}, ${pb.time}`
  return `${start} - ${end} ${tz(b)}`
}

/** "Oct 8, 2026" — day headings. */
export function fmtDay(t: number): string {
  const p = parts(t)
  return `${MONTHS[p.m]} ${p.d}, ${p.y}`
}

/** "4 Aug 2026" — uptime tooltip heading. */
export function fmtTooltipDay(t: number): string {
  const p = parts(t)
  return `${p.d} ${MONTHS[p.m]} ${p.y}`
}

export function monthName(m: number): string {
  return MONTHS_LONG[m]
}

/** Relative time in the style of moment.js "fromNow": "7 days ago", "an hour ago". */
export function ago(t: number): string {
  const s = Math.round((now - t) / 1000)
  const future = s < 0
  const abs = Math.abs(s)
  const min = abs / 60
  const hr = min / 60
  const day = hr / 24
  let txt: string
  if (abs < 45) txt = 'a few seconds'
  else if (abs < 90) txt = 'a minute'
  else if (min < 45) txt = `${Math.round(min)} minutes`
  else if (min < 90) txt = 'an hour'
  else if (hr < 22) txt = `${Math.round(hr)} hours`
  else if (hr < 36) txt = 'a day'
  else if (day < 26) txt = `${Math.round(day)} days`
  else if (day < 46) txt = 'a month'
  else if (day < 320) txt = `${Math.round(day / 30.4)} months`
  else txt = 'a year'
  return future ? `in ${txt}` : `${txt} ago`
}

export function monthKey(t: number): { y: number; m: number } {
  const d = new Date(t)
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() }
}
