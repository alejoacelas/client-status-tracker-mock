import { Fragment, memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  ArrowBothIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  KebabHorizontalIcon,
  LocationIcon,
  PlusIcon,
  SlidersIcon,
  XIcon,
  ZoomInIcon,
} from '@primer/octicons-react'
import type { Item, ItemFields, ViewConfig, Zoom } from '../types'
import { MILESTONES, SPRINTS, TODAY, useStore } from '../store'
import { MONTHS, MONTHS_SHORT, dayOf, fmtRange, fmtShort, parts, toDay, toIso } from '../lib/dates'
import type { Group } from '../lib/view'
import { Avatar, Button, ColorDecorator, Counter, ItemIcon, MenuItem, Overlay, useMediaQuery, useMenu } from './primitives'
import { DateFieldsMenu, MarkersMenu, SortMenu, ZoomMenu, ZOOM_LABEL, datesSummary, markersSummary, sortSummary } from './ViewMenus'
import { AddItem } from './AddItem'
import { SortIcon } from './FieldIcon'

const DAY_WIDTH: Record<Zoom, number> = { month: 48, quarter: 16, year: 4 }
const RANGE_BEFORE = 400
const RANGE_AFTER = 460
const ROW_H = 40
const GROUP_H = 44
const NUMBER_W = 60
const DATE_COL_W = 120
const MIN_PILL = 32

interface Span {
  start: number
  end: number
}

function sprintSpan(id?: string): Span | undefined {
  const s = SPRINTS.find((x) => x.id === id)
  if (!s) return undefined
  const st = toDay(s.startDate)
  return { start: st, end: st + s.duration - 1 }
}

/** Start/end days for an item under the view's date-field settings. */
export function itemSpan(item: Item, view: ViewConfig): Span | null {
  const read = (field: string | null, edge: 'start' | 'end') => {
    if (!field) return undefined
    if (field === 'sprint') return sprintSpan(item.fields.sprint)?.[edge]
    const v = item.fields[field as 'start' | 'target']
    return v ? toDay(v) : undefined
  }
  const s = read(view.startField, 'start')
  const e = read(view.targetField, 'end')
  if (s === undefined && e === undefined) return null
  const start = s ?? e!
  const end = e ?? s!
  return start <= end ? { start, end } : { start: end, end: start }
}

interface DragState {
  itemId: string
  mode: 'move' | 'start' | 'end'
  originX: number
  orig: Span
  span: Span
  moved: boolean
}

