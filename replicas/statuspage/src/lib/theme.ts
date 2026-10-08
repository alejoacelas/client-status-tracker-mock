// The colour slots a Statuspage owner can set, with the values githubstatus.com
// uses. Swap in `statuspageDefaults` to see the product's stock theme.

export interface Theme {
  background: string
  text: string
  textSecondary: string
  border: string
  red: string
  orange: string
  yellow: string
  blue: string
  green: string
  link: string
}

export const githubTheme: Theme = {
  background: '#ffffff',
  text: '#24292e',
  textSecondary: '#6a737d',
  border: '#e1e4e8',
  red: '#dc3545',
  orange: '#e36209',
  yellow: '#dbab09',
  blue: '#0366d6',
  green: '#28a745',
  link: '#0366d6',
}

export const statuspageDefaults: Theme = {
  background: '#ffffff',
  text: '#333333',
  textSecondary: '#aaaaaa',
  border: '#e0e0e0',
  red: '#e74c3c',
  orange: '#e67e22',
  yellow: '#f1c40f',
  blue: '#3498db',
  green: '#2fcc66',
  link: '#3498db',
}

export const theme: Theme = githubTheme

/** Bars for days before a component existed. */
export const NO_DATA = '#b3bac5'

export function applyTheme(t: Theme = theme) {
  const r = document.documentElement.style
  r.setProperty('--bg', t.background)
  r.setProperty('--text', t.text)
  r.setProperty('--text-secondary', t.textSecondary)
  r.setProperty('--border', t.border)
  r.setProperty('--red', t.red)
  r.setProperty('--orange', t.orange)
  r.setProperty('--yellow', t.yellow)
  r.setProperty('--blue', t.blue)
  r.setProperty('--green', t.green)
  r.setProperty('--link', t.link)
}

function hex(c: string): [number, number, number] {
  const n = parseInt(c.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hex(a)
  const [r2, g2, b2] = hex(b)
  const f = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0')
  return `#${f(r1, r2)}${f(g1, g2)}${f(b1, b2)}`
}
