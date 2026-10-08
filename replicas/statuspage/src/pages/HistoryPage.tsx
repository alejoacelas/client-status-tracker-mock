import { useState } from 'react'
import type { ClientPage, Incident } from '../data/statusData'
import { PageFooter } from '../components/IncidentBlocks'
import { Masthead } from '../components/Masthead'
import { endOf, historyIncidents, impactClass, startOf, updatesNewestFirst } from '../lib/model'
import { href } from '../lib/router'
import { fmtRange, monthKey, monthName, now, parse } from '../lib/time'

export const MONTHS_PER_PAGE = 3

/** Month index counted from year 0, so months can be stepped through with plain arithmetic. */
const idx = (y: number, m: number) => y * 12 + m
const fromIdx = (i: number) => ({ y: Math.floor(i / 12), m: i % 12 })

export function firstMonthIndex(page: ClientPage): number {
  const earliest = Math.min(...page.components.map((c) => parse(c.since)), ...historyIncidents(page).map(startOf))
  const k = monthKey(earliest)
  return idx(k.y, k.m)
}

export function HistoryNav({ page, current }: { page: ClientPage; current: 'incidents' | 'uptime' }) {
  return (
    <div className="history-nav border-color" role="navigation">
      <a
        className={`button border-color${current === 'incidents' ? ' current' : ''}`}
        href={href(page.key, 'history')}
        aria-current={current === 'incidents' ? 'page' : undefined}
      >
        Incidents
      </a>
      <a
        className={`button border-color${current === 'uptime' ? ' current' : ''}`}
        href={href(page.key, 'uptime')}
        aria-current={current === 'uptime' ? 'page' : undefined}
      >
        Uptime
      </a>
    </div>
  )
}

export function Pagination({
  startIdx,
  endIdx,
  prevHref,
  nextHref,
}: {
  startIdx: number
  endIdx: number
  prevHref: string | null
  nextHref: string | null
}) {
  const s = fromIdx(startIdx)
  const e = fromIdx(endIdx)
  return (
    <div className="pagination-container">
      <div className="pagination">
        <a
          href={prevHref ?? '#'}
          className={`previous-page border-color color-secondary${prevHref ? '' : ' disabled'}`}
          aria-label="Previous page"
          aria-disabled={!prevHref}
        >
          <i className="fa fa-chevron-left" />
        </a>
        <span className="current">
          {monthName(s.m)} {s.y} to {monthName(e.m)} {e.y}
        </span>
        <a
          href={nextHref ?? '#'}
          className={`next-page border-color color-secondary${nextHref ? '' : ' disabled'}`}
          aria-label="Next page"
          aria-disabled={!nextHref}
        >
          <i className="fa fa-chevron-right" />
        </a>
      </div>
    </div>
  )
}

function Month({ page, y, m, incidents }: { page: ClientPage; y: number; m: number; incidents: Incident[] }) {
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? incidents : incidents.slice(0, 3)
  return (
    <div className="month">
      <h2 className="month-title font-largest border-color">
        {monthName(m)}&nbsp;{y}
      </h2>
      <div className="month-content">
        {incidents.length === 0 ? (
          <small className="no-incidents color-secondary">No incidents reported for this month.</small>
        ) : (
          <div className="incident-history">
            <div className="incident-list">
              {shown.map((inc) => (
                <div className="incident-data incident-container" key={inc.id}>
                  <a href={href(page.key, 'incidents', inc.id)} className={`${impactClass(inc.impact)} incident-title font-large`}>
                    {inc.name}
                  </a>
                  <div className="message incident-body color-primary">{updatesNewestFirst(inc)[0].body}</div>
                  <div className="secondary font-small color-secondary">{fmtRange(startOf(inc), endOf(inc))}</div>
                </div>
              ))}
            </div>
            {incidents.length > 3 && (
              <div
                className="expand-incidents font-small border-color color-secondary"
                role="button"
                tabIndex={0}
                aria-expanded={expanded}
                onClick={() => setExpanded((x) => !x)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setExpanded((x) => !x)
                  }
                }}
              >
                {expanded ? '- Collapse Incidents' : `+ Show All ${incidents.length} Incidents`}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function HistoryPage({ page, pageNum }: { page: ClientPage; pageNum: number }) {
  const nowK = monthKey(now)
  const endIdx = idx(nowK.y, nowK.m) - (pageNum - 1) * MONTHS_PER_PAGE
  const startIdx = endIdx - MONTHS_PER_PAGE + 1
  const first = firstMonthIndex(page)
  const all = historyIncidents(page)
  const months = Array.from({ length: MONTHS_PER_PAGE }, (_, i) => fromIdx(endIdx - i))

  return (
    <div className="layout-content status status-full-history">
      <Masthead page={page} />
      <div className="container">
        <HistoryNav page={page} current="incidents" />
        <div className="history-backpage">
          <div className="history-header">
            <Pagination
              startIdx={startIdx}
              endIdx={endIdx}
              prevHref={startIdx > first ? `${href(page.key, 'history')}?page=${pageNum + 1}` : null}
              nextHref={pageNum > 1 ? `${href(page.key, 'history')}?page=${pageNum - 1}` : null}
            />
          </div>
          <div className="months-container">
            {months.map(({ y, m }) => (
              <Month
                key={`${pageNum}-${y}-${m}`}
                page={page}
                y={y}
                m={m}
                incidents={all.filter((inc) => {
                  const k = monthKey(startOf(inc))
                  return k.y === y && k.m === m
                })}
              />
            ))}
          </div>
        </div>
        <PageFooter link={{ href: href(page.key), label: 'Current Status' }} />
      </div>
    </div>
  )
}
