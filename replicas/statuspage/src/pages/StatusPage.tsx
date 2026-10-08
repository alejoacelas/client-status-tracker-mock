import type { ClientPage } from '../data/statusData'
import { ComponentsSection } from '../components/ComponentsSection'
import {
  PageFooter,
  PastIncidents,
  ScheduledMaintenances,
  UnresolvedIncidents,
} from '../components/IncidentBlocks'
import { Masthead } from '../components/Masthead'
import { activeIncidents, pageStatus } from '../lib/model'
import { href } from '../lib/router'

export function StatusPage({ page }: { page: ClientPage }) {
  const status = pageStatus(page)
  const hasActive = activeIncidents(page).length > 0
  return (
    <div className="layout-content status status-index">
      <Masthead page={page} />
      <div className="container" role="main">
        {hasActive ? (
          <UnresolvedIncidents page={page} />
        ) : (
          <div className={`page-status ${status.className}`}>
            <h2 className="status font-large">{status.text}</h2>
          </div>
        )}

        <div className="text-section">
          <h2 className="font-largest color-primary">About This Site</h2>
          <div className="font-regular color-secondary">{page.about}</div>
        </div>

        <ComponentsSection page={page} />
        <ScheduledMaintenances page={page} />
        <PastIncidents page={page} />
        <PageFooter link={{ href: href(page.key, 'history'), label: 'Incident History' }} />
      </div>
    </div>
  )
}
