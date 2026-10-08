import { useMemo, useState } from 'react';
import type { Milestone, Project } from '../data/mock';
import { now } from '../store';
import { shortDate, ymd } from '../util';

const DAY = 86400000;
const d = (s: string) => new Date(s + 'T00:00:00').getTime();

export function graphSeries(p: Project) {
  const start = d(p.startDate);
  const target = d(p.targetDate);
  const end = p.status === 'completed' ? target : Math.min(now().getTime(), target + 21 * DAY);
  const weeks = Math.max(1, Math.round((end - start) / (7 * DAY)));
  const completedNow = Math.round((p.scope * p.progress) / 100);
  const startedNow = p.status === 'completed' ? completedNow : Math.min(p.scope, completedNow + Math.round((p.scope - completedNow) * 0.22));
  const pts: { t: number; scope: number; started: number; completed: number }[] = [];
  let prevC = 0;
  let prevS = 0;
  for (let i = 0; i <= weeks; i++) {
    const t = i / weeks;
    const scope = i === weeks ? p.scope : Math.round(p.scope * Math.min(1, 0.5 + 0.5 * Math.min(1, t * 1.7)));
    let completed = i === weeks ? completedNow : Math.round(completedNow * Math.pow(t, 1.25));
    completed = Math.max(prevC, Math.min(completed, scope));
    let started = i === weeks ? startedNow : Math.round(completed + (startedNow - completedNow) * Math.min(1, t * 1.6) + (i > 0 && i < weeks ? 1 : 0));
    started = Math.max(prevS, completed, Math.min(started, scope));
    prevC = completed;
    prevS = started;
    pts.push({ t: start + i * 7 * DAY, scope, started, completed });
  }
  if (pts.length) pts[pts.length - 1].t = end;
  return { pts, start, target, end, completedNow, startedNow };
}

export function ProgressGraph({ project, milestones }: { project: Project; milestones: Milestone[] }) {
  const { pts, start, target, end, completedNow, startedNow } = useMemo(() => graphSeries(project), [project]);
  const [hover, setHover] = useState<number | null>(null);
  const W = 300;
  const H = 150;
  const pad = { l: 4, r: 4, t: 8, b: 30 };
  const x1 = Math.max(end, target);
  const xs = (t: number) => pad.l + ((t - start) / (x1 - start || 1)) * (W - pad.l - pad.r);
  const max = Math.max(...pts.map((p) => p.scope), 1);
  const ys = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const line = (k: 'scope' | 'started' | 'completed') => pts.map((p, i) => `${i ? 'L' : 'M'}${xs(p.t).toFixed(1)},${ys(p[k]).toFixed(1)}`).join('');
  const area = `${line('completed')}L${xs(pts[pts.length - 1].t).toFixed(1)},${ys(0)}L${xs(pts[0].t).toFixed(1)},${ys(0)}Z`;
  const bars = pts.slice(1).map((p, i) => ({ t: p.t, v: p.completed - pts[i].completed }));
  const barMax = Math.max(...bars.map((b) => b.v), 1);
  const hp = hover != null ? pts[hover] : null;

  return (
    <div>
      <div className="graph-legend">
        <div><div className="k"><span className="sq" style={{ background: 'var(--graph-scope)' }} />Scope</div><div className="v">{project.scope}</div></div>
        <div><div className="k"><span className="sq" style={{ background: 'var(--graph-started)' }} />Started</div><div className="v">{startedNow}</div></div>
        <div><div className="k"><span className="sq" style={{ background: 'var(--graph-completed)' }} />Completed</div><div className="v">{completedNow}</div></div>
      </div>
      <div style={{ position: 'relative' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          style={{ display: 'block', overflow: 'visible' }}
          onMouseMove={(e) => {
            const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            const t = start + ((e.clientX - r.left) / r.width) * (x1 - start);
            let best = 0;
            pts.forEach((p, i) => { if (Math.abs(p.t - t) < Math.abs(pts[best].t - t)) best = i; });
            setHover(best);
          }}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--graph-completed)" stopOpacity="0.32" />
              <stop offset="1" stopColor="var(--graph-completed)" stopOpacity="0.02" />
            </linearGradient>
            <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--graph-target)" strokeOpacity="0.35" strokeWidth="1.5" />
            </pattern>
          </defs>
          <line x1={pad.l} x2={W - pad.r} y1={ys(0)} y2={ys(0)} stroke="var(--border)" />
          {end > target && <rect x={xs(target)} y={pad.t} width={xs(end) - xs(target)} height={ys(0) - pad.t} fill="url(#hatch)" />}
          <path d={area} fill="url(#gc)" />
          {bars.map((b, i) => b.v > 0 && (
            <rect key={i} x={xs(b.t) - 2} width="4" y={ys(0) - (b.v / barMax) * 26} height={(b.v / barMax) * 26} rx="1" fill="var(--graph-completed)" opacity="0.85" />
          ))}
          <path d={line('scope')} fill="none" stroke="var(--graph-scope)" strokeWidth="1.5" />
          <path d={line('started')} fill="none" stroke="var(--graph-started)" strokeWidth="1.5" />
          <path d={line('completed')} fill="none" stroke="var(--graph-completed)" strokeWidth="1.5" />
          <line x1={xs(target)} x2={xs(target)} y1={pad.t} y2={ys(0)} stroke="var(--graph-target)" strokeWidth="1.2" />
          {milestones.map((m) => (
            <path key={m.id} transform={`translate(${xs(d(m.targetDate))},${ys(0) + 8})`} d="M0,-3.5 3.5,0 0,3.5 -3.5,0Z" fill={m.completedOn ? 'var(--text-tertiary)' : 'var(--text-quaternary)'}>
              <title>{m.name} · {shortDate(m.targetDate)}</title>
            </path>
          ))}
          {hp && <line x1={xs(hp.t)} x2={xs(hp.t)} y1={pad.t} y2={ys(0)} stroke="var(--text-quaternary)" strokeDasharray="2 2" />}
          {hp && <circle cx={xs(hp.t)} cy={ys(hp.completed)} r="3" fill="var(--graph-completed)" />}
          <text x={pad.l} y={H - 2} fontSize="11" fill="var(--text-tertiary)">{shortDate(project.startDate)}</text>
          <text x={W - pad.r} y={H - 2} fontSize="11" textAnchor="end" fill="var(--text-tertiary)">{shortDate(ymd(x1))}</text>
        </svg>
        {hp && (
          <div className="graph-tip" style={{ left: `${Math.min(62, (xs(hp.t) / W) * 100)}%`, top: -6 }}>
            <div style={{ color: 'var(--text-tertiary)', marginBottom: 2 }}>Week of {shortDate(ymd(hp.t))}</div>
            <div>Scope {hp.scope} · Started {hp.started} · Completed {hp.completed}</div>
          </div>
        )}
      </div>
    </div>
  );
}
