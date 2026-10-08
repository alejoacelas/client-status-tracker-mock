import { useEffect, useMemo, useState } from 'react';
import type { Project, Update } from '../data/mock';
import { CURRENT_USER_ID, initiatives, milestones as allMilestones, WORKSPACE } from '../data/mock';
import { Glyph, I, STATUS_META } from '../icons';
import { actions, latestProjectUpdate, projectUpdates, useStore, userById, type State } from '../store';
import { go, href, setUI, toast, useUI } from '../ui';
import { ago, copyText, fullDateTime, Markdown, shortDate } from '../util';
import { Avatar, MilestoneDiamond } from '../components/bits';
import { Composer } from '../components/Composer';
import { Menu, Tooltip, useAnchor } from '../components/Menu';
import { ProgressGraph } from '../components/ProgressGraph';
import { DateProp, LeadProp, MembersProp, PriorityProp, StatusProp } from '../components/ProjectProps';
import { Topbar } from '../components/Topbar';
import { UpdateItem } from '../components/UpdateItem';

const pct = (m: { issues: number; done: number }) => (m.issues ? Math.round((m.done / m.issues) * 100) : 0);

function progressSince(s: State, p: Project): Update['progress'] | undefined {
  // Progress shown in the last update that reported it; the original only shows changes above 2%.
  const ups = projectUpdates(s, p.id);
  const last = ups.find((u) => u.progress);
  const from = last?.progress?.to ?? (ups.length ? p.progress : 0);
  if (Math.abs(p.progress - from) <= 2) return undefined;
  const current = allMilestones.find((m) => m.projectId === p.id && !m.completedOn);
  return { from, to: p.progress, milestone: current?.name };
}

