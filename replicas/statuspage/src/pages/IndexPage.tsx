import { clients } from '../data/statusData'
import { Masthead } from '../components/Masthead'
import { activeIncidents, pageStatus, upcomingMaintenance } from '../lib/model'
import { href } from '../lib/router'

/** Not a Statuspage view: a directory of the per-client pages, styled like a component list. */
export function IndexPage() {
  return (
    <div className="layout-content status status-index client-index">
      <Masthead />
      <div className="container" role="main">
        <div className="text-section">
          <h2 className="font-largest color-primary">Client status pages</h2>
          <div className="font-regular color-secondary">
            One page per client. Each workstream is a component; risks and blockers are posted as incidents and
            upcoming milestones as scheduled maintenance.
          </div>
        </div>
        <div className="components-section font-regular">
          <div className="components-container one-column">
            {clients.map((c) => {
              const s = pageStatus(c)
              const open = activeIncidents(c)
              const upcoming = upcomingMaintenance(c)
              const colour = {
                'status-none': 'status-green',
                'status-minor': 'status-yellow',
                'status-major': 'status-orange',
                'status-critical': 'status-red',
                'status-maintenance': 'status-blue',
              }[s.className]
              return (
                <div className="component-container border-color client-row" key={c.key}>
                  <div className={`component-inner-container ${colour}`}>
                    <a className="name" href={href(c.key)}>
                      {c.name}
                    </a>
                    <span className="component-status">{s.text}</span>
                    <span className="detail">
                      {open.length === 0 ? 'No open incidents' : `${open.length} open: ${open.map((i) => i.name).join('; ')}`}
                      {upcoming.length > 0 && ` · next milestone: ${upcoming[0].name}`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="page-footer border-color font-small">
          <span className="color-secondary powered-by">Powered by Fieldwork Studio</span>
        </div>
      </div>
    </div>
  )
}
