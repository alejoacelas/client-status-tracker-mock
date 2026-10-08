import { useState, type ReactNode } from 'react';
import { initiatives, WORKSPACE } from '../data/mock';
import { Glyph, I } from '../icons';
import { actions, useStore } from '../store';
import { go, setUI, useUI } from '../ui';
import { cx } from '../util';
import { Menu, Tooltip, useAnchor } from './Menu';

function NavItem({ to, icon, label, active, count, sub }: { to: string; icon: ReactNode; label: string; active: boolean; count?: string; sub?: boolean }) {
  return (
    <a href={`#/${to}`} className={cx('nav-item', active && 'active', sub && 'sub')} onClick={() => setUI({ sidebarOpen: false })}>
      {icon}
      <span className="label">{label}</span>
      {count && <span className="count">{count}</span>}
    </a>
  );
}

function Section({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="nav-section">
      <button className={cx('nav-section-title', !open && 'collapsed')} onClick={() => setOpen(!open)}>
        {title}
        <I.caretDown />
      </button>
      {open && <div className="nav">{children}</div>}
    </div>
  );
}

export function Sidebar({ route }: { route: string[] }) {
  const s = useStore((s) => s);
  const open = useUI((u) => u.sidebarOpen);
  const ws = useAnchor();
  const [teamOpen, setTeamOpen] = useState(true);
  const path = route.join('/');
  const is = (p: string) => path === p || path.startsWith(p + '/');

  return (
    <>
      <div className={cx('scrim', open && 'open')} onClick={() => setUI({ sidebarOpen: false })} />
      <nav className={cx('sidebar', open && 'open')} aria-label="Sidebar">
        <div className="sidebar-top">
          <button className="ws-switch" onClick={ws.open}>
            <span className="ws-mark">{WORKSPACE.initials}</span>
            {WORKSPACE.name}
            <I.chevronDown size={12} className="chev" />
          </button>
          <div className="sidebar-actions">
            <Tooltip label="Search  ⌘K">
              <button className="icon-btn" aria-label="Search" onClick={() => setUI({ cmdk: true })}><I.search size={16} /></button>
            </Tooltip>
            <Tooltip label="New project update">
              <button
                className="icon-btn round"
                aria-label="New update"
                onClick={() => {
                  const pid = route[0] === 'project' ? route[1] : 'harbor-shop';
                  go(`project/${pid}/updates`);
                  setUI({ composeFor: pid });
                }}
              >
                <I.compose size={15} />
              </button>
            </Tooltip>
          </div>
        </div>

        <div className="sidebar-scroll">
          <div className="nav">
            <NavItem to="pulse" icon={<I.pulse />} label="Pulse" active={is('pulse')} />
            <NavItem to="inbox" icon={<I.inbox />} label="Inbox" active={is('inbox')} count="3" />
            <NavItem to="my-issues" icon={<I.myIssues />} label="My issues" active={is('my-issues')} />
          </div>

          <Section title="Workspace">
            <NavItem to="initiatives" icon={<I.initiatives />} label="Initiatives" active={is('initiatives') || is('initiative')} />
            <NavItem to="projects" icon={<I.projects />} label="Projects" active={is('projects')} />
            <NavItem to="views" icon={<I.views />} label="Views" active={is('views')} />
            <button className="nav-item" onClick={() => setUI({ cmdk: true })}><I.more /><span className="label">More</span></button>
          </Section>

          {s.favorites.length > 0 && (
            <Section title="Favorites">
              {s.favorites.map((id) => {
                const p = s.projects.find((x) => x.id === id);
                if (!p) return null;
                return <NavItem key={id} to={`project/${id}/overview`} icon={<Glyph name={p.icon} color={p.color} />} label={p.name} active={route[0] === 'project' && route[1] === id} />;
              })}
            </Section>
          )}

          <Section title="Your teams">
            <button className="nav-item" onClick={() => setTeamOpen(!teamOpen)}>
              <span className="team-mark">S</span>
              <span className="label" style={{ flex: 'none' }}>{WORKSPACE.team}</span>
              <I.caretDown size={14} style={{ transform: teamOpen ? undefined : 'rotate(-90deg)', transition: 'transform .12s' }} />
            </button>
            {teamOpen && (
              <>
                <NavItem sub to="team/issues" icon={<I.copy />} label="Issues" active={is('team/issues')} />
                <NavItem sub to="projects" icon={<I.projects />} label="Projects" active={false} />
                <NavItem sub to="team/views" icon={<I.views />} label="Views" active={is('team/views')} />
              </>
            )}
          </Section>

          <Section title="Clients">
            {initiatives.map((i) => (
              <NavItem key={i.id} to={`initiative/${i.id}/overview`} icon={<Glyph name={i.icon} color={i.color} />} label={i.name} active={route[0] === 'initiative' && route[1] === i.id} />
            ))}
          </Section>
        </div>

        <div className="sidebar-bottom">
          <Tooltip label="Help and shortcuts">
            <button className="icon-btn round" aria-label="Help" onClick={() => setUI({ cmdk: true })}><I.help size={15} /></button>
          </Tooltip>
          <button className="pill-btn" onClick={() => actions.setTheme(s.theme === 'dark' ? 'light' : 'dark')}>
            {s.theme === 'dark' ? <I.sun size={13} /> : <I.moon size={13} />}
            {s.theme === 'dark' ? 'Light theme' : 'Dark theme'}
          </button>
        </div>
      </nav>
      {ws.anchor && (
        <Menu
          anchor={ws.anchor}
          onClose={ws.close}
          width={240}
          onSelect={(id) => {
            if (id === 'theme') actions.setTheme(s.theme === 'dark' ? 'light' : 'dark');
            if (id === 'reset') { if (window.confirm('Reset the demo data? New updates, comments and reactions will be lost.')) actions.reset(); }
            if (id === 'cmdk') setUI({ cmdk: true });
          }}
          items={[
            { id: 'cmdk', label: 'Command menu', meta: '⌘K', icon: <I.search size={14} /> },
            { id: 'theme', label: s.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme', icon: s.theme === 'dark' ? <I.sun size={14} /> : <I.moon size={14} /> },
            { id: 'reset', label: 'Reset demo data', icon: <I.trash size={14} />, sep: true },
          ]}
        />
      )}
    </>
  );
}
