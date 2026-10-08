import type { Data, Highlight, HighlightKind, ItemRef, Milestone, Project, StatusKey } from '../data/mock';
import { PALETTE } from '../data/mock';
import { diffDays, fmtDate, fmtRange } from '../lib/dates';
import { STATUS, STATUS_ORDER } from '../lib/status';
import { getField, getPerson, getProject, hrefFor, milestonesFor, projectsDeep, updatesFor } from '../store';
import { Donut, HBars, Lollipops } from './charts';
import { IconClose, IconDiamond } from './Icons';
import { Avatar } from './ui';

/* ---------------- Snapshot helpers ---------------- */

export function statusAsOf(data: Data, ref: ItemRef, asOf: string): StatusKey | null {
  const u = updatesFor(data, ref).find((x) => x.date <= asOf);
  return u ? u.status : null;
}

function scopeProjects(data: Data, parent: ItemRef): Project[] {
  if (parent.type === 'project') {
    const p = getProject(data, parent.id);
    return p ? [p] : [];
  }
  return projectsDeep(data, parent.id);
}

function scopeMilestones(data: Data, parent: ItemRef): Milestone[] {
  return scopeProjects(data, parent).flatMap((p) => milestonesFor(data, p.id));
}

export function milestoneSets(data: Data, parent: ItemRef, asOf: string) {
  const all = scopeMilestones(data, parent);
  const done = all.filter((m) => m.completedOn && m.completedOn <= asOf).sort((a, b) => (b.completedOn ?? '').localeCompare(a.completedOn ?? ''));
  const open = all.filter((m) => !(m.completedOn && m.completedOn <= asOf));
  const overdue = open.filter((m) => m.dueDate < asOf);
  const upcoming = open.filter((m) => m.dueDate >= asOf);
  return { all, done, overdue, upcoming };
}

export const STATUS_HIGHLIGHT: Partial<Record<HighlightKind, StatusKey>> = {
  projects_on_track: 'on_track',
  projects_at_risk: 'at_risk',
  projects_off_track: 'off_track',
  projects_on_hold: 'on_hold',
};

export function highlightLabel(data: Data, parent: ItemRef, kind: HighlightKind, asOf: string): string {
  const ms = milestoneSets(data, parent, asOf);
  const plural = (n: number, s: string) => `${n} ${s}${n === 1 ? '' : 's'}`;
  switch (kind) {
    case 'milestones_completed':
      return `${plural(ms.done.length, 'milestone')} completed`;
    case 'milestones_upcoming':
      return `${plural(ms.upcoming.length, 'milestone')} upcoming`;
    case 'milestones_overdue':
      return `${plural(ms.overdue.length, 'milestone')} overdue`;
    case 'key_metrics':
      return 'Key metrics';
    case 'portfolio_health':
      return 'Portfolio health';
    case 'projects_by_priority':
      return 'Projects by priority';
    case 'projects_by_owner':
      return 'Projects by owner';
    default: {
      const st = STATUS_HIGHLIGHT[kind]!;
      const n = scopeProjects(data, parent).filter((p) => statusAsOf(data, { type: 'project', id: p.id }, asOf) === st).length;
      return `${plural(n, 'project')} ${STATUS[st].label.toLowerCase()}`;
    }
  }
}

/* ---------------- Rendering ---------------- */

const HEADINGS: Record<HighlightKind, string> = {
  milestones_completed: 'Completed milestones',
  milestones_upcoming: 'Upcoming milestones',
  milestones_overdue: 'Overdue milestones',
  key_metrics: 'Key metrics',
  projects_on_track: 'Projects on track',
  projects_at_risk: 'Projects at risk',
  projects_off_track: 'Projects off track',
  projects_on_hold: 'Projects on hold',
  portfolio_health: 'Portfolio health',
  projects_by_priority: 'Projects by priority',
  projects_by_owner: 'Projects by owner',
};

export function HighlightBlock({ data, parent, h, onRemove }: { data: Data; parent: ItemRef; h: Highlight; onRemove?: () => void }) {
  const st = STATUS_HIGHLIGHT[h.kind];
  const marker =
    h.kind === 'milestones_completed' ? <IconDiamond filled size={12} style={{ color: PALETTE.green }} />
    : h.kind === 'milestones_overdue' ? <IconDiamond filled size={12} style={{ color: PALETTE.red }} />
    : h.kind === 'milestones_upcoming' ? <IconDiamond size={12} style={{ color: '#6d6e6f' }} />
    : st ? <span className="hl-square" style={{ background: STATUS[st].dot === '#ffffff' ? STATUS[st].bg : STATUS[st].dot }} />
    : null;
  return (
    <div className="hl-block">
      <div className="hl-head">
        {marker}
        <span className="hl-title">{HEADINGS[h.kind]}</span>
        <span className="hl-asof">as of {fmtDate(h.asOf, { relative: false })}</span>
        {onRemove && (
          <button className="icon-btn sm hl-remove" aria-label="Remove highlight" onClick={onRemove}>
            <IconClose size={12} />
          </button>
        )}
      </div>
      <HighlightBody data={data} parent={parent} h={h} />
    </div>
  );
}

