import type { Field, Item, Option } from '../types'
import { FIELDS, MILESTONES, SPRINTS, userByLogin } from '../store'
import { fmtIsoShort, toDay } from './dates'

export function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

export function optionFor(field: Field | undefined, id?: string): Option | undefined {
  if (!field || !id) return undefined
  return field.options?.find((o) => o.id === id)
}

export function subIssueProgress(item: Item, items: Item[]) {
  const subs = item.subIssues.map((id) => items.find((i) => i.id === id)).filter(Boolean) as Item[]
  const done = subs.filter((s) => s.state === 'closed').length
  return { done, total: subs.length }
}

/** Raw comparable value of a field, used by sorting, grouping and filtering. */
export function rawValue(item: Item, fieldId: string, items: Item[]): string | number | string[] | undefined {
  const f = item.fields
  switch (fieldId) {
    case 'title':
      return item.title
    case 'assignees':
      return f.assignees ?? []
    case 'status':
    case 'client':
    case 'phase':
      return f[fieldId]
    case 'start':
    case 'target':
      return f[fieldId]
    case 'progress':
      return f.progress
    case 'milestone':
      return f.milestone
    case 'sprint':
      return f.sprint
    case 'parent':
      return item.parent
    case 'subIssuesProgress': {
      const p = subIssueProgress(item, items)
      return p.total ? p.done / p.total : undefined
    }
  }
  return undefined
}

/** Human-readable value used in filters and text. */
export function displayValue(item: Item, fieldId: string, items: Item[]): string {
  const field = FIELDS.find((x) => x.id === fieldId)
  const v = rawValue(item, fieldId, items)
  if (v === undefined) return ''
  if (field?.type === 'single_select') return optionFor(field, v as string)?.name ?? ''
  if (fieldId === 'assignees') return (v as string[]).join(', ')
  if (fieldId === 'start' || fieldId === 'target') return fmtIsoShort(v as string)
  if (fieldId === 'milestone') return MILESTONES.find((m) => m.id === v)?.title ?? ''
  if (fieldId === 'sprint') return SPRINTS.find((s) => s.id === v)?.title ?? ''
  if (fieldId === 'parent') return items.find((i) => i.id === v)?.title ?? ''
  if (fieldId === 'subIssuesProgress') return `${Math.round((v as number) * 100)}%`
  return String(v)
}

/** Value used to sort: option order for selects, day number for dates. */
export function sortValue(item: Item, fieldId: string, items: Item[]): string | number | undefined {
  const field = FIELDS.find((x) => x.id === fieldId)
  const v = rawValue(item, fieldId, items)
  if (v === undefined || (Array.isArray(v) && v.length === 0)) return undefined
  if (field?.type === 'single_select') return field.options?.findIndex((o) => o.id === v) ?? 0
  if (field?.type === 'date') return toDay(v as string)
  if (fieldId === 'assignees') return (v as string[]).map((l) => userByLogin(l)?.login ?? l).join(',')
  if (fieldId === 'milestone') return MILESTONES.find((m) => m.id === v)?.dueOn ?? ''
  if (fieldId === 'parent') return items.find((i) => i.id === v)?.number ?? 0
  if (typeof v === 'string') return v.toLowerCase()
  return v as number
}

export const SORTABLE = ['title', 'assignees', 'status', 'client', 'phase', 'start', 'target', 'progress', 'milestone', 'parent', 'subIssuesProgress']
export const GROUPABLE = ['assignees', 'status', 'client', 'phase', 'milestone', 'parent', 'start', 'target']
export const MARKABLE = ['sprint', 'milestone', 'start', 'target']
