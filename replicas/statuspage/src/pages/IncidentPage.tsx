import { useState } from 'react'
import type { ClientPage, Incident } from '../data/statusData'
import { PageFooter, SubscribeModal } from '../components/IncidentBlocks'
import {
  UPDATE_LABEL,
  affectedNames,
  impactClass,
  isMaintenance,
  isUnresolved,
  maintenanceState,
  updatesNewestFirst,
} from '../lib/model'
import { href } from '../lib/router'
import { ago, fmtLong, fmtWindowShort, parse } from '../lib/time'

export function IncidentPage({ page, inc }: { page: ClientPage; inc: Incident }) {
  const [modal, setModal] = useState(false)
  const maint = isMaintenance(inc)
  const state = maint ? maintenanceState(inc) : null
  const open = isUnresolved(inc) || state === 'upcoming'
  const affected = affectedNames(page, inc)
  const affectedText = maint
    ? `This scheduled maintenance ${state === 'completed' ? 'affected' : 'affects'}: ${affected}.`
    : `This incident ${open ? 'affects' : 'affected'}: ${affected}.`

  return (
    <div className="layout-content status status-incident">
      <div className="container">
        <div className="page-title">
          <h1 className={`color-primary incident-name whitespace-pre-wrap ${impactClass(inc.impact)}`}>{inc.name}</h1>
          {state === 'upcoming' ? (
            <div className="font-largest color-secondary subheader scheduled-for">
              Scheduled for {fmtWindowShort(parse(inc.scheduledFor!), parse(inc.scheduledUntil!))}
            </div>
          ) : (
            <div className="font-largest color-secondary subheader">
              {maint ? 'Scheduled Maintenance Report' : 'Incident Report'} for <a href={href(page.key)}>{page.name}</a>
            </div>
          )}
          {open && (
            <div className="subscribe-button">
              <button className="flat-button" onClick={() => setModal(true)}>
                Subscribe to Updates
              </button>
            </div>
          )}
        </div>

        <div className="incident-updates-container">
          {updatesNewestFirst(inc).map((u, i) => (
            <div className="row update-row" key={i}>
              <h2 className="update-title font-large">{UPDATE_LABEL[u.status]}</h2>
              <div className="update-container">
                <div className="update-body font-regular">
                  <span className="whitespace-pre-wrap">{u.body}</span>
                </div>
                <div className="update-timestamp font-small color-secondary">
                  Posted {ago(parse(u.at))}. {fmtLong(parse(u.at))}
                </div>
              </div>
            </div>
          ))}
          {affected && <div className="components-affected font-small color-secondary border-color">{affectedText}</div>}
        </div>

        <PageFooter link={{ href: href(page.key), label: 'Current Status' }} />
      </div>
      {modal && <SubscribeModal incident={inc} onClose={() => setModal(false)} />}
    </div>
  )
}
