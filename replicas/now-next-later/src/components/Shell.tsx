import { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  Bell,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  CircleHelp,
  Gauge,
  HeartHandshake,
  Lightbulb,
  LayoutGrid,
  Menu as MenuIcon,
  MessageSquare,
  MoreHorizontal,
  PanelLeftClose,
  Pencil,
  Plus,
  Search,
  Settings,
  Sparkles,
  Users,
  ListFilter,
  MessagesSquare,
} from 'lucide-react';
import { DATA, lineById, productById } from '../util';
import { href, go } from '../router';
import { useStore } from '../store';
import { Avatar, Menu, notInReplica, toast } from './bits';

export function BrandMark() {
  return <span className="brand-mark" aria-hidden>FS</span>;
}

export function SideNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const primary: [string, React.ReactNode, boolean][] = [
    ['Dashboard', <Gauge key="d" />, false],
    ['Roadmaps', <LayoutGrid key="r" />, true],
    ['Ideas', <Lightbulb key="i" />, false],
    ['Feedback', <HeartHandshake key="f" />, false],
    ['Personas', <Users key="p" />, false],
    ['Reports', <BarChart3 key="re" />, false],
  ];
  const secondary: [string, React.ReactNode][] = [
    ['Ask AI', <Sparkles key="a" />],
    ['Search', <Search key="s" />],
    ['Discussions', <MessageSquare key="di" />],
    ['Activity', <Bell key="ac" />],
    ['Help', <CircleHelp key="h" />],
  ];
  return (
    <>
      <div className={`nav-scrim${open ? ' is-open' : ''}`} onClick={onClose} />
      <nav className={`side-nav${open ? ' is-open' : ''}`} aria-label="Main">
        <div className="side-nav__header">
          <button className="account-trigger" onClick={() => notInReplica('Switching accounts')}>
            <BrandMark />
            <span style={{ flex: 1 }}>{DATA.agency}</span>
            <ChevronsUpDown size={16} />
          </button>
        </div>
        <div className="side-nav__body">
          <div className="side-nav__section">
            {primary.map(([label, icon, active]) =>
              active ? (
                <a key={label} className="menu-item is-active" href={href('portfolio/roadmap')} onClick={onClose} aria-current="page">
                  {icon}
                  {label}
                </a>
              ) : (
                <button key={label} className="menu-item" onClick={() => notInReplica(label)}>
                  {icon}
                  {label}
                </button>
              ),
            )}
            <button className="btn btn--navy side-nav__add" onClick={() => notInReplica('Quick add')}>
              <Plus size={16} /> Add
            </button>
          </div>
          <div className="side-nav__section">
            {secondary.map(([label, icon]) => (
              <button key={label} className="menu-item" onClick={() => notInReplica(label)}>
                {icon}
                {label}
              </button>
            ))}
            <button className="menu-item" onClick={() => notInReplica('Settings')}>
              <Settings />
              Settings
              <ChevronRight className="chev" />
            </button>
          </div>
        </div>
        <div className="side-nav__footer">
          <button className="profile-trigger" onClick={() => notInReplica('Profile settings')}>
            <Avatar id="maya" />
            <span className="name">Maya Chen</span>
            <ChevronsUpDown size={14} />
          </button>
          <button className="icon-btn" aria-label="Collapse menu" onClick={onClose}>
            <PanelLeftClose size={18} />
          </button>
        </div>
      </nav>
    </>
  );
}

export function MobileBar({ onMenu }: { onMenu: () => void }) {
  return (
    <div className="mobile-bar">
      <button className="icon-btn" aria-label="Open menu" onClick={onMenu}>
        <MenuIcon size={20} />
      </button>
      <span className="account-trigger" style={{ cursor: 'default' }}>
        <BrandMark />
        {DATA.agency}
      </span>
      <Avatar id="maya" />
    </div>
  );
}

type Tab = { label: string; to?: string; link?: boolean; icon?: React.ReactNode };

function Tabs({ tabs, active }: { tabs: (Tab | '|')[]; active: string }) {
  const ref = useRef<HTMLDivElement>(null);
  // Keep the active tab visible when the tab row scrolls sideways on phones.
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>('.tab.is-active');
    if (el && ref.current) ref.current.scrollLeft = Math.max(0, el.offsetLeft - 16);
  }, [active]);
  return (
    <div className="tabs" role="tablist" ref={ref}>
      {tabs.map((t, n) =>
        t === '|' ? (
          <span key={n} className="tab-sep" />
        ) : t.to ? (
          <a key={t.label} role="tab" aria-selected={active === t.label} className={`tab${active === t.label ? ' is-active' : ''}${t.link ? ' tab--link' : ''}`} href={t.to}>
            {t.icon}
            {t.label}
          </a>
        ) : (
          <button key={t.label} role="tab" aria-selected={false} className={`tab${t.link ? ' tab--link' : ''}`} onClick={() => notInReplica(`The ${t.label} tab`)}>
            {t.icon}
            {t.label}
          </button>
        ),
      )}
    </div>
  );
}

