import { useRef, useState } from 'react';
import type { Data, PortfolioView, SortRule } from '../../data/mock';
import { newId, useStore } from '../../store';
import { IconCheckCircle, IconChevronDown, IconClose, IconDrag, IconPerson, IconPlus, IconSortAsc, IconSortDesc } from '../../components/Icons';
import { MenuItem, Popover } from '../../components/ui';
import { FIELD_LABEL, filterableFields, filterChoices, groupableFields } from './model';

function Select({ value, options, onChange, placeholder, icon, width = 170 }: {
  value: string;
  options: { id: string; label: string; icon?: React.ReactNode }[];
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  width?: number;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const cur = options.find((o) => o.id === value);
  return (
    <>
      <button ref={ref} className="select" style={{ width }} onClick={() => setOpen(true)}>
        {(cur?.icon ?? icon) && <span className="select-icon">{cur?.icon ?? icon}</span>}
        <span className={`select-label ${cur ? '' : 'placeholder'}`}>{cur?.label ?? placeholder ?? 'Select'}</span>
        <IconChevronDown size={12} />
      </button>
      {open && (
        <Popover anchor={ref.current} onClose={() => setOpen(false)} matchWidth>
          <div className="menu">
            {options.map((o) => (
              <MenuItem key={o.id} icon={o.icon} active={o.id === value} onClick={() => { onChange(o.id); setOpen(false); }}>
                {o.label}
              </MenuItem>
            ))}
          </div>
        </Popover>
      )}
    </>
  );
}

export function FilterPopover({ data, portfolioId, view, anchor, onClose }: { data: Data; portfolioId: string; view: PortfolioView; anchor: HTMLElement | null; onClose: () => void }) {
  const { actions } = useStore();
  const fields = filterableFields(data, view);
  const setFilters = (filters: PortfolioView['filters']) => actions.setView(portfolioId, { filters });
  const mine = view.filters.some((f) => f.fieldId === 'owner' && f.value === data.meId);
  const incomplete = view.filters.some((f) => f.fieldId === 'status' && f.value === '__incomplete');
  return (
    <Popover anchor={anchor} onClose={onClose}>
      <div className="panel filter-panel">
        <div className="panel-head">
          <span className="panel-title">Filters</span>
          <button className="btn-link" onClick={() => setFilters([])}>Clear</button>
        </div>
        <div className="panel-sub">Quick filters</div>
        <div className="quick-filters">
          <button
            className={`qf ${incomplete ? 'on' : ''}`}
            onClick={() =>
              setFilters(incomplete ? view.filters.filter((f) => f.value !== '__incomplete') : [...view.filters, { id: newId('f'), fieldId: 'status', value: '__incomplete' }])
            }
          >
            <IconCheckCircle size={12} /> Incomplete work
          </button>
          <button
            className={`qf ${mine ? 'on' : ''}`}
            onClick={() =>
              setFilters(mine ? view.filters.filter((f) => !(f.fieldId === 'owner' && f.value === data.meId)) : [...view.filters, { id: newId('f'), fieldId: 'owner', value: data.meId }])
            }
          >
            <IconPerson size={12} /> Just my projects
          </button>
        </div>
        <div className="panel-sub">All filters</div>
        {view.filters.filter((f) => f.value !== '__incomplete').map((f) => (
          <div key={f.id} className="rule-row">
            <Select
              value={f.fieldId}
              options={fields.map((x) => ({ id: x.id, label: FIELD_LABEL(data, x.id, view) }))}
              onChange={(v) => setFilters(view.filters.map((x) => (x.id === f.id ? { ...x, fieldId: v, value: '' } : x)))}
            />
            <Select
              width={200}
              value={f.value}
              placeholder="Select value"
              options={filterChoices(data, f.fieldId).map((c) => ({ id: c.id, label: c.label, icon: c.color ? <span className="dot" style={{ background: c.color }} /> : undefined }))}
              onChange={(v) => setFilters(view.filters.map((x) => (x.id === f.id ? { ...x, value: v } : x)))}
            />
            <button className="icon-btn" aria-label="Remove filter" onClick={() => setFilters(view.filters.filter((x) => x.id !== f.id))}>
              <IconClose size={12} />
            </button>
          </div>
        ))}
        <button className="btn-subtle add-rule" onClick={() => setFilters([...view.filters, { id: newId('f'), fieldId: fields[0]?.id ?? 'status', value: '' }])}>
          <IconPlus size={12} /> Add filter
        </button>
      </div>
    </Popover>
  );
}

const SORTABLE = ['name', 'status', 'owner', 'date', 'start', 'progress', 'remaining', 'duration'];

export function SortPopover({ data, portfolioId, view, anchor, onClose }: { data: Data; portfolioId: string; view: PortfolioView; anchor: HTMLElement | null; onClose: () => void }) {
  const { actions } = useStore();
  const ids = [...SORTABLE, ...view.columns.map((c) => c.fieldId).filter((id) => !SORTABLE.includes(id) && id !== 'milestones')];
  const setSorts = (sorts: SortRule[]) => actions.setView(portfolioId, { sorts });
  const [drag, setDrag] = useState<number | null>(null);
  return (
    <Popover anchor={anchor} onClose={onClose}>
      <div className="panel sort-panel">
        <div className="panel-head">
          <span className="panel-title">Sort</span>
          <button className="btn-link" onClick={() => setSorts([])}>Clear</button>
        </div>
        {view.sorts.map((s, i) => (
          <div
            key={s.fieldId + i}
            className="rule-row"
            draggable
            onDragStart={() => setDrag(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (drag === null || drag === i) return;
              const next = [...view.sorts];
              const [m] = next.splice(drag, 1);
              next.splice(i, 0, m);
              setSorts(next);
              setDrag(null);
            }}
          >
            <span className="drag-handle"><IconDrag size={12} /></span>
            <Select
              value={s.fieldId}
              options={ids.map((id) => ({ id, label: FIELD_LABEL(data, id, view) }))}
              onChange={(v) => setSorts(view.sorts.map((x, j) => (j === i ? { ...x, fieldId: v } : x)))}
            />
            <Select
              width={140}
              value={s.dir}
              options={[
                { id: 'asc', label: 'Ascending', icon: <IconSortAsc size={14} /> },
                { id: 'desc', label: 'Descending', icon: <IconSortDesc size={14} /> },
              ]}
              onChange={(v) => setSorts(view.sorts.map((x, j) => (j === i ? { ...x, dir: v as 'asc' | 'desc' } : x)))}
            />
            <button className="icon-btn" aria-label="Remove sort" onClick={() => setSorts(view.sorts.filter((_, j) => j !== i))}>
              <IconClose size={12} />
            </button>
          </div>
        ))}
        <AddSort ids={ids.filter((id) => !view.sorts.some((s) => s.fieldId === id))} data={data} view={view} onAdd={(id) => setSorts([...view.sorts, { fieldId: id, dir: 'asc' }])} />
      </div>
    </Popover>
  );
}

function AddSort({ ids, data, view, onAdd }: { ids: string[]; data: Data; view: PortfolioView; onAdd: (id: string) => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <>
      <button ref={ref} className="btn-subtle add-rule" onClick={() => setOpen(true)}>
        <IconPlus size={12} /> Add sort <IconChevronDown size={10} />
      </button>
      {open && (
        <Popover anchor={ref.current} onClose={() => setOpen(false)}>
          <div className="menu">
            {ids.map((id) => (
              <MenuItem key={id} onClick={() => { onAdd(id); setOpen(false); }}>
                {FIELD_LABEL(data, id, view)}
              </MenuItem>
            ))}
          </div>
        </Popover>
      )}
    </>
  );
}

export function GroupPopover({ data, portfolioId, view, anchor, onClose }: { data: Data; portfolioId: string; view: PortfolioView; anchor: HTMLElement | null; onClose: () => void }) {
  const { actions } = useStore();
  const fields = groupableFields(data, view);
  return (
    <Popover anchor={anchor} onClose={onClose}>
      <div className="menu">
        <div className="menu-title-row">Group by</div>
        <MenuItem checked={!view.groupBy} onClick={() => { actions.setView(portfolioId, { groupBy: null }); onClose(); }}>None</MenuItem>
        {fields.map((f) => (
          <MenuItem key={f.id} checked={view.groupBy === f.id} onClick={() => { actions.setView(portfolioId, { groupBy: f.id }); onClose(); }}>
            {FIELD_LABEL(data, f.id, view)}
          </MenuItem>
        ))}
      </div>
    </Popover>
  );
}
