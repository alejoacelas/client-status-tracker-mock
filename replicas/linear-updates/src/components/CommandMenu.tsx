import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { initiatives } from '../data/mock';
import { Glyph, HealthIcon, I } from '../icons';
import { actions, getState, latestProjectUpdate } from '../store';
import { getUI, go, setUI, toast } from '../ui';
import { copyText, cx } from '../util';
import { updateMarkdown } from './UpdateItem';

interface Cmd { id: string; group: string; label: string; icon: ReactNode; keys?: string[]; run: () => void }

export function CommandMenu({ route }: { route: string[] }) {
  const [q, setQ] = useState('');
  const [hl, setHl] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const s = getState();
  const project = route[0] === 'project' ? s.projects.find((p) => p.id === route[1]) : undefined;
  const close = () => setUI({ cmdk: false });

  const cmds: Cmd[] = useMemo(() => {
    const c: Cmd[] = [];
    if (project) {
      const latest = latestProjectUpdate(s, project.id);
      c.push({ id: 'write', group: 'Project', label: 'Write project update…', icon: <I.pencil size={16} />, run: () => { go(`project/${project.id}/overview`); setUI({ composeFor: project.id }); } });
      if (latest) c.push({ id: 'copy-md', group: 'Project', label: 'Copy latest update as Markdown', icon: <I.markdown size={16} />, run: () => { copyText(updateMarkdown(latest)); toast('Update copied as Markdown'); } });
      c.push({ id: 'copy-link', group: 'Project', label: 'Copy project link', icon: <I.link size={16} />, keys: ['⌘', '⇧', ','], run: () => { copyText(window.location.href); toast('Project link copied'); } });
      c.push({ id: 'fav', group: 'Project', label: s.favorites.includes(project.id) ? 'Remove project from favorites' : 'Add project to favorites', icon: <I.star size={16} />, run: () => actions.toggleFavorite(project.id) });
      c.push({ id: 'details', group: 'Project', label: 'Toggle project details', icon: <I.panel size={16} />, keys: ['⌘', 'I'], run: () => setUI({ details: !getUI().details }) });
      c.push({ id: 'updates', group: 'Project', label: 'Open project updates', icon: <I.pulse size={16} />, run: () => go(`project/${project.id}/updates`) });
    }
    c.push({ id: 'go-pulse', group: 'Navigation', label: 'Go to Pulse', icon: <I.pulse size={16} />, keys: ['G', 'U'], run: () => go('pulse') });
    c.push({ id: 'go-init', group: 'Navigation', label: 'Go to initiatives', icon: <I.initiatives size={16} />, keys: ['G', 'I'], run: () => go('initiatives') });
    c.push({ id: 'go-proj', group: 'Navigation', label: 'Go to projects', icon: <I.projects size={16} />, keys: ['G', 'P'], run: () => go('projects') });
    s.projects.forEach((p) => {
      const u = latestProjectUpdate(s, p.id);
      c.push({ id: `p-${p.id}`, group: 'Projects', label: p.name, icon: u ? <span style={{ display: 'inline-flex', gap: 6 }}><Glyph name={p.icon} color={p.color} /><HealthIcon health={u.health} size={14} /></span> : <Glyph name={p.icon} color={p.color} />, run: () => go(`project/${p.id}/overview`) });
    });
    initiatives.forEach((i) => c.push({ id: `i-${i.id}`, group: 'Initiatives', label: i.name, icon: <Glyph name={i.icon} color={i.color} />, run: () => go(`initiative/${i.id}/overview`) }));
    c.push({ id: 'theme', group: 'Settings', label: s.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme', icon: s.theme === 'dark' ? <I.sun size={16} /> : <I.moon size={16} />, keys: ['⌘', '⇧', 'L'], run: () => actions.setTheme(s.theme === 'dark' ? 'light' : 'dark') });
    c.push({ id: 'reset', group: 'Settings', label: 'Reset demo data', icon: <I.trash size={16} />, run: () => { if (window.confirm('Reset the demo data? New updates, comments and reactions will be lost.')) { actions.reset(); toast('Demo data reset'); } } });
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.join('/')]);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return cmds;
    return cmds.filter((c) => c.label.toLowerCase().includes(t) || c.group.toLowerCase().includes(t));
  }, [q, cmds]);
  useEffect(() => setHl(0), [q]);
  useEffect(() => {
    listRef.current?.querySelector('.hl')?.scrollIntoView({ block: 'nearest' });
  }, [hl]);

  const run = (c?: Cmd) => { if (!c) return; close(); c.run(); };
  let lastGroup = '';

  return createPortal(
    <>
      <div className="overlay" onClick={close} />
      <div className="cmdk" role="dialog" aria-label="Command menu">
        {project && <div className="cmdk-context">{project.name}</div>}
        <input
          autoFocus
          className="cmdk-input"
          placeholder="Type a command or search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setHl((h) => Math.min(shown.length - 1, h + 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setHl((h) => Math.max(0, h - 1)); }
            if (e.key === 'Enter') { e.preventDefault(); run(shown[hl]); }
            if (e.key === 'Escape') { e.preventDefault(); close(); }
          }}
        />
        <div className="cmdk-list" ref={listRef}>
          {shown.length === 0 && <div className="cmdk-empty">No results</div>}
          {shown.map((c, i) => {
            const g = c.group !== lastGroup ? <div className="cmdk-group">{c.group}</div> : null;
            lastGroup = c.group;
            return (
              <div key={c.id}>
                {g}
                <button className={cx('cmdk-item', i === hl && 'hl')} onMouseMove={() => setHl(i)} onClick={() => run(c)}>
                  {c.icon}
                  <span className="grow">{c.label}</span>
                  {c.keys && <span className="keys">{c.keys.map((k, j) => <span key={j} className="kbd">{k}</span>)}</span>}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>,
    document.body,
  );
}