function MoreMenu({ token }: { token?: string }) {
  const { dispatch } = useStore();
  return (
    <Menu
      align="right"
      trigger={(_, t) => (
        <button className="more-btn" onClick={t} aria-label="More options">
          <MoreHorizontal size={16} />
          <ChevronDown size={12} />
        </button>
      )}
    >
      {(close) => (
        <>
          <a className="dropdown__item" href={href('portfolio/published')} onClick={close}>
            Roadmap publishing
          </a>
          {token && (
            <a className="dropdown__item" href={href(`p/${token}`)} target="_blank" rel="noreferrer" onClick={close}>
              View published roadmap
              <span className="sub" />
            </a>
          )}
          <button className="dropdown__item" onClick={() => (close(), notInReplica('Print to PDF'))}>
            Print to PDF
          </button>
          <div className="dropdown__sep" />
          <button
            className="dropdown__item"
            onClick={() => {
              close();
              if (window.confirm('Reset all roadmap changes back to the original mock data?')) {
                dispatch({ type: 'reset' });
                toast('Demo data reset');
              }
            }}
          >
            Reset demo data
          </button>
        </>
      )}
    </Menu>
  );
}

export function PortfolioHeader({ active }: { active: string }) {
  return (
    <header className="page-head">
      <div className="page-head__top">
        <div>
          <div className="page-title">
            <h1>Product Portfolio</h1>
          </div>
        </div>
        <div className="page-head__actions">
          <MoreMenu />
        </div>
      </div>
      <div className="tabs-row">
        <Tabs
          active={active}
          tabs={[
            { label: 'Product Portfolio', to: href('portfolio/overview') },
            '|',
            { label: 'Canvas' },
            { label: 'Objectives & Key Results' },
            { label: 'Roadmap', to: href('portfolio/roadmap') },
            { label: 'Chart' },
            '|',
            { label: 'Published roadmaps', to: href('portfolio/published') },
          ]}
        />
      </div>
    </header>
  );
}

export function ProductHeader({ productId }: { productId: string }) {
  const p = productById(productId);
  const line = lineById(p.line);
  const [follow, setFollow] = useState(true);
  return (
    <header className="page-head">
      <div className="page-head__top">
        <div style={{ minWidth: 0 }}>
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <a href={href('portfolio/overview')}>Product Portfolio</a>
            <span>/</span>
            <a href={href('portfolio/overview')}>
              {line.name}
            </a>
            <span>/</span>
            <span>{p.name}</span>
          </nav>
          <div className="page-title">
            <span className="product-image" style={{ background: p.color }}>
              {p.name[0]}
            </span>
            <h1>{p.name}</h1>
          </div>
          <Menu
            trigger={(_, t) => (
              <button className="switch-product" onClick={t}>
                Switch product <ChevronDown size={14} />
              </button>
            )}
          >
            {(close) => (
              <>
                <a className="dropdown__item" href={href('portfolio/roadmap')} onClick={close}>
                  Product Portfolio
                </a>
                {DATA.productLines.map((l) => (
                  <div key={l.id}>
                    <div className="dropdown__label">{l.name}</div>
                    {DATA.products
                      .filter((x) => x.line === l.id)
                      .map((x) => (
                        <button
                          key={x.id}
                          className={`dropdown__item${x.id === p.id ? ' is-selected' : ''}`}
                          onClick={() => {
                            close();
                            go(`product/${x.id}/roadmap`);
                          }}
                        >
                          <span className="product-image product-image--sm" style={{ background: x.color }}>
                            {x.name[0]}
                          </span>
                          {x.name}
                        </button>
                      ))}
                  </div>
                ))}
              </>
            )}
          </Menu>
        </div>
        <div className="page-head__actions">
          <span className="follow-box">
            Follow product
            <button className={`switch${follow ? ' is-on' : ''}`} role="switch" aria-checked={follow} aria-label="Follow product" onClick={() => setFollow(!follow)} />
          </span>
          <MoreMenu token={line.shareToken} />
        </div>
      </div>
      <div className="tabs-row">
        <Tabs
          active="Roadmap"
          tabs={[
            { label: 'Canvas' },
            { label: 'Objectives & Key Results' },
            { label: 'Roadmap', to: href(`product/${p.id}/roadmap`) },
            { label: 'Chart' },
            { label: 'Documentation' },
            { label: 'Files' },
            '|',
            { label: 'Ideas', link: true, icon: <ListFilter size={15} /> },
            { label: 'Feedback', link: true, icon: <MessagesSquare size={15} /> },
          ]}
        />
        <div className="managers">
          Product Managers
          <span className="avatars">
            <Avatar id={p.owner} size="lg" />
            {p.owner !== 'maya' && <Avatar id="maya" size="lg" />}
          </span>
          <button className="icon-btn" aria-label="Edit product managers" onClick={() => notInReplica('Editing product managers')}>
            <Pencil size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}

export function PortfolioOverview() {
  const { state } = useStore();
  return (
    <div className="pub-list">
      {DATA.productLines.map((l) => (
        <section key={l.id} className="pub-item" style={{ gridTemplateColumns: '1fr' }}>
          <h2 style={{ margin: 0, color: 'var(--blue-700)' }}>{l.name}</h2>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {DATA.products
              .filter((p) => p.line === l.id)
              .map((p) => {
                const n = state.initiatives.filter((i) => i.product === p.id && ['now', 'next', 'later'].includes(i.column)).length;
                return (
                  <a
                    key={p.id}
                    href={href(`product/${p.id}/roadmap`)}
                    style={{ width: 220, border: '1px solid var(--neutral-300)', borderRadius: 8, overflow: 'hidden', color: 'inherit', textDecoration: 'none', background: '#fff' }}
                  >
                    <div style={{ height: 120, background: p.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontFamily: 'var(--font-family-title)', fontWeight: 600 }}>
                      {p.name[0]}
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ color: 'var(--blue-700)', fontWeight: 600 }}>{p.name}</div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {p.status} · {n} on the roadmap
                      </div>
                    </div>
                  </a>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}
