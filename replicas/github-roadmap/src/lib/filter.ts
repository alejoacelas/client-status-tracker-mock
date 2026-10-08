import type { Item } from '../types'
import { FIELDS, MILESTONES, SPRINTS, TODAY, USERS } from '../store'
import { toDay } from './dates'
import { optionFor, rawValue, slug, subIssueProgress } from './fields'

export interface Token {
  raw: string
  start: number
  end: number
  negated: boolean
  key?: string
  value?: string
}

/** Split a filter query into tokens, keeping quoted values together. */
export function tokenize(q: string): Token[] {
  const out: Token[] = []
  let i = 0
  while (i < q.length) {
    while (i < q.length && q[i] === ' ') i++
    if (i >= q.length) break
    const start = i
    let inQuote = false
    while (i < q.length && (inQuote || q[i] !== ' ')) {
      if (q[i] === '"') inQuote = !inQuote
      i++
    }
    const raw = q.slice(start, i)
    let body = raw
    let negated = false
    if (body.startsWith('-') && body.length > 1) {
      negated = true
      body = body.slice(1)
    }
    const colon = body.indexOf(':')
    if (colon > 0 && !body.startsWith('"')) {
      out.push({ raw, start, end: i, negated, key: body.slice(0, colon).toLowerCase(), value: body.slice(colon + 1) })
    } else {
      out.push({ raw, start, end: i, negated, value: body })
    }
  }
  return out
}

const KEY_ALIASES: Record<string, string> = {
  assignee: 'assignees',
  assignees: 'assignees',
  start: 'start',
  'start-date': 'start',
  target: 'target',
  'target-date': 'target',
  parent: 'parent',
  'parent-issue': 'parent',
  'sub-issues-progress': 'subIssuesProgress',
  iteration: 'sprint',
}

export function fieldForKey(key: string): string | undefined {
  if (KEY_ALIASES[key]) return KEY_ALIASES[key]
  return FIELDS.find((f) => slug(f.name) === key || f.id === key)?.id
}

export const QUALIFIER_KEYS = ['is', 'has', 'no']

function splitValues(v: string): string[] {
  const out: string[] = []
  let cur = ''
  let q = false
  for (const ch of v) {
    if (ch === '"') q = !q
    else if (ch === ',' && !q) {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out.map((s) => s.trim()).filter(Boolean)
}

function resolveDate(v: string): number | undefined {
  const m = v.match(/^@today(?:([+-])(\d+)([dwm]?))?$/i)
  if (m) {
    if (!m[1]) return TODAY
    const n = Number(m[2]) * (m[3] === 'w' ? 7 : m[3] === 'm' ? 30 : 1)
    return TODAY + (m[1] === '+' ? n : -n)
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return toDay(v)
  return undefined
}

function compare(actual: number | undefined, expr: string, parse: (s: string) => number | undefined): boolean {
  if (actual === undefined) return false
  const range = expr.split('..')
  if (range.length === 2) {
    const lo = range[0] === '*' ? -Infinity : parse(range[0])
    const hi = range[1] === '*' ? Infinity : parse(range[1])
    if (lo === undefined || hi === undefined) return false
    return actual >= lo && actual <= hi
  }
  const m = expr.match(/^(>=|<=|>|<)?(.*)$/)!
  const val = parse(m[2])
  if (val === undefined) return false
  switch (m[1]) {
    case '>':
      return actual > val
    case '>=':
      return actual >= val
    case '<':
      return actual < val
    case '<=':
      return actual <= val
    default:
      return actual === val
  }
}

function hasValue(item: Item, fieldId: string, items: Item[]) {
  const v = rawValue(item, fieldId, items)
  if (fieldId === 'subIssuesProgress') return subIssueProgress(item, items).total > 0
  return !(v === undefined || v === '' || (Array.isArray(v) && v.length === 0))
}

function matchValue(item: Item, fieldId: string, value: string, items: Item[]): boolean {
  const field = FIELDS.find((f) => f.id === fieldId)
  const lv = value.toLowerCase()
  const raw = rawValue(item, fieldId, items)
  switch (field?.type) {
    case 'single_select':
      return (optionFor(field, raw as string)?.name.toLowerCase() ?? '') === lv
    case 'assignees': {
      const logins = (raw as string[]) ?? []
      const target = lv === '@me' ? 'maya-chen' : lv
      return logins.some((l) => l === target || USERS.find((u) => u.login === l)?.name.toLowerCase() === target)
    }
    case 'date':
      return compare(raw ? toDay(raw as string) : undefined, value, resolveDate)
    case 'number':
      return compare(raw as number | undefined, value, (s) => (s.trim() === '' || isNaN(Number(s)) ? undefined : Number(s)))
    case 'sub_issues_progress': {
      const p = subIssueProgress(item, items)
      if (!p.total) return false
      return compare(Math.round((p.done / p.total) * 100), value.replace('%', ''), (s) => (isNaN(Number(s)) ? undefined : Number(s)))
    }
    case 'milestone':
      return (MILESTONES.find((m) => m.id === raw)?.title.toLowerCase() ?? '') === lv
    case 'iteration': {
      const s = SPRINTS.find((x) => x.id === raw)
      if (lv === '@current') {
        const cur = SPRINTS.find((x) => toDay(x.startDate) <= TODAY && TODAY < toDay(x.startDate) + x.duration)
        return !!s && s.id === cur?.id
      }
      return (s?.title.toLowerCase() ?? '') === lv
    }
    case 'parent_issue': {
      const p = items.find((i) => i.id === raw)
      if (!p) return false
      return lv === `#${p.number}` || lv === String(p.number) || p.title.toLowerCase() === lv || (p.repo ? `${p.repo}#${p.number}` === lv : false)
    }
    case 'title':
      return item.title.toLowerCase().includes(lv)
  }
  return false
}

function matchToken(item: Item, t: Token, items: Item[]): boolean {
  if (!t.key) {
    const v = (t.value ?? '').replace(/"/g, '').toLowerCase()
    if (!v) return true
    return item.title.toLowerCase().includes(v) || (item.number !== undefined && `#${item.number}` === v)
  }
  const values = splitValues(t.value ?? '')
  if (values.length === 0) return true
  if (t.key === 'is') {
    return values.some((v) => {
      const lv = v.toLowerCase()
      if (lv === 'open' || lv === 'closed') return item.state === lv
      if (lv === 'issue') return item.type === 'issue'
      if (lv === 'draft') return item.type === 'draft'
      return false
    })
  }
  if (t.key === 'has' || t.key === 'no') {
    const res = values.every((v) => {
      const fid = fieldForKey(v.toLowerCase())
      return fid ? hasValue(item, fid, items) : false
    })
    return t.key === 'has' ? res : !res
  }
  const fid = fieldForKey(t.key)
  if (!fid) return true
  return values.some((v) => matchValue(item, fid, v, items))
}

export function isKnownKey(key: string) {
  return QUALIFIER_KEYS.includes(key) || !!fieldForKey(key)
}

export function applyFilter(items: Item[], q: string, all: Item[] = items): Item[] {
  const tokens = tokenize(q)
  if (tokens.length === 0) return items
  return items.filter((item) =>
    tokens.every((t) => {
      const m = matchToken(item, t, all)
      return t.negated ? !m : m
    }),
  )
}

/** Quote a value for insertion into a filter if it contains spaces. */
export function quote(v: string) {
  return /[\s,]/.test(v) ? `"${v}"` : v
}
