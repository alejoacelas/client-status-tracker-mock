import { agency, type ClientPage } from '../data/statusData'
import { historyIncidents, updatesNewestFirst, UPDATE_LABEL } from './model'
import { fmtShort, parse } from './time'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** An RSS 2.0 feed of the page's incident history, built in the browser. */
export function feedXml(page: ClientPage): string {
  const items = historyIncidents(page)
    .map((inc) => {
      const body = updatesNewestFirst(inc)
        .map((u) => `<p><small>${fmtShort(parse(u.at))}</small><br><strong>${UPDATE_LABEL[u.status]}</strong> - ${esc(u.body)}</p>`)
        .join('')
      const pub = new Date(parse(updatesNewestFirst(inc)[0].at)).toUTCString()
      return `<item><title>${esc(inc.name)}</title><description>${esc(body)}</description><pubDate>${pub}</pubDate><guid>${page.key}-${inc.id}</guid></item>`
    })
    .join('')
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(page.name)} status - ${esc(agency.name)}</title><description>Incident history</description>${items}</channel></rss>`
}
