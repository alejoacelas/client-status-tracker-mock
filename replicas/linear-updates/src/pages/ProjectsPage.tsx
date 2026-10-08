import { useMemo, useState } from 'react';
import type { Health } from '../data/mock';
import { initiatives } from '../data/mock';
import { Glyph, HEALTH_META, HealthIcon, I, NoHealthIcon, PriorityIcon, PRIORITY_META, STATUS_META, StatusIcon } from '../icons';
import { latestProjectUpdate, useStore } from '../store';
import { go, href } from '../ui';
import { shortDate } from '../util';
import { Avatar } from '../components/bits';
import { Menu, useAnchor } from '../components/Menu';
import { Topbar } from '../components/Topbar';
import { HealthCell } from './InitiativesPage';

type HF = Health | 'none';

export function ProjectsPage() {
  const s = useStore((s) => s);
  const [health, setHealth] = useState<HF[]>([]);
  const [group, setGroup] = useState<'initiative' | 'status' | 'none'>('initiative');
  const fm = useAnchor();
  const dm = useAnchor();

  const rows = useMemo(
    () =>
      s.projects
        .map((p) => ({ p, u: latestProjectUpdate(s, p.id) }))
        .filter(({ u }) => health.length === 0 || health.includes(u ? u.health : 'none')),
    [s, health],
  );
  const groups = useMemo(() => {
    if (group === 'none') return [{ key: 'all', label: '', rows }];
    if (group === 'status')
      return (Object.keys(STATUS_META) as (keyof typeof STATUS_META)[])
        .map((st) => ({ key: st, label: STATUS_META[st].label, icon: <StatusIcon status={st} progress={0.5} />, rows: rows.filter((r) => r.p.status === st) }))
        .filter((g) => g.rows.length);
    return initiatives
      .map((i) => ({ key: i.id, label: i.name, icon: <Glyph name={i.icon} color={i.color} size={14} />, rows: rows.filter((r) => r.p.initiativeId === i.id) }))
      .filter((g) => g.rows.length);
  }, [rows, group]);

  const count = (h: HF) => s.projects.filter((p) => { const u = latestProjectUpdate(s, p.id); return (u ? u.health : 'none') === h; }).length;
  const cols = 'minmax(0,1fr) 150px 96px 100px 96px 120px';

  return (
    <>
      <Topbar
        left={<><I.projects size={16} style={{ color: 'var(--text-tertiary)' }} /><span className="crumb-title">Projects</span></>}
        tabs={[{ id: 'all', label: 'All projects', href: href('projects'), active: true }]}
        right={<button className="icon-btn" aria-label="Display options" onClick={dm.open}><I.display size={16} /></button>}
      />
      <div className="list-head">
        {health.length > 0 && (
          <span className="filter-chip">
            <span><I.pulse size={13} />Health</span>
            <span className="op">is{health.length > 1 ? ' any of' : ''}</span>
            <button onClick={fm.open}>
              {health.length === 1 ? (health[0] === 'none' ? <><NoHealthIcon size={14} />No updates</> : <><HealthIcon health={health[0] as Health} size={14} />{HEALTH_META[health[0] as Health].label}</>) : `${health.length} values`}
            </button>
            <button aria-label="Clear filter" onClick={() => setHealth([])}><I.close size={12} /></button>
          </span>
        )}
        <button className="btn btn-ghost" onClick={fm.open}><I.filter size={14} />Filter</button>
      </div>
      {fm.anchor && (
        <Menu
          anchor={fm.anchor}
          onClose={fm.close}
          searchable
          placeholder="Filter by health…"
          width={260}
          onSelect={(id) => setHealth((h) => (h.includes(id as HF) ? h.filter((x) => x !== id) : [...h, id as HF]))}
          items={[
            ...(['onTrack', 'atRisk', 'offTrack'] as Health[]).map((h) => ({ id: h, label: HEALTH_META[h].label, icon: <HealthIcon health={h} />, checked: health.includes(h), meta: `${count(h)} project${count(h) === 1 ? '' : 's'}` })),
            { id: 'none', label: 'No updates', icon: <NoHealthIcon />, checked: health.includes('none'), meta: `${count('none')} projects` },
          ]}
        />
      )}
      {dm.anchor && (
        <Menu
          anchor={dm.anchor}
          align="right"
          onClose={dm.close}
          width={220}
          onSelect={(id) => setGroup(id as typeof group)}
          items={[
            { id: 'initiative', label: 'Group by initiative', checked: group === 'initiative' },
            { id: 'status', label: 'Group by status', checked: group === 'status' },
            { id: 'none', label: 'No grouping', checked: group === 'none' },
          ]}
        />
      )}
      <div className="scroll">
        <div className="table">
          <div className="trow head" style={{ ['--cols' as string]: cols }}>
            <span>Name</span><span>Health</span><span className="hide-sm">Priority</span><span className="hide-sm">Lead</span><span className="hide-sm">Target date</span><span className="hide-sm">Status</span>
          </div>
          {groups.map((g) => (
            <div key={g.key}>
              {g.label && (
                <div className="trow" style={{ minHeight: 36, background: 'var(--bg-chip)', color: 'var(--text-secondary)', fontWeight: 510, display: 'flex', gap: 8 }}>
                  {'icon' in g && g.icon}{g.label}<span style={{ color: 'var(--text-quaternary)', fontWeight: 400 }}>{g.rows.length}</span>
                </div>
              )}
              {g.rows.map(({ p, u }) => (
                <div key={p.id} className="trow clickable" style={{ ['--cols' as string]: cols }} onClick={(e) => { if (!(e.target as HTMLElement).closest('button')) go(`project/${p.id}/overview`); }}>
                  <span className="name"><Glyph name={p.icon} color={p.color} /><span className="t">{p.name}</span></span>
                  <span><HealthCell update={u} onOpen={() => go(`project/${p.id}/updates`)} /></span>
                  <span className="hide-sm" title={PRIORITY_META[p.priority]}><PriorityIcon priority={p.priority} /></span>
                  <span className="hide-sm" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><Avatar userId={p.leadId} size={18} /><span className="muted">{p.leadId}</span></span>
                  <span className="muted hide-sm">{shortDate(p.targetDate)}</span>
                  <span className="hide-sm" style={{ display: 'inline-flex', gap: 7, alignItems: 'center' }}><StatusIcon status={p.status} progress={p.progress / 100} /><span className="muted">{p.progress}%</span></span>
                </div>
              ))}
            </div>
          ))}
          {rows.length === 0 && <div className="empty"><h3>No projects match</h3>Try removing the health filter.</div>}
        </div>
      </div>
    </>
  );
}
