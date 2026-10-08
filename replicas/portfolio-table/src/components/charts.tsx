import { useState } from 'react';
import type { Person } from '../data/mock';
import { Avatar } from './ui';

export interface Seg {
  label: string;
  value: number;
  color: string;
}

export function Donut({ segs, size = 140, thickness = 26, center }: { segs: Seg[]; size?: number; thickness?: number; center?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const total = segs.reduce((s, x) => s + x.value, 0);
  const r = size / 2 - thickness / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="donut-wrap">
      <div className="donut" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#edeae9" strokeWidth={thickness} />
          {total > 0 &&
            segs.map((s, i) => {
              if (!s.value) return null;
              const len = (s.value / total) * c;
              const el = (
                <circle
                  key={s.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={hover === i ? thickness + 4 : thickness}
                  strokeDasharray={`${len} ${c - len}`}
                  strokeDashoffset={-acc}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  style={{ transition: 'stroke-width .1s' }}
                />
              );
              acc += len;
              return el;
            })}
        </svg>
        <div className="donut-center">
          <span className="donut-num">{hover !== null ? segs[hover].value : center ?? total}</span>
          {hover !== null && <span className="donut-sub">{segs[hover].label}</span>}
        </div>
      </div>
      <ul className="legend">
        {segs
          .filter((s) => s.value > 0)
          .map((s) => (
            <li key={s.label}>
              <span className="legend-swatch" style={{ background: s.color }} />
              {s.label}
            </li>
          ))}
      </ul>
    </div>
  );
}

export function HBars({ rows, max }: { rows: { label: string; value: number; color: string }[]; max?: number }) {
  const m = max ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="hbars">
      {rows.map((r) => (
        <div key={r.label} className="hbar-row">
          <span className="hbar-label">{r.label}</span>
          <span className="hbar-track">
            <span className="hbar-fill" style={{ width: `${(r.value / m) * 100}%`, background: r.color }} title={`${r.label}: ${r.value}`} />
          </span>
          <span className="hbar-val">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

export function VBars({ rows, height = 160, yLabel }: { rows: { label: string; value: number; color: string }[]; height?: number; yLabel?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1];
  return (
    <div className="vchart">
      {yLabel && <span className="vchart-ylabel">{yLabel}</span>}
      <div className="vchart-plot" style={{ height }}>
        {ticks.map((t) => (
          <div key={t} className="vchart-grid" style={{ bottom: `${(t / top) * 100}%` }}>
            <span>{t}</span>
          </div>
        ))}
        <div className="vchart-bars">
          {rows.map((r) => (
            <div key={r.label} className="vchart-col" title={`${r.label}: ${r.value}`}>
              <div className="vchart-bar" style={{ height: `${(r.value / top) * 100}%`, background: r.color }} />
            </div>
          ))}
        </div>
      </div>
      <div className="vchart-x">
        {rows.map((r) => (
          <span key={r.label} title={r.label}>
            {r.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Lollipops({ rows, height = 150, yLabel }: { rows: { person?: Person | null; label: string; value: number }[]; height?: number; yLabel?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1];
  return (
    <div className="vchart">
      {yLabel && <span className="vchart-ylabel">{yLabel}</span>}
      <div className="vchart-plot" style={{ height }}>
        {ticks.map((t) => (
          <div key={t} className="vchart-grid" style={{ bottom: `${(t / top) * 100}%` }}>
            <span>{t}</span>
          </div>
        ))}
        <div className="vchart-bars">
          {rows.map((r) => (
            <div key={r.label} className="vchart-col" title={`${r.label}: ${r.value}`}>
              <div className="lolli" style={{ height: `${(r.value / top) * 100}%` }}>
                <span className="lolli-dot" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="vchart-x avatars">
        {rows.map((r) => (
          <span key={r.label}>
            <Avatar person={r.person} size={20} />
          </span>
        ))}
      </div>
    </div>
  );
}

function niceTicks(max: number): number[] {
  const step = max <= 4 ? 1 : max <= 10 ? 2 : max <= 25 ? 5 : max <= 50 ? 10 : Math.ceil(max / 5 / 10) * 10;
  const out: number[] = [];
  for (let v = 0; v <= max + step - 1; v += step) {
    out.push(v);
    if (v >= max) break;
  }
  if (out[out.length - 1] < max) out.push(out[out.length - 1] + step);
  return out;
}