export function ProjectPage({ route }: { route: string[] }) {
  const s = useStore((s) => s);
  const details = useUI((u) => u.details);
  const composeFor = useUI((u) => u.composeFor);
  const id = route[1];
  const tab = route[2] === 'updates' ? 'updates' : 'overview';
  const focusUpdate = route[3];
  const p = s.projects.find((x) => x.id === id);
  const [composing, setComposing] = useState(false);
  const bell = useAnchor();
  const more = useAnchor();

  useEffect(() => {
    if (composeFor && composeFor === id) {
      setComposing(true);
      setUI({ composeFor: null });
    }
  }, [composeFor, id]);
  useEffect(() => setComposing(false), [id]);

  useEffect(() => {
    if (focusUpdate) window.setTimeout(() => document.getElementById(`update-${focusUpdate}`)?.scrollIntoView({ block: 'center' }), 50);
  }, [focusUpdate]);

  if (!p) return <div className="empty"><h3>Project not found</h3><a className="btn btn-secondary" href={href('projects')}>Go to projects</a></div>;

  const init = initiatives.find((i) => i.id === p.initiativeId)!;
  const ms = allMilestones.filter((m) => m.projectId === p.id);
  const fav = s.favorites.includes(p.id);
  const post = (health: Update['health'], body: string, progress?: Update['progress']) => {
    actions.postUpdate({ projectId: p.id, health, body, progress });
    setComposing(false);
    toast('Project update posted');
  };
  const composer = (
    <Composer
      initialHealth={latestProjectUpdate(s, p.id)?.health ?? 'onTrack'}
      progress={progressSince(s, p)}
      onCancel={() => setComposing(false)}
      onSubmit={post}
    />
  );

  return (
    <>
      <Topbar
        left={
          <>
            <a className="crumb-muted hide-sm" href={href('projects')}>Projects</a>
            <span className="sep hide-sm">›</span>
            <Glyph name={p.icon} color={p.color} />
            <span className="crumb-title">{p.name}</span>
            <Tooltip label={fav ? 'Remove from favorites' : 'Add to favorites'}>
              <button className="icon-btn sm hide-sm" aria-label="Favorite" onClick={() => actions.toggleFavorite(p.id)} style={fav ? { color: 'var(--health-risk)' } : undefined}>
                {fav ? <I.starFilled size={14} /> : <I.star size={14} />}
              </button>
            </Tooltip>
            <button className="icon-btn sm hide-sm" aria-label="Project options" onClick={more.open}><I.more size={14} /></button>
          </>
        }
        tabs={[
          { id: 'overview', label: 'Overview', href: href(`project/${p.id}/overview`), active: tab === 'overview' },
          { id: 'updates', label: 'Updates', href: href(`project/${p.id}/updates`), active: tab === 'updates' },
        ]}
        right={
          <>
            <Tooltip label="Copy project link">
              <button className="icon-btn hide-sm" aria-label="Copy link" onClick={() => { copyText(window.location.href); toast('Project link copied'); }}><I.link size={16} /></button>
            </Tooltip>
            <Tooltip label="Notifications">
              <button className="icon-btn hide-sm" aria-label="Notifications" onClick={bell.open}><I.bell size={16} /></button>
            </Tooltip>
            <span className="topbar-divider hide-sm" />
            <Tooltip label={`${details ? 'Close' : 'Open'} details  ⌘I`}>
              <button className={`icon-btn ${details ? 'active' : ''}`} aria-label="Toggle details" onClick={() => setUI({ details: !details })}>
                {details ? <I.panelOn size={16} /> : <I.panel size={16} />}
              </button>
            </Tooltip>
          </>
        }
      />
      {bell.anchor && (
        <Menu
          anchor={bell.anchor}
          align="right"
          onClose={bell.close}
          width={300}
          onSelect={(x) => toast(x === 'never' ? 'Update reminders turned off for this project' : 'Update schedule saved')}
          items={[
            { id: 'default', label: 'Default schedule', meta: 'Weekly, Wed', checked: true },
            { id: 'custom', label: 'Custom schedule…' },
            { id: 'never', label: 'Never remind me' },
            { id: 'slack', label: 'Send updates to a channel…', sep: true, icon: <I.bell size={14} /> },
          ]}
        />
      )}
      {more.anchor && (
        <Menu
          anchor={more.anchor}
          onClose={more.close}
          onSelect={(x) => {
            if (x === 'update') { go(`project/${p.id}/overview`); setComposing(true); }
            if (x === 'link') { copyText(window.location.href); toast('Project link copied'); }
            if (x === 'fav') actions.toggleFavorite(p.id);
          }}
          items={[
            { id: 'update', label: 'Write project update', icon: <I.pencil size={14} /> },
            { id: 'fav', label: fav ? 'Remove from favorites' : 'Add to favorites', icon: <I.star size={14} /> },
            { id: 'link', label: 'Copy link', icon: <I.link size={14} />, sep: true },
          ]}
        />
      )}
      <div className="body">
        <div className="scroll">
          {tab === 'overview' ? (
            <Overview p={p} s={s} init={init} ms={ms} composing={composing} setComposing={setComposing} composer={composer} />
          ) : (
            <UpdatesTab p={p} s={s} composing={composing} setComposing={setComposing} composer={composer} focus={focusUpdate} />
          )}
        </div>
        {details && <DetailsPane p={p} ms={ms} init={init} />}
      </div>
    </>
  );
}

