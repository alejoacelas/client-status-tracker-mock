import { useEffect, useRef, useState, type ReactNode } from 'react';
import { getPerson, hrefFor, navigate, useStore, useToast } from '../store';
import {
  IconBell, IconCheckCircle, IconChevronRight, IconFolder, IconGoal, IconHelp, IconHome, IconInvite, IconMenu, IconMore,
  IconPlus, IconReporting, IconSearch, IconTriangleDown, IconTriangleRight, IconCheck, IconBriefcase, IconMessage,
} from './Icons';
import { Avatar, FolderIcon, MenuItem, MenuSep, Popover, ProjectIcon } from './ui';

const NARROW = 768;

export function Shell({ children, active }: { children: ReactNode; active: string }) {
  const [open, setOpen] = useState(() => window.innerWidth >= NARROW);
  const [narrow, setNarrow] = useState(() => window.innerWidth < NARROW);
  useEffect(() => {
    const on = () => {
      const n = window.innerWidth < NARROW;
      setNarrow((prev) => {
        if (prev !== n) setOpen(!n);
        return n;
      });
    };
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  // Close the overlay sidebar after navigating on narrow screens.
  useEffect(() => {
    if (narrow) setOpen(false);
  }, [active, narrow]);

  return (
    <div className={`app ${open ? 'sidebar-open' : 'sidebar-closed'} ${narrow ? 'narrow' : ''}`}>
      <Topbar onToggle={() => setOpen((o) => !o)} />
      <div className="app-body">
        {open && narrow && <div className="scrim" onClick={() => setOpen(false)} />}
        <Sidebar active={active} />
        <main className="main">{children}</main>
      </div>
    </div>
  );
}

function Topbar({ onToggle }: { onToggle: () => void }) {
  const { data, actions, reset } = useStore();
  const toast = useToast();
  const createRef = useRef<HTMLButtonElement>(null);
  const meRef = useRef<HTMLButtonElement>(null);
  const [menu, setMenu] = useState<'create' | 'me' | null>(null);
  const [q, setQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const me = getPerson(data, data.meId);
  const results = q.trim()
    ? [
        ...data.portfolios.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())).map((p) => ({ kind: 'portfolio' as const, id: p.id, name: p.name, color: p.color })),
        ...data.projects.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())).map((p) => ({ kind: 'project' as const, id: p.id, name: p.name, color: p.color })),
      ]
    : [];

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-icon" aria-label="Toggle sidebar" onClick={onToggle}>
          <IconMenu size={20} />
        </button>
        <button ref={createRef} className="create-btn" onClick={() => setMenu('create')}>
          <span className="create-plus">
            <IconPlus size={12} />
          </span>
          <span className="create-label">Create</span>
        </button>
      </div>
      <div className="topbar-search" ref={searchRef}>
        <IconSearch size={14} />
        <input
          placeholder="Search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => setSearchOpen(true)}
          aria-label="Search"
        />
        {searchOpen && q.trim() && (
          <Popover anchor={searchRef.current} onClose={() => setSearchOpen(false)} matchWidth className="search-pop">
            {results.length === 0 && <div className="menu-empty">No results for “{q}”</div>}
            {results.map((r) => (
              <MenuItem
                key={r.kind + r.id}
                icon={r.kind === 'project' ? <ProjectIcon color={r.color} size={16} /> : <FolderIcon color={r.color} size={16} />}
                onClick={() => {
                  setSearchOpen(false);
                  setQ('');
                  navigate(r.kind === 'project' ? `/project/${r.id}` : `/portfolio/${r.id}/list`);
                }}
                right={<span className="muted small">{r.kind === 'project' ? 'Project' : 'Portfolio'}</span>}
              >
                {r.name}
              </MenuItem>
            ))}
          </Popover>
        )}
      </div>
      <div className="topbar-right">
        <button className="topbar-icon help" aria-label="Help" onClick={() => toast('Help is not part of this replica')}>
          <IconHelp size={18} />
        </button>
        <button ref={meRef} className="workspace-pill" onClick={() => setMenu('me')} aria-label="Account menu">
          <span className="ws-mark">FS</span>
          <span className="ws-name">{data.workspace}</span>
          <Avatar person={me} size={28} title={false} />
        </button>
      </div>
      {menu === 'create' && (
        <Popover anchor={createRef.current} onClose={() => setMenu(null)}>
          <div className="menu">
            <MenuItem icon={<IconCheckCircle />} onClick={() => { setMenu(null); toast('Tasks are not part of this replica'); }}>Task</MenuItem>
            <MenuItem
              icon={<IconBriefcase />}
              onClick={() => {
                setMenu(null);
                const id = actions.addProject(data.rootPortfolioId, 'New project');
                navigate(`/project/${id}`);
                toast('Project created in All clients');
              }}
            >
              Project
            </MenuItem>
            <MenuItem icon={<IconMessage />} onClick={() => { setMenu(null); toast('Messages are not part of this replica'); }}>Message</MenuItem>
            <MenuItem
              icon={<IconFolder />}
              onClick={() => {
                setMenu(null);
                const id = actions.addPortfolio(data.rootPortfolioId, 'New portfolio');
                navigate(`/portfolio/${id}/list`);
              }}
            >
              Portfolio
            </MenuItem>
            <MenuItem icon={<IconGoal />} onClick={() => { setMenu(null); toast('Goals are not part of this replica'); }}>Goal</MenuItem>
          </div>
        </Popover>
      )}
      {menu === 'me' && (
        <Popover anchor={meRef.current} onClose={() => setMenu(null)} align="right">
          <div className="menu">
            <div className="menu-header">
              <Avatar person={me} size={32} />
              <div>
                <div className="strong">{me?.name}</div>
                <div className="muted small">{me?.email}</div>
              </div>
            </div>
            <MenuSep />
            <MenuItem checked>{data.workspace}</MenuItem>
            <MenuSep />
            <MenuItem
              onClick={() => {
                setMenu(null);
                if (confirm('Reset all replica data to the seed? Your edits will be lost.')) {
                  reset();
                  toast('Demo data reset');
                }
              }}
            >
              Reset demo data
            </MenuItem>
          </div>
        </Popover>
      )}
    </header>
  );
}

