import { useMemo, useRef, useState, type ReactNode } from 'react'
import {
  CalendarIcon,
  ChevronRightIcon,
  GearIcon,
  LocationIcon,
  RowsIcon,
  SearchIcon,
  XCircleFillIcon,
  ZoomInIcon,
  ColumnsIcon,
  ProjectIcon,
} from '@primer/octicons-react'
import type { Layout, ViewConfig } from '../types'
import { FIELDS, MILESTONES, SPRINTS, USERS, useStore } from '../store'
import { fieldForKey, isKnownKey, quote, tokenize } from '../lib/filter'
import { slug } from '../lib/fields'
import { FieldIcon, SortIcon, fieldName } from './FieldIcon'
import { LayoutIcon } from './Header'
import { Avatar, Button, ColorDecorator, Counter, MenuDivider, MenuItem, Overlay } from './primitives'
import { DateFieldsMenu, FieldsMenu, GroupByMenu, MarkersMenu, SortMenu, ZoomMenu, ZOOM_LABEL, datesSummary, markersSummary, sortSummary } from './ViewMenus'

interface Suggestion {
  label: string
  insert: string
  icon?: ReactNode
  kind: 'key' | 'value'
}

function keySuggestions(prefix: string): Suggestion[] {
  const p = prefix.toLowerCase()
  const keys: Suggestion[] = FIELDS.filter((f) => f.type !== 'title').map((f) => ({
    label: f.name,
    insert: f.id === 'assignees' ? 'assignee:' : `${slug(f.name)}:`,
    icon: <FieldIcon fieldId={f.id} />,
    kind: 'key' as const,
  }))
  keys.push(
    { label: 'has', insert: 'has:', kind: 'key', icon: <SearchIcon /> },
    { label: 'no', insert: 'no:', kind: 'key', icon: <SearchIcon /> },
    { label: 'is', insert: 'is:', kind: 'key', icon: <SearchIcon /> },
  )
  return keys.filter((k) => k.label.toLowerCase().startsWith(p) || k.insert.startsWith(p))
}