export function RoadmapView({ view, groups, onOpenItem }: { view: ViewConfig; groups: Group[]; onOpenItem: (id: string) => void }) {
  const store = useStore()
  const update = useCallback((patch: Partial<ViewConfig>) => store.updateView(view.id, patch), [store, view.id])
  const narrow = useMediaQuery('(max-width: 767px)')
  const compactControls = useMediaQuery('(max-width: 1011px)')
  const dw = DAY_WIDTH[view.zoom]
  const rangeStart = TODAY - RANGE_BEFORE
  const totalDays = RANGE_BEFORE + RANGE_AFTER
  const width = totalDays * dw
  const x = useCallback((day: number) => (day - rangeStart) * dw, [rangeStart, dw])

  const [paneWidth, setPaneWidth] = useState(() => (window.innerWidth < 768 ? NUMBER_W + 75 : NUMBER_W + 420))
  useEffect(() => {
    if (narrow) setPaneWidth(NUMBER_W + 75)
  }, [narrow])
  const dateCols = view.showDateFields ? 2 * DATE_COL_W : 0
  const pane = paneWidth + dateCols

  const scrollRef = useRef<HTMLDivElement>(null)
  const [scroll, setScroll] = useState({ left: 0, width: 1200 })
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [drag, setDrag] = useState<DragState | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const [hoverGhost, setHoverGhost] = useState<{ itemId: string; day: number } | null>(null)

  // Day sitting under the pane-adjusted reference point; kept fixed across zoom changes.
  const anchorDay = useRef<number>(TODAY)
  const prevDw = useRef(dw)

  const scrollToDay = useCallback(
    (day: number, behavior: ScrollBehavior = 'auto') => {
      const el = scrollRef.current
      if (!el) return
      const ref = pane + (el.clientWidth - pane) / 3
      el.scrollTo({ left: x(day) + dw / 2 - ref, behavior })
    },
    [pane, x, dw],
  )

  useLayoutEffect(() => {
    scrollToDay(prevDw.current === dw ? TODAY : anchorDay.current)
    prevDw.current = dw
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dw])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        setScroll({ left: el.scrollLeft, width: el.clientWidth })
        const ref = pane + (el.clientWidth - pane) / 3
        anchorDay.current = Math.floor((el.scrollLeft + ref) / dw) + rangeStart
      })
    }
    onScroll()
    el.addEventListener('scroll', onScroll)
    window.addEventListener('resize', onScroll)
    return () => {
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [dw, pane, rangeStart])

  const visLeft = scroll.left + pane
  const visRight = scroll.left + scroll.width

  /* ---------------- drag and resize ---------------- */

  const commit = useCallback(
    (d: DragState) => {
      const item = store.items.find((i) => i.id === d.itemId)
      if (!item) return
      const { startField, targetField } = view
      const hasStart = !!(startField && item.fields[startField as 'start'])
      const hasTarget = !!(targetField && item.fields[targetField as 'target'])
      const set = (f: string | null, day: number) => f && f !== 'sprint' && store.setField(item.id, f as keyof ItemFields, toIso(day))
      if (d.mode === 'move') {
        if (hasStart || !hasTarget) set(startField, d.span.start)
        if (hasTarget || !hasStart) set(targetField, d.span.end)
      } else {
        set(startField, d.span.start)
        set(targetField, d.span.end)
      }
    },
    [store, view],
  )

  useEffect(() => {
    if (!drag) return
    const move = (e: PointerEvent) => {
      const d = dragRef.current
      if (!d) return
      const dx = e.clientX - d.originX
      const delta = Math.round(dx / dw)
      let span: Span
      if (d.mode === 'move') span = { start: d.orig.start + delta, end: d.orig.end + delta }
      else if (d.mode === 'start') span = { start: Math.min(d.orig.start + delta, d.orig.end), end: d.orig.end }
      else span = { start: d.orig.start, end: Math.max(d.orig.end + delta, d.orig.start) }
      const next = { ...d, span, moved: d.moved || Math.abs(dx) > 3 }
      dragRef.current = next
      setDrag(next)
    }
    const up = () => {
      const d = dragRef.current
      dragRef.current = null
      setDrag(null)
      document.body.classList.remove('is-dragging')
      if (!d) return
      if (d.moved) commit(d)
      else if (d.mode === 'move') onOpenItem(d.itemId)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [drag !== null, dw, commit, onOpenItem]) // eslint-disable-line react-hooks/exhaustive-deps

  const startDrag = (e: React.PointerEvent, item: Item, span: Span, mode: DragState['mode']) => {
    if (e.button !== 0) return
    e.stopPropagation()
    const canDrag = e.pointerType !== 'touch' && view.startField !== 'sprint' && view.targetField !== 'sprint'
    if (!canDrag) {
      if (mode === 'move') onOpenItem(item.id)
      return
    }
    e.preventDefault()
    const d: DragState = { itemId: item.id, mode, originX: e.clientX, orig: span, span, moved: false }
    dragRef.current = d
    setDrag(d)
    if (mode !== 'move') document.body.classList.add('is-dragging')
  }

  const addDates = (item: Item, day: number) => {
    const { startField, targetField } = view
    const len = view.zoom === 'month' ? 6 : view.zoom === 'quarter' ? 13 : 27
    if (startField && startField !== 'sprint') store.setField(item.id, startField as keyof ItemFields, toIso(day))
    if (targetField && targetField !== 'sprint') store.setField(item.id, targetField as keyof ItemFields, toIso(startField ? day + len : day))
  }

  /* ---------------- pane resize ---------------- */

  const startPaneResize = (e: React.PointerEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = paneWidth
    document.body.classList.add('is-col-resizing')
    const move = (ev: PointerEvent) => {
      const max = Math.min(NUMBER_W + 1000, (scrollRef.current?.clientWidth ?? 1200) - 120 - dateCols)
      setPaneWidth(Math.max(NUMBER_W + 75, Math.min(max, startW + ev.clientX - startX)))
    }
    const up = () => {
      document.body.classList.remove('is-col-resizing')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  /* ---------------- markers ---------------- */

  const visibleItems = useMemo(() => groups.flatMap((g) => g.items), [groups])
  const markers = useMemo(() => {
    const out: { kind: 'milestone' | 'sprint' | 'date' | 'currentSprint'; day: number; label: string; key: string }[] = []
    if (view.markers.includes('sprint'))
      for (const s of SPRINTS) {
        const sp = sprintSpan(s.id)!
        const current = sp.start <= TODAY && TODAY <= sp.end
        out.push({ kind: current ? 'currentSprint' : 'sprint', day: sp.start, label: s.title, key: s.id })
      }
    if (view.markers.includes('milestone')) {
      const ids = new Set(visibleItems.map((i) => i.fields.milestone).filter(Boolean))
      for (const m of MILESTONES) if (ids.has(m.id)) out.push({ kind: 'milestone', day: toDay(m.dueOn), label: m.title, key: m.id })
    }
    for (const f of ['start', 'target'] as const)
      if (view.markers.includes(f))
        for (const it of visibleItems) if (it.fields[f]) out.push({ kind: 'date', day: toDay(it.fields[f]!), label: `${it.title}: ${f === 'start' ? 'Start date' : 'Target date'}`, key: `${it.id}-${f}` })
    return out
  }, [view.markers, visibleItems])
  const showMarkerRow = markers.some((m) => m.kind !== 'date')
  const headerH = 64 + (showMarkerRow ? 24 : 0)

  /* ---------------- render helpers ---------------- */

  const groupPreset = (g: Group): ItemFields => {
    if (!view.groupBy || !g.value) return {}
    if (view.groupBy === 'assignees') return { assignees: [g.value] }
    if (['status', 'client', 'phase', 'start', 'target', 'milestone'].includes(view.groupBy)) return { [view.groupBy]: g.value } as ItemFields
    return {}
  }

  const ungrouped = groups.length === 1 && groups[0].key === '__all'
  let rowNumber = 0

  return (
    <div className={`Roadmap${drag?.moved ? ' is-dragging' : ''}`} style={{ '--pane-w': `${pane}px` } as CSSProperties}>
      <div className="Roadmap-scroll" ref={scrollRef}>
        <div className="Roadmap-content" style={{ width }}>
          <TimeHeader zoom={view.zoom} dw={dw} rangeStart={rangeStart} totalDays={totalDays} x={x} markers={markers} showMarkerRow={showMarkerRow} height={headerH} />
          <div className="Roadmap-body">
            <Lines zoom={view.zoom} dw={dw} rangeStart={rangeStart} totalDays={totalDays} x={x} markers={markers} />
            {groups.map((g, gi) => {
              const isCollapsed = collapsed.has(g.key)
              const spans = g.items.map((i) => itemSpan(i, view)).filter(Boolean) as Span[]
              const gSpan = spans.length ? { start: Math.min(...spans.map((s) => s.start)), end: Math.max(...spans.map((s) => s.end)) } : null
              return (
                <Fragment key={g.key}>
                {gi > 0 && (
                  <div className="Roadmap-gap" aria-hidden="true">
                    <div className="Roadmap-gapPane" style={{ width: pane }} />
                  </div>
                )}
                <section className={`Roadmap-group${ungrouped ? ' is-ungrouped' : ''}${isCollapsed ? ' is-collapsed' : ''}`}>
                  {!ungrouped && (
                    <div className="Roadmap-groupHeader" style={{ height: GROUP_H }}>
                      <div className="Roadmap-groupLabel" style={{ width: pane }}>
                        <button
                          type="button"
                          className="Roadmap-chevron"
                          aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} group ${g.name}`}
                          aria-expanded={!isCollapsed}
                          onClick={() =>
                            setCollapsed((s) => {
                              const n = new Set(s)
                              if (n.has(g.key)) n.delete(g.key)
                              else n.add(g.key)
                              return n
                            })
                          }
                        >
                          <ChevronDownIcon />
                        </button>
                        {g.color && <ColorDecorator color={g.color} />}
                        {view.groupBy === 'assignees' && g.value && <Avatar login={g.value} size={20} />}
                        <span className="Roadmap-groupName" title={g.description || g.name}>
                          {g.name}
                        </span>
                        <Counter>{g.items.length}</Counter>
                        <GroupMenu
                          collapsed={isCollapsed}
                          onToggle={() =>
                            setCollapsed((s) => {
                              const n = new Set(s)
                              if (n.has(g.key)) n.delete(g.key)
                              else n.add(g.key)
                              return n
                            })
                          }
                          onCollapseAll={() => setCollapsed(new Set(groups.map((x) => x.key)))}
                          onExpandAll={() => setCollapsed(new Set())}
                        />
                      </div>
                      {gSpan && (
                        <GroupPill
                          left={x(gSpan.start)}
                          right={x(gSpan.end + 1)}
                          label={fmtRange(gSpan.start, gSpan.end, TODAY)}
                          visLeft={visLeft}
                          visRight={visRight}
                        />
                      )}
                    </div>
                  )}
                  {!isCollapsed &&
                    g.items.map((item) => {
                      rowNumber += 1
                      const base = itemSpan(item, view)
                      const span = drag && drag.itemId === item.id ? drag.span : base
                      return (
                        <Row
                          key={item.id + g.key}
                          item={item}
                          n={rowNumber}
                          span={span}
                          pane={paneWidth}
                          dateCols={dateCols}
                          view={view}
                          x={x}
                          dw={dw}
                          visLeft={visLeft}
                          visRight={visRight}
                          dragging={drag?.itemId === item.id && drag.moved ? drag.mode : null}
                          onOpen={() => onOpenItem(item.id)}
                          onPointerDown={(e, mode) => span && startDrag(e, item, span, mode)}
                          onJump={(day) => scrollRef.current?.scrollTo({ left: x(day) - pane - 32, behavior: 'smooth' })}
                          ghostDay={hoverGhost?.itemId === item.id ? hoverGhost.day : null}
                          onGhost={(day) => setHoverGhost(day === null ? null : { itemId: item.id, day })}
                          onAddDates={(day) => addDates(item, day)}
                          rangeStart={rangeStart}
                          scrollLeft={scroll.left}
                        />
                      )
                    })}
                  {!isCollapsed && (
                    <div className="Roadmap-row Roadmap-addRow" style={{ height: ROW_H }}>
                      <div className="Roadmap-pane" style={{ width: pane }}>
                        <AddItem preset={groupPreset(g)} onCreated={() => undefined} />
                      </div>
                    </div>
                  )}
                </section>
                </Fragment>
              )
            })}
            {groups.length === 0 && (
              <div className="Roadmap-empty" style={{ width: pane }}>
                No items match this filter
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="Roadmap-paneHandle" style={{ left: paneWidth + dateCols - 9, top: headerH - 28 }} onPointerDown={startPaneResize} role="separator" aria-label="Resize table" title="Drag to resize">
        <ArrowBothIcon size={16} />
      </div>
      <Controls view={view} update={update} compact={compactControls} onToday={() => scrollToDay(TODAY, 'smooth')} onPage={(dir) => {
        const el = scrollRef.current
        if (el) el.scrollBy({ left: dir * (el.clientWidth - pane) * 0.9, behavior: 'smooth' })
      }} />
      {drag?.moved && <DragTooltip drag={drag} x={x} scrollLeft={scroll.left} />}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function DragTooltip({ drag, x, scrollLeft }: { drag: DragState; x: (d: number) => number; scrollLeft: number }) {
  const center = drag.mode === 'start' ? x(drag.span.start) : drag.mode === 'end' ? x(drag.span.end + 1) : (x(drag.span.start) + x(drag.span.end + 1)) / 2
  const el = document.querySelector(`[data-item-row="${CSS.escape(drag.itemId)}"]`) as HTMLElement | null
  const top = el ? el.getBoundingClientRect().top - (el.closest('.Roadmap')?.getBoundingClientRect().top ?? 0) - 30 : 0
  return (
    <div className="PillTooltip" style={{ left: center - scrollLeft, top }}>
      {drag.span.start === drag.span.end ? fmtShort(drag.span.start) : `${fmtShort(drag.span.start)} – ${fmtShort(drag.span.end)}`}
    </div>
  )
}

function GroupMenu({ collapsed, onToggle, onCollapseAll, onExpandAll }: { collapsed: boolean; onToggle: () => void; onCollapseAll: () => void; onExpandAll: () => void }) {
  const m = useMenu()
  return (
    <>
      <button ref={m.ref} type="button" className="Roadmap-groupMenu" aria-label="Group actions" onClick={m.toggle}>
        <KebabHorizontalIcon />
      </button>
      {m.open && (
        <Overlay anchor={m.ref.current} onClose={m.close} width={200}>
          <ul className="Menu" role="menu">
            <MenuItem
              onSelect={() => {
                onToggle()
                m.close()
              }}
            >
              {collapsed ? 'Expand group' : 'Collapse group'}
            </MenuItem>
            <MenuItem
              onSelect={() => {
                onCollapseAll()
                m.close()
              }}
            >
              Collapse all
            </MenuItem>
            <MenuItem
              onSelect={() => {
                onExpandAll()
                m.close()
              }}
            >
              Expand all
            </MenuItem>
          </ul>
        </Overlay>
      )}
    </>
  )
}

function GroupPill({ left, right, label, visLeft, visRight }: { left: number; right: number; label: string; visLeft: number; visRight: number }) {
  if (right < visLeft - 2000 || left > visRight + 2000) return null
  const w = Math.max(right - left, MIN_PILL)
  const contentOffset = Math.max(0, Math.min(visLeft + 8 - left, w - 40))
  return (
    <div className="GroupPill" style={{ left, width: w }}>
      <span className="GroupPill-label" style={{ transform: `translateX(${contentOffset}px)` }}>
        {label}
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ */

interface RowProps {
  item: Item
  n: number
  span: Span | null
  pane: number
  dateCols: number
  view: ViewConfig
  x: (d: number) => number
  dw: number
  visLeft: number
  visRight: number
  dragging: DragState['mode'] | null
  onOpen: () => void
  onPointerDown: (e: React.PointerEvent, mode: DragState['mode']) => void
  onJump: (day: number) => void
  ghostDay: number | null
  onGhost: (day: number | null) => void
  onAddDates: (day: number) => void
  rangeStart: number
  scrollLeft: number
}

function Row(p: RowProps) {
  const { item, span, x } = p
  const left = span ? x(span.start) : 0
  const right = span ? x(span.end + 1) : 0
  const w = Math.max(right - left, MIN_PILL)
  const offRight = span && left > p.visRight - 8
  const offLeft = span && left + w < p.visLeft + 8
  const contentOffset = span ? Math.max(0, Math.min(p.visLeft + 8 - left, w - MIN_PILL)) : 0
  const assignees = item.fields.assignees ?? []

  return (
    <div
      className={`Roadmap-row${p.dragging ? ' is-dragging' : ''}`}
      style={{ height: ROW_H }}
      data-item-row={item.id}
      onMouseMove={(e) => {
        if (span) return
        const rect = (e.currentTarget.closest('.Roadmap-content') as HTMLElement).getBoundingClientRect()
        const cx = e.clientX - rect.left
        if (cx < p.scrollLeft + p.pane + p.dateCols) return p.onGhost(null)
        p.onGhost(Math.floor(cx / p.dw) + p.rangeStart)
      }}
      onMouseLeave={() => !span && p.onGhost(null)}
    >
      <div className="Roadmap-pane" style={{ width: p.pane + p.dateCols }}>
        <div className="Roadmap-number" style={{ width: NUMBER_W }}>
          {p.n}
        </div>
        <div className={`Roadmap-title${p.view.truncateTitles === false ? '' : ''}`} style={{ width: p.pane - NUMBER_W }}>
          <ItemIcon item={item} />
          <a
            className="Roadmap-titleLink"
            href={`#/views/${p.view.id}?pane=issue&item=${encodeURIComponent(item.id)}`}
            onClick={(e) => {
              e.preventDefault()
              p.onOpen()
            }}
          >
            {item.title}
          </a>
          {item.number !== undefined && <span className="Roadmap-number-ref">#{item.number}</span>}
        </div>
        {p.dateCols > 0 && (
          <>
            <div className="Roadmap-dateCell">{item.fields.start ? fmtShort(toDay(item.fields.start)) : ''}</div>
            <div className="Roadmap-dateCell">{item.fields.target ? fmtShort(toDay(item.fields.target)) : ''}</div>
          </>
        )}
      </div>
      {span && !offLeft && !offRight && (
        <div className={`Pill${p.dragging ? ' is-active' : ''}${w <= MIN_PILL + 16 ? ' is-narrow' : ''}`} style={{ left, width: w }} title={fmtRange(span.start, span.end, TODAY)}>
          <div className="Pill-bg" onPointerDown={(e) => p.onPointerDown(e, 'move')} />
          <div className="Pill-content" style={{ transform: `translateX(${contentOffset}px)` }} onPointerDown={(e) => p.onPointerDown(e, 'move')}>
            <ItemIcon item={item} />
            <span className="Pill-title">
              {item.title}
              {item.number !== undefined && <span className="Pill-number"> #{item.number}</span>}
            </span>
            {assignees.length > 0 && (
              <span className="Pill-avatars">
                {assignees.map((a) => (
                  <Avatar key={a} login={a} size={20} />
                ))}
              </span>
            )}
          </div>
          <div className="Pill-handle Pill-handle--start" onPointerDown={(e) => p.onPointerDown(e, 'start')} aria-label="Change start date" role="slider" aria-valuetext={fmtShort(span.start)}>
            <span />
          </div>
          <div className="Pill-handle Pill-handle--end" onPointerDown={(e) => p.onPointerDown(e, 'end')} aria-label="Change target date" role="slider" aria-valuetext={fmtShort(span.end)}>
            <span />
          </div>
        </div>
      )}
      {span && offRight && (
        <button type="button" className="Pill-jump" style={{ left: p.visRight - 30 }} aria-label={`Scroll to ${fmtRange(span.start, span.end, TODAY)}`} title={`Scroll to: ${fmtRange(span.start, span.end, TODAY)}`} onClick={() => p.onJump(span.start)}>
          <ArrowRightIcon size={16} />
        </button>
      )}
      {span && offLeft && (
        <button type="button" className="Pill-jump" style={{ left: p.visLeft + 8 }} aria-label={`Scroll to ${fmtRange(span.start, span.end, TODAY)}`} title={`Scroll to: ${fmtRange(span.start, span.end, TODAY)}`} onClick={() => p.onJump(span.start)}>
          <ArrowLeftIcon size={16} />
        </button>
      )}
      {!span && p.ghostDay !== null && (
        <>
          <div className="Pill-ghost" style={{ left: x(p.ghostDay), width: Math.max(p.dw * (p.view.zoom === 'month' ? 7 : p.view.zoom === 'quarter' ? 14 : 28), MIN_PILL) }} />
          <button type="button" className="Pill-add" style={{ left: x(p.ghostDay) - 30 }} aria-label={`Add dates starting ${fmtShort(p.ghostDay)}`} title={`Add dates: ${fmtShort(p.ghostDay)}`} onClick={() => p.onAddDates(p.ghostDay!)}>
            <PlusIcon size={16} />
          </button>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */

interface ScaleProps {
  zoom: Zoom
  dw: number
  rangeStart: number
  totalDays: number
  x: (d: number) => number
}

type Marker = { kind: 'milestone' | 'sprint' | 'date' | 'currentSprint'; day: number; label: string; key: string }

function monthsIn(rangeStart: number, totalDays: number) {
  const out: { start: number; end: number; y: number; m: number }[] = []
  let p = parts(rangeStart)
  let start = dayOf(p.y, p.m, 1)
  while (start < rangeStart + totalDays) {
    p = parts(start)
    const next = dayOf(p.y, p.m + 1, 1)
    out.push({ start, end: next, y: p.y, m: p.m })
    start = next
  }
  return out
}

const TimeHeader = memo(function TimeHeader({ zoom, dw, rangeStart, totalDays, x, markers, showMarkerRow, height }: ScaleProps & { markers: Marker[]; showMarkerRow: boolean; height: number }) {
  const months = monthsIn(rangeStart, totalDays)
  const labels: { day: number; text: string }[] = []
  for (let d = rangeStart; d < rangeStart + totalDays; d++) {
    const p = parts(d)
    if (zoom === 'month') labels.push({ day: d, text: String(p.d) })
    else if (zoom === 'quarter' && p.wd === 1) labels.push({ day: d, text: String(p.d) })
    else if (zoom === 'year' && p.wd === 1 && Math.floor((d - 4) / 7) % 2 === 0) labels.push({ day: d, text: String(p.d) })
  }
  return (
    <div className="Roadmap-header" style={{ height }}>
      <div className="Roadmap-monthRow">
        {months.map((m) => (
          <div key={`${m.y}-${m.m}`} className="Roadmap-month" style={{ left: Math.max(0, x(m.start)), width: x(m.end) - Math.max(0, x(m.start)) }}>
            <span className="Roadmap-monthLabel">{zoom === 'year' ? `${MONTHS_SHORT[m.m]} ${m.y}` : `${MONTHS[m.m]} ${m.y}`}</span>
          </div>
        ))}
      </div>
      {showMarkerRow && (
        <div className="Roadmap-markerRow">
          {markers
            .filter((m) => m.kind !== 'date')
            .sort((a, b) => a.day - b.day)
            .map((m, i, arr) => {
              const left = x(m.day) + (m.kind === 'milestone' ? dw / 2 : 0)
              const next = arr[i + 1]
              const room = next ? x(next.day) + (next.kind === 'milestone' ? dw / 2 : 0) - left - 6 : 220
              return (
                <span key={m.key} className={`Roadmap-markerLabel is-${m.kind}`} style={{ left, maxWidth: Math.max(18, Math.min(220, room)) }} title={`${m.label} · ${fmtShort(m.day)}`}>
                  {m.label}
                </span>
              )
            })}
        </div>
      )}
      <div className="Roadmap-dayRow">
        {labels.map((l) => (
          <time key={l.day} dateTime={toIso(l.day)} className={`Roadmap-day${l.day === TODAY ? ' is-today' : ''}`} style={{ left: x(l.day) + dw / 2 - 24, width: 48 }}>
            {l.text}
          </time>
        ))}
      </div>
      <span className="Roadmap-todayNub" style={{ left: x(TODAY) + dw / 2 - 4 }} title={`Today: ${fmtShort(TODAY)}`} />
      {markers.map((m) =>
        m.kind === 'date' ? null : (
          <span key={m.key} className={`Roadmap-nub is-${m.kind}`} style={{ left: x(m.day) + (m.kind === 'milestone' ? dw / 2 : 0) - 4 }} />
        ),
      )}
      {markers
        .filter((m) => m.kind === 'date')
        .map((m) => (
          <span key={m.key} className="Roadmap-nub is-date" style={{ left: x(m.day) + dw / 2 - 3 }} title={m.label} />
        ))}
    </div>
  )
})

const Lines = memo(function Lines({ zoom, dw, rangeStart, totalDays, x, markers }: ScaleProps & { markers: Marker[] }) {
  const lines: number[] = []
  for (let d = rangeStart; d < rangeStart + totalDays; d++) {
    const p = parts(d)
    if (zoom === 'month' ? p.wd === 1 : p.d === 1) lines.push(d)
  }
  return (
    <div className="Roadmap-lines" aria-hidden="true">
      {lines.map((d) => (
        <span key={d} className="Line is-divider" style={{ left: x(d) }} />
      ))}
      {markers.map((m) => (
        <span key={m.key} className={`Line is-${m.kind}`} style={{ left: x(m.day) + (m.kind === 'milestone' || m.kind === 'date' ? dw / 2 : 0) }} />
      ))}
      <span className="Line is-today" style={{ left: x(TODAY) + dw / 2 - 1 }} />
    </div>
  )
})

/* ------------------------------------------------------------------ */

type ControlMenu = 'markers' | 'sort' | 'dates' | 'zoom' | null

function Controls({ view, update, compact, onToday, onPage }: { view: ViewConfig; update: (p: Partial<ViewConfig>) => void; compact: boolean; onToday: () => void; onPage: (dir: number) => void }) {
  const [open, setOpen] = useState<ControlMenu>(null)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [sheet, setSheet] = useState(false)
  const [sheetSub, setSheetSub] = useState<ControlMenu>(null)
  const toggle = (k: ControlMenu) => (e: React.MouseEvent<HTMLButtonElement>) => {
    setAnchor(e.currentTarget)
    setOpen(open === k ? null : k)
  }
  const close = () => setOpen(null)
  const btn = (k: Exclude<ControlMenu, null>, icon: React.ReactNode, label: string) => (
    <Button variant="invisible" size="small" leading={icon} onClick={toggle(k)} ariaExpanded={open === k} className={`Roadmap-control${open === k ? ' is-open' : ''}`}>
      {label}
    </Button>
  )
  const menuFor = (k: ControlMenu, onDone: () => void) =>
    k === 'markers' ? <MarkersMenu view={view} update={update} /> : k === 'sort' ? <SortMenu view={view} update={update} onDone={onDone} /> : k === 'dates' ? <DateFieldsMenu view={view} update={update} onDone={onDone} /> : k === 'zoom' ? <ZoomMenu view={view} update={update} onDone={onDone} /> : null

  return (
    <div className="Roadmap-controls" role="toolbar" aria-label="Roadmap controls">
      {compact ? (
        <Button variant="invisible" size="small" leading={<SlidersIcon />} ariaLabel="Roadmap settings" onClick={() => setSheet(true)} className="Roadmap-control" />
      ) : (
        <>
          {btn('markers', <LocationIcon />, 'Markers')}
          {btn('sort', <SortIcon />, 'Sort')}
          {btn('dates', <CalendarIcon />, 'Date fields')}
          {btn('zoom', <ZoomInIcon />, ZOOM_LABEL[view.zoom])}
        </>
      )}
      <Button variant="invisible" size="small" onClick={onToday} className="Roadmap-control Roadmap-today">
        Today
      </Button>
      <Button variant="invisible" size="small" leading={<ChevronLeftIcon />} ariaLabel="Scroll to previous date range" title="Scroll to previous date range" onClick={() => onPage(-1)} className="Roadmap-control" />
      <Button variant="invisible" size="small" leading={<ChevronRightIcon />} ariaLabel="Scroll to next date range" title="Scroll to next date range" onClick={() => onPage(1)} className="Roadmap-control" />
      {open && (
        <Overlay anchor={anchor} onClose={close} align="start" width={open === 'sort' ? 240 : 220}>
          {menuFor(open, close)}
        </Overlay>
      )}
      {sheet && (
        <div className="Sheet" role="dialog" aria-label="Roadmap settings">
          <div className="Sheet-header">
            {sheetSub && <Button variant="invisible" leading={<ChevronLeftIcon />} ariaLabel="Back" onClick={() => setSheetSub(null)} />}
            <span className="Sheet-title">{sheetSub ? { markers: 'Markers', sort: 'Sort by', dates: 'Dates', zoom: 'Zoom level' }[sheetSub] : ''}</span>
            <Button
              variant="invisible"
              leading={<XIcon />}
              ariaLabel="Close"
              onClick={() => {
                setSheet(false)
                setSheetSub(null)
              }}
            />
          </div>
          {sheetSub ? (
            <div className="Sheet-body">{menuFor(sheetSub, () => setSheetSub(null))}</div>
          ) : (
            <ul className="Menu Sheet-body" role="menu">
              {(
                [
                  ['markers', <LocationIcon key="i" />, 'Markers', markersSummary(view), view.markers.length === 0],
                  ['sort', <SortIcon key="i" />, 'Sort by', sortSummary(view), view.sort.length === 0],
                  ['dates', <CalendarIcon key="i" />, 'Dates', datesSummary(view), false],
                  ['zoom', <ZoomInIcon key="i" />, 'Zoom level', ZOOM_LABEL[view.zoom], false],
                ] as const
              ).map(([k, icon, label, value, italic]) => (
                <li key={k} role="menuitem" tabIndex={0} className="MenuItem" onClick={() => setSheetSub(k)}>
                  <span className="MenuItem-leading">{icon}</span>
                  <span className="MenuItem-main MenuItem-main--row">
                    <span className="MenuItem-label fgMuted">{label}:</span>
                    <span className={`MenuItem-value${italic ? ' is-italic' : ''}`}>{value}</span>
                  </span>
                  <span className="MenuItem-trailing">
                    <ChevronRightIcon />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
