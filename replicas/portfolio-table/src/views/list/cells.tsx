import { useEffect, useRef, useState } from 'react';
import type { Data, Milestone, StatusKey } from '../../data/mock';
import { TODAY } from '../../data/mock';
import { diffDays, fmtAgo, fmtDate, fmtRange } from '../../lib/dates';
import { STATUS, STATUS_ORDER } from '../../lib/status';
import { getField, getPerson, hrefFor, navigate, useStore } from '../../store';
import { DatePicker } from '../../components/DatePicker';
import { IconCheck, IconDiamond, IconSparkle } from '../../components/Icons';
import { Avatar, MenuItem, MenuSep, Pill, Popover, ProgressBar, StatusChip } from '../../components/ui';
import type { Row } from './model';

/* ---------------- Shared pickers ---------------- */

export function StatusMenu({ current, onPick, onClose, anchor, extra }: {
  current: StatusKey | null;
  onPick: (s: StatusKey) => void;
  onClose: () => void;
  anchor: HTMLElement | null;
  extra?: React.ReactNode;
}) {
  return (
    <Popover anchor={anchor} onClose={onClose}>
      <div className="menu status-menu">
        <div className="menu-title-row">
          <span className="status-ring" /> {current ? 'Update status' : 'Set status'}
        </div>
        {STATUS_ORDER.slice(0, 4).map((k) => (
          <button key={k} className={`menu-item ${current === k ? 'active' : ''}`} onClick={() => onPick(k)}>
            <StatusChip status={k} size="sm" />
          </button>
        ))}
        <MenuSep />
        {STATUS_ORDER.slice(4).map((k) => (
          <button key={k} className={`menu-item ${current === k ? 'active' : ''}`} onClick={() => onPick(k)}>
            <StatusChip status={k} size="sm" />
          </button>
        ))}
        {extra && (
          <>
            <MenuSep />
            {extra}
          </>
        )}
      </div>
    </Popover>
  );
}

export function PeoplePicker({ data, current, onPick, onClose, anchor }: {
  data: Data;
  current: string | null;
  onPick: (id: string | null) => void;
  onClose: () => void;
  anchor: HTMLElement | null;
}) {
  const [q, setQ] = useState('');
  const list = data.people.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <Popover anchor={anchor} onClose={onClose}>
      <div className="menu picker">
        <input autoFocus className="picker-input" placeholder="Name or email" value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && list[0]) onPick(list[0].id); }} />
        {list.map((p) => (
          <MenuItem key={p.id} icon={<Avatar person={p} size={22} />} onClick={() => onPick(p.id)} active={p.id === current}
            right={<span className="muted small">{p.role}</span>}>
            {p.name}
          </MenuItem>
        ))}
        {list.length === 0 && <div className="menu-empty">No people match “{q}”</div>}
        {current && (
          <>
            <MenuSep />
            <MenuItem onClick={() => onPick(null)}>Remove owner</MenuItem>
          </>
        )}
      </div>
    </Popover>
  );
}

export function OptionPicker({ data, fieldId, current, onPick, onClose, anchor }: {
  data: Data;
  fieldId: string;
  current: string | null;
  onPick: (id: string | null) => void;
  onClose: () => void;
  anchor: HTMLElement | null;
}) {
  const f = getField(data, fieldId);
  const [q, setQ] = useState('');
  const opts = (f?.options ?? []).filter((o) => o.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <Popover anchor={anchor} onClose={onClose}>
      <div className="menu picker">
        <input autoFocus className="picker-input" placeholder="Find an option" value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && opts[0]) onPick(opts[0].id); }} />
        {opts.map((o) => (
          <MenuItem key={o.id} onClick={() => onPick(o.id)} right={o.id === current ? <IconCheck size={14} /> : undefined}>
            <Pill name={o.name} color={o.color} />
          </MenuItem>
        ))}
        {opts.length === 0 && <div className="menu-empty">No options match</div>}
        {current && (
          <>
            <MenuSep />
            <MenuItem onClick={() => onPick(null)}>Clear</MenuItem>
          </>
        )}
      </div>
    </Popover>
  );
}

/* ---------------- Milestone diamonds ---------------- */

