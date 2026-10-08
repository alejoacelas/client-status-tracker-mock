import { useSyncExternalStore } from 'react'

// Hash routes mirror the original's URLs: #/views/1?pane=issue&item=harbor-shop

export interface Route {
  viewId: number | null
  itemId: string | null
}

function parse(): Route {
  const h = window.location.hash.replace(/^#/, '')
  const [path, query = ''] = h.split('?')
  const m = path.match(/^\/views\/(\d+)/)
  const params = new URLSearchParams(query)
  return { viewId: m ? Number(m[1]) : null, itemId: params.get('pane') === 'issue' ? params.get('item') : null }
}

let current = parse()
const listeners = new Set<() => void>()
window.addEventListener('hashchange', () => {
  current = parse()
  listeners.forEach((l) => l())
})

export function useRoute(): Route {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => current,
  )
}

export function navigate(viewId: number | null, itemId: string | null = null) {
  const path = viewId ? `/views/${viewId}` : '/'
  const q = itemId ? `?pane=issue&item=${encodeURIComponent(itemId)}` : ''
  const next = `#${path}${q}`
  if (window.location.hash !== next) window.location.hash = next
}