function SideLink({ href, icon, children, active, right }: { href: string; icon: ReactNode; children: ReactNode; active?: boolean; right?: ReactNode }) {
  return (
    <a href={href} className={`side-link ${active ? 'active' : ''}`}>
      <span className="side-icon">{icon}</span>
      <span className="side-label">{children}</span>
      {right}
    </a>
  );
}

function Sidebar({ active }: { active: string }) {
  const { data, actions } = useStore();
  const toast = useToast();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [plusMenu, setPlusMenu] = useState<{ el: HTMLElement; kind: 'insights' | 'projects' } | null>(null);
  const toggle = (k: string) => setCollapsed((c) => ({ ...c, [k]: !c[k] }));
  const starred = data.portfolios.filter((p) => p.starred);
  const projects = data.projects.filter((p) => !p.archived);

  const Section = ({ id, title, children, plus }: { id: string; title: string; children: ReactNode; plus?: 'insights' | 'projects' }) => (
    <div className="side-section">
      <div className="side-section-head">
        <button className="side-section-title" onClick={() => toggle(id)} aria-expanded={!collapsed[id]}>
          <span className="side-caret">{collapsed[id] ? <IconTriangleRight size={12} /> : <IconTriangleDown size={12} />}</span>
          {title}
        </button>
        {plus === 'projects' && (
          <button className="side-head-btn" aria-label="More" onClick={() => toast('Sort and organise options are not part of this replica')}>
            <IconMore size={14} />
          </button>
        )}
        {plus && (
          <button className="side-head-btn" aria-label={`Add to ${title}`} onClick={(e) => setPlusMenu({ el: e.currentTarget, kind: plus })}>
            <IconPlus size={14} />
          </button>
        )}
      </div>
      {!collapsed[id] && <div className="side-section-body">{children}</div>}
    </div>
  );

  const renderPortfolioTree = (pid: string, depth: number) => {
    const pf = data.portfolios.find((p) => p.id === pid);
    if (!pf) return null;
    const key = `${pid}@${depth}`;
    const isOpen = expanded[key];
    return (
      <div key={key}>
        <a href={hrefFor.portfolio(pf.id)} className={`side-link ${active === 'portfolio:' + pf.id ? 'active' : ''}`} style={{ paddingLeft: 16 + depth * 14 }}>
          <span className="side-icon">
            <FolderIcon color={pf.color} size={18} />
          </span>
          <span className="side-label">{pf.name}</span>
          {pf.items.length > 0 && (
            <button
              className={`side-expand ${isOpen ? 'open' : ''}`}
              aria-label={isOpen ? 'Collapse' : 'Expand'}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setExpanded((x) => ({ ...x, [key]: !x[key] }));
              }}
            >
              <IconChevronRight size={14} />
            </button>
          )}
        </a>
        {isOpen &&
          pf.items.map((it) => {
            if (it.type === 'portfolio') return renderPortfolioTree(it.id, depth + 1);
            const p = data.projects.find((x) => x.id === it.id);
            if (!p) return null;
            return (
              <a key={p.id} href={hrefFor.project(p.id)} className={`side-link ${active === 'project:' + p.id ? 'active' : ''}`} style={{ paddingLeft: 16 + (depth + 1) * 14 }}>
                <span className="side-icon">
                  <span className="side-swatch" style={{ background: p.color }} />
                </span>
                <span className="side-label">{p.name}</span>
              </a>
            );
          })}
      </div>
    );
  };

  return (
    <nav className="sidebar" aria-label="Sidebar">
      <div className="side-scroll">
        <div className="side-top">
          <SideLink href="#/home" icon={<IconHome />} active={active === 'home'}>Home</SideLink>
          <SideLink href="#/my-tasks" icon={<IconCheckCircle />} active={active === 'my-tasks'}>My tasks</SideLink>
          <SideLink href="#/inbox" icon={<IconBell />} active={active === 'inbox'}>Inbox</SideLink>
        </div>
        <Section id="insights" title="Insights" plus="insights">
          <SideLink href="#/reporting" icon={<IconReporting />} active={active === 'reporting'}>Reporting</SideLink>
          <SideLink href="#/portfolios" icon={<IconFolder />} active={active === 'portfolios'}>Portfolios</SideLink>
          <SideLink href="#/goals" icon={<IconGoal />} active={active === 'goals'}>Goals</SideLink>
        </Section>
        <Section id="starred" title="Starred">
          {starred.length === 0 && <div className="side-empty">Star portfolios and projects to see them here.</div>}
          {starred.map((pf) => renderPortfolioTree(pf.id, 0))}
        </Section>
        <Section id="projects" title="Projects" plus="projects">
          {projects.map((p) => (
            <a key={p.id} href={hrefFor.project(p.id)} className={`side-link ${active === 'project:' + p.id ? 'active' : ''}`}>
              <span className="side-icon">
                <span className="side-swatch" style={{ background: p.color }} />
              </span>
              <span className="side-label">{p.name}</span>
            </a>
          ))}
        </Section>
        <Section id="teams" title="Teams">
          <SideLink href="#/portfolios" icon={<IconInvite />}>Fieldwork Studio</SideLink>
        </Section>
      </div>
      <div className="side-footer">
        <button className="side-foot-btn" onClick={() => toast('Invites are not part of this replica')}>
          <IconInvite size={16} /> Invite
        </button>
        <span className="side-foot-sep" />
        <button className="side-foot-btn" onClick={() => toast('Help is not part of this replica')}>
          <IconHelp size={16} /> Help
        </button>
      </div>
      {plusMenu && (
        <Popover anchor={plusMenu.el} onClose={() => setPlusMenu(null)}>
          <div className="menu">
            {plusMenu.kind === 'insights' ? (
              <>
                <MenuItem icon={<IconReporting />} onClick={() => { setPlusMenu(null); toast('Dashboards are not part of this replica'); }}>New dashboard</MenuItem>
                <MenuItem
                  icon={<IconFolder />}
                  onClick={() => {
                    setPlusMenu(null);
                    const id = actions.addPortfolio(data.rootPortfolioId, 'New portfolio');
                    navigate(`/portfolio/${id}/list`);
                  }}
                >
                  New portfolio
                </MenuItem>
                <MenuItem icon={<IconGoal />} onClick={() => { setPlusMenu(null); toast('Goals are not part of this replica'); }}>New goal</MenuItem>
              </>
            ) : (
              <>
                <MenuItem
                  icon={<IconCheck />}
                  onClick={() => {
                    setPlusMenu(null);
                    const id = actions.addProject(data.rootPortfolioId, 'New project');
                    navigate(`/project/${id}`);
                  }}
                >
                  New project
                </MenuItem>
                <MenuItem
                  icon={<IconFolder />}
                  onClick={() => {
                    setPlusMenu(null);
                    const id = actions.addPortfolio(data.rootPortfolioId, 'New portfolio');
                    navigate(`/portfolio/${id}/list`);
                  }}
                >
                  New portfolio
                </MenuItem>
              </>
            )}
          </div>
        </Popover>
      )}
    </nav>
  );
}
