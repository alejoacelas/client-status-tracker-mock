import { useRef, useState } from 'react';
import type { FieldDef, ItemRef } from '../data/mock';
import { fmtDate, fmtRange } from '../lib/dates';
import { getField, hrefFor, itemInfo, latestUpdate, navigate, updatesFor, useStore, useToast } from '../store';
import { FIELD_LABEL, COLUMN_ICON_KIND } from '../views/list/model';
import { StatusMenu } from '../views/list/cells';
import { FieldModal } from './FieldModal';
import {
  IconCalendar, IconChevronDown, IconClock, IconCollapseRight, IconDiamond, IconLink, IconNumber, IconPeople, IconPlus, IconProgress,
  IconSingleSelect, IconText, IconFlag,
} from './Icons';
import { StatusCard, copyLink } from './StatusCard';
import { FolderIcon, ProjectIcon, Toggle } from './ui';

export const fieldIcon = (kind: string) =>
  ({
    status: <IconFlag />, progress: <IconProgress />, milestone: <IconDiamond />, date: <IconCalendar />, people: <IconPeople />,
    clock: <IconClock />, single: <IconSingleSelect />, text: <IconText />, number: <IconNumber />,
  } as Record<string, React.ReactNode>)[kind] ?? <IconText />;

export function CustomizePane({ portfolioId, onClose }: { portfolioId: string; onClose: () => void }) {
  const { data, actions } = useStore();
  const toast = useToast();
  const view = data.views[portfolioId];
  const [more, setMore] = useState(false);
  const [adding, setAdding] = useState(false);
  const cols = view.columns;
  const shown = more ? cols : cols.slice(0, 7);
  return (
    <aside className="side-pane customize-pane" aria-label="Customize">
      <div className="pane-head">
        <h2>Customize</h2>
        <button className="icon-btn" aria-label="Close" onClick={onClose}>
          <IconCollapseRight />
        </button>
      </div>
      <div className="pane-body">
        <h3 className="pane-h3">Fields</h3>
        <button className="dashed-btn" onClick={() => setAdding(true)}>
          <IconPlus size={12} /> Add field
        </button>
        <div className="field-list">
          {shown.map((c) => (
            <div key={c.fieldId} className="field-item">
              <span className="menu-icon">{fieldIcon(COLUMN_ICON_KIND(data, c.fieldId))}</span>
              <span className="grow">{FIELD_LABEL(data, c.fieldId, view)}</span>
              <Toggle
                on={!c.hidden}
                label={`Show ${FIELD_LABEL(data, c.fieldId, view)}`}
                onChange={(on) => actions.setView(portfolioId, { columns: cols.map((x) => (x.fieldId === c.fieldId ? { ...x, hidden: !on } : x)) })}
              />
            </div>
          ))}
        </div>
        {cols.length > 7 && (
          <button className="btn-link" onClick={() => setMore(!more)}>
            {more ? 'Show fewer fields' : `Show ${cols.length - 7} more fields`}
          </button>
        )}
        <h3 className="pane-h3 mt">Progress type</h3>
        <div className="seg">
          <button className={view.progressType === 'task' ? 'on' : ''} onClick={() => actions.setView(portfolioId, { progressType: 'task' })}>Task</button>
          <button className={view.progressType === 'milestone' ? 'on' : ''} onClick={() => actions.setView(portfolioId, { progressType: 'milestone' })}>Milestone</button>
        </div>
        <h3 className="pane-h3 mt">Project templates</h3>
        <p className="muted">Quickly create standardized projects from a template.</p>
        <button className="dashed-btn" onClick={() => toast('Templates are not part of this replica')}>
          <IconPlus size={12} /> Add template
        </button>
      </div>
      {adding && (
        <FieldModal
          type="single"
          onClose={() => setAdding(false)}
          onSave={(f: FieldDef) => {
            actions.addField(portfolioId, f);
            setAdding(false);
            toast(`${f.name} field added`);
          }}
        />
      )}
    </aside>
  );
}

export function DetailsPane({ item, onClose }: { item: ItemRef; onClose: () => void }) {
  const { data } = useStore();
  const toast = useToast();
  const info = itemInfo(data, item);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [menu, setMenu] = useState(false);
  if (!info) return null;
  const latest = latestUpdate(data, item);
  const older = updatesFor(data, item).slice(1);
  const href = item.type === 'project' ? hrefFor.project(item.id) : hrefFor.portfolio(item.id);
  const priority = getField(data, 'priority')?.options?.find((o) => o.id === data.values[item.id]?.priority);
  return (
    <aside className="side-pane details-pane" aria-label="Details">
      <div className="pane-head">
        <a className="btn btn-secondary sm" href={href}>
          {item.type === 'project' ? 'View project' : 'View portfolio'}
        </a>
        <span className="grow" />
        <button
          className="icon-btn"
          aria-label="Copy link"
          onClick={() => {
            copyLink(href);
            toast('Link copied to clipboard');
          }}
        >
          <IconLink />
        </button>
        <button className="icon-btn" aria-label="Close details" onClick={onClose}>
          <IconCollapseRight />
        </button>
      </div>
      <div className="pane-body">
        <div className="details-title">
          {item.type === 'project' ? <ProjectIcon color={info.color} size={32} /> : <FolderIcon color={info.color} size={34} />}
          <h2>{info.name}</h2>
        </div>
        <div className="details-meta">
          <span className="round-icon"><IconCalendar size={14} /></span>
          <span>{fmtRange(info.startDate, info.dueDate) || 'No dates'}</span>
          {priority && <span className="muted">· {priority.name} priority</span>}
        </div>
        <div className="details-status-head">
          <h3>Latest status</h3>
          <button ref={btnRef} className="btn btn-secondary sm" onClick={() => setMenu(true)}>
            Update status <IconChevronDown size={12} />
          </button>
        </div>
        {latest ? <StatusCard u={latest} /> : <div className="empty-card">No status updates yet. Share one to keep everyone informed.</div>}
        {older.length > 0 && (
          <>
            <h3 className="pane-h3 mt">Previous updates</h3>
            <ul className="prev-updates">
              {older.map((u) => (
                <li key={u.id}>
                  <a href={hrefFor.update(u.id)}>
                    <span className="dot" style={{ background: statusDot(u.status) }} />
                    <span className="grow">{u.title}</span>
                    <span className="muted small">{fmtDate(u.date)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      {menu && (
        <StatusMenu
          anchor={btnRef.current}
          current={latest?.status ?? null}
          onClose={() => setMenu(false)}
          onPick={(s) => {
            setMenu(false);
            navigate(hrefFor.compose(item, s).slice(1));
          }}
        />
      )}
    </aside>
  );
}

const statusDot = (s: string) => ({ on_track: '#5da283', at_risk: '#f1bd6c', off_track: '#f06a6a', on_hold: '#4573d2', complete: '#5da283', dropped: '#a2a0a2' } as Record<string, string>)[s];
