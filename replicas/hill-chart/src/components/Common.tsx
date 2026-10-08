import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { AGENCY, PEOPLE, PROJECTS, type PersonKey } from '../data';
import { Activity, Bookmark, Calendar, ChevronDown, Dots, Globe, Pie, Star } from './Icons';

// ---------- routing (hash based so the static build works anywhere) ----------
const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};
export function useRoute() {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash);
  return hash.replace(/^#/, '') || '/';
}
export const go = (path: string) => {
  window.location.hash = path;
};

// ---------- avatars ----------
export function Avatar({ who, size = 32 }: { who: PersonKey; size?: number }) {
  const p = PEOPLE[who];
  const initials = p.name.replace('Dr. ', '').split(' ').map((s) => s[0]).join('').slice(0, 2);
  return (
    <span className="avatar" style={{ width: size, height: size, background: p.color, fontSize: size * 0.4 }} title={p.name} aria-hidden="true">
      {initials}
    </span>
  );
}

// ---------- the account mark that replaces the product logo ----------
export function Mark({ size = 34 }: { size?: number }) {
  return (
    <span className="mark" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 34 34" width={size} height={size}>
        <circle cx="17" cy="17" r="16" fill="rgb(41 53 60)" />
        <text x="17" y="22.2" textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff" fontFamily="inherit">
          FS
        </text>
      </svg>
    </span>
  );
}

// ---------- click-outside popover helper ----------
export function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return { open, setOpen, ref };
}

// ---------- the switcher at the top of every screen and its menu ----------
export function Switcher() {
  const { open, setOpen, ref } = usePopover();
  const [q, setQ] = useState('');
  const projects = PROJECTS.filter((p) => `${p.name} ${p.client}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="switcher" ref={ref}>
      <button className="switcher__button" onClick={() => setOpen(!open)} aria-expanded={open}>
        <Mark />
        <span className="switcher__name">{AGENCY}</span>
        <ChevronDown width={18} height={18} strokeWidth={2.2} />
      </button>
      {open && (
        <div className="umenu" role="dialog" aria-label="Jump menu">
          <div className="umenu__tiles">
            {[
              ['Activity', <Activity key="a" width={28} height={28} />],
              ['Calendar', <Calendar key="c" width={28} height={28} />],
              ['Reports', <Pie key="r" width={28} height={28} />],
              ['Everything', <Globe key="e" width={28} height={28} />],
            ].map(([label, icon]) => (
              <button key={label as string} className="umenu__tile" onClick={() => { setOpen(false); go('/'); }}>
                {icon}
                <span>{label}</span>
              </button>
            ))}
          </div>
          <input
            className="umenu__search"
            placeholder="Search or jump to a project, person, or recent page"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />
          <div className="umenu__section">Projects</div>
          <ul className="umenu__list">
            {projects.map((p) => (
              <li key={p.key}>
                <a href={`#/p/${p.key}`} onClick={() => setOpen(false)}>
                  <span className="umenu__star"><Star size={22} /></span>
                  <span className="umenu__item-name">{p.name}</span>
                  <span className="umenu__item-meta"> - for {p.client}</span>
                </a>
              </li>
            ))}
            {projects.length === 0 && <li className="umenu__empty">No matches</li>}
          </ul>
          <div className="umenu__footer">
            <Avatar who="maya" size={26} />
            <a href="#/">Home</a> · <span>My Activity</span> · <span>Account &amp; Settings</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- the white screen that holds a project or tool ----------
export function Screen({ tint, bar, children }: { tint?: string; bar: ReactNode; children: ReactNode }) {
  useEffect(() => {
    document.body.style.background = tint ?? 'rgb(254 250 246)';
  }, [tint]);
  return (
    <div className="app">
      <Switcher />
      <main className="screen">
        <div className="bar">{bar}</div>
        {children}
      </main>
    </div>
  );
}

export function ToolBar({ projectKey, sub }: { projectKey: string; sub?: { label: string; href: string } }) {
  const p = PROJECTS.find((x) => x.key === projectKey)!;
  const [marked, setMarked] = useState(false);
  return (
    <>
      <span className="bar__crumbs">
        <a className="bar__crumb" href={`#/p/${p.key}`}>
          {p.name}
        </a>
        {sub && (
          <>
            <span className="bar__sep" aria-hidden="true">›</span>
            <a className="bar__sub" href={sub.href}>
              {sub.label}
            </a>
          </>
        )}
      </span>
      <span className="bar__actions">
        <button className="bar__action" onClick={() => setMarked(!marked)}>
          <Bookmark fill={marked ? 'currentColor' : 'none'} />
          {marked ? 'Bookmarked' : 'Bookmark'}
        </button>
        <button className="bar__action bar__action--icon" aria-label="More">
          <Dots />
        </button>
      </span>
    </>
  );
}
