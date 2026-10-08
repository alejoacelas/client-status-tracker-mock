import { useEffect } from 'react'
import { agency } from './data/statusData'
import { getClient } from './lib/model'
import { href, useRoute } from './lib/router'
import { HistoryPage } from './pages/HistoryPage'
import { IncidentPage } from './pages/IncidentPage'
import { IndexPage } from './pages/IndexPage'
import { StatusPage } from './pages/StatusPage'
import { UptimePage } from './pages/UptimePage'

function NotFound() {
  return (
    <div className="layout-content status status-incident">
      <div className="container">
        <div className="page-title">
          <h1 className="incident-name">Page not found</h1>
          <div className="font-largest color-secondary subheader">
            <a href={href('')}>See all client status pages</a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const { parts, query } = useRoute()
  const page = parts[0] ? getClient(parts[0]) : undefined
  const pageNum = Math.max(1, Number(query.get('page')) || 1)

  let title = `${agency.name} Status`
  let view = <NotFound />
  if (parts.length === 0) {
    view = <IndexPage />
  } else if (page && parts.length === 1) {
    title = `${page.name} Status`
    view = <StatusPage page={page} />
  } else if (page && parts[1] === 'history') {
    title = `${page.name} Status - Incident History`
    view = <HistoryPage page={page} pageNum={pageNum} />
  } else if (page && parts[1] === 'uptime') {
    title = `${page.name} Status - Uptime History`
    view = <UptimePage page={page} componentId={query.get('component')} pageNum={pageNum} />
  } else if (page && parts[1] === 'incidents' && parts[2]) {
    const inc = page.incidents.find((i) => i.id === parts[2])
    if (inc) {
      title = `${page.name} Status - ${inc.name}`
      view = <IncidentPage page={page} inc={inc} />
    }
  }

  useEffect(() => {
    document.title = title
  }, [title])

  return view
}
