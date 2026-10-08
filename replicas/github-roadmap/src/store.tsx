import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import raw from './data/project.json'
import type { Field, Item, ItemFields, Milestone, ProjectData, ProjectMeta, Sprint, User, ViewConfig } from './types'
import { toDay } from './lib/dates'

export const DATA = raw as unknown as ProjectData
export const TODAY = toDay(DATA.today)
export const FIELDS: Field[] = DATA.fields
export const USERS: User[] = DATA.users
export const MILESTONES: Milestone[] = DATA.milestones
export const SPRINTS: Sprint[] = DATA.sprints

export const fieldById = (id: string) => FIELDS.find((f) => f.id === id)
export const userByLogin = (login: string) => USERS.find((u) => u.login === login)

const STORAGE_KEY = 'fieldwork-roadmap-replica-v1'

interface Persisted {
  items: Item[]
  views: ViewConfig[]
  drafts: Record<number, ViewConfig>
  project: ProjectMeta
}

function load(): Persisted {
  const fresh: Persisted = { items: DATA.items, views: DATA.views, drafts: {}, project: DATA.project }
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    if (!s) return fresh
    const parsed = JSON.parse(s) as Persisted
    if (!Array.isArray(parsed.items) || !Array.isArray(parsed.views)) return fresh
    return { ...fresh, ...parsed }
  } catch {
    return fresh
  }
}

interface Store extends Persisted {
  /** The view as currently shown: saved config plus unsaved edits. */
  viewFor: (id: number) => ViewConfig | undefined
  isDirty: (id: number) => boolean
  updateView: (id: number, patch: Partial<ViewConfig>) => void
  saveView: (id: number) => void
  discardView: (id: number) => void
  renameView: (id: number, name: string) => void
  addView: (layout: ViewConfig['layout']) => number
  duplicateView: (id: number) => number
  deleteView: (id: number) => void
  updateItem: (id: string, patch: Partial<Item>) => void
  setField: (id: string, field: keyof ItemFields, value: ItemFields[keyof ItemFields] | undefined) => void
  addItem: (title: string, fields: ItemFields) => Item
  reset: () => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* storage unavailable: edits last for this session only */
    }
  }, [state])

  const viewFor = useCallback(
    (id: number) => state.drafts[id] ?? state.views.find((v) => v.id === id),
    [state.drafts, state.views],
  )

  const isDirty = useCallback((id: number) => !!state.drafts[id], [state.drafts])

  const updateView = useCallback((id: number, patch: Partial<ViewConfig>) => {
    setState((s) => {
      const base = s.drafts[id] ?? s.views.find((v) => v.id === id)
      if (!base) return s
      const next = { ...base, ...patch }
      const saved = s.views.find((v) => v.id === id)
      const drafts = { ...s.drafts }
      if (saved && JSON.stringify(saved) === JSON.stringify(next)) delete drafts[id]
      else drafts[id] = next
      return { ...s, drafts }
    })
  }, [])

  const saveView = useCallback((id: number) => {
    setState((s) => {
      const d = s.drafts[id]
      if (!d) return s
      const drafts = { ...s.drafts }
      delete drafts[id]
      return { ...s, views: s.views.map((v) => (v.id === id ? d : v)), drafts }
    })
  }, [])

  const discardView = useCallback((id: number) => {
    setState((s) => {
      const drafts = { ...s.drafts }
      delete drafts[id]
      return { ...s, drafts }
    })
  }, [])

  const renameView = useCallback((id: number, name: string) => {
    setState((s) => ({
      ...s,
      views: s.views.map((v) => (v.id === id ? { ...v, name } : v)),
      drafts: s.drafts[id] ? { ...s.drafts, [id]: { ...s.drafts[id], name } } : s.drafts,
    }))
  }, [])

  const addView = useCallback(
    (layout: ViewConfig['layout']) => {
      const id = Math.max(0, ...state.views.map((v) => v.id)) + 1
      const v: ViewConfig = {
        id,
        name: `View ${id}`,
        layout,
        filter: '',
        groupBy: layout === 'board' ? 'status' : null,
        sort: [],
        zoom: 'month',
        markers: [],
        startField: 'start',
        targetField: 'target',
        fields: ['title', 'status', 'client', 'assignees', 'start', 'target'],
      }
      setState((s) => ({ ...s, views: [...s.views, v] }))
      return id
    },
    [state.views],
  )

  const duplicateView = useCallback(
    (id: number) => {
      const src = state.drafts[id] ?? state.views.find((v) => v.id === id)
      const nid = Math.max(0, ...state.views.map((v) => v.id)) + 1
      if (!src) return id
      setState((s) => ({ ...s, views: [...s.views, { ...src, id: nid, name: `${src.name} (copy)` }] }))
      return nid
    },
    [state.views, state.drafts],
  )

  const deleteView = useCallback((id: number) => {
    setState((s) => {
      const drafts = { ...s.drafts }
      delete drafts[id]
      return { ...s, views: s.views.filter((v) => v.id !== id), drafts }
    })
  }, [])

  const updateItem = useCallback((id: string, patch: Partial<Item>) => {
    setState((s) => ({ ...s, items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) }))
  }, [])

  const setField = useCallback((id: string, field: keyof ItemFields, value: ItemFields[keyof ItemFields] | undefined) => {
    setState((s) => ({
      ...s,
      items: s.items.map((it) => {
        if (it.id !== id) return it
        const fields = { ...it.fields } as Record<string, unknown>
        if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) delete fields[field]
        else fields[field] = value
        const next = { ...it, fields: fields as ItemFields }
        if (field === 'status') next.state = value === 'done' ? 'closed' : 'open'
        return next
      }),
    }))
  }, [])

  const addItem = useCallback((title: string, fields: ItemFields) => {
    const item: Item = {
      id: `draft-${Date.now().toString(36)}`,
      type: 'draft',
      state: 'open',
      title,
      createdAt: DATA.today,
      author: 'maya-chen',
      fields,
      subIssues: [],
      comments: [],
    }
    setState((s) => ({ ...s, items: [...s.items, item] }))
    return item
  }, [])

  const reset = useCallback(() => {
    setState({ items: DATA.items, views: DATA.views, drafts: {}, project: DATA.project })
  }, [])

  const value = useMemo<Store>(
    () => ({
      ...state,
      viewFor,
      isDirty,
      updateView,
      saveView,
      discardView,
      renameView,
      addView,
      duplicateView,
      deleteView,
      updateItem,
      setField,
      addItem,
      reset,
    }),
    [state, viewFor, isDirty, updateView, saveView, discardView, renameView, addView, duplicateView, deleteView, updateItem, setField, addItem, reset],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('StoreProvider missing')
  return s
}
