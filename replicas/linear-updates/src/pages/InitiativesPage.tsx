import { useCallback, useMemo, useState } from 'react';
import type { Health, Initiative, Project, Update } from '../data/mock';
import { initiatives } from '../data/mock';
import { Glyph, HEALTH_META, HealthIcon, I, NoHealthIcon } from '../icons';
import { latestInitiativeUpdate, latestProjectUpdate, now, useStore, type State } from '../store';
import { go, href, setUI } from '../ui';
import { agoCompact, cx, shortDate } from '../util';
import { Avatar, ProgressRing } from '../components/bits';
import { Topbar } from '../components/Topbar';
import { UpdatePopover } from '../components/UpdatePopover';

type Row =
  | { kind: 'init'; id: string; i: Initiative; update?: Update }
  | { kind: 'project'; id: string; p: Project; update?: Update; last: boolean };

export function HealthCell({ update, onOpen, active }: { update?: Update; onOpen: (e: React.MouseEvent) => void; active?: boolean }) {
  if (!update)
    return (
      <button className="health-cell" onClick={onOpen} style={{ color: 'var(--text-quaternary)' }}>
        <NoHealthIcon /> No updates
      </button>
    );
  const m = HEALTH_META[update.health];
  return (
    <button className={cx('health-cell', active && 'sel')} onClick={onOpen} style={{ color: m.color, background: active ? 'var(--bg-selected)' : undefined }}>
      <HealthIcon health={update.health} />
      {m.label}
      <span className="age">· {agoCompact(update.createdAt)}</span>
    </button>
  );
}

