import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronRight, Eye, ListFilter, Sparkles, X, SlidersHorizontal } from 'lucide-react';
import type { Column, ColumnId, DisplayOptions, Filters, Initiative, Stage, ViewPreset } from '../types';
import { useStore, usePref } from '../store';
import { DATA, byOrder, countFilters, emptyFilters, matches, monthsAgo, plural } from '../util';
import { setQuery } from '../router';
import { Card } from './Card';
import { Menu, notInReplica, toast } from './bits';
import { useDnd, type DropTarget } from '../useDnd';
import { CompleteDialog, AddInitiativeDialog } from './Dialogs';

const PRESETS: Record<ViewPreset, Omit<DisplayOptions, 'productName' | 'columnDescription' | 'visibility'>> = {
  collapsed: { preset: 'collapsed', objectives: true, description: false, tags: false, targetDate: false, ideas: false, owners: false },
  expanded: { preset: 'expanded', objectives: true, description: true, tags: false, targetDate: true, ideas: false, owners: true },
  detailed: { preset: 'detailed', objectives: true, description: true, tags: true, targetDate: true, ideas: true, owners: true },
};
const DEFAULT_OPTS: DisplayOptions = { ...PRESETS.detailed, ideas: false, owners: false, productName: true, columnDescription: true, visibility: true };

export type Scope = { kind: 'portfolio' } | { kind: 'product'; productId: string };