function valueSuggestions(key: string, partial: string): Suggestion[] {
  const p = partial.replace(/"/g, '').toLowerCase()
  let out: Suggestion[] = []
  if (key === 'is') out = ['open', 'closed', 'issue', 'draft'].map((v) => ({ label: v, insert: v, kind: 'value' }))
  else if (key === 'has' || key === 'no')
    out = FIELDS.filter((f) => f.type !== 'title').map((f) => ({
      label: f.name,
      insert: f.id === 'assignees' ? 'assignee' : slug(f.name),
      icon: <FieldIcon fieldId={f.id} />,
      kind: 'value',
    }))
  else {
    const fid = fieldForKey(key)
    const field = FIELDS.find((f) => f.id === fid)
    if (field?.type === 'single_select')
      out = (field.options ?? []).map((o) => ({ label: o.name, insert: quote(o.name), icon: <ColorDecorator color={o.color} />, kind: 'value' }))
    else if (field?.type === 'assignees')
      out = [{ label: '@me', insert: '@me', kind: 'value' as const }, ...USERS.map((u) => ({ label: u.login, insert: u.login, icon: <Avatar login={u.login} size={16} />, kind: 'value' as const }))]
    else if (field?.type === 'date')
      out = ['@today', '<@today', '>@today', '@today..@today+14d'].map((v) => ({ label: v, insert: v, icon: <CalendarIcon />, kind: 'value' }))
    else if (field?.type === 'milestone') out = MILESTONES.filter((m) => m.state === 'open').map((m) => ({ label: m.title, insert: quote(m.title), kind: 'value' }))
    else if (field?.type === 'iteration') out = [{ label: '@current', insert: '@current', kind: 'value' as const }, ...SPRINTS.map((s) => ({ label: s.title, insert: quote(s.title), kind: 'value' as const }))]
    else if (field?.type === 'number') out = ['>50', '<50', '100'].map((v) => ({ label: v, insert: v, kind: 'value' }))
  }
  return out.filter((s) => s.label.toLowerCase().includes(p))
}

/** Text behind the transparent input, coloured like the original's qualifier highlighting. */
function Highlight({ text }: { text: string }) {
  const tokens = tokenize(text)
  const out: ReactNode[] = []
  let pos = 0
  tokens.forEach((t, i) => {
    if (t.start > pos) out.push(text.slice(pos, t.start))
    if (t.key !== undefined) {
      const known = isKnownKey(t.key)
      const keyPart = t.raw.slice(0, t.raw.indexOf(':') + 1)
      out.push(
        <span key={i} className={known ? '' : 'Filter-invalid'}>
          {keyPart}
          {t.value ? <span className={known ? 'Filter-value' : ''}>{t.value}</span> : null}
        </span>,
      )
    } else out.push(<span key={i}>{t.raw}</span>)
    pos = t.end
  })
  if (pos < text.length) out.push(text.slice(pos))
  return <>{out}</>
}

export function FilterBar({ view, count }: { view: ViewConfig; count: number }) {
  const store = useStore()
  const dirty = store.isDirty(view.id)
  const inputRef = useRef<HTMLInputElement>(null)
  const mirrorRef = useRef<HTMLDivElement>(null)
  const [focused, setFocused] = useState(false)
  const [caret, setCaret] = useState(0)
  const [active, setActive] = useState(0)
  const [suppress, setSuppress] = useState(false)
  const [viewMenuOpen, setViewMenuOpen] = useState(false)
  const viewBtnRef = useRef<HTMLButtonElement>(null)

  const setFilter = (filter: string) => store.updateView(view.id, { filter })

  const context = useMemo(() => {
    const tokens = tokenize(view.filter)
    const tok = tokens.find((t) => caret >= t.start && caret <= t.end)
    if (!tok) return { tok: undefined, suggestions: keySuggestions('') }
    const body = tok.negated ? tok.raw.slice(1) : tok.raw
    if (tok.key !== undefined) {
      const after = (tok.value ?? '').split(',')
      const partial = after[after.length - 1]
      return { tok, partial, suggestions: valueSuggestions(tok.key, partial) }
    }
    return { tok, suggestions: body ? keySuggestions(body) : keySuggestions('') }
  }, [view.filter, caret])

  const showSuggest = focused && !suppress && context.suggestions.length > 0

  const accept = (s: Suggestion) => {
    const q = view.filter
    const tok = context.tok
    let next: string
    let nextCaret: number
    if (s.kind === 'key') {
      const prefix = tok?.negated ? '-' : ''
      const start = tok ? tok.start : caret
      const end = tok ? tok.end : caret
      const pre = q.slice(0, start)
      const sep = pre && !pre.endsWith(' ') ? ' ' : ''
      next = pre + sep + prefix + s.insert + q.slice(end)
      nextCaret = (pre + sep + prefix + s.insert).length
    } else {
      const t = tok!
      const valueStart = t.end - (context.partial?.length ?? 0)
      const pre = q.slice(0, valueStart)
      const rest = q.slice(t.end)
      next = pre + s.insert + (rest.startsWith(' ') ? '' : ' ') + rest.trimStart()
      nextCaret = (pre + s.insert).length + 1
    }
    setFilter(next)
    setActive(0)
    requestAnimationFrame(() => {
      const el = inputRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(nextCaret, nextCaret)
      setCaret(nextCaret)
    })
  }

  return (
    <div className="FilterBar">
      <div className={`FilterInput${focused ? ' is-focused' : ''}`}>
        <span className="FilterInput-icon">
          <SearchIcon />
        </span>
        <div className="FilterInput-field">
          <div className="FilterInput-mirror" ref={mirrorRef} aria-hidden="true">
            <Highlight text={view.filter} />
          </div>
          <input
            ref={inputRef}
            className="FilterInput-input"
            role="combobox"
            aria-expanded={showSuggest}
            aria-label="Filter by keyword or by field"
            placeholder="Filter by keyword or by field"
            value={view.filter}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => {
              setFilter(e.target.value)
              setCaret(e.target.selectionStart ?? 0)
              setSuppress(false)
              setActive(0)
            }}
            onSelect={(e) => setCaret(e.currentTarget.selectionStart ?? 0)}
            onScroll={(e) => {
              if (mirrorRef.current) mirrorRef.current.scrollLeft = e.currentTarget.scrollLeft
            }}
            onFocus={(e) => {
              setFocused(true)
              setSuppress(false)
              setCaret(e.currentTarget.selectionStart ?? 0)
            }}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onKeyDown={(e) => {
              if (showSuggest) {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setActive((a) => (a + 1) % context.suggestions.length)
                  return
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setActive((a) => (a - 1 + context.suggestions.length) % context.suggestions.length)
                  return
                }
                if (e.key === 'Tab' || (e.key === 'Enter' && context.tok)) {
                  e.preventDefault()
                  accept(context.suggestions[active])
                  return
                }
              }
              if (e.key === 'Escape') setSuppress(true)
              if (e.key === 'Enter') setSuppress(true)
            }}
          />
          {showSuggest && (
            <ul className="FilterSuggest Menu" role="listbox">
              {context.suggestions.slice(0, 12).map((s, i) => (
                <li
                  key={s.kind + s.insert}
                  role="option"
                  aria-selected={i === active}
                  className={`MenuItem${i === active ? ' is-active' : ''}`}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    accept(s)
                  }}
                  onMouseEnter={() => setActive(i)}
                >
                  {s.icon && <span className="MenuItem-leading">{s.icon}</span>}
                  <span className="MenuItem-main">
                    <span className="MenuItem-label">{s.label}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <span className="FilterInput-trailing">
          <Counter>{count}</Counter>
          {view.filter && (
            <button
              type="button"
              className="FilterInput-clear"
              aria-label="Clear filter"
              onClick={() => {
                setFilter('')
                inputRef.current?.focus()
              }}
            >
              <XCircleFillIcon size={16} />
            </button>
          )}
        </span>
      </div>
      <div className="FilterBar-actions">
        {dirty && (
          <>
            <Button onClick={() => store.discardView(view.id)}>Discard</Button>
            <Button variant="primary" onClick={() => store.saveView(view.id)}>
              Save
            </Button>
          </>
        )}
        <Button btnRef={viewBtnRef} leading={<GearIcon />} onClick={() => setViewMenuOpen((o) => !o)} ariaExpanded={viewMenuOpen} className="FilterBar-view">
          View
        </Button>
      </div>
      {viewMenuOpen && <ViewOptionsMenu view={view} anchor={viewBtnRef.current} onClose={() => setViewMenuOpen(false)} />}
    </div>
  )
}

type Sub = 'group' | 'markers' | 'sort' | 'dates' | 'zoom' | 'fields' | 'column' | null

export function ViewOptionsMenu({ view, anchor, onClose }: { view: ViewConfig; anchor: HTMLElement | null; onClose: () => void }) {
  const store = useStore()
  const update = (patch: Partial<ViewConfig>) => store.updateView(view.id, patch)
  const [sub, setSub] = useState<Sub>(null)
  const [subAnchor, setSubAnchor] = useState<HTMLElement | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const dirty = store.isDirty(view.id)

  const row = (key: Exclude<Sub, null>, icon: ReactNode, label: string, value: string, italic = false) => (
    <li
      role="menuitem"
      tabIndex={0}
      className={`MenuItem${sub === key ? ' MenuItem--active' : ''}`}
      onClick={(e) => {
        setSubAnchor(e.currentTarget)
        setSub(sub === key ? null : key)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === 'ArrowRight') {
          setSubAnchor(e.currentTarget)
          setSub(key)
        }
      }}
    >
      <span className="MenuItem-leading">{icon}</span>
      <span className="MenuItem-main MenuItem-main--row">
        <span className="MenuItem-label fgMuted">{label}:</span>
        <span className={`MenuItem-value${italic ? ' is-italic' : ''}`}>{value}</span>
      </span>
      <span className="MenuItem-trailing">
        <ChevronRightIcon />
      </span>
    </li>
  )

  const closeSub = () => setSub(null)

  return (
    <>
      <Overlay anchor={anchor} onClose={onClose} align="end" width={312} className="ViewOptions" ignore={[menuRef.current]}>
        <div ref={menuRef}>
          <div className="SegmentedControl" role="group" aria-label="Layout">
            {(['table', 'board', 'roadmap'] as Layout[]).map((l) => (
              <button key={l} type="button" className={`SegmentedControl-item${view.layout === l ? ' is-selected' : ''}`} aria-pressed={view.layout === l} onClick={() => update({ layout: l, groupBy: l === 'board' && !view.groupBy ? 'status' : view.groupBy })}>
                <LayoutIcon layout={l} />
                <span>{l[0].toUpperCase() + l.slice(1)}</span>
              </button>
            ))}
          </div>
          <ul className="Menu" role="menu">
            {view.layout === 'table' && row('fields', <RowsIcon />, 'Fields', view.fields.map(fieldName).join(', '))}
            {view.layout === 'board' && row('column', <ColumnsIcon />, 'Column by', fieldName(view.groupBy ?? 'status'))}
            {view.layout === 'board' && row('fields', <ProjectIcon />, 'Fields', view.fields.map(fieldName).join(', '))}
            {view.layout !== 'board' && row('group', <RowsIcon />, 'Group by', view.groupBy ? fieldName(view.groupBy) : 'none', !view.groupBy)}
            {view.layout === 'roadmap' && row('markers', <LocationIcon />, 'Markers', markersSummary(view), view.markers.length === 0)}
            {row('sort', <SortIcon />, 'Sort by', sortSummary(view), view.sort.length === 0)}
            {view.layout === 'roadmap' && row('dates', <CalendarIcon />, 'Dates', datesSummary(view))}
            {view.layout === 'roadmap' && row('zoom', <ZoomInIcon />, 'Zoom level', ZOOM_LABEL[view.zoom])}
            {view.layout === 'roadmap' && (
              <>
                <MenuDivider />
                <MenuItem role="menuitemcheckbox" selectable checked={!!view.truncateTitles} onSelect={() => update({ truncateTitles: !view.truncateTitles })}>
                  Truncate titles
                </MenuItem>
                <MenuItem role="menuitemcheckbox" selectable checked={!!view.showDateFields} onSelect={() => update({ showDateFields: !view.showDateFields })}>
                  Show date fields
                </MenuItem>
              </>
            )}
          </ul>
          <div className="ViewOptions-footer">
            <Button disabled={!dirty} onClick={() => store.discardView(view.id)}>
              Discard
            </Button>
            <Button variant="primary" disabled={!dirty} onClick={() => store.saveView(view.id)}>
              Save
            </Button>
          </div>
        </div>
      </Overlay>
      {sub && (
        <Overlay anchor={subAnchor} onClose={closeSub} side="left" width={260}>
          {sub === 'group' && <GroupByMenu view={view} update={update} onDone={closeSub} />}
          {sub === 'column' && <GroupByMenu view={view} update={update} onDone={closeSub} label="Column by" />}
          {sub === 'markers' && <MarkersMenu view={view} update={update} />}
          {sub === 'sort' && <SortMenu view={view} update={update} onDone={closeSub} />}
          {sub === 'dates' && <DateFieldsMenu view={view} update={update} onDone={closeSub} />}
          {sub === 'zoom' && <ZoomMenu view={view} update={update} onDone={closeSub} />}
          {sub === 'fields' && <FieldsMenu view={view} update={update} />}
        </Overlay>
      )}
    </>
  )
}
