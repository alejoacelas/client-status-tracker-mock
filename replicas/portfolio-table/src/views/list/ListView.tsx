import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { FieldType, ItemRef } from '../../data/mock';
import { getField, getPerson, getPortfolio, hrefFor, navigate, refKey, useStore, useToast } from '../../store';
import { FieldModal, FieldTypeMenu } from '../../components/FieldModal';
import {
  IconArchive, IconArrowLeft, IconArrowRight, IconChevronDown, IconChevronRight, IconClose, IconDrag, IconEyeOff, IconFilter, IconGroup, IconLink,
  IconMore, IconOpen, IconPencil, IconPlus, IconSort, IconSortAsc, IconSortDesc, IconTrash, IconTriangleDown, IconTriangleRight, IconFolder,
} from '../../components/Icons';
import { CustomizePane, DetailsPane } from '../../components/Panes';
import { copyLink } from '../../components/StatusCard';
import { Avatar, FolderIcon, MenuItem, MenuSep, Modal, Pill, Popover, ProjectIcon, StatusChip } from '../../components/ui';
import { Cell, NameEditor } from './cells';
import { compareRows, FIELD_LABEL, groupKey, makeRow, matchesFilter, type Row } from './model';
import { FilterPopover, GroupPopover, SortPopover } from './toolbar';

type Pane = { kind: 'details'; ref: ItemRef } | { kind: 'customize' } | null;

