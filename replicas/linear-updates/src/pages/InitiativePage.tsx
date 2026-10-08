import { useEffect, useMemo, useState } from 'react';
import type { Update } from '../data/mock';
import { CURRENT_USER_ID, initiatives } from '../data/mock';
import { Glyph, I, StatusIcon } from '../icons';
import { actions, initiativeUpdates, latestInitiativeUpdate, latestProjectUpdate, useStore, userById } from '../store';
import { go, href, setUI, toast, useUI } from '../ui';
import { copyText, cx, dayKey, dayLabel, shortDate } from '../util';
import { Avatar, ProgressRing } from '../components/bits';
import { Composer } from '../components/Composer';
import { Tooltip } from '../components/Menu';
import { Topbar } from '../components/Topbar';
import { UpdateItem } from '../components/UpdateItem';
import { HealthCell } from './InitiativesPage';

export function InitiativePage({ route }: { route: string[] }) {
  const s = useStore((s) => s);
  const composeFor = useUI((u) => u.composeFor);
  const id = route[1];
  const tab = route[2] === 'projects' ? 'projects' : route[2] === 'updates' ? 'updates' : 'overview';
  const i = initiatives.find((x) => x.id === id);
  const [composing, setComposing] = useState(false);
  const [withProjects, setWithProjects] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (composeFor && composeFor === id) { setComposing(true); setUI({ composeFor: null }); }
  }, [composeFor, id]);
  useEffect(() => setComposing(false), [id]);

  const ps = useMemo(() => s.projects.filter((p) => p.initiativeId === id), [s.projects, id]);
  const feed = useMemo(() => {
    const own = initiativeUpdates(s, id);
    const proj = withProjects ? s.updates.filter((u) => u.projectId && ps.some((p) => p.id === u.projectId)) : [];
    return [...own, ...proj].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [s, id, ps, withProjects]);

  if (!i) return <div className="empty"><h3>Initiative not found</h3></div>;
  const latest = latestInitiativeUpdate(s, i.id);
  const post = (health: Update['health'], body: string) => {
    actions.postUpdate({ initiativeId: i.id, health, body });
    setComposing(false);
    toast('Initiative update posted');
  };
  const composer = (
    <Composer initialHealth={latest?.health ?? 'onTrack'} placeholder="Write an initiative update…" onCancel={() => setComposing(false)} onSubmit={post} />
  );
  const cols = 'minmax(0,1fr) 168px 92px 90px 80px';

  const projectTable = (
    <div className="table" style={{ border: '1px solid var(--border-subtle)', borderRadius: 9, overflow: 'hidden' }}>
      <div className="trow head" style={{ ['--cols' as string]: cols, paddingLeft: 16 }}>
        <span>Name</span><span>Health</span><span className="hide-sm">Lead</span><span className="hide-sm">Target</span><span className="hide-sm">Progress</span>
      </div>
      {ps.map((p) => (
        <div key={p.id} className="trow clickable" style={{ ['--cols' as string]: cols, paddingLeft: 16 }} onClick={(e) => { if (!(e.target as HTMLElement).closest('button')) go(`project/${p.id}/overview`); }}>
          <span className="name"><StatusIcon status={p.status} progress={p.progress / 100} /><Glyph name={p.icon} color={p.color} /><span className="t">{p.name}</span></span>
          <span><HealthCell update={latestProjectUpdate(s, p.id)} onOpen={() => go(`project/${p.id}/updates`)} /></span>
          <span className="hide-sm" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><Avatar userId={p.leadId} size={18} /><span className="muted">{p.leadId}</span></span>
          <span className="muted hide-sm">{shortDate(p.targetDate)}</span>
          <span className="pct-ring hide-sm"><ProgressRing pct={p.progress} />{p.progress}%</span>
        </div>
      ))}
    </div>
  );

  let lastDay = '';
  return (
    <>
      <Topbar
        left={
          <>
            <a className="crumb-muted hide-sm" href={href('initiatives')}>Initiatives</a>
            <span className="sep hide-sm">›</span>
            <Glyph name={i.icon} color={i.color} />
            <span className="crumb-title">{i.name}</span>
          </>
        }
        tabs={[
          { id: 'overview', label: 'Overview', href: href(`initiative/${i.id}/overview`), active: tab === 'overview', icon: <I.doc size={14} /> },
          { id: 'projects', label: 'Projects', href: href(`initiative/${i.id}/projects`), active: tab === 'projects', icon: <I.projects size={14} /> },
          { id: 'updates', label: 'Updates', href: href(`initiative/${i.id}/updates`), active: tab === 'updates', icon: <I.pulse size={14} /> },
        ]}
        right={
          <>
            <Tooltip label="Copy initiative link">
              <button className="icon-btn hide-sm" aria-label="Copy link" onClick={() => { copyText(window.location.href); toast('Initiative link copied'); }}><I.link size={16} /></button>
            </Tooltip>
            <button className="btn btn-ghost hide-sm" onClick={() => toast('Projects are fixed in this replica')}><I.plus size={14} />Add project</button>
          </>
        }
      />
      <div className="body">
        <div className="scroll">
          {tab === 'overview' && (
            <div className="overview">
              <div className="init-icon" style={{ width: 36, height: 36, marginBottom: 14, background: `color-mix(in srgb, ${i.color} 18%, transparent)` }}><Glyph name={i.icon} color={i.color} size={18} /></div>
              <div className="eyebrow">Initiative</div>
              <h1 className="page-title">{i.name}</h1>
              <p className="page-summary">{i.description}</p>
              <div className="props">
                <div className="props-label">Properties</div>
                <div className="props-items">
                  <span className="prop"><StatusIcon status="started" progress={0.5} />Active</span>
                  <span className="prop"><Avatar userId={i.ownerId} size={16} />{userById(i.ownerId).name}</span>
                  <span className="prop"><I.calendar size={14} />{i.targetLabel}</span>
                </div>
                <div className="props-label">Resources</div>
                <div className="props-items"><button className="prop muted" onClick={() => toast('Resources are read-only in this replica')}><I.plus size={14} />Document or link</button></div>
              </div>
              {composing ? composer : latest ? (
                <div className="latest-card">
                  <div className="latest-head">
                    <button className={cx('latest-toggle', collapsed && 'collapsed')} onClick={() => setCollapsed(!collapsed)}>Latest update <I.caretDown /></button>
                    <div style={{ flex: 1 }} />
                    <a className="btn btn-ghost" href={href(`initiative/${i.id}/updates`)}>See all</a>
                    <Tooltip label="Write initiative update"><button className="icon-btn" aria-label="Write initiative update" onClick={() => setComposing(true)}><I.pencil size={16} /></button></Tooltip>
                  </div>
                  <UpdateItem u={latest} variant="latest" hideActions={collapsed} key={latest.id + String(collapsed)} />
                </div>
              ) : (
                <button className="latest-empty" onClick={() => setComposing(true)}><I.pencil size={16} />Write first initiative update</button>
              )}
              <div className="section-head">Projects <span style={{ color: 'var(--text-quaternary)' }}>{ps.length}</span></div>
              {projectTable}
            </div>
          )}
          {tab === 'projects' && <div className="overview" style={{ maxWidth: 980, paddingTop: 28 }}>{projectTable}</div>}
          {tab === 'updates' && (
            <div className="overview" style={{ paddingTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <label className="pill-btn" style={{ cursor: 'default' }}>
                  <input type="checkbox" checked={withProjects} onChange={(e) => setWithProjects(e.target.checked)} style={{ margin: 0, accentColor: 'var(--accent)' }} />
                  Show project updates
                </label>
              </div>
              {composing ? composer : (
                <button className="latest-empty" style={{ justifyContent: 'flex-start', padding: '0 18px', gap: 10, height: 52 }} onClick={() => setComposing(true)}>
                  <Avatar userId={CURRENT_USER_ID} size={20} />
                  <span style={{ fontWeight: 400, color: 'var(--text-quaternary)' }}>Write an initiative update…</span>
                </button>
              )}
              <div className="feed">
                {feed.map((u) => {
                  const day = dayKey(u.createdAt);
                  const sep = day !== lastDay ? <div className="day-sep">{dayLabel(u.createdAt)}</div> : null;
                  lastDay = day;
                  const p = u.projectId ? s.projects.find((x) => x.id === u.projectId) : undefined;
                  return (
                    <div key={u.id}>
                      {sep}
                      <UpdateItem
                        u={u}
                        variant="pulse"
                        title={p
                          ? <a className="feed-item-title" href={href(`project/${p.id}/overview`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Glyph name={p.icon} color={p.color} />{p.name}</a>
                          : <span className="feed-item-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Glyph name={i.icon} color={i.color} />{i.name}</span>}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
