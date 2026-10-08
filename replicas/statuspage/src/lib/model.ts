import {
  clients,
  type ClientPage,
  type ComponentStatus,
  type Impact,
  type Incident,
  type IncidentUpdate,
  type StatusComponent,
  type UpdateStatus,
} from '../data/statusData'
import { DAY, MINUTE, dayStart, now, parse, today } from './time'
import { NO_DATA, mix, theme } from './theme'

export function getClient(key: string): ClientPage | undefined {
  return clients.find((c) => c.key === key)
}

// ---------------------------------------------------------------- labels

export const STATUS_LABEL: Record<ComponentStatus, string> = {
  operational: 'Operational',
  degraded_performance: 'Degraded Performance',
  partial_outage: 'Partial Outage',
  major_outage: 'Major Outage',
  under_maintenance: 'Under Maintenance',
}

export const STATUS_COLOR_CLASS: Record<ComponentStatus, string> = {
  operational: 'status-green',
  degraded_performance: 'status-yellow',
  partial_outage: 'status-orange',
  major_outage: 'status-red',
  under_maintenance: 'status-blue',
}

const STATUS_RANK: Record<ComponentStatus, number> = {
  operational: 0,
  under_maintenance: 1,
  degraded_performance: 2,
  partial_outage: 3,
  major_outage: 4,
}

export const UPDATE_LABEL: Record<UpdateStatus, string> = {
  investigating: 'Investigating',
  identified: 'Identified',
  monitoring: 'Monitoring',
  update: 'Update',
  resolved: 'Resolved',
  scheduled: 'Scheduled',
  in_progress: 'In progress',
  verifying: 'Verifying',
  completed: 'Completed',
}

export function worst(statuses: ComponentStatus[]): ComponentStatus {
  return statuses.reduce<ComponentStatus>(
    (w, s) => (STATUS_RANK[s] > STATUS_RANK[w] ? s : w),
    'operational',
  )
}

// ---------------------------------------------------------------- incidents

export function updatesNewestFirst(inc: Incident): IncidentUpdate[] {
  return [...inc.updates].sort((a, b) => parse(b.at) - parse(a.at))
}

export const isMaintenance = (inc: Incident) => inc.impact === 'maintenance'

export type MaintenanceState = 'upcoming' | 'in_progress' | 'completed'

export function maintenanceState(inc: Incident): MaintenanceState {
  if (inc.updates.some((u) => u.status === 'completed')) return 'completed'
  if (inc.updates.some((u) => u.status === 'in_progress' || u.status === 'verifying')) return 'in_progress'
  return 'upcoming'
}

/** When the incident (or the maintenance work) began. */
export function startOf(inc: Incident): number {
  if (isMaintenance(inc)) {
    const ip = inc.updates.find((u) => u.status === 'in_progress')
    if (ip) return parse(ip.at)
    return parse(inc.scheduledFor ?? inc.updates[0].at)
  }
  return Math.min(...inc.updates.map((u) => parse(u.at)))
}

/** When it ended; null while still open. */
export function endOf(inc: Incident): number | null {
  const end = inc.updates.find((u) => u.status === 'resolved' || u.status === 'completed')
  return end ? parse(end.at) : null
}

export function isUnresolved(inc: Incident): boolean {
  if (isMaintenance(inc)) return maintenanceState(inc) === 'in_progress'
  return endOf(inc) === null
}

/** Incidents and maintenance in progress, newest first: the coloured boxes at the top of the page. */
export function activeIncidents(page: ClientPage): Incident[] {
  return page.incidents.filter(isUnresolved).sort((a, b) => startOf(b) - startOf(a))
}

export function upcomingMaintenance(page: ClientPage): Incident[] {
  return page.incidents
    .filter((i) => isMaintenance(i) && maintenanceState(i) === 'upcoming')
    .sort((a, b) => parse(a.scheduledFor!) - parse(b.scheduledFor!))
}

/** Everything except upcoming maintenance, i.e. what appears in incident history. */
export function historyIncidents(page: ClientPage): Incident[] {
  return page.incidents
    .filter((i) => !(isMaintenance(i) && maintenanceState(i) === 'upcoming'))
    .sort((a, b) => startOf(b) - startOf(a))
}

export function incidentsOnDay(page: ClientPage, day: number): Incident[] {
  return historyIncidents(page).filter((i) => dayStart(startOf(i)) === day)
}

export function impactClass(impact: Impact): string {
  return `impact-${impact}`
}

