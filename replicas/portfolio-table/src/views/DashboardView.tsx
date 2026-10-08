import { useState } from 'react';
import { TODAY } from '../data/mock';
import { STATUS, STATUS_ORDER } from '../lib/status';
import { getField, getPortfolio, itemStatus, milestonesFor, projectsDeep, useStore, useToast } from '../store';
import { Donut, HBars, Lollipops, VBars } from '../components/charts';
import { IconFilter, IconMore, IconPlus } from '../components/Icons';
import { MenuItem, Modal, Popover } from '../components/ui';

const CHARTS: Record<string, { title: string; filters: string }> = {
  status: { title: 'Projects by project status', filters: 'No filters' },
  incomplete: { title: 'Incomplete milestones by project', filters: '1 filter' },
  upcoming: { title: 'Upcoming milestones by owner', filters: '2 filters' },
  owner: { title: 'Projects by owner', filters: 'No filters' },
  priority: { title: 'Projects by priority', filters: 'No filters' },
  phase: { title: 'Projects by phase', filters: 'No filters' },
};
const DEFAULT = ['status', 'incomplete', 'upcoming', 'owner'];

export function DashboardView({ portfolioId }: { portfolioId: string }) {
  const { data, actions } = useStore();
  const toast = useToast();
  const pf = getPortfolio(data, portfolioId)!;
  const charts = data.views[portfolioId].charts ?? DEFAULT;
  const setCharts = (c: string[]) => actions.setView(portfolioId, { charts: c });
  const [adding, setAdding] = useState(false);
  const [menu, setMenu] = useState<{ id: string; el: HTMLElement } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const projs = projectsDeep(data, portfolioId);
  const ms = projs.flatMap((p) => milestonesFor(data, p.id));
  const done = ms.filter((m) => m.completedOn);
  const open = ms.filter((m) => !m.completedOn);
  const overdue = open.filter((m) => m.dueDate < TODAY);

  const numbers = [
    { label: 'Total milestones', n: ms.length, f: 'No filters' },
    { label: 'Completed milestones', n: done.length, f: '1 filter' },
    { label: 'Incomplete milestones', n: open.length, f: '1 filter' },
    { label: 'Overdue milestones', n: overdue.length, f: '1 filter' },
  ];

  const renderChart = (id: string) => {
    switch (id) {
      case 'status':
        return (
          <Donut
            size={170}
            thickness={34}
            segs={[...STATUS_ORDER, null].map((k) => ({
              label: k ? STATUS[k].label : 'No status',
              value: projs.filter((p) => itemStatus(data, { type: 'project', id: p.id }).status === k).length,
              color: k ? (k === 'complete' ? '#4f8a70' : STATUS[k].dot) : '#e0dddc',
            }))}
          />
        );
      case 'incomplete':
        return <VBars yLabel="Milestone count" rows={projs.map((p) => ({ label: p.name, value: milestonesFor(data, p.id).filter((m) => !m.completedOn).length, color: p.color }))} />;
      case 'upcoming':
        return (
          <Lollipops
            yLabel="Milestone count"
            rows={data.people.map((person) => ({
              person,
              label: person.name,
              value: projs.filter((p) => p.ownerId === person.id).flatMap((p) => milestonesFor(data, p.id)).filter((m) => !m.completedOn && m.dueDate >= TODAY).length,
            }))}
          />
        );
      case 'owner':
        return <Lollipops yLabel="Project count" rows={data.people.map((person) => ({ person, label: person.name, value: projs.filter((p) => p.ownerId === person.id).length }))} />;
      case 'priority':
      case 'phase': {
        const f = getField(data, id);
        return <HBars rows={(f?.options ?? []).map((o) => ({ label: o.name, value: projs.filter((p) => data.values[p.id]?.[id] === o.id).length, color: o.color }))} />;
      }
    }
    return null;
  };

  return (
    <div className="dashboard">
      <div className="toolbar">
        <div className="toolbar-left">
          <button className="btn btn-primary sm" onClick={() => setAdding(true)}>
            <IconPlus size={12} /> Add chart
          </button>
        </div>
        <div className="toolbar-right">
          <button className="send-feedback" onClick={() => toast('Thanks! Feedback is not collected in this replica')}>Send feedback</button>
        </div>
      </div>
      <div className="dash-scroll">
        <div className="dash-numbers">
          {numbers.map((n) => (
            <div key={n.label} className="dash-number">
              <span className="dn-label">{n.label}</span>
              <span className={`dn-value ${n.label.startsWith('Overdue') && n.n ? 'bad' : ''}`}>{n.n}</span>
              <span className="dn-filter"><IconFilter size={10} /> {n.f}</span>
            </div>
          ))}
        </div>
        <div className="dash-grid">
          {charts.map((id) => (
            <div key={id} className={`dash-card ${expanded === id ? 'wide' : ''}`}>
              <div className="dc-head">
                <h3>{CHARTS[id]?.title}</h3>
                <button className="icon-btn sm" aria-label="Chart actions" onClick={(e) => setMenu({ id, el: e.currentTarget })}>
                  <IconMore size={14} />
                </button>
              </div>
              <div className="dc-body">{renderChart(id)}</div>
              <div className="dc-foot"><IconFilter size={10} /> {CHARTS[id]?.filters}</div>
            </div>
          ))}
          {charts.length === 0 && (
            <div className="empty-card">
              No charts yet. <button className="btn-link" onClick={() => setAdding(true)}>Add a chart</button>
            </div>
          )}
        </div>
        <p className="muted small dash-note">Charts for {pf.name} count every project in nested portfolios.</p>
      </div>
      {menu && (
        <Popover anchor={menu.el} onClose={() => setMenu(null)} align="right">
          <div className="menu">
            <MenuItem onClick={() => { setExpanded(expanded === menu.id ? null : menu.id); setMenu(null); }}>{expanded === menu.id ? 'Show at normal size' : 'Show full width'}</MenuItem>
            <MenuItem disabled={charts.indexOf(menu.id) === 0} onClick={() => { const i = charts.indexOf(menu.id); const c = [...charts]; [c[i - 1], c[i]] = [c[i], c[i - 1]]; setCharts(c); setMenu(null); }}>Move earlier</MenuItem>
            <MenuItem disabled={charts.indexOf(menu.id) === charts.length - 1} onClick={() => { const i = charts.indexOf(menu.id); const c = [...charts]; [c[i + 1], c[i]] = [c[i], c[i + 1]]; setCharts(c); setMenu(null); }}>Move later</MenuItem>
            <MenuItem danger onClick={() => { setCharts(charts.filter((c) => c !== menu.id)); setMenu(null); toast('Chart removed'); }}>Remove chart</MenuItem>
          </div>
        </Popover>
      )}
      {adding && (
        <Modal title="Add chart" onClose={() => setAdding(false)} width={560}>
          <div className="chart-gallery">
            {Object.entries(CHARTS).map(([id, c]) => (
              <button key={id} className="chart-option" disabled={charts.includes(id)} onClick={() => { setCharts([...charts, id]); setAdding(false); toast(`${c.title} added`); }}>
                <span className="co-thumb">{renderThumb(id)}</span>
                <span className="co-title">{c.title}</span>
                {charts.includes(id) && <span className="muted small">Already on dashboard</span>}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

function renderThumb(id: string) {
  if (id === 'status') return <svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="16" fill="none" stroke="#5da283" strokeWidth="9" strokeDasharray="60 41" /><circle cx="24" cy="24" r="16" fill="none" stroke="#f1bd6c" strokeWidth="9" strokeDasharray="25 76" strokeDashoffset="-60" /></svg>;
  if (id === 'owner' || id === 'upcoming') return <span className="mini-lolli">{[26, 18, 12].map((h) => <span key={h} className="mini-lolli-col"><span className="mini-lolli-stick" style={{ height: h }} /></span>)}</span>;
  if (id === 'incomplete') return <span className="mini-vbars">{['#f1bd6c', '#4ecbc4', '#b36bd4', '#4573d2'].map((c, i) => <span key={c} style={{ background: c, height: [30, 22, 34, 16][i] }} />)}</span>;
  return <span className="mini-lines">{['#f06a6a', '#ec8d71', '#f1bd6c'].map((c, i) => <span key={c} className="mini-hbar" style={{ background: c, width: `${[80, 55, 70][i]}%` }} />)}</span>;
}
