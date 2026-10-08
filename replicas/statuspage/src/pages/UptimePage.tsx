import type { ClientPage } from '../data/statusData'
import { PageFooter } from '../components/IncidentBlocks'
import { Masthead } from '../components/Masthead'
import { useDayTooltip } from '../components/useDayTooltip'
import { barColor, componentDay, formatUptime, rows, uptimePercent } from '../lib/model'
import { href } from '../lib/router'
import { DAY, monthKey, monthName, now, parse, today } from '../lib/time'
import { HistoryNav, MONTHS_PER_PAGE, Pagination } from './HistoryPage'

const idx = (y: number, m: number) => y * 12 + m
const FUTURE = '#eaeaea'

export function UptimePage({ page, componentId, pageNum }: { page: ClientPage; componentId: string | null; pageNum: number }) {
  const comp = page.components.find((c) => c.id === componentId) ?? page.components[0]
  const { bind, tooltip, activeKey } = useDayTooltip(page)
  const nowK = monthKey(now)
  const endIdx = idx(nowK.y, nowK.m) - (pageNum - 1) * MONTHS_PER_PAGE
  const startIdx = endIdx - MONTHS_PER_PAGE + 1
  const sinceK = monthKey(parse(comp.since))
  const firstIdx = idx(sinceK.y, sinceK.m)
  const base = `${href(page.key, 'uptime')}?component=${comp.id}`

  const months = Array.from({ length: MONTHS_PER_PAGE }, (_, i) => {
    const mi = startIdx + i
    return { y: Math.floor(mi / 12), m: mi % 12 }
  })

  return (
    <div className="layout-content status status-full-history">
      <Masthead page={page} />
      <div className="container">
        <HistoryNav page={page} current="uptime" />
        <div className="uptime-calendar">
          <div className="uptime-header">
            <div className="component-selector">
              <div className="select-wrapper">
                <select
                  aria-label="Select Component"
                  value={comp.id}
                  onChange={(e) => {
                    window.location.hash = `${href(page.key, 'uptime')}?component=${e.target.value}&page=${pageNum}`.slice(1)
                  }}
                >
                  {rows(page).map((r) =>
                    r.kind === 'component' ? (
                      <option key={r.component.id} value={r.component.id}>
                        {r.component.name}
                      </option>
                    ) : (
                      <optgroup key={r.name} label={r.name}>
                        {r.children.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </optgroup>
                    ),
                  )}
                </select>
              </div>
            </div>
            <Pagination
              startIdx={startIdx}
              endIdx={endIdx}
              prevHref={startIdx > firstIdx ? `${base}&page=${pageNum + 1}` : null}
              nextHref={pageNum > 1 ? `${base}&page=${pageNum - 1}` : null}
            />
          </div>
          <div className="uptime-calendar-display">
            {months.map(({ y, m }) => {
              const first = Date.UTC(y, m, 1)
              const count = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
              const offset = new Date(first).getUTCDay()
              const days = Array.from({ length: count }, (_, i) => componentDay(page, comp, first + i * DAY))
              const measured = days.filter((d) => d.hasData)
              return (
                <div className="calendar-month" key={`${y}-${m}`}>
                  <div className="month-header">
                    <h2 className="month-name">
                      {monthName(m)} {y}
                    </h2>
                    {measured.length > 0 && <small className="month-uptime">{formatUptime(uptimePercent(measured))}%</small>}
                  </div>
                  <div className="days">
                    {Array.from({ length: offset }, (_, i) => (
                      <svg className="day" width="32" height="32" key={`pad-${i}`} aria-hidden="true" style={{ visibility: 'hidden' }} />
                    ))}
                    {days.map((d, i) => {
                      const future = d.day > today
                      const key = `cal-${y}-${m}-${i}`
                      return future ? (
                        <svg className="day" width="32" height="32" key={key} aria-hidden="true">
                          <rect width="32" height="32" fill={FUTURE} />
                        </svg>
                      ) : (
                        <svg
                          className={`day active${activeKey === key ? ' selected' : ''}`}
                          width="32"
                          height="32"
                          key={key}
                          role="img"
                          aria-label={`${monthName(m)} ${i + 1}`}
                          {...bind(key, d, false)}
                        >
                          <rect width="32" height="32" fill={d.hasData ? barColor(d) : FUTURE} />
                        </svg>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <PageFooter link={{ href: href(page.key), label: 'Current Status' }} />
      </div>
      {tooltip}
    </div>
  )
}
