import { useRef, useState } from 'react';
import { PALETTE } from '../data/mock';
import { getPerson, getPortfolio, hrefFor, itemStatus, navigate, parentPortfolios, useStore, useToast } from '../store';
import { IconChevronDown, IconChevronRight, IconCustomize, IconLink, IconPencil, IconPeople, IconStar, IconTrash } from '../components/Icons';
import { copyLink } from '../components/StatusCard';
import { AvatarStack, FolderIcon, MenuItem, MenuSep, Modal, Popover, StatusChip } from '../components/ui';
import { StatusMenu } from './list/cells';
import { ListView } from './list/ListView';
import { TimelineView } from './TimelineView';
import { DashboardView } from './DashboardView';
import { ProgressView } from './ProgressView';
import { NotReplicated } from './Placeholder';

const TABS = [
  { id: 'list', label: 'List' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'progress', label: 'Progress' },
  { id: 'workload', label: 'Workload' },
  { id: 'messages', label: 'Messages' },
];

export function PortfolioPage({ id, tab }: { id: string; tab: string }) {
  const { data, actions } = useStore();
  const toast = useToast();
  const pf = getPortfolio(data, id);
  const [customize, setCustomize] = useState(false);
  const [menu, setMenu] = useState<'title' | 'status' | 'color' | null>(null);
  const [editing, setEditing] = useState(false);
  const [share, setShare] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const titleCaret = useRef<HTMLButtonElement>(null);
  const statusRef = useRef<HTMLButtonElement>(null);
  const iconRef = useRef<HTMLButtonElement>(null);

  if (!pf) return <NotReplicated title="Portfolio not found" text="This portfolio was deleted or never existed." />;
  const st = itemStatus(data, { type: 'portfolio', id });
  const parents = parentPortfolios(data, { type: 'portfolio', id });
  const members = pf.memberIds.map((m) => getPerson(data, m)!).filter(Boolean);

  return (
    <div className="page portfolio-page">
      <header className="page-header">
        <div className="ph-top">
          <button ref={iconRef} className="ph-icon" aria-label="Change colour" onClick={() => setMenu('color')}>
            <FolderIcon color={pf.color} size={46} />
          </button>
          <div className="ph-titles">
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <a href="#/portfolios">Portfolios</a>
              <IconChevronRight size={12} />
              {parents[0] && (
                <>
                  <a href={hrefFor.portfolio(parents[0].id)}>{parents[0].name}</a>
                  <IconChevronRight size={12} />
                </>
              )}
            </nav>
            <div className="ph-title-row">
              {editing ? (
                <input
                  autoFocus
                  className="title-input"
                  defaultValue={pf.name}
                  onBlur={(e) => {
                    actions.rename({ type: 'portfolio', id }, e.target.value);
                    setEditing(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    if (e.key === 'Escape') setEditing(false);
                  }}
                />
              ) : (
                <h1 className="ph-title" onClick={() => setEditing(true)} title="Click to rename">
                  {pf.name}
                </h1>
              )}
              <button ref={titleCaret} className="icon-btn" aria-label="Portfolio actions" onClick={() => setMenu('title')}>
                <IconChevronDown />
              </button>
              <button className={`icon-btn star ${pf.starred ? 'on' : ''}`} aria-label={pf.starred ? 'Remove from starred' : 'Add to starred'} onClick={() => actions.toggleStar(id)}>
                <IconStar filled={pf.starred} />
              </button>
              <button ref={statusRef} className="ph-status" onClick={() => setMenu('status')}>
                {st.status ? (
                  <StatusChip status={st.status} size="sm" />
                ) : (
                  <span className="set-status">
                    <span className="status-ring" /> Set status
                  </span>
                )}
              </button>
            </div>
          </div>
          <div className="ph-right">
            <button className="members-btn" onClick={() => setShare(true)} aria-label="Members">
              <AvatarStack people={members} size={26} />
            </button>
            <button className="btn btn-primary sm share-btn" onClick={() => setShare(true)}>
              <IconPeople size={14} /> <span className="hide-narrow">Share</span>
            </button>
            <span className="vsep" />
            <button className={`btn btn-secondary sm ${customize ? 'pressed' : ''}`} onClick={() => { if (tab !== 'list') navigate(`/portfolio/${id}/list`); setCustomize(!customize); }}>
              <IconCustomize /> <span className="hide-narrow">Customize</span>
            </button>
          </div>
        </div>
        <nav className="tabs" role="tablist">
          {TABS.map((t) => (
            <a key={t.id} role="tab" aria-selected={tab === t.id} className={`tab ${tab === t.id ? 'active' : ''}`} href={hrefFor.portfolio(id, t.id)}>
              {t.label}
            </a>
          ))}
        </nav>
      </header>

      <div className="page-content">
        {tab === 'list' && <ListView portfolioId={id} customize={customize} setCustomize={setCustomize} />}
        {tab === 'timeline' && <TimelineView portfolioId={id} />}
        {tab === 'dashboard' && <DashboardView portfolioId={id} />}
        {tab === 'progress' && <ProgressView portfolioId={id} />}
        {tab === 'workload' && <NotReplicated title="Workload" text="Workload shows each person's tasks across projects. The seed has no tasks, so this tab is not replicated." />}
        {tab === 'messages' && <NotReplicated title="Messages" text="Send a message to everyone in this portfolio. Messaging is not part of this replica." />}
      </div>

      {menu === 'title' && (
        <Popover anchor={titleCaret.current} onClose={() => setMenu(null)}>
          <div className="menu">
            <MenuItem icon={<IconPencil />} onClick={() => { setMenu(null); setEditing(true); }}>Rename portfolio</MenuItem>
            <MenuItem icon={<span className="dot lg" style={{ background: pf.color }} />} onClick={() => setMenu('color')}>Set colour</MenuItem>
            <MenuItem icon={<IconLink />} onClick={() => { setMenu(null); copyLink(hrefFor.portfolio(id)); toast('Portfolio link copied'); }}>Copy portfolio link</MenuItem>
            {id !== data.rootPortfolioId && (
              <>
                <MenuSep />
                <MenuItem danger icon={<IconTrash />} onClick={() => { setMenu(null); setConfirmDel(true); }}>Delete portfolio</MenuItem>
              </>
            )}
          </div>
        </Popover>
      )}
      {menu === 'color' && (
        <Popover anchor={iconRef.current} onClose={() => setMenu(null)}>
          <div className="color-grid">
            {Object.values(PALETTE).map((c) => (
              <button key={c} className={`color-dot lg ${c === pf.color ? 'sel' : ''}`} style={{ background: c }} aria-label={c} onClick={() => { actions.setColor({ type: 'portfolio', id }, c); setMenu(null); }} />
            ))}
          </div>
        </Popover>
      )}
      {menu === 'status' && (
        <StatusMenu
          anchor={statusRef.current}
          current={st.status}
          onClose={() => setMenu(null)}
          onPick={(s) => {
            setMenu(null);
            navigate(hrefFor.compose({ type: 'portfolio', id }, s).slice(1));
          }}
          extra={st.update ? <MenuItem onClick={() => { setMenu(null); navigate(`/update/${st.update!.id}`); }}>View latest status update</MenuItem> : undefined}
        />
      )}
      {share && (
        <Modal title={`Share ${pf.name}`} onClose={() => setShare(false)} width={520}
          footer={<button className="btn btn-primary" onClick={() => { copyLink(hrefFor.portfolio(id)); toast('Portfolio link copied'); }}><IconLink size={14} /> Copy portfolio link</button>}>
          <div className="share-input">
            <input className="input" placeholder="Add members by name or email" onKeyDown={(e) => { if (e.key === 'Enter') toast('Inviting people is not part of this replica'); }} />
            <button className="btn btn-primary" onClick={() => toast('Inviting people is not part of this replica')}>Invite</button>
          </div>
          <h3 className="pane-h3 mt">Members</h3>
          <ul className="member-list">
            {members.map((m) => (
              <li key={m.id}>
                <AvatarStack people={[m]} size={28} />
                <span className="grow">
                  <span className="strong">{m.name}</span>
                  <span className="muted small block">{m.role}</span>
                </span>
                <span className="muted">{m.id === pf.ownerId ? 'Portfolio owner' : 'Editor'}</span>
              </li>
            ))}
          </ul>
        </Modal>
      )}
      {confirmDel && (
        <Modal title={`Delete “${pf.name}”?`} width={440} onClose={() => setConfirmDel(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setConfirmDel(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => { actions.deleteItem({ type: 'portfolio', id }); setConfirmDel(false); navigate('/portfolios'); toast('Portfolio deleted'); }}>Delete portfolio</button>
            </>
          }>
          <p>The projects inside stay in the workspace; only the portfolio is deleted.</p>
        </Modal>
      )}
    </div>
  );
}
