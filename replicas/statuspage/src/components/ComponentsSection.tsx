import { useEffect, useState } from 'react'
import type { ClientPage, StatusComponent } from '../data/statusData'
import {
  STATUS_COLOR_CLASS,
  STATUS_ICON,
  STATUS_LABEL,
  barColor,
  componentDay,
  dayRange,
  formatUptime,
  groupDay,
  rows,
  uptimePercent,
  worst,
  type DayUptime,
} from '../lib/model'
import { href } from '../lib/router'
import { DarkTip, HelpBubble } from './Tooltips'
import { useDayTooltip } from './useDayTooltip'

/** Statuspage shows fewer days on narrow screens. */
export function useBarDays(): number {
  const get = () => {
    const w = window.innerWidth
    return w < 600 ? 30 : w < 900 ? 60 : 90
  }
  const [n, setN] = useState(get)
  useEffect(() => {
    const onResize = () => setN(get())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return n
}

type Bind = ReturnType<typeof useDayTooltip>['bind']

function UptimeBars({
  id,
  days,
  bind,
  activeKey,
  isGroup,
}: {
  id: string
  days: DayUptime[]
  bind: Bind
  activeKey: string | null
  isGroup: boolean
}) {
  const n = days.length
  return (
    <div className="shared-partial uptime-90-days-wrapper">
      <svg
        className="availability-time-line-graphic"
        preserveAspectRatio="none"
        height="34"
        viewBox={`0 0 ${n * 5 - 2} 34`}
        role="list"
        aria-label="Daily uptime"
      >
        {days.map((d, i) => {
          const key = `${id}-${i}`
          return (
            <rect
              key={key}
              height="34"
              width="3"
              x={i * 5}
              y="0"
              fill={barColor(d)}
              role="listitem"
              className={`uptime-day${activeKey === key ? ' active' : ''}`}
              {...bind(key, d, isGroup)}
            />
          )
        })}
      </svg>
      <div className="legend">
        <div className="legend-item legend-item-date-range">
          <span>{n}</span> days ago
        </div>
        <div className="spacer" />
        <div className="legend-item legend-item-uptime-value">
          <span>{formatUptime(uptimePercent(days))}</span> % uptime
        </div>
        <div className="spacer" />
        <div className="legend-item legend-item-date-range">Today</div>
      </div>
    </div>
  )
}

/** The status as text (one column) or as a coloured icon (two columns), with an optional dark tooltip. */
function ComponentStatusText({ status, title }: { status: StatusComponent['status']; title?: string }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const tip = title ?? STATUS_LABEL[status]
  return (
    <>
      <span
        className="component-status"
        onMouseEnter={title ? (e) => setAnchor(e.currentTarget) : undefined}
        onMouseLeave={title ? () => setAnchor(null) : undefined}
      >
        {STATUS_LABEL[status]}
      </span>
      <button
        type="button"
        className={`icon-indicator fa ${STATUS_ICON[status]}`}
        aria-label={STATUS_LABEL[status]}
        onMouseEnter={(e) => setAnchor(e.currentTarget)}
        onMouseLeave={() => setAnchor(null)}
      />
      {anchor && <DarkTip anchor={anchor}>{anchor.classList.contains('icon-indicator') ? STATUS_LABEL[status] : tip}</DarkTip>}
    </>
  )
}

const LEGEND: { cls: string; icon: string; label: string }[] = [
  { cls: 'status-green', icon: 'fa-check', label: 'Operational' },
  { cls: 'status-yellow', icon: 'fa-minus-square', label: 'Degraded Performance' },
  { cls: 'status-orange', icon: 'fa-exclamation-triangle', label: 'Partial Outage' },
  { cls: 'status-red', icon: 'fa-times', label: 'Major Outage' },
  { cls: 'status-blue', icon: 'fa-wrench', label: 'Maintenance' },
]

function StatusLegend() {
  return (
    <div className="component-statuses-legend font-small">
      {LEGEND.flatMap((l, i) => [
        ...(i === 3 ? [<div className="breaker" key="breaker" />] : []),
        <div className={`legend-item ${l.cls}`} key={l.label}>
          <span className={`icon-indicator fa ${l.icon}`} />
          {l.label}
        </div>,
      ])}
    </div>
  )
}

function ComponentRow({
  page,
  comp,
  days,
  bind,
  activeKey,
  child,
}: {
  page: ClientPage
  comp: StatusComponent
  days: number[]
  bind: Bind
  activeKey: string | null
  child?: boolean
}) {
  const data = days.map((d) => componentDay(page, comp, d))
  return (
    <div className={`component-inner-container ${STATUS_COLOR_CLASS[comp.status]} showcased`} data-component-id={comp.id}>
      <span className="name" role="heading" aria-level={child ? 3 : 2}>
        {comp.name}
      </span>
      {comp.description && <HelpBubble text={comp.description} label={comp.name} />}
      <ComponentStatusText status={comp.status} />
      <UptimeBars id={comp.id} days={data} bind={bind} activeKey={activeKey} isGroup={false} />
    </div>
  )
}

function GroupRow({
  page,
  name,
  description,
  children,
  days,
  bind,
  activeKey,
}: {
  page: ClientPage
  name: string
  description?: string
  children: StatusComponent[]
  days: number[]
  bind: Bind
  activeKey: string | null
}) {
  const [open, setOpen] = useState(false)
  const status = worst(children.map((c) => c.status))
  const data = days.map((d) => groupDay(page, children, d))
  const toggle = () => setOpen((o) => !o)
  return (
    <div className={`component-container border-color is-group${open ? ' open' : ''}`}>
      <div
        className={`component-inner-container ${STATUS_COLOR_CLASS[status]}`}
        onClick={(e) => {
          if ((e.target as Element).closest('rect, .tooltip-base')) return
          toggle()
        }}
      >
        <span className="name" role="heading" aria-level={2}>
          <span
            className={`fa group-parent-indicator ${open ? 'fa-minus-square-o' : 'fa-plus-square-o'}`}
            role="button"
            aria-expanded={open}
            aria-label={`Toggle ${name}`}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                toggle()
              }
            }}
          />
          <span>{name}</span>
        </span>
        {description && <HelpBubble text={description} label={name} />}
        <ComponentStatusText
          status={status}
          title="Groups take on the status of their most degraded child component. Click to see the status of the individual components."
        />
        <UptimeBars id={`group-${name}`} days={data} bind={bind} activeKey={activeKey} isGroup />
      </div>
      <div className="child-components-container">
        {children.map((c) => (
          <ComponentRow key={c.id} page={page} comp={c} days={days} bind={bind} activeKey={activeKey} child />
        ))}
      </div>
    </div>
  )
}

export function ComponentsSection({ page }: { page: ClientPage }) {
  const n = useBarDays()
  const days = dayRange(n)
  const { bind, tooltip, activeKey } = useDayTooltip(page)
  const layout = page.layout ?? 'one-column'
  const list = rows(page)
  return (
    <div className="components-section font-regular">
      <div className="components-uptime-link history-footer-link">
        Uptime over the past {n} days. <a href={href(page.key, 'uptime')}>View historical uptime.</a>
      </div>
      <div className={`components-container ${layout}`}>
        {list.map((r) =>
          r.kind === 'component' ? (
            <div className="component-container border-color" key={r.component.id}>
              <ComponentRow page={page} comp={r.component} days={days} bind={bind} activeKey={activeKey} />
            </div>
          ) : (
            <GroupRow
              key={r.name}
              page={page}
              name={r.name}
              description={r.description}
              children={r.children}
              days={days}
              bind={bind}
              activeKey={activeKey}
            />
          ),
        )}
        {layout === 'two-columns' && list.length % 2 === 1 && <div className="component-container border-color filler" />}
      </div>
      {layout === 'two-columns' && <StatusLegend />}
      {tooltip}
    </div>
  )
}
