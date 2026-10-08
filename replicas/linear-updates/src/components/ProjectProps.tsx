import { useState } from 'react';
import type { Priority, Project, ProjectStatus } from '../data/mock';
import { users } from '../data/mock';
import { I, PRIORITY_META, PriorityIcon, STATUS_META, StatusIcon } from '../icons';
import { actions, userById } from '../store';
import { shortDate } from '../util';
import { Avatar } from './bits';
import { Menu, Popover, Tooltip, useAnchor } from './Menu';

export function StatusProp({ p, label = true }: { p: Project; label?: boolean }) {
  const a = useAnchor();
  return (
    <>
      <button className="prop" onClick={a.open}>
        <StatusIcon status={p.status} progress={p.progress / 100} />
        {label && STATUS_META[p.status].label}
      </button>
      {a.anchor && (
        <Menu
          anchor={a.anchor}
          onClose={a.close}
          searchable
          placeholder="Change project status…"
          width={240}
          onSelect={(id) => {
            const st = id as ProjectStatus;
            if (st === p.status) return;
            actions.updateProject(p.id, { status: st, progress: st === 'completed' ? 100 : p.progress }, `changed status from ${STATUS_META[p.status].label} to ${STATUS_META[st].label}`, 'status');
          }}
          items={(Object.keys(STATUS_META) as ProjectStatus[]).map((s, i) => ({
            id: s, label: STATUS_META[s].label, icon: <StatusIcon status={s} progress={0.5} />, checked: s === p.status, meta: String(i + 1),
          }))}
        />
      )}
    </>
  );
}

export function PriorityProp({ p, label = true }: { p: Project; label?: boolean }) {
  const a = useAnchor();
  return (
    <>
      <button className={`prop ${p.priority === 0 ? 'muted' : ''}`} onClick={a.open}>
        <PriorityIcon priority={p.priority} />
        {label && PRIORITY_META[p.priority]}
      </button>
      {a.anchor && (
        <Menu
          anchor={a.anchor}
          onClose={a.close}
          searchable
          placeholder="Set priority to…"
          width={220}
          onSelect={(id) => {
            const pr = Number(id) as Priority;
            actions.updateProject(p.id, { priority: pr }, `set priority to ${PRIORITY_META[pr]}`, 'status');
          }}
          items={([0, 1, 2, 3, 4] as Priority[]).map((pr) => ({
            id: String(pr), label: PRIORITY_META[pr], icon: <PriorityIcon priority={pr} />, checked: pr === p.priority, meta: String(pr),
          }))}
        />
      )}
    </>
  );
}

export function LeadProp({ p }: { p: Project }) {
  const a = useAnchor();
  return (
    <>
      <button className="prop" onClick={a.open}>
        <Avatar userId={p.leadId} size={16} />
        {userById(p.leadId).name}
      </button>
      {a.anchor && (
        <Menu
          anchor={a.anchor}
          onClose={a.close}
          searchable
          placeholder="Change project lead…"
          width={230}
          onSelect={(id) => {
            if (id === p.leadId) return;
            actions.updateProject(p.id, { leadId: id, memberIds: p.memberIds.includes(id) ? p.memberIds : [...p.memberIds, id] }, `changed lead from ${userById(p.leadId).name} to ${userById(id).name}`, 'lead');
          }}
          items={users.map((u) => ({ id: u.id, label: u.name, meta: u.fullName, icon: <Avatar userId={u.id} size={18} />, checked: u.id === p.leadId }))}
        />
      )}
    </>
  );
}

export function MembersProp({ p, showNames }: { p: Project; showNames?: boolean }) {
  const a = useAnchor();
  return (
    <>
      <Tooltip label={`Members: ${p.memberIds.map((id) => userById(id).name).join(', ')}`}>
        <button className="prop" onClick={a.open}>
          <span className="avatars">{p.memberIds.map((id) => <Avatar key={id} userId={id} size={16} />)}</span>
          {showNames && <span>{p.memberIds.length} members</span>}
        </button>
      </Tooltip>
      {a.anchor && (
        <Menu
          anchor={a.anchor}
          onClose={() => a.close()}
          searchable
          placeholder="Change members…"
          width={230}
          onSelect={(id) => {
            const has = p.memberIds.includes(id);
            if (has && id === p.leadId) return;
            actions.updateProject(p.id, { memberIds: has ? p.memberIds.filter((m) => m !== id) : [...p.memberIds, id] }, `${has ? 'removed' : 'added'} ${userById(id).name} ${has ? 'from' : 'to'} members`, 'member');
          }}
          items={users.map((u) => ({ id: u.id, label: u.name, meta: u.fullName, icon: <Avatar userId={u.id} size={18} />, checked: p.memberIds.includes(u.id) }))}
        />
      )}
    </>
  );
}

export function DateProp({ p, field }: { p: Project; field: 'startDate' | 'targetDate' }) {
  const a = useAnchor();
  const [v, setV] = useState(p[field]);
  const label = field === 'startDate' ? 'start date' : 'target date';
  return (
    <>
      <Tooltip label={field === 'startDate' ? 'Start date' : 'Target date'}>
        <button className="prop" onClick={(e) => { setV(p[field]); a.open(e); }}>
          {field === 'startDate' ? <I.calendar size={14} /> : <I.target size={14} />}
          {shortDate(p[field])}
        </button>
      </Tooltip>
      {a.anchor && (
        <Popover anchor={a.anchor} onClose={a.close} className="date-pop">
          <div className="menu-label" style={{ padding: '0 0 6px' }}>Set {label}</div>
          <input
            type="date"
            value={v}
            autoFocus
            onChange={(e) => setV(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { apply(); } }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 10 }}>
            <button className="btn btn-secondary" onClick={a.close}>Cancel</button>
            <button className="btn btn-primary" onClick={apply}>Save</button>
          </div>
        </Popover>
      )}
    </>
  );
  function apply() {
    if (v && v !== p[field]) actions.updateProject(p.id, { [field]: v }, `changed ${label} from ${shortDate(p[field])} to ${shortDate(v)}`, 'target');
    a.close();
  }
}
