import { useEffect, useState } from 'react';

export interface Route { path: string[]; query: URLSearchParams }

function parse(): Route {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [p, q = ''] = raw.split('?');
  return { path: p.split('/').filter(Boolean), query: new URLSearchParams(q) };
}

export function useRoute(): Route {
  const [r, setR] = useState(parse);
  useEffect(() => {
    const on = () => setR(parse());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return r;
}

export function href(path: string, query?: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  Object.entries(query || {}).forEach(([k, v]) => v && q.set(k, v));
  const qs = q.toString();
  return '#/' + path.replace(/^\//, '') + (qs ? '?' + qs : '');
}

export function go(path: string, query?: Record<string, string | undefined>) {
  window.location.hash = href(path, query).slice(1);
}

/** Change one query parameter on the current route. */
export function setQuery(key: string, value: string | undefined) {
  const r = parse();
  if (value) r.query.set(key, value);
  else r.query.delete(key);
  const qs = r.query.toString();
  window.location.hash = '/' + r.path.join('/') + (qs ? '?' + qs : '');
}