function Overview({ p, s, init, ms, composing, setComposing, composer }: {
  p: Project; s: State; init: (typeof initiatives)[number]; ms: typeof allMilestones; composing: boolean; setComposing: (b: boolean) => void; composer: JSX.Element;
}) {
  const latest = latestProjectUpdate(s, p.id);
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="overview">
      <div className="proj-icon"><Glyph name={p.icon} color={p.color} size={18} /></div>
      <h1 className="page-title">{p.name}</h1>
      <p className="page-summary">{p.summary}</p>

      <div className="props">
        <div className="props-label">Properties</div>
        <div className="props-items">
          <StatusProp p={p} />
          <PriorityProp p={p} />
          <LeadProp p={p} />
          <MembersProp p={p} />
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            <DateProp p={p} field="startDate" />
            <I.arrowRight size={12} style={{ color: 'var(--text-quaternary)' }} />
            <DateProp p={p} field="targetDate" />
          </span>
          <span className="prop"><I.users size={14} />{WORKSPACE.teamKey}</span>
        </div>
        <div className="props-label">Initiatives</div>
        <div className="props-items">
          <a className="prop" href={href(`initiative/${init.id}/overview`)}><Glyph name={init.icon} color={init.color} size={14} />{init.name}</a>
        </div>
        <div className="props-label">Labels</div>
        <div className="props-items" style={{ gap: 6 }}>
          {p.labels.map((l) => <span key={l.name} className="chip-label"><span className="dot" style={{ background: l.color }} />{l.name}</span>)}
        </div>
        <div className="props-label">Resources</div>
        <div className="props-items" style={{ gap: 6 }}>
          {p.resources.map((r) => (
            <span key={r.name} className="resource">{r.kind === 'figma' ? <I.figma size={14} /> : r.kind === 'link' ? <I.link size={14} /> : <I.doc size={14} />}{r.name}</span>
          ))}
          <button className="icon-btn sm" aria-label="Add resource" onClick={() => toast('Resources are read-only in this replica')}><I.plus size={14} /></button>
        </div>
      </div>

      {composing ? (
        composer
      ) : latest ? (
        <div className="latest-card">
          <div className="latest-head">
            <button className={`latest-toggle ${collapsed ? 'collapsed' : ''}`} onClick={() => setCollapsed(!collapsed)}>
              Latest update <I.caretDown />
            </button>
            <div style={{ flex: 1 }} />
            <a className="btn btn-ghost" href={href(`project/${p.id}/updates`)}>See all</a>
            <Tooltip label="Write project update">
              <button className="icon-btn" aria-label="Write project update" onClick={() => setComposing(true)}><I.pencil size={16} /></button>
            </Tooltip>
          </div>
          {collapsed ? (
            <UpdateItem u={latest} variant="latest" hideActions key={latest.id + 'c'} />
          ) : (
            <UpdateItem u={latest} variant="latest" key={latest.id} />
          )}
        </div>
      ) : (
        <button className="latest-empty" onClick={() => setComposing(true)}><I.pencil size={16} />Write first project update</button>
      )}

      <div className="section-head">Description</div>
      <div className="description"><Markdown text={p.description} /></div>

      <div className="section-head">
        Milestones <span style={{ color: 'var(--text-quaternary)' }}>{ms.filter((m) => m.completedOn).length} / {ms.length}</span>
        <span className="grow" />
      </div>
      <div className="ms-list">
        {ms.map((m) => (
          <div className="ms-row" key={m.id}>
            <MilestoneDiamond pct={pct(m)} />
            <span className="n">{m.name}</span>
            <span className="pct">{pct(m)}% of {m.issues}</span>
            <span className="d">{m.completedOn ? `Completed ${shortDate(m.completedOn)}` : shortDate(m.targetDate)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UpdatesTab({ p, s, composing, setComposing, composer, focus }: {
  p: Project; s: State; composing: boolean; setComposing: (b: boolean) => void; composer: JSX.Element; focus?: string;
}) {
  const items = useMemo(() => {
    const ups = projectUpdates(s, p.id).map((u) => ({ at: u.createdAt, u }));
    const evs = s.activity.filter((a) => a.projectId === p.id).map((a) => ({ at: a.createdAt, a }));
    const mss = allMilestones
      .filter((m) => m.projectId === p.id && m.completedOn)
      .map((m) => ({ at: m.completedOn + 'T18:00:00', m }));
    return [...ups, ...evs, ...mss].sort((a, b) => b.at.localeCompare(a.at));
  }, [s, p.id]);

  return (
    <div className="overview" style={{ paddingTop: 28 }}>
      <div style={{ marginBottom: 8 }}>
        {composing ? (
          composer
        ) : (
          <button className="latest-empty" style={{ justifyContent: 'flex-start', padding: '0 18px', gap: 10, height: 52 }} onClick={() => setComposing(true)}>
            <Avatar userId={CURRENT_USER_ID} size={20} />
            <span style={{ fontWeight: 400, color: 'var(--text-quaternary)' }}>Write a project update…</span>
          </button>
        )}
      </div>
      <div className="feed">
        {items.map((it) => {
          if ('u' in it && it.u) return <UpdateItem key={it.u.id} u={it.u} variant="feed" highlight={focus === it.u.id} />;
          if ('a' in it && it.a)
            return (
              <div className="activity-line" key={it.a.id}>
                {it.a.kind === 'status' ? <I.projects size={14} /> : it.a.kind === 'target' ? <I.target size={14} /> : <I.users size={14} />}
                <span><span className="who">{userById(it.a.actorId).name}</span> {it.a.text}</span>
                <span className="meta-dot">·</span>
                <Tooltip label={fullDateTime(it.a.createdAt)}><span>{ago(it.a.createdAt)}</span></Tooltip>
              </div>
            );
          if ('m' in it && it.m)
            return (
              <div className="activity-line" key={it.m.id}>
                <MilestoneDiamond pct={100} size={14} />
                <span>Milestone <span className="who">{it.m.name}</span> completed</span>
                <span className="meta-dot">·</span>
                <span>{ago(it.at)}</span>
              </div>
            );
          return null;
        })}
        <div className="activity-line">
          <I.projects size={14} />
          <span><span className="who">{userById(p.leadId).name}</span> created the project</span>
          <span className="meta-dot">·</span>
          <span>{shortDate(p.startDate)}</span>
        </div>
      </div>
    </div>
  );
}

function DetailsPane({ p, ms, init }: { p: Project; ms: typeof allMilestones; init: (typeof initiatives)[number] }) {
  return (
    <aside className="details" aria-label="Project details">
      <div className="details-section">
        <div className="details-title">Properties</div>
        <div className="details-row"><span className="k">Status</span><StatusProp p={p} /></div>
        <div className="details-row"><span className="k">Priority</span><PriorityProp p={p} /></div>
        <div className="details-row"><span className="k">Lead</span><LeadProp p={p} /></div>
        <div className="details-row"><span className="k">Members</span><MembersProp p={p} showNames /></div>
        <div className="details-row"><span className="k">Start date</span><DateProp p={p} field="startDate" /></div>
        <div className="details-row"><span className="k">Target date</span><DateProp p={p} field="targetDate" /></div>
        <div className="details-row"><span className="k">Teams</span><span className="prop"><span className="team-mark" style={{ width: 14, height: 14 }}>S</span>{WORKSPACE.team}</span></div>
        <div className="details-row"><span className="k">Initiative</span><a className="prop" href={href(`initiative/${init.id}/overview`)}><Glyph name={init.icon} color={init.color} size={14} />{init.name}</a></div>
      </div>
      <div className="details-section">
        <div className="details-title">
          Milestones
          <button className="icon-btn sm" aria-label="Add milestone" onClick={() => toast('Milestones are read-only in this replica')}><I.plus size={14} /></button>
        </div>
        {ms.map((m) => (
          <div className="ms-row" key={m.id} title={`${m.name} · ${pct(m)}% of ${m.issues} · ${shortDate(m.targetDate)}`}>
            <MilestoneDiamond pct={pct(m)} />
            <span className="n">{m.name}</span>
            <span className="pct">{pct(m)}% of {m.issues}</span>
            <span className="d">{shortDate(m.targetDate)}</span>
          </div>
        ))}
      </div>
      <div className="details-section">
        <div className="details-title">Progress <span style={{ color: 'var(--text-quaternary)', fontWeight: 400 }}>{STATUS_META[p.status].label} · {p.progress}%</span></div>
        <ProgressGraph project={p} milestones={ms} />
      </div>
    </aside>
  );
}
