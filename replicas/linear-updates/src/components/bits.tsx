import type { Health } from '../data/mock';
import { HEALTH_META, HealthIcon } from '../icons';
import { userById } from '../store';

export function Avatar({ userId, size = 16 }: { userId: string; size?: number }) {
  const u = userById(userId);
  return (
    <span className="avatar" title={u.fullName} style={{ width: size, height: size, background: u.color, fontSize: Math.max(7, Math.round(size * 0.45)) }}>
      {u.fullName.split(' ').map((p) => p[0]).join('').slice(0, size >= 20 ? 2 : 1)}
    </span>
  );
}

export function HealthLabel({ health, prefix = '', size = 16 }: { health: Health; prefix?: string; size?: number }) {
  const m = HEALTH_META[health];
  return (
    <>
      <HealthIcon health={health} size={size} />
      <span className="health-label" style={{ color: m.color }}>{prefix}{prefix ? m.label.toLowerCase() : m.label}</span>
    </>
  );
}

export function Toast({ msg }: { msg: string }) {
  return (
    <div className="toast" role="status">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" /><path d="m5.3 8.2 1.8 1.8 3.6-3.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      {msg}
    </div>
  );
}

export function MilestoneDiamond({ pct, size = 14 }: { pct: number; size?: number }) {
  // Outline diamond that fills as the milestone completes, like the original's progress diamond.
  const done = pct >= 100;
  const color = done ? 'var(--accent)' : pct > 0 ? 'var(--status-started)' : 'var(--text-quaternary)';
  const id = `clip-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} style={{ flex: 'none' }} aria-hidden="true">
      <defs>
        <clipPath id={id}><path d="M8 1.5 14.5 8 8 14.5 1.5 8Z" /></clipPath>
      </defs>
      <path d="M8 1.5 14.5 8 8 14.5 1.5 8Z" fill={done ? color : 'none'} stroke={done ? color : 'var(--text-quaternary)'} strokeWidth="1.4" strokeLinejoin="round" />
      {!done && pct > 0 && (
        <g clipPath={`url(#${id})`}>
          <rect x="0" y={16 - (16 * pct) / 100} width="16" height={(16 * pct) / 100} fill={color} opacity="0.9" />
        </g>
      )}
    </svg>
  );
}

export function ProgressRing({ pct, size = 14 }: { pct: number; size?: number }) {
  const r = 5.5;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 14 14" width={size} height={size} style={{ flex: 'none', transform: 'rotate(-90deg)' }}>
      <circle cx="7" cy="7" r={r} fill="none" stroke="var(--bg-selected)" strokeWidth="2" />
      <circle cx="7" cy="7" r={r} fill="none" stroke={pct >= 100 ? 'var(--accent)' : 'var(--status-started)'} strokeWidth="2" strokeDasharray={`${(c * pct) / 100} ${c}`} strokeLinecap="round" />
    </svg>
  );
}