export function MilestoneDiamonds({ ms, max = 6 }: { ms: Milestone[]; max?: number }) {
  if (!ms.length) return <span className="muted">No milestones</span>;
  const shown = ms.slice(0, max);
  return (
    <span className="diamonds">
      {shown.map((m) => {
        const done = !!m.completedOn;
        const overdue = !done && m.dueDate < TODAY;
        return (
          <span key={m.id} className="diamond-wrap" title={`${m.name} · ${done ? 'Completed ' + fmtDate(m.completedOn!) : 'Due ' + fmtDate(m.dueDate)}`}>
            <IconDiamond filled={done || overdue} size={14} className={done ? 'd-done' : overdue ? 'd-overdue' : 'd-open'} />
            {done && <IconCheck size={8} className="d-check" />}
          </span>
        );
      })}
      {ms.length > max && <span className="muted small">+{ms.length - max}</span>}
    </span>
  );
}

/* ---------------- Cell ---------------- */

type Editing = null | 'status' | 'owner' | 'date' | 'option' | 'text';

export function Cell({ row, fieldId, progressType, width }: { row: Row; fieldId: string; progressType: 'task' | 'milestone'; width: number }) {
  const { data, actions } = useStore();
  const ref = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState<Editing>(null);
  const [draft, setDraft] = useState('');
  const field = getField(data, fieldId);
  const raw = data.values[row.ref.id]?.[fieldId] ?? null;
  const info = row.info;

  const begin = (kind: Editing) => {
    if (kind === 'text') setDraft(raw === null ? '' : String(raw));
    setEditing(kind);
  };

  let content: React.ReactNode = null;
  let onActivate: (() => void) | null = null;
  let readOnlyTitle: string | undefined;

  switch (fieldId) {
    case 'status':
      content = row.status ? (
        <span className="status-cell">
          <StatusChip status={row.status} size="sm" />
          <span className="status-date">{fmtAgo(row.statusDate!)}</span>
        </span>
      ) : (
        <StatusChip status={null} size="sm" noRecent />
      );
      onActivate = () => begin('status');
      break;
    case 'progress':
      content = progressType === 'milestone' ? <MilestoneDiamonds ms={info.milestones} /> : <ProgressBar value={info.progress} width={Math.min(80, Math.max(40, width - 80))} />;
      readOnlyTitle = progressType === 'milestone' ? 'Milestone progress' : 'Task progress is calculated from completed tasks';
      break;
    case 'milestones':
      content = <MilestoneDiamonds ms={info.milestones} />;
      readOnlyTitle = 'Milestone progress';
      break;
    case 'date': {
      const overdue = info.dueDate && diffDays(TODAY, info.dueDate) < 0 && row.status !== 'complete';
      const text = fmtRange(info.startDate, info.dueDate);
      content = text ? <span className={`date-text ${overdue ? 'overdue' : ''}`}>{text}</span> : null;
      onActivate = () => begin('date');
      break;
    }
    case 'start':
      content = info.startDate ? <span className="date-text">{fmtDate(info.startDate)}</span> : null;
      onActivate = () => begin('date');
      break;
    case 'owner': {
      const p = getPerson(data, info.ownerId);
      content = p ? (
        <span className="owner-cell">
          <Avatar person={p} size={22} />
          <span className="owner-name">{p.name}</span>
        </span>
      ) : null;
      onActivate = () => begin('owner');
      break;
    }
    case 'remaining': {
      if (info.dueDate && row.status !== 'complete') {
        const d = diffDays(TODAY, info.dueDate);
        content = <span className={d < 0 ? 'date-text overdue' : ''}>{d < 0 ? `${-d} days overdue` : d < 7 ? `${d} days` : `${Math.round(d / 7)} weeks`}</span>;
      } else content = info.dueDate ? <span className="muted">—</span> : null;
      readOnlyTitle = 'Calculated from the due date';
      break;
    }
    case 'duration': {
      if (info.startDate && info.dueDate) {
        const d = diffDays(info.startDate, info.dueDate);
        content = <span>{d >= 14 ? `${Math.round(d / 7)} weeks` : `${d} days`}</span>;
      }
      readOnlyTitle = 'Calculated from the start and due dates';
      break;
    }
    default: {
      if (field?.type === 'single') {
        const o = field.options?.find((x) => x.id === raw);
        content = o ? <Pill name={o.name} color={o.color} /> : null;
        onActivate = () => begin('option');
      } else if (field?.type === 'people') {
        const p = getPerson(data, raw as string);
        content = p ? (
          <span className="owner-cell">
            <Avatar person={p} size={22} />
            <span className="owner-name">{p.name}</span>
          </span>
        ) : null;
        onActivate = () => begin('owner');
      } else if (field?.type === 'date') {
        content = raw ? <span className="date-text">{fmtDate(String(raw))}</span> : null;
        onActivate = () => begin('date');
      } else {
        content = raw !== null && raw !== '' ? <span className={`text-cell ${field?.type === 'number' ? 'num' : ''}`} title={String(raw)}>{field?.type === 'number' ? Number(raw).toLocaleString('en-GB') : String(raw)}</span> : null;
        onActivate = () => begin('text');
      }
    }
  }

  const isPeopleField = field?.type === 'people';
  const isDateField = field?.type === 'date';

  return (
    <div
      ref={ref}
      className={`cell ${onActivate ? 'editable' : 'readonly'} ${editing ? 'editing' : ''}`}
      style={{ width, minWidth: width, maxWidth: width }}
      title={readOnlyTitle}
      tabIndex={onActivate ? 0 : -1}
      onClick={() => !editing && onActivate?.()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !editing) onActivate?.();
      }}
    >
      {editing === 'text' ? (
        <input
          autoFocus
          className="cell-input"
          type={field?.type === 'number' ? 'number' : 'text'}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            actions.setValue(row.ref.id, fieldId, draft === '' ? null : field?.type === 'number' ? Number(draft) : draft);
            setEditing(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            if (e.key === 'Escape') setEditing(null);
          }}
        />
      ) : (
        content ?? (onActivate ? <span className="cell-empty" /> : null)
      )}
      {editing === 'status' && (
        <StatusMenu
          anchor={ref.current}
          current={row.status}
          onClose={() => setEditing(null)}
          onPick={(s) => {
            setEditing(null);
            navigate(hrefFor.compose(row.ref, s).slice(1));
          }}
          extra={
            <>
              {row.status && (
                <MenuItem onClick={() => { setEditing(null); navigate(`/update/${STATUS_LATEST(data, row)}`); }}>
                  View latest status update
                </MenuItem>
              )}
              <MenuItem icon={<IconSparkle />} onClick={() => { setEditing(null); navigate(hrefFor.compose(row.ref).slice(1)); }}>
                Write a status update
              </MenuItem>
            </>
          }
        />
      )}
      {editing === 'owner' && (
        <PeoplePicker
          data={data}
          anchor={ref.current}
          current={isPeopleField ? (raw as string | null) : info.ownerId}
          onClose={() => setEditing(null)}
          onPick={(id) => {
            if (isPeopleField) actions.setValue(row.ref.id, fieldId, id);
            else actions.setOwner(row.ref, id);
            setEditing(null);
          }}
        />
      )}
      {editing === 'option' && (
        <OptionPicker
          data={data}
          fieldId={fieldId}
          anchor={ref.current}
          current={raw as string | null}
          onClose={() => setEditing(null)}
          onPick={(id) => {
            actions.setValue(row.ref.id, fieldId, id);
            setEditing(null);
          }}
        />
      )}
      {editing === 'date' && (
        <Popover anchor={ref.current} onClose={() => setEditing(null)}>
          {isDateField ? (
            <DatePicker
              allowStart={false}
              start={null}
              due={raw as string | null}
              onChange={(_s, d) => actions.setValue(row.ref.id, fieldId, d)}
              onDone={() => setEditing(null)}
            />
          ) : (
            <DatePicker start={info.startDate} due={info.dueDate} onChange={(s, d) => actions.setDates(row.ref, s, d)} onDone={() => setEditing(null)} />
          )}
        </Popover>
      )}
    </div>
  );
}

function STATUS_LATEST(data: Data, row: Row) {
  const list = data.updates.filter((u) => u.parent.type === row.ref.type && u.parent.id === row.ref.id).sort((a, b) => b.date.localeCompare(a.date));
  return list[0]?.id ?? '';
}

/** Inline name editor used for rename. */
export function NameEditor({ initial, onDone }: { initial: string; onDone: (v: string | null) => void }) {
  const [v, setV] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.select();
  }, []);
  return (
    <input
      ref={ref}
      className="name-input"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onBlur={() => onDone(v)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onDone(v);
        if (e.key === 'Escape') onDone(null);
      }}
    />
  );
}

export { STATUS };