export function ListView({ portfolioId, customize, setCustomize }: { portfolioId: string; customize: boolean; setCustomize: (v: boolean) => void }) {
  const { data, actions, reset } = useStore();
  const toast = useToast();
  const pf = getPortfolio(data, portfolioId)!;
  const view = data.views[portfolioId];
  const narrow = useNarrow();

  const [pane, setPane] = useState<Pane>(null);
  useEffect(() => {
    if (customize) setPane({ kind: 'customize' });
    else setPane((p) => (p?.kind === 'customize' ? null : p));
  }, [customize]);
  const closePane = () => {
    if (pane?.kind === 'customize') setCustomize(false);
    setPane(null);
  };

  // The top-level portfolio opens with its client portfolios expanded.
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    portfolioId === data.rootPortfolioId
      ? Object.fromEntries(pf.items.filter((i) => i.type === 'portfolio').map((i) => [`${portfolioId}/${i.id}`, true]))
      : {},
  );
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [pop, setPop] = useState<{ kind: string; el: HTMLElement; data?: string } | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [fieldModal, setFieldModal] = useState<{ type?: FieldType; editId?: string; library?: boolean } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);
  const [liveWidths, setLiveWidths] = useState<Record<string, number>>({});
  const [drag, setDrag] = useState<{ from: number; over: number | null } | null>(null);
  const [ctx, setCtx] = useState<{ row: Row; rect: DOMRect } | null>(null);

  const cols = view.columns.filter((c) => !c.hidden && (c.fieldId !== 'milestones' || true));
  const nameWidth = liveWidths.name ?? (narrow ? 210 : view.nameWidth);
  const widthOf = (fieldId: string, w: number) => liveWidths[fieldId] ?? w;
  const manualOrder = !view.sorts.length && !view.groupBy;

  /* ---------- rows ---------- */
  const { groups } = useMemo(() => {
    const top = pf.items.map((r, i) => makeRow(data, r, 0, pf.id, i)).filter((r): r is Row => !!r);
    const filtered = top.filter((r) => view.filters.every((f) => matchesFilter(data, r, f)));
    const sorted = view.sorts.length ? [...filtered].sort(compareRows(data, view.sorts)) : filtered;
    if (!view.groupBy) return { groups: [{ key: '__all', order: 0, rows: sorted }] };
    const map = new Map<string, { key: string; order: number; rows: Row[] }>();
    for (const r of sorted) {
      const g = groupKey(data, r, view.groupBy);
      if (!map.has(g.key)) map.set(g.key, { ...g, rows: [] });
      map.get(g.key)!.rows.push(r);
    }
    return { groups: [...map.values()].sort((a, b) => a.order - b.order) };
  }, [data, pf, view]);

  const expandRows = (r: Row, out: Row[], seen: Set<string>) => {
    out.push(r);
    const key = `${r.parentId}/${r.ref.id}`;
    if (r.ref.type !== 'portfolio' || !expanded[key] || seen.has(r.ref.id)) return;
    seen.add(r.ref.id);
    const child = getPortfolio(data, r.ref.id);
    if (!child) return;
    let kids = child.items.map((x, i) => makeRow(data, x, r.depth + 1, child.id, i)).filter((x): x is Row => !!x);
    if (view.sorts.length) kids = kids.sort(compareRows(data, view.sorts));
    for (const k of kids) expandRows(k, out, seen);
  };

  const totalVisible = groups.reduce((s, g) => s + g.rows.length, 0);

  /* ---------- resizing ---------- */
  const startResize = (fieldId: string, startW: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const x0 = e.clientX;
    let w = startW;
    const move = (ev: MouseEvent) => {
      w = Math.max(fieldId === 'name' ? 160 : 70, Math.min(640, startW + ev.clientX - x0));
      setLiveWidths((lw) => ({ ...lw, [fieldId]: w }));
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      document.body.classList.remove('resizing');
      if (fieldId === 'name') actions.setView(portfolioId, { nameWidth: w });
      else actions.setView(portfolioId, { columns: view.columns.map((c) => (c.fieldId === fieldId ? { ...c, width: w } : c)) });
      setLiveWidths((lw) => {
        const n = { ...lw };
        delete n[fieldId];
        return n;
      });
    };
    document.body.classList.add('resizing');
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  /* ---------- column ops ---------- */
  const moveCol = (fieldId: string, dir: -1 | 1) => {
    const all = [...view.columns];
    const visible = all.filter((c) => !c.hidden);
    const vi = visible.findIndex((c) => c.fieldId === fieldId);
    const target = visible[vi + dir];
    if (!target) return;
    const a = all.findIndex((c) => c.fieldId === fieldId);
    const b = all.findIndex((c) => c.fieldId === target.fieldId);
    [all[a], all[b]] = [all[b], all[a]];
    actions.setView(portfolioId, { columns: all });
  };
  const sortBy = (fieldId: string, dir: 'asc' | 'desc') => actions.setView(portfolioId, { sorts: [{ fieldId, dir }] });

  const library = data.fields.filter((f) => f.type !== 'builtin' && !view.columns.some((c) => c.fieldId === f.id));
  const hiddenBuiltins = view.columns.filter((c) => c.hidden);

  /* ---------- toolbar ---------- */
  const filterCount = view.filters.filter((f) => f.value).length;
  const sortCount = view.sorts.length;
  const progressLabel = view.progressType === 'task' ? 'Task' : 'Milestone';

  const renderGroupLabel = (key: string) => {
    if (!view.groupBy) return null;
    if (view.groupBy === 'status') return key === 'none' ? <span>No status</span> : <StatusChip status={key as never} size="sm" />;
    if (view.groupBy === 'owner') {
      const p = getPerson(data, key);
      return p ? (
        <span className="group-person">
          <Avatar person={p} size={24} /> {p.name}
        </span>
      ) : (
        <span>No owner</span>
      );
    }
    const f = getField(data, view.groupBy);
    const o = f?.options?.find((x) => x.id === key);
    return o ? <span className="group-title">{o.name}</span> : <span className="group-title">No {f?.name.toLowerCase()}</span>;
  };

  const rowMenu = (row: Row, el: HTMLElement | DOMRect) => setCtx({ row, rect: el instanceof HTMLElement ? el.getBoundingClientRect() : el });

  const renderRow = (r: Row) => {
    const key = `${r.parentId}/${r.ref.id}`;
    const isOpen = !!expanded[key];
    const selected = pane?.kind === 'details' && refKey(pane.ref) === refKey(r.ref);
    const href = r.ref.type === 'project' ? hrefFor.project(r.ref.id) : hrefFor.portfolio(r.ref.id);
    const canDrag = manualOrder && r.depth === 0;
    return (
      <div
        key={key + r.depth}
        className={`trow ${selected ? 'selected' : ''} ${drag && drag.over === r.index && r.depth === 0 ? 'drop-target' : ''} ${r.info.archived ? 'archived' : ''}`}
        onContextMenu={(e) => {
          e.preventDefault();
          rowMenu(r, new DOMRect(e.clientX, e.clientY, 0, 0));
        }}
        draggable={canDrag && renaming === null}
        onDragStart={(e) => {
          if (!canDrag) return;
          e.dataTransfer.effectAllowed = 'move';
          setDrag({ from: r.index, over: null });
        }}
        onDragOver={(e) => {
          if (!drag || r.depth !== 0) return;
          e.preventDefault();
          if (drag.over !== r.index) setDrag({ ...drag, over: r.index });
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (drag && r.depth === 0 && drag.from !== r.index) actions.moveItem(pf.id, drag.from, r.index);
          setDrag(null);
        }}
        onDragEnd={() => setDrag(null)}
      >
        <div className="cell name-cell" style={{ width: nameWidth, minWidth: nameWidth, maxWidth: nameWidth }}>
          <span className="drag-slot">{canDrag && <IconDrag size={12} className="row-drag" />}</span>
          <span className="indent" style={{ width: r.depth * 22 }} />
          <span className="expand-slot">
            {r.expandable && (
              <button
                className="expand-btn"
                aria-label={isOpen ? 'Collapse' : 'Expand'}
                onClick={() => setExpanded((x) => ({ ...x, [key]: !x[key] }))}
              >
                {isOpen ? <IconTriangleDown size={12} /> : <IconTriangleRight size={12} />}
              </button>
            )}
          </span>
          <span className="name-icon">{r.ref.type === 'project' ? <ProjectIcon color={r.info.color} size={20} /> : <FolderIcon color={r.info.color} size={22} />}</span>
          {renaming === key ? (
            <NameEditor
              initial={r.info.name}
              onDone={(v) => {
                if (v !== null) actions.rename(r.ref, v);
                setRenaming(null);
              }}
            />
          ) : (
            <a className="name-link" href={href} title={r.info.name}>
              {r.info.name}
            </a>
          )}
          {r.ref.type === 'portfolio' && renaming !== key && (
            <span className="name-sub">{countLabel(r.info.projectCount, r.info.portfolioCount)}</span>
          )}
          {r.info.archived && (
            <span className="archived-label">
              <IconArchive size={12} /> Archived
            </span>
          )}
          <span className="row-actions">
            <button className="row-more" aria-label="More actions" onClick={(e) => rowMenu(r, e.currentTarget)}>
              <IconMore size={14} />
            </button>
            <button
              className="details-btn"
              aria-label="Details"
              data-tip="Details"
              onClick={() => setPane(selected ? null : { kind: 'details', ref: r.ref })}
            >
              <IconChevronRight size={14} />
            </button>
          </span>
        </div>
        {cols.map((c) => (
          <Cell key={c.fieldId} row={r} fieldId={c.fieldId} progressType={view.progressType} width={widthOf(c.fieldId, c.width)} />
        ))}
        <div className="cell add-col-cell" />
        <div className="cell filler" />
      </div>
    );
  };

  return (
    <div className="list-wrap">
      <div className="list-main">
        <div className="toolbar">
          <div className="toolbar-left">
            <div className="split-btn">
              <button className="btn btn-secondary sm" onClick={() => setAdding(true)}>
                <IconPlus size={12} /> Add work
              </button>
              <button className="btn btn-secondary sm split-caret" aria-label="Add work options" onClick={(e) => setPop({ kind: 'add', el: e.currentTarget })}>
                <IconChevronDown size={12} />
              </button>
            </div>
            {filterCount ? (
              <span className="chip-btn">
                <button onClick={(e) => setPop({ kind: 'filter', el: e.currentTarget.parentElement! })}>
                  <IconFilter size={14} /> Filters: {filterCount}
                </button>
                <button aria-label="Clear filters" onClick={() => actions.setView(portfolioId, { filters: [] })}>
                  <IconClose size={10} />
                </button>
              </span>
            ) : (
              <button className="btn-ghost sm" onClick={(e) => setPop({ kind: 'filter', el: e.currentTarget })}>
                <IconFilter size={14} /> Filter
              </button>
            )}
            {sortCount ? (
              <span className="chip-btn">
                <button onClick={(e) => setPop({ kind: 'sort', el: e.currentTarget.parentElement! })}>
                  <IconSort size={14} /> Sorts: {sortCount}
                </button>
                <button aria-label="Clear sorts" onClick={() => actions.setView(portfolioId, { sorts: [] })}>
                  <IconClose size={10} />
                </button>
              </span>
            ) : (
              <button className="btn-ghost sm" onClick={(e) => setPop({ kind: 'sort', el: e.currentTarget })}>
                <IconSort size={14} /> Sort
              </button>
            )}
            {view.groupBy ? (
              <span className="chip-btn">
                <button onClick={(e) => setPop({ kind: 'group', el: e.currentTarget.parentElement! })}>
                  <IconGroup size={14} /> Group: {FIELD_LABEL(data, view.groupBy, view)}
                </button>
                <button aria-label="Clear grouping" onClick={() => actions.setView(portfolioId, { groupBy: null })}>
                  <IconClose size={10} />
                </button>
              </span>
            ) : (
              <button className="btn-ghost sm" onClick={(e) => setPop({ kind: 'group', el: e.currentTarget })}>
                <IconGroup size={14} /> Group
              </button>
            )}
          </div>
          <div className="toolbar-right">
            <button className="btn-ghost sm progress-type" onClick={(e) => setPop({ kind: 'ptype', el: e.currentTarget })}>
              Progress type: {progressLabel}
            </button>
            <button className="send-feedback" onClick={() => toast('Thanks! Feedback is not collected in this replica')}>
              Send feedback
            </button>
            <button className="icon-btn" aria-label="More options" onClick={(e) => setPop({ kind: 'options', el: e.currentTarget })}>
              <IconMore />
            </button>
          </div>
        </div>

        <div className="table-scroll">
          <div className="table" role="table" aria-label={`${pf.name} projects`}>
            <div className="thead trow" role="row">
              <div className="th name-th" style={{ width: nameWidth, minWidth: nameWidth, maxWidth: nameWidth }}>
                <button className="th-label" onClick={(e) => setPop({ kind: 'col', el: e.currentTarget.parentElement!, data: 'name' })}>
                  Name
                  <SortMark dir={view.sorts.find((s) => s.fieldId === 'name')?.dir} />
                </button>
                <span className="resize-handle" onMouseDown={startResize('name', nameWidth)} />
              </div>
              {cols.map((c) => {
                const w = widthOf(c.fieldId, c.width);
                const s = view.sorts.find((x) => x.fieldId === c.fieldId);
                return (
                  <div key={c.fieldId} className={`th ${pop?.kind === 'col' && pop.data === c.fieldId ? 'menu-open' : ''}`} style={{ width: w, minWidth: w, maxWidth: w }}>
                    <button className="th-label" onClick={(e) => setPop({ kind: 'col', el: e.currentTarget.parentElement!, data: c.fieldId })}>
                      <span className="th-text">{FIELD_LABEL(data, c.fieldId, view)}</span>
                      <SortMark dir={s?.dir} />
                    </button>
                    <button className="th-caret" aria-label={`${FIELD_LABEL(data, c.fieldId, view)} options`} onClick={(e) => setPop({ kind: 'col', el: e.currentTarget.parentElement!, data: c.fieldId })}>
                      <IconChevronDown size={12} />
                    </button>
                    <span className="resize-handle" onMouseDown={startResize(c.fieldId, w)} />
                  </div>
                );
              })}
              <div className="th add-col">
                <button className="add-field-btn" aria-label="Add field" onClick={(e) => setPop({ kind: 'addfield', el: e.currentTarget })}>
                  <IconPlus size={14} />
                </button>
              </div>
              <div className="th filler" />
            </div>

            {adding && (
              <AddWorkRow
                portfolioId={portfolioId}
                nameWidth={nameWidth}
                onDone={(created) => {
                  setAdding(false);
                  if (created) toast(created);
                }}
              />
            )}

            {groups.map((g) => (
              <Fragment key={g.key}>
                {view.groupBy && (
                  <div className="group-row">
                    <button className="group-toggle" onClick={() => setCollapsedGroups((x) => ({ ...x, [g.key]: !x[g.key] }))} aria-expanded={!collapsedGroups[g.key]}>
                      {collapsedGroups[g.key] ? <IconTriangleRight size={12} /> : <IconTriangleDown size={12} />}
                    </button>
                    {renderGroupLabel(g.key)}
                    <span className="group-count">{g.rows.length}</span>
                  </div>
                )}
                {!collapsedGroups[g.key] &&
                  g.rows.flatMap((r) => {
                    const out: Row[] = [];
                    expandRows(r, out, new Set());
                    return out;
                  }).map(renderRow)}
              </Fragment>
            ))}

            {totalVisible === 0 && pf.items.length > 0 && (
              <div className="empty-row">
                No projects match these filters.{' '}
                <button className="btn-link" onClick={() => actions.setView(portfolioId, { filters: [] })}>
                  Clear filters
                </button>
              </div>
            )}

            {creating ? (
              <div className="trow new-row">
                <div className="cell name-cell editing" style={{ width: nameWidth, minWidth: nameWidth, maxWidth: nameWidth }}>
                  <span className="drag-slot" />
                  <span className="expand-slot" />
                  <span className="name-icon"><ProjectIcon color="#c7c4c4" size={20} /></span>
                  <NameEditor
                    initial=""
                    onDone={(v) => {
                      setCreating(false);
                      if (v && v.trim()) {
                        actions.addProject(portfolioId, v);
                        toast(`${v.trim()} added to ${pf.name}`);
                      }
                    }}
                  />
                </div>
              </div>
            ) : (
              <button className="create-row" onClick={() => setCreating(true)}>
                <IconPlus size={14} /> Create new project
              </button>
            )}
          </div>
        </div>
      </div>

      {pane?.kind === 'details' && <DetailsPane item={pane.ref} onClose={closePane} />}
      {pane?.kind === 'customize' && <CustomizePane portfolioId={portfolioId} onClose={closePane} />}

      {/* ---------- popovers ---------- */}
      {pop?.kind === 'filter' && <FilterPopover data={data} portfolioId={portfolioId} view={view} anchor={pop.el} onClose={() => setPop(null)} />}
      {pop?.kind === 'sort' && <SortPopover data={data} portfolioId={portfolioId} view={view} anchor={pop.el} onClose={() => setPop(null)} />}
      {pop?.kind === 'group' && <GroupPopover data={data} portfolioId={portfolioId} view={view} anchor={pop.el} onClose={() => setPop(null)} />}
      {pop?.kind === 'add' && (
        <Popover anchor={pop.el} onClose={() => setPop(null)}>
          <div className="menu">
            <MenuItem onClick={() => { setPop(null); setCreating(true); }}>Create new project</MenuItem>
            <MenuItem
              onClick={() => {
                setPop(null);
                const id = actions.addPortfolio(portfolioId, 'New portfolio');
                navigate(`/portfolio/${id}/list`);
                toast('Portfolio created');
              }}
            >
              Create new portfolio
            </MenuItem>
            <MenuSep />
            <MenuItem onClick={() => { setPop(null); setAdding(true); }}>Add existing project or portfolio</MenuItem>
          </div>
        </Popover>
      )}
      {pop?.kind === 'ptype' && (
        <Popover anchor={pop.el} onClose={() => setPop(null)} align="right">
          <div className="menu">
            <div className="menu-title-row muted">Progress type</div>
            <MenuItem checked={view.progressType === 'task'} onClick={() => { actions.setView(portfolioId, { progressType: 'task' }); setPop(null); }}>Task</MenuItem>
            <MenuItem checked={view.progressType === 'milestone'} onClick={() => { actions.setView(portfolioId, { progressType: 'milestone' }); setPop(null); }}>Milestone</MenuItem>
          </div>
        </Popover>
      )}
      {pop?.kind === 'options' && (
        <Popover anchor={pop.el} onClose={() => setPop(null)} align="right">
          <div className="menu">
            <MenuItem onClick={() => { setPop(null); setCustomize(true); }}>Show/hide columns</MenuItem>
            <MenuItem
              onClick={() => {
                setPop(null);
                const all: Record<string, boolean> = {};
                const walk = (pid: string) => getPortfolio(data, pid)?.items.forEach((i) => { if (i.type === 'portfolio') { all[`${pid}/${i.id}`] = true; walk(i.id); } });
                walk(portfolioId);
                setExpanded(all);
              }}
            >
              Expand all portfolios
            </MenuItem>
            <MenuItem onClick={() => { setPop(null); setExpanded({}); }}>Collapse all portfolios</MenuItem>
            <MenuSep />
            <MenuItem onClick={() => { setPop(null); toast('Layout saved as the default for everyone'); }}>Save layout as default</MenuItem>
            <MenuItem
              onClick={() => {
                setPop(null);
                copyLink(hrefFor.portfolio(portfolioId));
                toast('Portfolio link copied');
              }}
            >
              Copy portfolio link
            </MenuItem>
            <MenuSep />
            <MenuItem danger onClick={() => { setPop(null); if (confirm('Reset all replica data to the seed?')) { reset(); toast('Demo data reset'); } }}>
              Reset demo data
            </MenuItem>
          </div>
        </Popover>
      )}
      {pop?.kind === 'addfield' && (
        <FieldTypeMenu
          anchor={pop.el}
          libraryCount={library.length + hiddenBuiltins.length}
          onClose={() => setPop(null)}
          onPick={(t) => { setPop(null); setFieldModal({ type: t }); }}
          onLibrary={() => { setPop(null); setFieldModal({ library: true }); }}
        />
      )}
      {pop?.kind === 'col' && pop.data && (
        <Popover anchor={pop.el} onClose={() => setPop(null)}>
          <div className="menu">
            <MenuItem icon={<IconSortAsc />} onClick={() => { sortBy(pop.data!, 'asc'); setPop(null); }}>Sort ascending</MenuItem>
            <MenuItem icon={<IconSortDesc />} onClick={() => { sortBy(pop.data!, 'desc'); setPop(null); }}>Sort descending</MenuItem>
            {pop.data !== 'name' && (
              <>
                <MenuSep />
                <MenuItem icon={<IconArrowLeft />} disabled={cols[0]?.fieldId === pop.data} onClick={() => { moveCol(pop.data!, -1); setPop(null); }}>Move left</MenuItem>
                <MenuItem icon={<IconArrowRight />} disabled={cols[cols.length - 1]?.fieldId === pop.data} onClick={() => { moveCol(pop.data!, 1); setPop(null); }}>Move right</MenuItem>
              </>
            )}
            <MenuSep />
            <WidthSubmenu
              onPick={(w) => {
                if (pop.data === 'name') actions.setView(portfolioId, { nameWidth: w + 160 });
                else actions.setView(portfolioId, { columns: view.columns.map((c) => (c.fieldId === pop.data ? { ...c, width: w } : c)) });
                setPop(null);
              }}
            />
            {pop.data !== 'name' && (
              <>
                <MenuSep />
                {getField(data, pop.data)?.type !== 'builtin' && (
                  <MenuItem icon={<IconPencil />} onClick={() => { setFieldModal({ editId: pop.data }); setPop(null); }}>Edit field</MenuItem>
                )}
                <MenuItem
                  icon={<IconEyeOff />}
                  onClick={() => {
                    actions.setView(portfolioId, { columns: view.columns.map((c) => (c.fieldId === pop.data ? { ...c, hidden: true } : c)) });
                    setPop(null);
                  }}
                >
                  Hide column
                </MenuItem>
                {getField(data, pop.data)?.type !== 'builtin' && (
                  <MenuItem
                    danger
                    icon={<IconTrash />}
                    onClick={() => {
                      const name = FIELD_LABEL(data, pop.data!, view);
                      actions.removeFieldFromPortfolio(portfolioId, pop.data!);
                      setPop(null);
                      toast(`${name} removed from ${pf.name}`);
                    }}
                  >
                    Remove field from portfolio
                  </MenuItem>
                )}
              </>
            )}
          </div>
        </Popover>
      )}
      {ctx && (
        <Popover anchor={ctx.rect} onClose={() => setCtx(null)}>
          <div className="menu">
            <MenuItem
              icon={<IconOpen />}
              onClick={() => {
                window.open(location.href.split('#')[0] + (ctx.row.ref.type === 'project' ? hrefFor.project(ctx.row.ref.id) : hrefFor.portfolio(ctx.row.ref.id)), '_blank');
                setCtx(null);
              }}
            >
              Open in new tab
            </MenuItem>
            <MenuItem
              icon={<IconLink />}
              onClick={() => {
                copyLink(ctx.row.ref.type === 'project' ? hrefFor.project(ctx.row.ref.id) : hrefFor.portfolio(ctx.row.ref.id));
                toast('Link copied to clipboard');
                setCtx(null);
              }}
            >
              Copy {ctx.row.ref.type} link
            </MenuItem>
            <MenuItem icon={<IconPencil />} onClick={() => { setRenaming(`${ctx.row.parentId}/${ctx.row.ref.id}`); setCtx(null); }}>
              Rename {ctx.row.ref.type}
            </MenuItem>
            <MenuSep />
            <MenuItem
              icon={<IconFolder />}
              onClick={() => {
                const r = ctx.row;
                actions.removeFromPortfolio(r.parentId, r.ref);
                setCtx(null);
                toast(`${r.info.name} removed from portfolio`, { label: 'Undo', run: () => actions.addExisting(r.parentId, r.ref) });
              }}
            >
              Remove from portfolio
            </MenuItem>
            {ctx.row.ref.type === 'project' && (
              <MenuItem
                icon={<IconArchive />}
                onClick={() => {
                  actions.archiveProject(ctx.row.ref.id, !ctx.row.info.archived);
                  toast(ctx.row.info.archived ? 'Project restored' : 'Project archived');
                  setCtx(null);
                }}
              >
                {ctx.row.info.archived ? 'Unarchive project' : 'Archive project'}
              </MenuItem>
            )}
            <MenuItem danger icon={<IconTrash />} onClick={() => { setConfirmDelete(ctx.row); setCtx(null); }}>
              Delete {ctx.row.ref.type}
            </MenuItem>
          </div>
        </Popover>
      )}

      {/* ---------- modals ---------- */}
      {fieldModal && (
        <FieldModal
          type={fieldModal.type}
          initial={fieldModal.editId ? getField(data, fieldModal.editId) : undefined}
          library={fieldModal.library || !fieldModal.editId ? [...library, ...hiddenBuiltins.map((c) => getField(data, c.fieldId)!).filter(Boolean)] : undefined}
          onAddExisting={(id) => {
            if (view.columns.some((c) => c.fieldId === id)) {
              actions.setView(portfolioId, { columns: view.columns.map((c) => (c.fieldId === id ? { ...c, hidden: false } : c)) });
            } else {
              actions.setView(portfolioId, { columns: [...view.columns, { fieldId: id, width: 150 }] });
            }
            setFieldModal(null);
          }}
          onClose={() => setFieldModal(null)}
          onSave={(f) => {
            if (fieldModal.editId) actions.updateField(f);
            else actions.addField(portfolioId, f);
            setFieldModal(null);
            toast(fieldModal.editId ? 'Field updated' : `${f.name} field added`);
          }}
        />
      )}
      {confirmDelete && (
        <Modal
          title={`Delete “${confirmDelete.info.name}”?`}
          width={440}
          onClose={() => setConfirmDelete(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  actions.deleteItem(confirmDelete.ref);
                  toast(`${confirmDelete.info.name} deleted`);
                  setConfirmDelete(null);
                }}
              >
                Delete {confirmDelete.ref.type}
              </button>
            </>
          }
        >
          <p>
            This removes the {confirmDelete.ref.type} and its status updates from every portfolio. You can reset the demo data from the
            options menu to bring it back.
          </p>
        </Modal>
      )}
    </div>
  );
}

