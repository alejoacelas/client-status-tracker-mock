import type { Color, Item, SortSpec, ViewConfig } from '../types'
import { FIELDS, MILESTONES, USERS } from '../store'
import { applyFilter } from './filter'
import { sortValue } from './fields'
import { fmtShort, toDay } from './dates'

export interface Group {
  key: string
  name: string
  color?: Color
  description?: string
  /** Field value that items dropped into this group receive. */
  value?: string
  items: Item[]
}

export function sortItems(items: Item[], sort: SortSpec[], all: Item[]): Item[] {
  if (sort.length === 0) return items
  return [...items].sort((a, b) => {
    for (const s of sort) {
      const va = sortValue(a, s.field, all)
      const vb = sortValue(b, s.field, all)
      if (va === vb) continue
      // Empty values always sort last, as in the original.
      if (va === undefined) return 1
      if (vb === undefined) return -1
      const c = va < vb ? -1 : 1
      return s.dir === 'asc' ? c : -c
    }
    return 0
  })
}

export function groupItems(items: Item[], groupBy: string | null, all: Item[]): Group[] {
  if (!groupBy) return [{ key: '__all', name: '', items }]
  const field = FIELDS.find((f) => f.id === groupBy)
  const groups: Group[] = []
  const none: Group = { key: '__none', name: `No ${field?.name ?? groupBy}`, items: [] }
  const push = (key: string, name: string, item: Item, extra: Partial<Group> = {}) => {
    let g = groups.find((x) => x.key === key)
    if (!g) {
      g = { key, name, items: [], ...extra }
      groups.push(g)
    }
    g.items.push(item)
  }
  if (field?.type === 'single_select') {
    for (const o of field.options ?? []) groups.push({ key: o.id, name: o.name, color: o.color, description: o.description, value: o.id, items: [] })
    for (const it of items) {
      const v = it.fields[groupBy as 'status']
      const g = groups.find((x) => x.key === v)
      if (g) g.items.push(it)
      else none.items.push(it)
    }
    const out = groups.filter((g) => g.items.length > 0)
    return none.items.length ? [...out, none] : out
  }
  for (const it of items) {
    if (groupBy === 'assignees') {
      const a = it.fields.assignees ?? []
      if (a.length === 0) none.items.push(it)
      for (const l of a) push(l, USERS.find((u) => u.login === l)?.login ?? l, it, { value: l })
    } else if (groupBy === 'milestone') {
      const m = MILESTONES.find((x) => x.id === it.fields.milestone)
      if (!m) none.items.push(it)
      else push(m.id, m.title, it, { value: m.id, description: `Due by ${fmtShort(toDay(m.dueOn))}` })
    } else if (groupBy === 'parent') {
      const p = all.find((x) => x.id === it.parent)
      if (!p) none.items.push(it)
      else push(p.id, p.title, it, { value: p.id, description: `${p.repo ?? ''} #${p.number ?? ''}` })
    } else if (groupBy === 'start' || groupBy === 'target') {
      const v = it.fields[groupBy]
      if (!v) none.items.push(it)
      else push(v, fmtShort(toDay(v)), it, { value: v })
    }
  }
  if (groupBy === 'start' || groupBy === 'target') groups.sort((a, b) => (a.key < b.key ? -1 : 1))
  if (groupBy === 'parent') groups.sort((a, b) => (all.find((x) => x.id === a.key)?.number ?? 0) - (all.find((x) => x.id === b.key)?.number ?? 0))
  if (groupBy === 'milestone') groups.sort((a, b) => (MILESTONES.find((m) => m.id === a.key)!.dueOn < MILESTONES.find((m) => m.id === b.key)!.dueOn ? -1 : 1))
  return none.items.length ? [...groups, none] : groups
}

export function visibleItems(all: Item[], view: ViewConfig, filterOverride?: string) {
  const filtered = applyFilter(all, filterOverride ?? view.filter, all)
  return sortItems(filtered, view.sort, all)
}
