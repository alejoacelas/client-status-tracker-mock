import { useRef, useState } from 'react';
import type { StatusKey } from '../data/mock';
import { PALETTE, TODAY } from '../data/mock';
import { fmtDate, fmtRange } from '../lib/dates';
import { STATUS } from '../lib/status';
import { getField, getPerson, getProject, hrefFor, itemStatus, milestonesFor, navigate, parentPortfolios, updatesFor, useStore, useToast } from '../store';
import { DatePicker } from '../components/DatePicker';
import { IconCalendar, IconCheck, IconChevronDown, IconChevronRight, IconDiamond, IconLink, IconMore, IconPencil, IconStar } from '../components/Icons';
import { copyLink } from '../components/StatusCard';
import { Avatar, FolderIcon, MenuItem, Pill, Popover, ProjectIcon, StatusChip } from '../components/ui';
import { OptionPicker, PeoplePicker, StatusMenu } from './list/cells';
import { NotReplicated } from './Placeholder';

const TABS = ['Overview', 'List', 'Board', 'Timeline', 'Dashboard', 'Messages', 'Files'];

export function ProjectPage({ id }: { id: string }) {
  const { data, actions } = useStore();
  const toast = useToast();
  const p = getProject(data, id);
  const [tab, setTab] = useState('Overview');
  const [menu, setMenu] = useState<{ kind: string; el: HTMLElement } | null>(null);
  const [desc, setDesc] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [starred, setStarred] = useState(false);
  const statusRef = useRef<HTMLButtonElement>(null);
  if (!p) return <NotReplicated title="Project not found" text="This project was deleted." />;
  const ref = { type: 'project' as const, id };
  const st = itemStatus(data, ref);
  const updates = updatesFor(data, ref);
  const owner = getPerson(data, p.ownerId);
  const ms = milestonesFor(data, id);
  const parents = parentPortfolios(data, ref);
  const customFields = data.fields.filter((f) => f.type !== 'builtin');

  return (
    <div className="page project-page">
      <header className="page-header">
        <div className="ph-top">
          <button className="ph-icon" aria-label="Change colour" onClick={(e) => setMenu({ kind: 'color', el: e.currentTarget })}>
            <ProjectIcon color={p.color} size={40} />
          </button>
          <div className="ph-titles">
            <nav className="breadcrumb">
              {parents[0] ? (
                <>
                  <a href={hrefFor.portfolio(parents[0].id)}>{parents[0].name}</a>
                  <IconChevronRight size={12} />
                </>
              ) : null}
            </nav>
            <div className="ph-title-row">
              {editingName ? (
                <input autoFocus className="title-input" defaultValue={p.name}
                  onBlur={(e) => { actions.rename(ref, e.target.value); setEditingName(false); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditingName(false); }} />
              ) : (
                <h1 className="ph-title" onClick={() => setEditingName(true)}>{p.name}</h1>
              )}
              <button className="icon-btn" aria-label="Project actions" onClick={(e) => setMenu({ kind: 'title', el: e.currentTarget })}><IconChevronDown /></button>
              <button className={`icon-btn star ${starred ? 'on' : ''}`} aria-label="Star" onClick={() => setStarred(!starred)}><IconStar filled={starred} /></button>
              <button ref={statusRef} className="ph-status" onClick={() => setMenu({ kind: 'status', el: statusRef.current! })}>
                {st.status ? <StatusChip status={st.status} size="sm" /> : <span className="set-status"><span className="status-ring" /> Set status</span>}
              </button>
            </div>
          </div>
          <div className="ph-right">
            <Avatar person={owner} size={28} />
            <button className="btn btn-primary sm" onClick={() => { copyLink(hrefFor.project(id)); toast('Project link copied'); }}>
              <IconLink size={14} /> <span className="hide-narrow">Share</span>
            </button>
          </div>
        </div>
        <nav className="tabs">
          {TABS.map((t) => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </nav>
      </header>
      {tab !== 'Overview' ? (
        <div className="page-content">
          <NotReplicated title={tab} text="Only the project Overview is replicated. The portfolio views are the focus of this reference." />
        </div>
      ) : (
        <div className="project-overview">
          <div className="po-main">
            <section className="po-section">
              <h2>Project description</h2>
              {desc !== null ? (
                <textarea autoFocus className="po-desc-input" value={desc} rows={4} onChange={(e) => setDesc(e.target.value)}
                  onBlur={() => { actions.setDescription(ref, desc); setDesc(null); }} />
              ) : (
                <p className={`po-desc ${p.description ? '' : 'placeholder'}`} onClick={() => setDesc(p.description)}>
                  {p.description || 'What’s this project about?'}
                </p>
              )}
            </section>
            <section className="po-section">
              <h2>Project roles</h2>
              <div className="roles">
                <button className="role" onClick={(e) => setMenu({ kind: 'owner', el: e.currentTarget })}>
                  <Avatar person={owner} size={36} />
                  <span><span className="strong block">{owner?.name ?? 'No owner'}</span><span className="muted small">Project owner</span></span>
                </button>
                {data.people.filter((x) => x.id !== p.ownerId).map((x) => (
                  <div key={x.id} className="role">
                    <Avatar person={x} size={36} />
                    <span><span className="strong block">{x.name}</span><span className="muted small">{x.role}</span></span>
                  </div>
                ))}
                {data.values[id]?.contact && (
                  <div className="role">
                    <span className="avatar" style={{ width: 36, height: 36, background: '#edeae9', fontSize: 14 }}>{String(data.values[id].contact).split(' ').map((w) => w[0]).slice(-2).join('')}</span>
                    <span><span className="strong block">{String(data.values[id].contact)}</span><span className="muted small">Client contact</span></span>
                  </div>
                )}
              </div>
            </section>
            <section className="po-section">
              <h2>Milestones</h2>
              <div className="po-milestones">
                {ms.map((m) => {
                  const done = !!m.completedOn;
                  const overdue = !done && m.dueDate < TODAY;
                  return (
                    <div key={m.id} className="po-ms">
                      <button className={`ms-toggle ${done ? 'done' : ''}`} aria-label={done ? 'Mark incomplete' : 'Mark complete'} onClick={() => actions.toggleMilestone(m.id)}>
                        <IconDiamond filled={done} size={16} />
                        {done && <IconCheck size={9} className="ms-check" />}
                      </button>
                      <span className={`grow ${done ? 'muted' : ''}`}>{m.name}</span>
                      <span className={`small ${overdue ? 'overdue-text' : 'muted'}`}>{done ? `Completed ${fmtDate(m.completedOn!)}` : fmtDate(m.dueDate)}</span>
                      <Avatar person={owner} size={22} />
                    </div>
                  );
                })}
                {ms.length === 0 && <p className="muted">No milestones yet.</p>}
              </div>
            </section>
            <section className="po-section">
              <h2>Fields</h2>
              <div className="po-fields">
                {customFields.map((f) => {
                  const v = data.values[id]?.[f.id];
                  const o = f.options?.find((x) => x.id === v);
                  return (
                    <div key={f.id} className="po-field">
                      <span className="su-field-label">{f.name}</span>
                      {f.type === 'single' ? (
                        <button className="po-field-val" onClick={(e) => setMenu({ kind: 'opt:' + f.id, el: e.currentTarget })}>
                          {o ? <Pill name={o.name} color={o.color} /> : <span className="muted">—</span>}
                        </button>
                      ) : (
                        <InlineText value={v == null ? '' : String(v)} onSave={(t) => actions.setValue(id, f.id, t || null)} />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
            <section className="po-section">
              <h2>Portfolios</h2>
              <ul className="pv-subs">
                {parents.map((pf) => (
                  <li key={pf.id}>
                    <a href={hrefFor.portfolio(pf.id)}>
                      <FolderIcon color={pf.color} size={18} />
                      <span className="grow">{pf.name}</span>
                    </a>
                  </li>
                ))}
                {parents.length === 0 && <li className="muted">Not in any portfolio.</li>}
              </ul>
            </section>
          </div>
          <aside className="po-side">
            <h2 className="po-side-title">What's the status?</h2>
            <div className="status-buttons">
              {(['on_track', 'at_risk', 'off_track'] as StatusKey[]).map((k) => (
                <button key={k} className={`status-btn ${st.status === k ? 'current' : ''}`} onClick={() => navigate(hrefFor.compose(ref, k).slice(1))}>
                  <span className="status-dot" style={{ background: STATUS[k].dot }} /> {STATUS[k].label}
                </button>
              ))}
              <button className="status-btn more" aria-label="More statuses" onClick={(e) => setMenu({ kind: 'status', el: e.currentTarget })}><IconMore size={14} /></button>
            </div>
            {updates[0] && (
              <a className="po-latest" href={hrefFor.update(updates[0].id)} style={{ borderTopColor: STATUS[updates[0].status].bar }}>
                <span className="strong block">{updates[0].title}</span>
                <span className="po-latest-label">Summary</span>
                <span className="po-latest-text">{updates[0].sections.find((s) => s.kind === 'summary')?.text || 'No summary'}</span>
                <span className="po-latest-author">
                  <Avatar person={getPerson(data, updates[0].authorId)} size={24} />
                  <span><span className="block small strong">{getPerson(data, updates[0].authorId)?.name}</span><span className="muted small">{fmtDate(updates[0].date)}</span></span>
                </span>
              </a>
            )}
            <button className="po-due" onClick={(e) => setMenu({ kind: 'date', el: e.currentTarget })}>
              <span className="round-icon"><IconCalendar size={14} /></span>
              <span>
                <span className="block small muted">Dates</span>
                {fmtRange(p.startDate, p.dueDate) || 'No due date'}
              </span>
            </button>
            <ol className="po-feed">
              {updates.map((u) => (
                <li key={u.id}>
                  <span className="feed-dot" style={{ background: STATUS[u.status].dot === '#ffffff' ? STATUS.complete.bg : STATUS[u.status].dot }} />
                  <a href={hrefFor.update(u.id)}>
                    <span className="block strong">{u.title}</span>
                    <span className="muted small">{getPerson(data, u.authorId)?.name} · {fmtDate(u.date)}{u.isPrivate ? ' · Private' : ''}</span>
                  </a>
                </li>
              ))}
              <li>
                <span className="feed-dot hollow" />
                <span>
                  <span className="block strong">Project created</span>
                  <span className="muted small">{owner?.name} · {fmtDate(p.startDate ?? TODAY)}</span>
                </span>
              </li>
            </ol>
          </aside>
        </div>
      )}
      {menu?.kind === 'status' && (
        <StatusMenu anchor={menu.el} current={st.status} onClose={() => setMenu(null)} onPick={(s) => { setMenu(null); navigate(hrefFor.compose(ref, s).slice(1)); }} />
      )}
      {menu?.kind === 'owner' && (
        <PeoplePicker data={data} anchor={menu.el} current={p.ownerId} onClose={() => setMenu(null)} onPick={(pid) => { actions.setOwner(ref, pid); setMenu(null); }} />
      )}
      {menu?.kind.startsWith('opt:') && (
        <OptionPicker data={data} fieldId={menu.kind.slice(4)} anchor={menu.el} current={(data.values[id]?.[menu.kind.slice(4)] as string) ?? null}
          onClose={() => setMenu(null)} onPick={(v) => { actions.setValue(id, menu.kind.slice(4), v); setMenu(null); }} />
      )}
      {menu?.kind === 'date' && (
        <Popover anchor={menu.el} onClose={() => setMenu(null)}>
          <DatePicker start={p.startDate} due={p.dueDate} onChange={(s, d) => actions.setDates(ref, s, d)} onDone={() => setMenu(null)} />
        </Popover>
      )}
      {menu?.kind === 'title' && (
        <Popover anchor={menu.el} onClose={() => setMenu(null)}>
          <div className="menu">
            <MenuItem icon={<IconPencil />} onClick={() => { setMenu(null); setEditingName(true); }}>Rename project</MenuItem>
            <MenuItem icon={<IconLink />} onClick={() => { setMenu(null); copyLink(hrefFor.project(id)); toast('Project link copied'); }}>Copy project link</MenuItem>
          </div>
        </Popover>
      )}
      {menu?.kind === 'color' && (
        <Popover anchor={menu.el} onClose={() => setMenu(null)}>
          <div className="color-grid">
            {Object.values(PALETTE).map((c) => (
              <button key={c} className={`color-dot lg ${c === p.color ? 'sel' : ''}`} style={{ background: c }} aria-label={c} onClick={() => { actions.setColor(ref, c); setMenu(null); }} />
            ))}
          </div>
        </Popover>
      )}
    </div>
  );
}

function InlineText({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState<string | null>(null);
  if (v === null) {
    return (
      <button className="po-field-val text" onClick={() => setV(value)}>
        {value || <span className="muted">—</span>}
      </button>
    );
  }
  return (
    <textarea autoFocus className="po-field-input" value={v} rows={Math.max(1, Math.ceil(v.length / 60))} onChange={(e) => setV(e.target.value)}
      onBlur={() => { onSave(v.trim()); setV(null); }}
      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); (e.target as HTMLTextAreaElement).blur(); } if (e.key === 'Escape') setV(null); }} />
  );
}

export { getField };
