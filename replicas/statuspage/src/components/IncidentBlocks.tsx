import { useState, type FormEvent } from 'react'
import { agency, type ClientPage, type Incident } from '../data/statusData'
import {
  UPDATE_LABEL,
  activeIncidents,
  impactClass,
  incidentsOnDay,
  upcomingMaintenance,
  updatesNewestFirst,
} from '../lib/model'
import { href } from '../lib/router'
import { DAY, fmtDay, fmtLong, fmtPosted, fmtShort, fmtWindow, parse, today } from '../lib/time'

export function SubscribeModal({ incident, onClose }: { incident: Incident; onClose: () => void }) {
  const [done, setDone] = useState(false)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    setDone(true)
  }
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <form className="modal" role="dialog" aria-modal="true" aria-labelledby="incident-subscription-dialog-header" onSubmit={submit}>
        <div className="modal-header">
          <button type="button" className="close" aria-label="close" onClick={onClose}>
            ×
          </button>
          <h1 id="incident-subscription-dialog-header">Subscribe to Incident</h1>
        </div>
        <div className="modal-body">
          {done ? (
            <p>
              You will get an email each time <strong>{incident.name}</strong> is updated. (Mock: nothing was sent.)
            </p>
          ) : (
            <>
              <p style={{ marginBottom: 25 }}>
                Get email notifications when {agency.name} <strong>updates</strong> or <strong>resolves</strong> this
                incident.
              </p>
              <label htmlFor="incident-email">Email address:</label>
              <input id="incident-email" type="text" className="full-width" required />
            </>
          )}
        </div>
        <div className="modal-footer">
          {done ? (
            <button type="button" className="flat-button" onClick={onClose}>
              Close
            </button>
          ) : (
            <button type="submit" className="flat-button">
              Subscribe to Incident
            </button>
          )}
        </div>
      </form>
    </>
  )
}

export function UnresolvedIncidents({ page }: { page: ClientPage }) {
  const [modal, setModal] = useState<Incident | null>(null)
  const list = activeIncidents(page)
  if (list.length === 0) return null
  return (
    <div className="unresolved-incidents">
      {list.map((inc) => (
        <div className={`unresolved-incident ${impactClass(inc.impact)}`} key={inc.id}>
          <div className="incident-title font-large">
            <a className="whitespace-pre-wrap actual-title" href={href(page.key, 'incidents', inc.id)}>
              {inc.name}
            </a>
            <a
              className="subscribe"
              role="button"
              href="#"
              onClick={(e) => {
                e.preventDefault()
                setModal(inc)
              }}
            >
              Subscribe
            </a>
          </div>
          <div className="updates font-regular">
            {updatesNewestFirst(inc).map((u, i) => (
              <div className="update" key={i}>
                <strong>{UPDATE_LABEL[u.status]}</strong> - <span className="whitespace-pre-wrap">{u.body}</span>
                <br />
                <small>{fmtLong(parse(u.at))}</small>
              </div>
            ))}
          </div>
        </div>
      ))}
      {modal && <SubscribeModal incident={modal} onClose={() => setModal(null)} />}
    </div>
  )
}

export function ScheduledMaintenances({ page }: { page: ClientPage }) {
  const list = upcomingMaintenance(page)
  if (list.length === 0) return null
  return (
    <div className="scheduled-maintenances-container">
      <h2 className="font-largest">Scheduled Maintenance</h2>
      {list.map((m) => {
        const first = updatesNewestFirst(m)[0]
        return (
          <div className="scheduled-maintenance" key={m.id}>
            <h3 className="incident-title font-large border-color">
              <a href={href(page.key, 'incidents', m.id)} className="color-primary" title={m.name}>
                <span className="whitespace-pre-wrap">{m.name}</span>
              </a>
              <small>{fmtWindow(parse(m.scheduledFor!), parse(m.scheduledUntil!))}</small>
            </h3>
            <div className="updates-container font-regular">
              <div className="update">
                <span className="whitespace-pre-wrap">{first.body}</span>
                <br />
                <small>Posted on {fmtPosted(parse(first.at))}</small>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function IncidentSummary({ page, inc }: { page: ClientPage; inc: Incident }) {
  return (
    <div className="incident-container">
      <div className={`incident-title ${impactClass(inc.impact)} font-large`}>
        <a className="whitespace-pre-wrap" href={href(page.key, 'incidents', inc.id)}>
          {inc.name}
        </a>
      </div>
      <div className="updates-container">
        {updatesNewestFirst(inc).map((u, i) => (
          <div className={`update font-regular ${u.status}`} key={i}>
            <strong>{UPDATE_LABEL[u.status]}</strong> - <span className="whitespace-pre-wrap">{u.body}</span>
            <br />
            <small>{fmtShort(parse(u.at))}</small>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Today and the 14 days before it, newest first. */
export function PastIncidents({ page }: { page: ClientPage }) {
  const days = Array.from({ length: 15 }, (_, i) => today - i * DAY)
  return (
    <div className="incidents-list format-expanded">
      <h2 className="font-largest" id="past-incidents">
        Past Incidents
      </h2>
      {days.map((d, i) => {
        const list = incidentsOnDay(page, d)
        return (
          <div className={`status-day font-regular${list.length === 0 ? ' no-incidents' : ''}`} key={d}>
            <h3 className="date border-color font-large">{fmtDay(d)}</h3>
            {list.length === 0 ? (
              <p className="color-secondary">{i === 0 ? 'No incidents reported today.' : 'No incidents reported.'}</p>
            ) : (
              list.map((inc) => <IncidentSummary page={page} inc={inc} key={inc.id} />)
            )}
          </div>
        )
      })}
    </div>
  )
}

export function PageFooter({ link }: { link: { href: string; label: string; back?: boolean } }) {
  return (
    <div className="page-footer border-color font-small">
      <a href={link.href} className="history-footer-link">
        <span style={{ fontFamily: 'arial' }} aria-hidden="true">
          ←
        </span>{' '}
        {link.label}
      </a>
      <span className="color-secondary powered-by">Powered by {agency.name}</span>
    </div>
  )
}
