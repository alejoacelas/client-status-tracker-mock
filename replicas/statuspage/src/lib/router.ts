import { useEffect, useState } from 'react'

export interface Route {
  parts: string[]
  query: URLSearchParams
}

function read(): Route {
  const raw = window.location.hash.replace(/^#/, '') || '/'
  const [path, qs = ''] = raw.split('?')
  return { parts: path.split('/').filter(Boolean), query: new URLSearchParams(qs) }
}

export function useRoute(): Route {
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const onChange = () => {
      setRoute(read())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

/** Build an href for the hash router: href('meridian', 'history') -> '#/meridian/history'. */
export function href(...parts: (string | number)[]): string {
  return `#/${parts.join('/')}`
}