function HighlightBody({ data, parent, h }: { data: Data; parent: ItemRef; h: Highlight }) {
  const asOf = h.asOf;
  if (h.kind.startsWith('milestones_')) {
    const ms = milestoneSets(data, parent, asOf);
    const list = h.kind === 'milestones_completed' ? ms.done : h.kind === 'milestones_overdue' ? ms.overdue : ms.upcoming;
    if (!list.length) return <div className="hl-empty">There are no milestones in this highlight</div>;
    return (
      <div className="hl-table">
        {list.slice(0, 6).map((m) => {
          const p = getProject(data, m.projectId);
          const owner = getPerson(data, p?.ownerId);
          return (
            <div key={m.id} className="hl-row">
              <span className="hl-row-name">
                {m.name}
                {parent.type === 'portfolio' && <span className="muted"> · {p?.name}</span>}
              </span>
              <span className={`hl-row-date ${h.kind === 'milestones_overdue' ? 'overdue' : ''}`}>
                {h.kind === 'milestones_completed' ? fmtDate(m.completedOn!, { relative: false }) : fmtDate(m.dueDate, { relative: false })}
              </span>
              <Avatar person={owner} size={18} />
            </div>
          );
        })}
        {list.length > 6 && <div className="hl-more">+{list.length - 6} more</div>}
      </div>
    );
  }
  if (h.kind === 'key_metrics') {
    const projs = scopeProjects(data, parent);
    const ms = milestoneSets(data, parent, asOf);
    const progress = projs.length ? Math.round(projs.reduce((s, p) => s + p.progress, 0) / projs.length) : 0;
    const due = projs.map((p) => p.dueDate).filter(Boolean).sort().reverse()[0] as string | undefined;
    const days = due ? diffDays(asOf, due) : null;
    return (
      <div className="metric-row">
        <div className="metric">
          <span className="metric-num">{progress}%</span>
          <span className="metric-label">Task progress</span>
        </div>
        <div className="metric">
          <span className="metric-num">
            {ms.done.length}/{ms.all.length}
          </span>
          <span className="metric-label">Milestones complete</span>
        </div>
        <div className="metric">
          <span className={`metric-num ${ms.overdue.length ? 'bad' : ''}`}>{ms.overdue.length}</span>
          <span className="metric-label">Overdue milestones</span>
        </div>
        <div className="metric">
          <span className="metric-num">{days === null ? '—' : days < 0 ? `${-days}` : days}</span>
          <span className="metric-label">{days !== null && days < 0 ? 'Days past due date' : 'Days to due date'}</span>
        </div>
      </div>
    );
  }
  const st = STATUS_HIGHLIGHT[h.kind];
  if (st) {
    const projs = scopeProjects(data, parent).filter((p) => statusAsOf(data, { type: 'project', id: p.id }, asOf) === st);
    if (!projs.length) return <div className="hl-empty">There are no projects in this highlight</div>;
    return (
      <div className="hl-table">
        {projs.map((p) => (
          <a key={p.id} className="hl-row" href={hrefFor.project(p.id)}>
            <span className="hl-row-name">{p.name}</span>
            <span className="hl-row-date">{fmtRange(p.startDate, p.dueDate)}</span>
            <Avatar person={getPerson(data, p.ownerId)} size={18} />
          </a>
        ))}
      </div>
    );
  }
  const projs = scopeProjects(data, parent);
  if (h.kind === 'portfolio_health') {
    const segs = [...STATUS_ORDER, null].map((k) => ({
      label: k ? STATUS[k].label : 'No status',
      value: projs.filter((p) => statusAsOf(data, { type: 'project', id: p.id }, asOf) === k).length,
      color: k ? (k === 'complete' ? '#4f8a70' : STATUS[k].dot) : '#e0dddc',
    }));
    return <Donut segs={segs} size={130} thickness={24} />;
  }
  if (h.kind === 'projects_by_priority') {
    const f = getField(data, 'priority');
    const rows = (f?.options ?? []).map((o) => ({
      label: o.name,
      value: projs.filter((p) => data.values[p.id]?.priority === o.id).length,
      color: o.color,
    }));
    return <HBars rows={rows} />;
  }
  // projects_by_owner
  const owners = data.people.map((person) => ({ person, label: person.name, value: projs.filter((p) => p.ownerId === person.id).length }));
  return <Lollipops rows={owners} height={110} yLabel="Projects" />;
}