export function affectedNames(page: ClientPage, inc: Incident): string {
  const names = Object.keys(inc.components).map((id) => {
    const c = page.components.find((x) => x.id === id)
    if (!c) return id
    return c.group ? `${c.name} (${c.group})` : c.name
  })
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

// ---------------------------------------------------------------- page status

export interface PageStatus {
  className: string
  text: string
}

export function pageStatus(page: ClientPage): PageStatus {
  const w = worst(page.components.map((c) => c.status))
  switch (w) {
    case 'major_outage':
      return { className: 'status-critical', text: 'Major System Outage' }
    case 'partial_outage':
      return { className: 'status-major', text: 'Partial System Outage' }
    case 'degraded_performance':
      return { className: 'status-minor', text: 'Partially Degraded Service' }
    case 'under_maintenance':
      return { className: 'status-maintenance', text: 'Service Under Maintenance' }
    default:
      return { className: 'status-none', text: 'All Systems Operational' }
  }
}

// ---------------------------------------------------------------- uptime

export interface DayUptime {
  day: number
  hasData: boolean
  major: number
  partial: number
  related: Incident[]
  /** For groups: how many children had each kind of outage. */
  majorCount?: number
  partialCount?: number
}

function overlapMinutes(a0: number, a1: number, b0: number, b1: number): number {
  return Math.max(0, Math.min(a1, b1) - Math.max(a0, b0)) / MINUTE
}

export function componentDay(page: ClientPage, comp: StatusComponent, day: number): DayUptime {
  const hasData = day >= parse(comp.since) && day <= today
  const dayEnd = day + DAY
  let major = 0
  let partial = 0
  const related: Incident[] = []
  for (const inc of page.incidents) {
    const effect = inc.components[comp.id]
    if (!effect) continue
    if (isMaintenance(inc) && maintenanceState(inc) === 'upcoming') continue
    const s = startOf(inc)
    const e = endOf(inc) ?? now
    const mins = overlapMinutes(s, e, day, dayEnd)
    const touches = mins > 0 || (dayStart(s) === day)
    if (!touches) continue
    related.push(inc)
    if (effect === 'major_outage') major += mins
    if (effect === 'partial_outage') partial += mins
  }
  return { day, hasData, major: Math.round(major), partial: Math.round(partial), related }
}

export function groupDay(page: ClientPage, comps: StatusComponent[], day: number): DayUptime {
  const days = comps.map((c) => componentDay(page, c, day))
  const related: Incident[] = []
  for (const d of days) for (const r of d.related) if (!related.includes(r)) related.push(r)
  return {
    day,
    hasData: days.some((d) => d.hasData),
    major: Math.max(0, ...days.map((d) => d.major)),
    partial: Math.max(0, ...days.map((d) => d.partial)),
    related,
    majorCount: days.filter((d) => d.major > 0).length,
    partialCount: days.filter((d) => d.partial > 0).length,
  }
}

/** Day bars, oldest first, ending today. */
export function dayRange(n: number): number[] {
  return Array.from({ length: n }, (_, i) => today - (n - 1 - i) * DAY)
}

/** Partial outages count for 30% of their duration, as on Statuspage. */
export function uptimePercent(days: DayUptime[]): number {
  const withData = days.filter((d) => d.hasData)
  if (withData.length === 0) return 100
  const total = withData.length * 24 * 60
  const down = withData.reduce((s, d) => s + d.major + 0.3 * d.partial, 0)
  return Math.max(0, 100 * (1 - down / total))
}

export function formatUptime(p: number): string {
  return String(Number(p.toFixed(2)))
}

export function barColor(d: DayUptime): string {
  if (!d.hasData) return NO_DATA
  if (d.major > 0) return mix(theme.orange, theme.red, Math.min(1, d.major / 240))
  if (d.partial > 0) return mix(theme.yellow, theme.orange, Math.min(1, d.partial / 480))
  return theme.green
}

export function hrsMins(mins: number): { hrs: string; mins: string } {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return { hrs: h > 0 ? `${h} hrs` : '', mins: `${m} mins` }
}

/** Components laid out as Statuspage lists them: top-level ones and groups in data order. */
export type Row =
  | { kind: 'component'; component: StatusComponent }
  | { kind: 'group'; name: string; description?: string; children: StatusComponent[] }

export function rows(page: ClientPage): Row[] {
  const out: Row[] = []
  for (const c of page.components) {
    if (!c.group) {
      out.push({ kind: 'component', component: c })
      continue
    }
    let g = out.find((r): r is Extract<Row, { kind: 'group' }> => r.kind === 'group' && r.name === c.group)
    if (!g) {
      const meta = page.groups.find((x) => x.name === c.group)
      g = { kind: 'group', name: c.group, description: meta?.description, children: [] }
      out.push(g)
    }
    g.children.push(c)
  }
  return out
}
