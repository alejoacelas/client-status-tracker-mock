import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ItemRef } from '../data/mock';
import { TODAY } from '../data/mock';
import { addDays, diffDays, fmtDate, monthShort, parse, toIso } from '../lib/dates';
import { getPerson, getPortfolio, hrefFor, useStore, useToast } from '../store';
import { IconChevronDown, IconDiamond, IconFilter, IconOptions, IconPlus, IconSort, IconTriangleDown, IconTriangleRight, IconZoom } from '../components/Icons';
import { Avatar, FolderIcon, MenuItem, Popover, ProjectIcon, StatusChip } from '../components/ui';
import { compareRows, makeRow, matchesFilter, type Row } from './list/model';
import { FilterPopover, SortPopover } from './list/toolbar';

type Zoom = 'days' | 'weeks' | 'months' | 'quarters';
const DAY_W: Record<Zoom, number> = { days: 36, weeks: 14, months: 4.2, quarters: 1.6 };
const ROW_H = 72;
const LEFT_W = 280;

export function TimelineView({ portfolioId }: { portfolioId: string }) {
  const { data, actions } = useStore();
  const toast = useToast();
  const pf = getPortfolio(data, portfolioId)!;
  const view = data.views[portfolioId];
  const [zoom, setZoom] = useState<Zoom>('weeks');
  const [showMilestones, setShowMilestones] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    portfolioId === data.rootPortfolioId ? Object.fromEntries(pf.items.map((i) => [`${portfolioId}/${i.id}`, true])) : {},
  );
  const [pop, setPop] = useState<{ kind: string; el: HTMLElement } | null>(null);
  const [newName, setNewName] = useState('');
  const [live, setLive] = useState<{ key: string; start: string; due: string } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const narrow = window.innerWidth < 768;
  const leftW = narrow ? 150 : LEFT_W;
  const dayW = DAY_W[zoom];

  /* rows */
  const rows = useMemo(() => {
    let top = pf.items.map((r, i) => makeRow(data, r, 0, pf.id, i)).filter((r): r is Row => !!r);
    top = top.filter((r) => view.filters.every((f) => matchesFilter(data, r, f)));
    if (view.sorts.length) top.sort(compareRows(data, view.sorts));
    const out: Row[] = [];
    const walk = (r: Row) => {
      out.push(r);
      const k = `${r.parentId}/${r.ref.id}`;
      if (r.ref.type === 'portfolio' && expanded[k]) {
        const child = getPortfolio(data, r.ref.id);
        child?.items.map((x, i) => makeRow(data, x, r.depth + 1, child.id, i)).filter((x): x is Row => !!x).forEach(walk);
      }
    };
    top.forEach(walk);
    return out;
  }, [data, pf, view, expanded]);

  /* date range */
  const { start, days } = useMemo(() => {
    const dates = rows.flatMap((r) => [r.info.startDate, r.info.dueDate]).filter(Boolean) as string[];
    const min = [TODAY, ...dates].sort()[0];
    const max = [TODAY, ...dates].sort().reverse()[0];
    const s = parse(addDays(min, -21));
    s.setDate(1);
    const e = parse(addDays(max, 60));
    return { start: toIso(s), days: diffDays(toIso(s), toIso(e)) };
  }, [rows]);
  const x = (iso: string) => diffDays(start, iso) * dayW;
  const width = days * dayW;

  const scrollToToday = () => {
    const el = scroller.current;
    if (el) el.scrollLeft = Math.max(0, x(TODAY) - (el.clientWidth - leftW) / 3);
  };
  useLayoutEffect(scrollToToday, [zoom]);

  /* header ticks */
  const months: { label: string; left: number; w: number }[] = [];
  const ticks: { label: string; left: number; weekend?: boolean }[] = [];
  for (let i = 0; i < days; i++) {
    const d = parse(addDays(start, i));
    if (d.getDate() === 1 || i === 0) {
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const len = Math.min(days - i, diffDays(toIso(d), toIso(next)));
      const q = Math.floor(d.getMonth() / 3) + 1;
      const label = zoom === 'quarters' ? (d.getMonth() % 3 === 0 ? `Q${q} ${d.getFullYear()}` : '') : zoom === 'months' ? `${d.getFullYear()}` : `${monthShort(d.getMonth())} ${d.getFullYear()}`;
      months.push({ label, left: i * dayW, w: len * dayW });
    }
    if (zoom === 'days') ticks.push({ label: String(d.getDate()), left: i * dayW, weekend: d.getDay() === 0 || d.getDay() === 6 });
    else if (zoom === 'weeks' && d.getDay() === 1) ticks.push({ label: String(d.getDate()), left: i * dayW });
    else if ((zoom === 'months' || zoom === 'quarters') && d.getDate() === 1) ticks.push({ label: monthShort(d.getMonth()), left: i * dayW });
  }

  /* dragging */
  const startDrag = (r: Row, mode: 'move' | 'start' | 'end') => (e: React.MouseEvent) => {
    if (!r.info.startDate && !r.info.dueDate) return;
    e.preventDefault();
    e.stopPropagation();
    const key = `${r.parentId}/${r.ref.id}`;
    const s0 = r.info.startDate ?? r.info.dueDate!;
    const d0 = r.info.dueDate ?? r.info.startDate!;
    const x0 = e.clientX;
    let cur = { key, start: s0, due: d0 };
    const move = (ev: MouseEvent) => {
      const dd = Math.round((ev.clientX - x0) / dayW);
      if (mode === 'move') cur = { key, start: addDays(s0, dd), due: addDays(d0, dd) };
      if (mode === 'start') cur = { key, start: addDays(s0, Math.min(dd, diffDays(s0, d0))), due: d0 };
      if (mode === 'end') cur = { key, start: s0, due: addDays(d0, Math.max(dd, -diffDays(s0, d0))) };
      setLive(cur);
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      document.body.classList.remove('dragging-bar');
      if (cur.start !== s0 || cur.due !== d0) {
        actions.setDates(r.ref, cur.start, cur.due);
        toast(`${r.info.name}: ${fmtDate(cur.start)} – ${fmtDate(cur.due)}`);
      }
      setLive(null);
    };
    document.body.classList.add('dragging-bar');
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const create = () => {
    if (!newName.trim()) return;
    const id = actions.addProject(portfolioId, newName);
    actions.setDates({ type: 'project', id } as ItemRef, TODAY, addDays(TODAY, 21));
    toast(`${newName.trim()} added to ${pf.name}`);
    setNewName('');
    setPop(null);
  };

  return (
    <div className="timeline">
      <div className="toolbar">
        <div className="toolbar-left">
          <button className="btn btn-secondary sm" onClick={(e) => setPop({ kind: 'add', el: e.currentTarget })}>
            <IconPlus size={12} /> Add work
          </button>
          <button className="btn-ghost sm" onClick={scrollToToday}>Today</button>
        </div>
        <div className="toolbar-right tl-tools">
          <button className="btn-ghost sm" onClick={(e) => setPop({ kind: 'zoom', el: e.currentTarget })}>
            <IconZoom size={14} /> {zoom[0].toUpperCase() + zoom.slice(1)} <IconChevronDown size={10} />
          </button>
          <button className="btn-ghost sm" onClick={(e) => setPop({ kind: 'filter', el: e.currentTarget })}>
            <IconFilter size={14} /> {view.filters.filter((f) => f.value).length ? `Filters: ${view.filters.filter((f) => f.value).length}` : 'Filter'}
          </button>
          <button className="btn-ghost sm" onClick={(e) => setPop({ kind: 'sort', el: e.currentTarget })}>
            <IconSort size={14} /> {view.sorts.length ? `Sorts: ${view.sorts.length}` : 'Sort'}
          </button>
          <button className="btn-ghost sm" onClick={(e) => setPop({ kind: 'options', el: e.currentTarget })}>
            <IconOptions size={14} /> Options
          </button>
        </div>
      </div>
      <div className="tl-scroll" ref={scroller}>
        <div className="tl-canvas" style={{ width: leftW + width }}>
          <div className="tl-head" style={{ width: leftW + width }}>
            <div className="tl-head-left" style={{ width: leftW }} />
            <div className="tl-head-right" style={{ width }}>
              <div className="tl-months">
                {months.map((m) => (
                  <span key={m.left} style={{ left: m.left, width: m.w }}>{m.label}</span>
                ))}
              </div>
              <div className="tl-ticks">
                {ticks.map((t) => (
                  <span key={t.left} className={t.weekend ? 'weekend' : ''} style={{ left: t.left, width: zoom === 'days' ? dayW : undefined }}>{t.label}</span>
                ))}
                <span className="tl-today-dot" style={{ left: x(TODAY) + dayW / 2 }} />
              </div>
            </div>
          </div>
          <div className="tl-body" style={{ height: Math.max(rows.length * ROW_H + 60, 400) }}>
            <div className="tl-grid" style={{ left: leftW, width }}>
              {zoom === 'days' && ticks.filter((t) => t.weekend).map((t) => <span key={t.left} className="tl-weekend" style={{ left: t.left, width: dayW }} />)}
              {zoom !== 'days' && ticks.map((t) => <span key={t.left} className="tl-gridline" style={{ left: t.left }} />)}
              <span className="tl-today" style={{ left: x(TODAY) + dayW / 2 }} />
            </div>
            {rows.map((r, i) => {
              const key = `${r.parentId}/${r.ref.id}`;
              const s = live?.key === key ? live.start : r.info.startDate ?? r.info.dueDate;
              const d = live?.key === key ? live.due : r.info.dueDate ?? r.info.startDate;
              const owner = getPerson(data, r.info.ownerId);
              const barW = s && d ? (diffDays(s, d) + 1) * dayW : 0;
              const href = r.ref.type === 'project' ? hrefFor.project(r.ref.id) : hrefFor.portfolio(r.ref.id, 'timeline');
              return (
                <div key={key} className="tl-row" style={{ top: i * ROW_H, height: ROW_H }}>
                  <div className="tl-left" style={{ width: leftW, paddingLeft: 12 + r.depth * 18 }}>
                    <span className="expand-slot">
                      {r.expandable && (
                        <button className="expand-btn" aria-label="Expand" onClick={() => setExpanded((x) => ({ ...x, [key]: !x[key] }))}>
                          {expanded[key] ? <IconTriangleDown size={12} /> : <IconTriangleRight size={12} />}
                        </button>
                      )}
                    </span>
                    <span className="tl-icon">{r.ref.type === 'project' ? <ProjectIcon color={r.info.color} size={28} /> : <FolderIcon color={r.info.color} size={30} />}</span>
                    <span className="tl-name">
                      <a href={href} title={r.info.name}>{r.info.name}</a>
                      <StatusChip status={r.status} size="sm" noRecent />
                    </span>
                  </div>
                  {s && d && (
                    <div
                      className={`tl-bar ${r.ref.type}`}
                      style={{ left: leftW + x(s), width: Math.max(barW, 8), background: r.info.color }}
                      onMouseDown={startDrag(r, 'move')}
                      title={`${r.info.name}: ${fmtDate(s)} – ${fmtDate(d)}`}
                    >
                      <span className="tl-handle l" onMouseDown={startDrag(r, 'start')} />
                      {barW > 120 && (
                        <span className="tl-bar-label" style={{ left: leftW + 4 }}>
                          <Avatar person={owner} size={18} title={false} />
                          <span>{owner ? `Owned by ${owner.name}` : r.info.name}</span>
                        </span>
                      )}
                      <span className="tl-handle r" onMouseDown={startDrag(r, 'end')} />
                    </div>
                  )}
                  {s && d && barW <= 120 && <span className="tl-outside-label" style={{ left: leftW + x(s) + Math.max(barW, 8) + 8 }}>{r.info.name}</span>}
                  {showMilestones && r.ref.type === 'project' &&
                    r.info.milestones.map((m) => {
                      const done = !!m.completedOn;
                      const overdue = !done && m.dueDate < TODAY;
                      return (
                        <span key={m.id} className="tl-ms" style={{ left: leftW + x(m.dueDate) + dayW / 2 - 7 }} title={`${m.name} · Due ${fmtDate(m.dueDate)}`}>
                          <IconDiamond filled={done || overdue} size={14} className={done ? 'd-done' : overdue ? 'd-overdue' : 'd-open'} />
                          {zoom === 'days' && (
                            <span className="tl-ms-label">
                              <span>{m.name}</span>
                              <span className="muted">Due {fmtDate(m.dueDate, { relative: false })}</span>
                            </span>
                          )}
                        </span>
                      );
                    })}
                </div>
              );
            })}
            <div className="tl-create-row" style={{ top: rows.length * ROW_H }}>
              <button className="tl-create" style={{ width: leftW }} onClick={(e) => setPop({ kind: 'add', el: e.currentTarget })}>
                <IconPlus size={14} /> Create new project
              </button>
            </div>
          </div>
        </div>
      </div>
      {pop?.kind === 'zoom' && (
        <Popover anchor={pop.el} onClose={() => setPop(null)} align="right">
          <div className="menu">
            {(['days', 'weeks', 'months', 'quarters'] as Zoom[]).map((z) => (
              <MenuItem key={z} checked={zoom === z} onClick={() => { setZoom(z); setPop(null); }}>{z[0].toUpperCase() + z.slice(1)}</MenuItem>
            ))}
          </div>
        </Popover>
      )}
      {pop?.kind === 'options' && (
        <Popover anchor={pop.el} onClose={() => setPop(null)} align="right">
          <div className="menu">
            <MenuItem checked={showMilestones} onClick={() => setShowMilestones(!showMilestones)}>Show milestones</MenuItem>
          </div>
        </Popover>
      )}
      {pop?.kind === 'filter' && <FilterPopover data={data} portfolioId={portfolioId} view={view} anchor={pop.el} onClose={() => setPop(null)} />}
      {pop?.kind === 'sort' && <SortPopover data={data} portfolioId={portfolioId} view={view} anchor={pop.el} onClose={() => setPop(null)} />}
      {pop?.kind === 'add' && (
        <Popover anchor={pop.el} onClose={() => setPop(null)}>
          <div className="panel add-panel">
            <div className="panel-title">New project in {pf.name}</div>
            <input autoFocus className="input" placeholder="Project name" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && create()} />
            <div className="panel-foot">
              <span className="muted small">Starts today, due in three weeks. Drag the bar to change.</span>
              <button className="btn btn-primary sm" onClick={create} disabled={!newName.trim()}>Create</button>
            </div>
          </div>
        </Popover>
      )}
    </div>
  );
}