function countLabel(projects: number, portfolios: number) {
  const parts = [];
  if (projects) parts.push(`${projects} project${projects === 1 ? '' : 's'}`);
  if (portfolios) parts.push(`${portfolios} portfolio${portfolios === 1 ? '' : 's'}`);
  return parts.join(' · ');
}

function SortMark({ dir }: { dir?: 'asc' | 'desc' }) {
  if (!dir) return null;
  return <span className="sort-mark">{dir === 'asc' ? <IconSortAsc size={12} /> : <IconSortDesc size={12} />}</span>;
}

function WidthSubmenu({ onPick }: { onPick: (w: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <div ref={ref} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <MenuItem right={<IconChevronRight size={12} />} onClick={() => setOpen(true)}>
        Set column width
      </MenuItem>
      {open && (
        <Popover anchor={ref.current ? sideRect(ref.current) : null} onClose={() => setOpen(false)} offset={0}>
          <div className="menu" onMouseEnter={() => setOpen(true)}>
            <MenuItem onClick={() => onPick(100)}>Narrow</MenuItem>
            <MenuItem onClick={() => onPick(160)}>Medium</MenuItem>
            <MenuItem onClick={() => onPick(260)}>Wide</MenuItem>
          </div>
        </Popover>
      )}
    </div>
  );
}

const sideRect = (el: HTMLElement) => {
  const r = el.getBoundingClientRect();
  return new DOMRect(r.right - 4, r.top - 6, 0, 0);
};

function AddWorkRow({ portfolioId, nameWidth, onDone }: { portfolioId: string; nameWidth: number; onDone: (msg?: string) => void }) {
  const { data, actions } = useStore();
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  useEffect(() => setAnchor(ref.current), []);
  const pf = getPortfolio(data, portfolioId)!;
  const inPf = (t: ItemRef['type'], id: string) => pf.items.some((i) => i.type === t && i.id === id);
  const projects = data.projects.filter((p) => !inPf('project', p.id) && p.name.toLowerCase().includes(q.toLowerCase()));
  const portfolios = data.portfolios.filter((p) => p.id !== portfolioId && p.id !== data.rootPortfolioId && !inPf('portfolio', p.id) && p.name.toLowerCase().includes(q.toLowerCase()));
  const add = (r: ItemRef, name: string) => {
    actions.addExisting(portfolioId, r);
    onDone(`${name} added to ${pf.name}`);
  };
  return (
    <div className="trow new-row">
      <div ref={ref} className="cell name-cell editing" style={{ width: nameWidth, minWidth: nameWidth, maxWidth: nameWidth }}>
        <input
          autoFocus
          className="name-input"
          placeholder="Add a project or portfolio by name"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onDone();
            if (e.key === 'Enter') {
              if (projects[0] && q) add({ type: 'project', id: projects[0].id }, projects[0].name);
              else if (q.trim()) {
                actions.addProject(portfolioId, q);
                onDone(`${q.trim()} created in ${pf.name}`);
              }
            }
          }}
        />
      </div>
      {anchor && (
        <Popover anchor={anchor} onClose={() => onDone()}>
          <div className="menu add-work-menu">
            <div className="menu-section">Projects</div>
            {projects.slice(0, 6).map((p) => (
              <MenuItem key={p.id} icon={<span className="side-swatch" style={{ background: p.color }} />} onClick={() => add({ type: 'project', id: p.id }, p.name)}
                right={<span className="muted small">{data.portfolios.find((x) => x.items.some((i) => i.id === p.id))?.name}</span>}>
                {p.name}
              </MenuItem>
            ))}
            {projects.length === 0 && <div className="menu-empty">All projects are already in this portfolio</div>}
            <MenuSep />
            <MenuItem
              icon={<IconPlus size={14} />}
              onClick={() => {
                actions.addProject(portfolioId, q || 'New project');
                onDone(`${q.trim() || 'New project'} created in ${pf.name}`);
              }}
            >
              <span className="link-blue">{q.trim() ? `Create project “${q.trim()}”` : 'Create new project'}</span>
            </MenuItem>
            {portfolios.length > 0 && (
              <>
                <MenuSep />
                <div className="menu-section">Portfolios</div>
                {portfolios.slice(0, 6).map((p) => (
                  <MenuItem key={p.id} icon={<FolderIcon color={p.color} size={16} />} onClick={() => add({ type: 'portfolio', id: p.id }, p.name)}
                    right={<span className="muted small">{countLabel(p.items.filter((i) => i.type === 'project').length, p.items.filter((i) => i.type === 'portfolio').length)}</span>}>
                    {p.name}
                  </MenuItem>
                ))}
              </>
            )}
          </div>
        </Popover>
      )}
    </div>
  );
}

export function useNarrow(bp = 768) {
  const [n, setN] = useState(() => window.innerWidth < bp);
  useEffect(() => {
    const on = () => setN(window.innerWidth < bp);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [bp]);
  return n;
}

export { Pill };