export function ActivityGlyph({ update }: { update?: Update }) {
  if (!update) return <span style={{ color: 'var(--text-quaternary)' }}>—</span>;
  const days = (now().getTime() - new Date(update.createdAt).getTime()) / 86400000;
  if (days > 14) return <span style={{ color: 'var(--text-quaternary)' }}>—</span>;
  const n = days < 3 ? 3 : days < 7 ? 2 : 1;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-label="Recent activity">
      {Array.from({ length: n }).map((_, i) => (
        <path key={i} d={`M3.5 ${11 - i * 3.2} 8 ${7 - i * 3.2} 12.5 ${11 - i * 3.2}`} fill="none" stroke="var(--health-on)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

function initHealthCounts(s: State, id: string) {
  const ps = s.projects.filter((p) => p.initiativeId === id && p.status !== 'completed' && p.status !== 'canceled');
  const c: Record<Health | 'none', number> = { onTrack: 0, atRisk: 0, offTrack: 0, none: 0 };
  ps.forEach((p) => { const u = latestProjectUpdate(s, p.id); c[u ? u.health : 'none']++; });
  return c;
}

export function InitiativesPage({ route }: { route: string[] }) {
  const s = useStore((s) => s);
  const filter = route[1] === 'planned' ? 'planned' : route[1] === 'all' ? 'all' : 'active';
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [pop, setPop] = useState<{ id: string; rect: DOMRect } | null>(null);

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    initiatives
      .filter((i) => filter === 'all' || i.status === filter)
      .forEach((i) => {
        out.push({ kind: 'init', id: `i:${i.id}`, i, update: latestInitiativeUpdate(s, i.id) });
        if (!collapsed[i.id]) {
          const ps = s.projects.filter((p) => p.initiativeId === i.id);
          ps.forEach((p, k) => out.push({ kind: 'project', id: `p:${p.id}`, p, update: latestProjectUpdate(s, p.id), last: k === ps.length - 1 }));
        }
      });
    return out;
  }, [s, filter, collapsed]);

  const popRow = pop ? rows.find((r) => r.id === pop.id) : undefined;
  const nav = useCallback(
    (dir: 1 | -1) => {
      if (!pop) return;
      const idx = rows.findIndex((r) => r.id === pop.id);
      const next = rows[idx + dir];
      if (!next) return;
      const el = document.querySelector(`[data-row="${next.id}"] .health-cell`);
      if (el) setPop({ id: next.id, rect: el.getBoundingClientRect() });
    },
    [pop, rows],
  );

  const cols = 'minmax(0,1fr) 96px 168px 104px 150px 56px';
  return (
    <>
      <Topbar
        left={<><I.initiatives size={16} style={{ color: 'var(--text-tertiary)' }} /><span className="crumb-title">Initiatives</span></>}
        tabs={[
          { id: 'active', label: 'Active', href: href('initiatives'), active: filter === 'active' },
          { id: 'planned', label: 'Planned', href: href('initiatives/planned'), active: filter === 'planned' },
          { id: 'all', label: 'All initiatives', href: href('initiatives/all'), active: filter === 'all' },
        ]}
        right={<button className="icon-btn hide-sm" aria-label="Display options"><I.display size={16} /></button>}
      />
      <div className="scroll">
        {rows.length === 0 ? (
          <div className="empty"><h3>No planned initiatives</h3>Every client initiative is active. Switch to “All initiatives” to see them.</div>
        ) : (
          <div className="table" role="table">
            <div className="trow head" style={{ ['--cols' as string]: cols }} role="row">
              <span>Name</span>
              <span className="hide-sm">Target</span>
              <span>Health</span>
              <span className="hide-sm">Projects</span>
              <span className="hide-sm">Active projects</span>
              <span className="hide-sm">Activity</span>
            </div>
            {rows.map((r, idx) => {
              if (r.kind === 'init') {
                const ps = s.projects.filter((p) => p.initiativeId === r.i.id);
                const c = initHealthCounts(s, r.i.id);
                const done = ps.filter((p) => p.status === 'completed').length;
                return (
                  <div key={r.id} data-row={r.id} className={cx('trow clickable', pop?.id === r.id && 'sel')} style={{ ['--cols' as string]: cols, minHeight: 52, borderTop: idx > 0 ? '1px solid var(--border-subtle)' : undefined }} role="row" onClick={(e) => { if (!(e.target as HTMLElement).closest('button')) go(`initiative/${r.i.id}/overview`); }}>
                    <span className="name">
                      <button className={cx('expander', collapsed[r.i.id] && 'collapsed')} aria-label="Toggle projects" onClick={() => setCollapsed({ ...collapsed, [r.i.id]: !collapsed[r.i.id] })}><I.caretDown /></button>
                      <span className="init-icon" style={{ background: `color-mix(in srgb, ${r.i.color} 18%, transparent)` }}><Glyph name={r.i.icon} color={r.i.color} size={14} /></span>
                      <span className="t">{r.i.name}</span>
                    </span>
                    <span className="muted hide-sm">{r.i.targetLabel}</span>
                    <span><HealthCell update={r.update} active={pop?.id === r.id} onOpen={(e) => setPop({ id: r.id, rect: e.currentTarget.getBoundingClientRect() })} /></span>
                    <span className="count-cell hide-sm"><I.hexCheck size={15} />{done}<span className="slash">/</span>{ps.length}</span>
                    <span className="dots hide-sm">
                      {c.onTrack > 0 && <span><i style={{ background: 'var(--health-on)' }} />{c.onTrack}</span>}
                      {c.atRisk > 0 && <span><i style={{ background: 'var(--health-risk)' }} />{c.atRisk}</span>}
                      {c.offTrack > 0 && <span><i style={{ background: 'var(--health-off)' }} />{c.offTrack}</span>}
                      {c.none > 0 && <span><i style={{ background: 'var(--text-quaternary)' }} />{c.none}</span>}
                      {ps.length - done === 0 && <span className="muted">—</span>}
                    </span>
                    <span className="hide-sm"><ActivityGlyph update={r.update} /></span>
                  </div>
                );
              }
              const p = r.p;
              return (
                <div key={r.id} data-row={r.id} className={cx('trow clickable child', !r.last && 'mid', pop?.id === r.id && 'sel')} style={{ ['--cols' as string]: cols }} role="row" onClick={(e) => { if (!(e.target as HTMLElement).closest('button')) go(`project/${p.id}/overview`); }}>
                  <span className="name">
                    <Glyph name={p.icon} color={p.color} size={16} />
                    <span style={{ minWidth: 0 }}>
                      <span className="t" style={{ display: 'block' }}>{p.name}</span>
                      <span className="sub">{p.summary}</span>
                    </span>
                  </span>
                  <span className="muted hide-sm">{shortDate(p.targetDate)}</span>
                  <span><HealthCell update={r.update} active={pop?.id === r.id} onOpen={(e) => setPop({ id: r.id, rect: e.currentTarget.getBoundingClientRect() })} /></span>
                  <span className="pct-ring hide-sm"><ProgressRing pct={p.progress} />{p.progress}%</span>
                  <span className="hide-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Avatar userId={p.leadId} size={18} /><span className="muted">{p.leadId}</span></span>
                  <span className="hide-sm"><ActivityGlyph update={r.update} /></span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {pop && popRow && (
        <UpdatePopover
          anchor={pop.rect}
          update={popRow.update}
          onClose={() => setPop(null)}
          onNav={nav}
          title={
            popRow.kind === 'init'
              ? <><Glyph name={popRow.i.icon} color={popRow.i.color} /><a href={href(`initiative/${popRow.i.id}/overview`)}>{popRow.i.name}</a></>
              : <><Glyph name={popRow.p.icon} color={popRow.p.color} /><a href={href(`project/${popRow.p.id}/overview`)}>{popRow.p.name}</a></>
          }
          onWrite={() => {
            setPop(null);
            if (popRow.kind === 'init') { go(`initiative/${popRow.i.id}/overview`); setUI({ composeFor: popRow.i.id }); }
            else { go(`project/${popRow.p.id}/overview`); setUI({ composeFor: popRow.p.id }); }
          }}
        />
      )}
    </>
  );
}