export function RoadmapPage({ scope, stage }: { scope: Scope; stage: Stage }) {
  const { state, dispatch } = useStore();
  const [filters, setFilters] = usePref<Filters>('filters', emptyFilters());
  const [opts, setOpts] = usePref<DisplayOptions>('display', DEFAULT_OPTS);
  const [showFilters, setShowFilters] = usePref<boolean>('filters-open', false);
  const [gbo, setGbo] = usePref<boolean>('group-by-objective', false);
  const [completing, setCompleting] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const effectiveOpts: DisplayOptions = { ...opts, productName: scope.kind === 'portfolio' && opts.productName };

  const inScope = useMemo(
    () => state.initiatives.filter((i) => scope.kind === 'portfolio' || i.product === scope.productId),
    [state.initiatives, scope],
  );
  const visible = useMemo(() => inScope.filter((i) => matches(i, filters)), [inScope, filters]);

  const open = useCallback((id: string) => setQuery('i', id), []);

  const onDrop = useCallback(
    (id: string, t: DropTarget) => {
      const item = state.initiatives.find((i) => i.id === id);
      if (!item) return;
      if (t.kind === 'column') {
        // Index is among the visible cards; map it to an index among all cards in that column.
        const colAll = state.initiatives.filter((i) => i.column === t.column && i.id !== id).sort(byOrder);
        const colVisible = colAll.filter((i) => visible.some((v) => v.id === i.id));
        const anchor = colVisible[t.index];
        const index = anchor ? colAll.indexOf(anchor) : colVisible.length ? colAll.indexOf(colVisible[colVisible.length - 1]) + 1 : colAll.length;
        dispatch({ type: 'move', id, to: t.column, index });
      } else if (t.stage === 'completed' && item.column !== 'completed') {
        setCompleting(id);
      } else if (t.stage === 'candidates' && item.column !== 'candidate') {
        dispatch({ type: 'move', id, to: 'candidate' });
        toast(`Moved “${item.title}” to Candidates`);
      } else if (t.stage === 'roadmap' && (item.column === 'candidate' || item.column === 'completed')) {
        dispatch({ type: 'move', id, to: 'later' });
        toast(`Moved “${item.title}” to Later`);
      }
    },
    [state.initiatives, visible, dispatch],
  );

  const dndEnabled = !(stage === 'roadmap' && gbo);
  const { dragId, target, onPointerDown, ghostEl } = useDnd(dndEnabled, onDrop);

  useEffect(() => {
    document.body.classList.toggle('is-dragging', !!dragId);
  }, [dragId]);

  const stageCount = (s: Stage) =>
    visible.filter((i) => (s === 'completed' ? i.column === 'completed' : s === 'candidates' ? i.column === 'candidate' : ['now', 'next', 'later'].includes(i.column))).length;

  return (
    <>
      <div className="toolbar">
        <div className="toolbar__left">
          <button className={`pill-btn${showFilters ? ' is-active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
            <ListFilter size={15} /> Filters
            {countFilters(filters) > 0 && <span className="count">{countFilters(filters)}</span>}
          </button>
          <DisplayMenu opts={opts} setOpts={setOpts} portfolio={scope.kind === 'portfolio'} />
        </div>
        <div className="segmented" role="tablist" aria-label="Roadmap stage">
          {(['completed', 'roadmap', 'candidates'] as Stage[]).map((s) => {
            const isDrop = !!dragId && s !== stage;
            const hover = target?.kind === 'stage' && target.stage === s;
            return (
              <button
                key={s}
                role="tab"
                aria-selected={stage === s}
                className={`${stage === s ? 'is-active' : ''}${isDrop ? ' is-drop' : ''}${hover ? ' is-drop-hover' : ''}`}
                data-drop-stage={isDrop ? s : undefined}
                onClick={() => setQuery('stage', s === 'roadmap' ? undefined : s)}
              >
                {s === 'completed' ? 'Completed' : s === 'roadmap' ? 'Roadmap' : 'Candidates'}
              </button>
            );
          })}
        </div>
        <div className="toolbar__right">
          {stage === 'roadmap' && (
            <label className="switch-box">
              Group by objective
              <button
                type="button"
                className={`switch${gbo ? ' is-on' : ''}`}
                role="switch"
                aria-checked={gbo}
                aria-label="Group by objective"
                onClick={() => setGbo(!gbo)}
              />
            </label>
          )}
          <span className="btn-split">
            <button className="btn btn--navy" onClick={() => setAdding(true)}>
              Add an initiative
            </button>
            <button className="btn btn--ai" aria-label="Generate initiatives with AI" onClick={() => notInReplica('AI initiative generation')}>
              <Sparkles size={18} />
            </button>
          </span>
        </div>
      </div>

      <div className="board-wrap">
        {showFilters && (
          <FiltersPanel
            filters={filters}
            setFilters={setFilters}
            count={stageCount(stage)}
            scope={scope}
            stage={stage}
            onClose={() => setShowFilters(false)}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          {stage === 'roadmap' && !gbo && (
            <Board
              columns={state.columns}
              items={visible}
              all={state.initiatives}
              opts={effectiveOpts}
              dragId={dragId}
              target={target}
              onOpen={open}
              onPointerDown={onPointerDown}
              onEditColumn={(id, patch) => dispatch({ type: 'column', id, patch })}
            />
          )}
          {stage === 'roadmap' && gbo && <GroupByObjective columns={state.columns} items={visible} all={state.initiatives} opts={effectiveOpts} onOpen={open} />}
          {stage === 'completed' && (
            <CompletedView items={visible.filter((i) => i.column === 'completed')} all={state.initiatives} opts={effectiveOpts} dragId={dragId} onOpen={open} onPointerDown={onPointerDown} />
          )}
          {stage === 'candidates' && (
            <CandidatesView items={visible.filter((i) => i.column === 'candidate')} all={state.initiatives} opts={effectiveOpts} dragId={dragId} onOpen={open} onPointerDown={onPointerDown} />
          )}
        </div>
      </div>
      {ghostEl}
      {completing && (
        <CompleteDialog
          item={state.initiatives.find((i) => i.id === completing)!}
          onCancel={() => setCompleting(null)}
          onConfirm={(date, outcome) => {
            dispatch({ type: 'move', id: completing, to: 'completed', index: 0, completedOn: date, outcome });
            setCompleting(null);
            toast('Initiative marked as completed');
          }}
        />
      )}
      {adding && (
        <AddInitiativeDialog
          defaultProduct={scope.kind === 'product' ? scope.productId : DATA.products[0].id}
          defaultColumn={stage === 'candidates' ? 'candidate' : 'now'}
          onCancel={() => setAdding(false)}
          onCreate={(init) => {
            dispatch({ type: 'add', initiative: init });
            setAdding(false);
            if (init.column === 'candidate') setQuery('stage', 'candidates');
            open(init.id);
          }}
        />
      )}
    </>
  );
}

/* ---------- Board ---------- */

function Board(props: {
  columns: Column[];
  items: Initiative[];
  all: Initiative[];
  opts: DisplayOptions;
  dragId: string | null;
  target: DropTarget | null;
  onOpen: (id: string) => void;
  onPointerDown: (e: React.PointerEvent, item: Initiative) => void;
  onEditColumn: (id: string, patch: Partial<Column>) => void;
}) {
  const { columns, items, all, opts, dragId, target, onOpen, onPointerDown, onEditColumn } = props;
  const dragged = dragId ? all.find((i) => i.id === dragId) : null;
  return (
    <div className="board">
      {columns.map((col) => {
        const list = items.filter((i) => i.column === col.id).sort(byOrder);
        const ideas = list.reduce((n, i) => n + i.ideas.length, 0);
        const rest = list.filter((i) => i.id !== dragId);
        const ph = target?.kind === 'column' && target.column === col.id ? target.index : -1;
        const placeholder = dragged && <div key="ph" className="drop-placeholder" style={{ height: 96 }} />;
        return (
          <section key={col.id} className="roadmap-column" data-drop-column={col.id} aria-label={col.title}>
            <div className="column-head">
              <div className="column-head__title">
                <EditableText as="h2" value={col.title} onSave={(v) => onEditColumn(col.id, { title: v })} />
                <span className="tab-count">
                  ({plural(list.length, 'initiative')}, {plural(ideas, 'idea')})
                </span>
              </div>
              {opts.columnDescription && (
                <EditableText as="div" className="column-head__desc" value={col.description} onSave={(v) => onEditColumn(col.id, { description: v })} />
              )}
            </div>
            <div className="column-body">
              {rest.map((i, n) => (
                <Fragment key={i.id}>
                  {ph === n && placeholder}
                  <Card item={i} all={all} opts={opts} onOpen={onOpen} onPointerDown={onPointerDown} />
                </Fragment>
              ))}
              {ph >= rest.length && placeholder}
              {list.length === 0 && ph < 0 && <div className="column-empty">Drag an initiative here, or add a new one.</div>}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/** Double-click to edit, like the original's column headings. */
function EditableText({ value, onSave, as, className }: { value: string; onSave: (v: string) => void; as: 'h2' | 'div'; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const Tag = as;
  if (editing)
    return (
      <Tag className={className} style={{ flex: 1 }}>
        <input
          className="inline-input"
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setEditing(false);
            if (draft.trim() && draft !== value) onSave(draft.trim());
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            if (e.key === 'Escape') {
              setDraft(value);
              setEditing(false);
            }
          }}
        />
      </Tag>
    );
  return (
    <Tag
      className={className}
      title="Double-click to edit"
      onDoubleClick={() => {
        setDraft(value);
        setEditing(true);
      }}
    >
      {value}
    </Tag>
  );
}

/* ---------- Group by objective ---------- */

function GroupByObjective({ columns, items, all, opts, onOpen }: { columns: Column[]; items: Initiative[]; all: Initiative[]; opts: DisplayOptions; onOpen: (id: string) => void }) {
  const onRoadmap = items.filter((i) => i.column === 'now' || i.column === 'next' || i.column === 'later');
  const groups = DATA.objectives
    .map((o) => ({ id: o.id, name: o.name, color: o.color, items: onRoadmap.filter((i) => i.objectives.includes(o.id)) }))
    .filter((g) => g.items.length > 0);
  const none = onRoadmap.filter((i) => i.objectives.length === 0);
  if (none.length) groups.push({ id: '__none', name: 'No objective', color: 1, items: none });
  const score = (g: (typeof groups)[number]) => {
    const c = (col: string) => g.items.filter((i) => i.column === col).length;
    return c('now') * 10000 + c('next') * 100 + c('later');
  };
  groups.sort((a, b) => score(b) - score(a));
  return (
    <div className="gbo">
      <div className="gbo-titles">
        {columns.map((c) => (
          <div key={c.id} className="column-head__title">
            <h2>{c.title}</h2>
          </div>
        ))}
      </div>
      {groups.map((g) => (
        <div className="gbo-row" key={g.id} style={{ ['--obj-color' as string]: `var(--obj-${g.color})` }}>
          <div className="gbo-row__bar">
            <span className="gbo-row__title">
              <span>{g.name}</span>
            </span>
          </div>
          <div className="gbo-row__cards">
            {columns.map((c) => {
              const list = g.items.filter((i) => i.column === c.id).sort(byOrder);
              return (
                <div key={c.id}>
                  <h2 className="gbo-col-title">{c.title}</h2>
                  {list.length === 0 && <div className="gbo-empty">No initiatives</div>}
                  {list.map((i) => (
                    <Card key={i.id} item={i} all={all} opts={opts} onOpen={onOpen} multiGroup={i.objectives.length > 1} />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {groups.length === 0 && <div className="column-empty">No initiatives match these filters.</div>}
    </div>
  );
}

/* ---------- Completed ---------- */

function CompletedView({ items, all, opts, dragId, onOpen, onPointerDown }: { items: Initiative[]; all: Initiative[]; opts: DisplayOptions; dragId: string | null; onOpen: (id: string) => void; onPointerDown: (e: React.PointerEvent, item: Initiative) => void }) {
  const sorted = [...items].sort((a, b) => (b.completedOn || '').localeCompare(a.completedOn || ''));
  const periods = [
    { title: 'Completed in the last 3 months', list: sorted.filter((i) => monthsAgo(i.completedOn!) < 3) },
    { title: 'Completed 3 - 6 months ago', list: sorted.filter((i) => monthsAgo(i.completedOn!) >= 3 && monthsAgo(i.completedOn!) < 6) },
    { title: 'Completed more than 6 months ago', list: sorted.filter((i) => monthsAgo(i.completedOn!) >= 6) },
  ];
  return (
    <div className="roadmap-completed-section">
      <div className="section-title">
        <h2>Completed</h2>
        <span className="tab-count">({plural(items.length, 'initiative')})</span>
      </div>
      {periods.map((p, n) => (
        <div className="period" key={p.title}>
          <h3>{p.title}</h3>
          {p.list.length > 0 && (
            <div className="card-grid">
              {p.list.map((i) => (
                <Card key={i.id} item={i} all={all} opts={opts} mode="completed" dragging={dragId === i.id} onOpen={onOpen} onPointerDown={onPointerDown} />
              ))}
            </div>
          )}
          {n < periods.length - 1 && <hr />}
        </div>
      ))}
    </div>
  );
}

/* ---------- Candidates ---------- */

function CandidatesView({ items, all, opts, dragId, onOpen, onPointerDown }: { items: Initiative[]; all: Initiative[]; opts: DisplayOptions; dragId: string | null; onOpen: (id: string) => void; onPointerDown: (e: React.PointerEvent, item: Initiative) => void }) {
  const sorted = [...items].sort(byOrder);
  return (
    <div className="roadmap-candidates-section">
      <div className="section-title">
        <h2>Candidates</h2>
        <span className="tab-count">({plural(items.length, 'initiative')})</span>
      </div>
      <p className="section-desc">Initiatives we're considering but haven't placed on the roadmap. Drag one onto “Roadmap” above, or open it and pick a column.</p>
      {sorted.length === 0 ? (
        <div className="column-empty">No candidate initiatives.</div>
      ) : (
        <div className="card-grid" style={{ paddingLeft: 0 }}>
          {sorted.map((i, n) => (
            <Card key={i.id} item={i} all={all} opts={opts} mode="candidate" candidateNumber={n + 1} dragging={dragId === i.id} onOpen={onOpen} onPointerDown={onPointerDown} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Display options ---------- */

function DisplayMenu({ opts, setOpts, portfolio }: { opts: DisplayOptions; setOpts: (o: DisplayOptions) => void; portfolio: boolean }) {
  const toggle = (k: keyof DisplayOptions) => setOpts({ ...opts, [k]: !opts[k] });
  const items: [keyof DisplayOptions, string][] = [
    ['columnDescription', 'Column description'],
    ['objectives', 'Objectives'],
    ['description', 'Description'],
    ['targetDate', 'Target date'],
    ['tags', 'Tags'],
    ['owners', 'Owners'],
    ['ideas', 'Ideas list (Detailed view)'],
    ['visibility', 'Visibility'],
  ];
  if (portfolio) items.splice(1, 0, ['productName', 'Product names']);
  return (
    <Menu
      trigger={(open, t) => (
        <button className={`pill-btn${open ? ' is-active' : ''}`} onClick={t} aria-expanded={open}>
          <SlidersHorizontal size={15} /> Display options
        </button>
      )}
    >
      {() => (
        <>
          <div className="dropdown__label">
            <Eye size={12} style={{ verticalAlign: '-2px' }} /> Saved views
          </div>
          {(['collapsed', 'expanded', 'detailed'] as ViewPreset[]).map((p) => (
            <button
              key={p}
              className={`dropdown__item${opts.preset === p ? ' is-selected' : ''}`}
              onClick={() => setOpts({ ...opts, ...PRESETS[p] })}
            >
              <span>
                {p[0].toUpperCase() + p.slice(1)}
                <span className="sub">
                  {p === 'collapsed' ? 'Objectives and titles only' : p === 'expanded' ? 'Adds description, owners, impact and effort' : 'Adds tags and linked ideas'}
                </span>
              </span>
            </button>
          ))}
          <div className="dropdown__sep" />
          <div className="dropdown__label">View settings</div>
          {items.map(([k, label]) => (
            <label key={k} className="check">
              <input type="checkbox" checked={!!opts[k]} onChange={() => toggle(k)} /> {label}
            </label>
          ))}
        </>
      )}
    </Menu>
  );
}

/* ---------- Filters ---------- */

function FiltersPanel({ filters, setFilters, count, scope, stage, onClose }: { filters: Filters; setFilters: (f: Filters) => void; count: number; scope: Scope; stage: Stage; onClose: () => void }) {
  const [open, setOpen] = useState<Record<string, boolean>>({ Objectives: true });
  const n = countFilters(filters);
  const toggleIn = <K extends keyof Filters>(key: K, value: string) => {
    const arr = filters[key] as unknown as string[];
    setFilters({ ...filters, [key]: arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value] });
  };
  const group = (title: string, count: number, body: React.ReactNode) => (
    <div className="filter-group" key={title}>
      <button onClick={() => setOpen({ ...open, [title]: !open[title] })} aria-expanded={!!open[title]}>
        <ChevronRight size={14} className={`caret${open[title] ? ' is-open' : ''}`} />
        {title}
        {count > 0 && <span className="n">{count}</span>}
      </button>
      {open[title] && <div className="filter-options">{body}</div>}
    </div>
  );
  const products = DATA.products.filter((p) => scope.kind === 'portfolio' || p.id === scope.productId);
  return (
    <aside className="filters-panel" aria-label="Filters">
      <button className="icon-btn filters-panel__close" onClick={onClose} aria-label="Close filters">
        <X size={18} />
      </button>
      <h2>Filters</h2>
      <div className="filters-summary">{plural(count, 'initiative')}</div>
      <div className="filters-applied">
        <span>{plural(n, 'filter')} applied</span>
        <button className="btn btn--outline btn--xs" onClick={() => setFilters(emptyFilters())} disabled={n === 0}>
          Reset
        </button>
        <button className="btn btn--outline btn--xs" disabled={n === 0} onClick={() => notInReplica('Saving filters')}>
          Save
        </button>
      </div>
      <h3 style={{ marginTop: 4 }}>Find initiatives</h3>
      <input className="text-input" placeholder="Search by title..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
      <div style={{ height: 8 }} />
      {group('Saved filters', 0, <span className="muted">You haven't saved any filters yet.</span>)}
      {group('Shared filters', 0, <span className="muted">No shared filters.</span>)}
      {group(
        'Objectives',
        filters.objectives.length,
        <>
          {DATA.objectives.map((o) => (
            <label className="check" key={o.id}>
              <input type="checkbox" checked={filters.objectives.includes(o.id)} onChange={() => toggleIn('objectives', o.id)} />
              <span className="obj-swatch" style={{ background: `var(--obj-${o.color})` }} />
              {o.name}
            </label>
          ))}
          <label className="check">
            <input type="checkbox" checked={filters.objectives.includes('__none')} onChange={() => toggleIn('objectives', '__none')} />
            No objective
          </label>
        </>,
      )}
      {group(
        'Owners',
        filters.owners.length,
        DATA.staff.map((s) => (
          <label className="check" key={s.id}>
            <input type="checkbox" checked={filters.owners.includes(s.id)} onChange={() => toggleIn('owners', s.id)} />
            {s.name}
          </label>
        )),
      )}
      {scope.kind === 'portfolio' &&
        group(
          'Product line',
          filters.lines.length,
          DATA.productLines.map((l) => (
            <label className="check" key={l.id}>
              <input type="checkbox" checked={filters.lines.includes(l.id)} onChange={() => toggleIn('lines', l.id)} />
              {l.name}
            </label>
          )),
        )}
      {scope.kind === 'portfolio' &&
        group(
          'Product',
          filters.products.length,
          products.map((p) => (
            <label className="check" key={p.id}>
              <input type="checkbox" checked={filters.products.includes(p.id)} onChange={() => toggleIn('products', p.id)} />
              {p.name}
            </label>
          )),
        )}
      {stage === 'roadmap' &&
        group(
          'Roadmap column',
          filters.columns.length,
          (['now', 'next', 'later'] as ColumnId[]).map((c) => (
            <label className="check" key={c}>
              <input type="checkbox" checked={filters.columns.includes(c)} onChange={() => toggleIn('columns', c)} />
              {c[0].toUpperCase() + c.slice(1)}
            </label>
          )),
        )}
      {group(
        'Tag',
        filters.tags.length,
        DATA.tags.map((t) => (
          <label className="check" key={t}>
            <input type="checkbox" checked={filters.tags.includes(t)} onChange={() => toggleIn('tags', t)} />
            {t}
          </label>
        )),
      )}
      {group(
        'Visibility',
        filters.visibility ? 1 : 0,
        (['', 'public', 'internal'] as const).map((v) => (
          <label className="check" key={v || 'all'}>
            <input type="radio" name="vis" checked={filters.visibility === v} onChange={() => setFilters({ ...filters, visibility: v })} />
            {v === '' ? 'All' : v === 'public' ? 'Public' : 'Internal'}
          </label>
        )),
      )}
    </aside>
  );
}

