import { forwardRef } from 'react'
import { createPortal } from 'react-dom'
import type { ClientPage } from '../data/statusData'
import { hrsMins, type DayUptime } from '../lib/model'
import { href } from '../lib/router'
import { fmtTooltipDay } from '../lib/time'

export interface Anchor {
  /** Horizontal centre of the hovered bar, in document coordinates. */
  x: number
  /** Bottom edge of the hovered bar, in document coordinates. */
  bottom: number
}

interface Props {
  page: ClientPage
  day: DayUptime
  anchor: Anchor
  isGroup: boolean
  pinned: boolean
  onClose: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}

const BOX = 325

export const UptimeTooltip = forwardRef<HTMLDivElement, Props>(function UptimeTooltip(
  { page, day, anchor, isGroup, pinned, onClose, onMouseEnter, onMouseLeave },
  ref,
) {
  const docW = document.documentElement.clientWidth
  const boxW = docW <= 450 ? 290 : BOX
  const left = Math.max(8, Math.min(anchor.x - boxW / 2, docW - boxW - 8))
  const top = anchor.bottom + 10
  const major = hrsMins(day.major)
  const partial = hrsMins(day.partial)
  const noDowntime = day.hasData && day.major === 0 && day.partial === 0

  return createPortal(
    <div
      ref={ref}
      className="uptime-tooltip"
      role="tooltip"
      style={{ left: 0, top: 0 }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="pointer-container" style={{ left: anchor.x - 9, top }}>
        <div className="pointer-larger" />
        <div className="pointer-smaller" />
      </div>
      <div className="tooltip-box" style={{ left, top, width: boxW }}>
        <div className="tooltip-content">
          {pinned && (
            <button className="tooltip-close" aria-label="Close" onClick={onClose}>
              <i className="fa fa-times" />
            </button>
          )}
          <div className="date">{fmtTooltipDay(day.day)}</div>
          <div className="outages">
            {!day.hasData && <div className="no-data-msg">No data exists for this day.</div>}
            {noDowntime && <div className="no-outages-msg">No downtime recorded on this day.</div>}
            {isGroup ? (
              <>
                {!!day.majorCount && (
                  <div className="outage-count">
                    <i className="fa fa-times major_outage" />
                    <span className="count">{day.majorCount} {day.majorCount === 1 ? 'component' : 'components'}</span> had a
                    major outage.
                  </div>
                )}
                {!!day.partialCount && (
                  <div className="outage-count">
                    <i className="fa fa-exclamation-triangle partial_outage" />
                    <span className="count">{day.partialCount} {day.partialCount === 1 ? 'component' : 'components'}</span>{' '}
                    had a partial outage.
                  </div>
                )}
              </>
            ) : (
              <>
                {day.major > 0 && (
                  <div className="outage-field major">
                    <span className="label">
                      <i className="fa fa-times major_outage" />
                      Major outage
                    </span>
                    <span className="value-hrs">{major.hrs}</span>
                    <span className="value-mins">{major.mins}</span>
                  </div>
                )}
                {day.partial > 0 && (
                  <div className="outage-field partial">
                    <span className="label">
                      <i className="fa fa-exclamation-triangle partial_outage" />
                      Partial outage
                    </span>
                    <span className="value-hrs">{partial.hrs}</span>
                    <span className="value-mins">{partial.mins}</span>
                  </div>
                )}
              </>
            )}
          </div>
          {day.related.length > 0 && (
            <div className="related-events">
              <h3>Related</h3>
              <ul>
                {day.related.map((inc) => (
                  <li className="related-event" key={inc.id}>
                    <a href={href(page.key, 'incidents', inc.id)}>{inc.name}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
})
