// Hand-drawn 16px icons approximating the original's line-icon style.
import type { CSSProperties, ReactNode } from 'react';
import type { Health, Priority, ProjectStatus } from './data/mock';

type P = { size?: number; style?: CSSProperties; className?: string };

function Svg({ size = 16, children, style, className, fill = 'none' }: P & { children: ReactNode; fill?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={fill} style={style} className={className} aria-hidden="true">
      {children}
    </svg>
  );
}
const st = { stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export const I = {
  pulse: (p: P) => <Svg {...p}><path d="M9.2 1.8 4 9h4l-1.2 5.2L12 7H8l1.2-5.2Z" {...st} /></Svg>,
  inbox: (p: P) => <Svg {...p}><path d="M2.5 9.5h3l1 1.5h3l1-1.5h3M3.6 3.5h8.8l1.6 6v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-3l1.6-6Z" {...st} /></Svg>,
  myIssues: (p: P) => <Svg {...p}><path d="M2.5 5V3.5a1 1 0 0 1 1-1H5M11 2.5h1.5a1 1 0 0 1 1 1V5M13.5 11v1.5a1 1 0 0 1-1 1H11M5 13.5H3.5a1 1 0 0 1-1-1V11" {...st} /><circle cx="8" cy="8" r="2" fill="currentColor" /></Svg>,
  initiatives: (p: P) => <Svg {...p}><circle cx="8" cy="8" r="5.8" {...st} /><path d="M5.6 11.2 8 5.2l2.4 6M6.6 9.2h2.8" {...st} /></Svg>,
  projects: (p: P) => <Svg {...p}><path d="M8 1.9 13.3 4.9v6.2L8 14.1l-5.3-3V4.9L8 1.9Z" {...st} /><path d="M2.9 5 8 8m0 0 5.1-3M8 8v6" {...st} /></Svg>,
  views: (p: P) => <Svg {...p}><path d="M8 2.3 14 5.5 8 8.7 2 5.5l6-3.2Z" {...st} /><path d="m2 8.5 6 3.2 6-3.2M2 11.2l6 3.2 6-3.2" {...st} /></Svg>,
  more: (p: P) => <Svg {...p}><circle cx="3.5" cy="8" r="1.1" fill="currentColor" /><circle cx="8" cy="8" r="1.1" fill="currentColor" /><circle cx="12.5" cy="8" r="1.1" fill="currentColor" /></Svg>,
  search: (p: P) => <Svg {...p}><circle cx="7" cy="7" r="4.3" {...st} /><path d="m10.3 10.3 3.2 3.2" {...st} /></Svg>,
  compose: (p: P) => <Svg {...p}><path d="M7.5 2.5h-4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-4" {...st} /><path d="M12.2 1.9a1.3 1.3 0 0 1 1.9 1.9L8.6 9.3l-2.5.6.6-2.5 5.5-5.5Z" {...st} /></Svg>,
  pencil: (p: P) => <Svg {...p}><path d="M7.5 2.5h-4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-4" {...st} /><path d="M12.2 1.9a1.3 1.3 0 0 1 1.9 1.9L8.6 9.3l-2.5.6.6-2.5 5.5-5.5Z" {...st} /></Svg>,
  bell: (p: P) => <Svg {...p}><path d="M4 11.5V7a4 4 0 0 1 8 0v4.5l1 1H3l1-1ZM6.5 14h3" {...st} /></Svg>,
  link: (p: P) => <Svg {...p}><path d="M6.8 9.2a2.6 2.6 0 0 0 3.7 0l2.2-2.2a2.6 2.6 0 0 0-3.7-3.7l-.8.8M9.2 6.8a2.6 2.6 0 0 0-3.7 0L3.3 9a2.6 2.6 0 0 0 3.7 3.7l.8-.8" {...st} /></Svg>,
  star: (p: P) => <Svg {...p}><path d="m8 2.2 1.8 3.6 4 .6-2.9 2.8.7 4L8 11.3l-3.6 1.9.7-4-2.9-2.8 4-.6L8 2.2Z" {...st} /></Svg>,
  starFilled: (p: P) => <Svg {...p}><path d="m8 2.2 1.8 3.6 4 .6-2.9 2.8.7 4L8 11.3l-3.6 1.9.7-4-2.9-2.8 4-.6L8 2.2Z" fill="currentColor" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" /></Svg>,
  panel: (p: P) => <Svg {...p}><rect x="2" y="2.5" width="12" height="11" rx="2.2" {...st} /><path d="M10 2.8v10.4" {...st} /></Svg>,
  panelOn: (p: P) => <Svg {...p}><rect x="2" y="2.5" width="12" height="11" rx="2.2" {...st} /><path d="M10 3h1.8a1.7 1.7 0 0 1 1.7 1.7v6.6a1.7 1.7 0 0 1-1.7 1.7H10V3Z" fill="currentColor" /></Svg>,
  chevronDown: (p: P) => <Svg {...p}><path d="m4.5 6.5 3.5 3.5 3.5-3.5" {...st} /></Svg>,
  chevronRight: (p: P) => <Svg {...p}><path d="m6.5 4.5 3.5 3.5-3.5 3.5" {...st} /></Svg>,
  caretDown: (p: P) => <Svg {...p}><path d="M4.8 6.3h6.4L8 10.2 4.8 6.3Z" fill="currentColor" /></Svg>,
  caretRight: (p: P) => <Svg {...p}><path d="M6.3 4.8v6.4L10.2 8 6.3 4.8Z" fill="currentColor" /></Svg>,
  plus: (p: P) => <Svg {...p}><path d="M8 3v10M3 8h10" {...st} /></Svg>,
  comment: (p: P) => <Svg {...p}><path d="M8 2.6c3.1 0 5.5 2.1 5.5 4.8S11.1 12.2 8 12.2c-.6 0-1.2-.1-1.8-.2l-3 1.4.7-2.5c-.9-.9-1.4-2-1.4-3.5C2.5 4.7 4.9 2.6 8 2.6Z" {...st} /></Svg>,
  emojiAdd: (p: P) => <Svg {...p}><path d="M13.4 7.2a5.5 5.5 0 1 0-4.6 6.2" {...st} /><circle cx="6" cy="6.8" r=".9" fill="currentColor" /><circle cx="9.6" cy="6.8" r=".9" fill="currentColor" /><path d="M5.6 9.4c.6.8 1.4 1.2 2.3 1.2M12.2 10.2v4M10.2 12.2h4" {...st} /></Svg>,
  calendar: (p: P) => <Svg {...p}><rect x="2.5" y="3" width="11" height="10.5" rx="2" {...st} /><path d="M2.5 6.2h11" {...st} /></Svg>,
  target: (p: P) => <Svg {...p}><rect x="2.5" y="3" width="11" height="10.5" rx="2" {...st} /><path d="M7.2 8.3 8.3 7.5v3.6" {...st} /></Svg>,
  users: (p: P) => <Svg {...p}><rect x="2.5" y="2.5" width="11" height="11" rx="2" {...st} /><circle cx="8" cy="7" r="1.6" {...st} /><path d="M5.3 11.2c.6-1.1 1.6-1.6 2.7-1.6s2.1.5 2.7 1.6" {...st} /></Svg>,
  diamond: (p: P) => <Svg {...p}><path d="M8 2.3 13.7 8 8 13.7 2.3 8 8 2.3Z" {...st} /></Svg>,
  diamondFilled: (p: P) => <Svg {...p}><path d="M8 2.3 13.7 8 8 13.7 2.3 8 8 2.3Z" fill="currentColor" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></Svg>,
  hexCheck: (p: P) => <Svg {...p}><path d="M8 1.8 13.4 4.9v6.2L8 14.2l-5.4-3.1V4.9L8 1.8Z" {...st} /><path d="m5.7 8.1 1.6 1.6 3-3.2" {...st} /></Svg>,
  close: (p: P) => <Svg {...p}><path d="m4 4 8 8M12 4l-8 8" {...st} /></Svg>,
  arrowRight: (p: P) => <Svg {...p}><path d="M3 8h10m-3.5-3.5L13 8l-3.5 3.5" {...st} /></Svg>,
  arrowUp: (p: P) => <Svg {...p}><path d="M8 13V3M4.5 6.5 8 3l3.5 3.5" {...st} /></Svg>,
  arrowDown: (p: P) => <Svg {...p}><path d="M8 3v10m3.5-3.5L8 13l-3.5-3.5" {...st} /></Svg>,
  copy: (p: P) => <Svg {...p}><rect x="5.5" y="5.5" width="8" height="8" rx="1.6" {...st} /><path d="M10.5 3.5V3a1 1 0 0 0-1-1H3.5a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1H4" {...st} /></Svg>,
  trash: (p: P) => <Svg {...p}><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.3 4.5l.6 8.2a1 1 0 0 0 1 .9h4.2a1 1 0 0 0 1-.9l.6-8.2" {...st} /></Svg>,
  markdown: (p: P) => <Svg {...p}><rect x="1.8" y="3.5" width="12.4" height="9" rx="1.6" {...st} /><path d="M4.3 10.3V5.8l1.7 2 1.7-2v4.5M10.8 5.8v4.2m-1.5-1.4 1.5 1.6 1.5-1.6" {...st} /></Svg>,
  sun: (p: P) => <Svg {...p}><circle cx="8" cy="8" r="2.8" {...st} /><path d="M8 1.5v1.3M8 13.2v1.3M1.5 8h1.3M13.2 8h1.3M3.4 3.4l.9.9M11.7 11.7l.9.9M3.4 12.6l.9-.9M11.7 4.3l.9-.9" {...st} /></Svg>,
  moon: (p: P) => <Svg {...p}><path d="M13.2 9.6A5.5 5.5 0 0 1 6.4 2.8a5.5 5.5 0 1 0 6.8 6.8Z" {...st} /></Svg>,
  menu: (p: P) => <Svg {...p}><path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" {...st} /></Svg>,
  filter: (p: P) => <Svg {...p}><path d="M2.5 4.5h11M4.5 8h7M6.5 11.5h3" {...st} /></Svg>,
  display: (p: P) => <Svg {...p}><path d="M2.5 5h6M11.5 5h2M2.5 11h2M7.5 11h6" {...st} /><circle cx="10" cy="5" r="1.5" {...st} /><circle cx="6" cy="11" r="1.5" {...st} /></Svg>,
  doc: (p: P) => <Svg {...p}><path d="M4 1.8h5l3.5 3.5v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2.8a1 1 0 0 1 1-1Z" {...st} /><path d="M9 1.8v3.5h3.5" {...st} /></Svg>,
  figma: (p: P) => <Svg {...p}><rect x="4" y="1.8" width="8" height="12.4" rx="2" {...st} /><path d="M4 6h8M4 10h4" {...st} /></Svg>,
  check: (p: P) => <Svg {...p}><path d="m3.5 8.3 2.9 2.9 6.1-6.4" {...st} /></Svg>,
  team: (p: P) => <Svg {...p}><path d="M8 2.2c1.6 1.4 3.3 2 5.3 2v3.3c0 3-2.2 5.3-5.3 6.3-3.1-1-5.3-3.3-5.3-6.3V4.2c2 0 3.7-.6 5.3-2Z" {...st} /></Svg>,
  help: (p: P) => <Svg {...p}><circle cx="8" cy="8" r="5.8" {...st} /><path d="M6.4 6.4a1.7 1.7 0 0 1 3.2.6c0 1.2-1.6 1.4-1.6 2.4" {...st} /><circle cx="8" cy="11.3" r=".75" fill="currentColor" /></Svg>,
  bold: (p: P) => <Svg {...p}><path d="M4.8 2.8h3.7a2.6 2.6 0 0 1 0 5.2H4.8V2.8Zm0 5.2h4.4a2.6 2.6 0 0 1 0 5.2H4.8V8Z" {...st} strokeWidth={1.6} /></Svg>,
  italic: (p: P) => <Svg {...p}><path d="M6.5 2.8h5M4.5 13.2h5M9.4 2.8 6.6 13.2" {...st} /></Svg>,
  strike: (p: P) => <Svg {...p}><path d="M2.5 8h11M10.8 4.6c-.4-1-1.5-1.8-2.9-1.8-1.7 0-2.9.9-2.9 2.3 0 .8.4 1.4 1.1 1.8M5 11.2c.4 1.2 1.6 2 3.1 2 1.8 0 3-1 3-2.4 0-.5-.1-.9-.4-1.2" {...st} /></Svg>,
  code: (p: P) => <Svg {...p}><path d="m5.5 4.5-3.5 3.5 3.5 3.5M10.5 4.5 14 8l-3.5 3.5" {...st} /></Svg>,
  list: (p: P) => <Svg {...p}><path d="M6.5 4.5h7M6.5 8h7M6.5 11.5h7" {...st} /><circle cx="3.2" cy="4.5" r=".9" fill="currentColor" /><circle cx="3.2" cy="8" r=".9" fill="currentColor" /><circle cx="3.2" cy="11.5" r=".9" fill="currentColor" /></Svg>,
  attach: (p: P) => <Svg {...p}><path d="m12.6 7.4-4.8 4.8a2.8 2.8 0 0 1-4-4l5-5a1.9 1.9 0 0 1 2.7 2.7l-5 5a.9.9 0 0 1-1.3-1.3l4.6-4.6" {...st} /></Svg>,
  progress: (p: P) => <Svg {...p}><path d="M2.5 13.5h11M4 11V8M7 11V4.5M10 11V6.5M13 11V9" {...st} /></Svg>,
};

// ---- Status / priority / health glyphs ----

export const STATUS_META: Record<ProjectStatus, { label: string; color: string }> = {
  backlog: { label: 'Backlog', color: 'var(--status-backlog)' },
  planned: { label: 'Planned', color: 'var(--status-planned)' },
  started: { label: 'In Progress', color: 'var(--status-started)' },
  paused: { label: 'Paused', color: 'var(--status-paused)' },
  completed: { label: 'Completed', color: 'var(--status-completed)' },
  canceled: { label: 'Canceled', color: 'var(--status-canceled)' },
};

export function StatusIcon({ status, size = 14, progress = 0.5 }: { status: ProjectStatus; size?: number; progress?: number }) {
  const c = STATUS_META[status].color;
  const s = { width: size, height: size, flex: 'none' as const };
  if (status === 'backlog')
    return <svg viewBox="0 0 14 14" style={s}><circle cx="7" cy="7" r="5.6" fill="none" stroke={c} strokeWidth="1.5" strokeDasharray="1.6 1.9" /></svg>;
  if (status === 'planned')
    return <svg viewBox="0 0 14 14" style={s}><circle cx="7" cy="7" r="5.6" fill="none" stroke={c} strokeWidth="1.5" /></svg>;
  if (status === 'completed')
    return <svg viewBox="0 0 14 14" style={s}><circle cx="7" cy="7" r="6.3" fill={c} /><path d="m4.3 7.2 1.9 1.9 3.6-3.8" fill="none" stroke="var(--bg-panel)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (status === 'canceled')
    return <svg viewBox="0 0 14 14" style={s}><circle cx="7" cy="7" r="6.3" fill={c} /><path d="m5 5 4 4M9 5 5 9" stroke="var(--bg-panel)" strokeWidth="1.5" strokeLinecap="round" /></svg>;
  if (status === 'paused')
    return <svg viewBox="0 0 14 14" style={s}><circle cx="7" cy="7" r="5.6" fill="none" stroke={c} strokeWidth="1.5" /><path d="M5.7 5v4M8.3 5v4" stroke={c} strokeWidth="1.5" strokeLinecap="round" /></svg>;
  // started: ring + pie wedge proportional to progress
  const p = Math.min(0.999, Math.max(0.08, progress));
  const a = p * 2 * Math.PI;
  const x = 7 + 3.3 * Math.sin(a);
  const y = 7 - 3.3 * Math.cos(a);
  return (
    <svg viewBox="0 0 14 14" style={s}>
      <circle cx="7" cy="7" r="5.6" fill="none" stroke={c} strokeWidth="1.5" />
      <path d={`M7 7V3.7A3.3 3.3 0 ${p > 0.5 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)}Z`} fill={c} />
    </svg>
  );
}

export const PRIORITY_META: Record<Priority, string> = { 0: 'No priority', 1: 'Urgent', 2: 'High', 3: 'Medium', 4: 'Low' };

export function PriorityIcon({ priority, size = 14 }: { priority: Priority; size?: number }) {
  const s = { width: size, height: size, flex: 'none' as const };
  if (priority === 0)
    return <svg viewBox="0 0 14 14" style={s}><path d="M2.5 7h1.6M6.2 7h1.6M9.9 7h1.6" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" /></svg>;
  if (priority === 1)
    return <svg viewBox="0 0 14 14" style={s}><rect x="1" y="1" width="12" height="12" rx="3" fill="var(--priority-urgent)" /><path d="M7 3.8v4" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" /><circle cx="7" cy="10.1" r="1" fill="#fff" /></svg>;
  const filled = priority === 2 ? 3 : priority === 3 ? 2 : 1;
  return (
    <svg viewBox="0 0 14 14" style={s}>
      {[0, 1, 2].map((i) => (
        <rect key={i} x={1.5 + i * 4} y={8 - i * 3} width="3" height={4.5 + i * 3} rx="1" fill={i < filled ? 'var(--text-secondary)' : 'var(--text-quaternary)'} opacity={i < filled ? 1 : 0.5} />
      ))}
    </svg>
  );
}

export const HEALTH_META: Record<Health, { label: string; color: string; bg: string }> = {
  onTrack: { label: 'On track', color: 'var(--health-on)', bg: 'var(--health-on-bg)' },
  atRisk: { label: 'At risk', color: 'var(--health-risk)', bg: 'var(--health-risk-bg)' },
  offTrack: { label: 'Off track', color: 'var(--health-off)', bg: 'var(--health-off-bg)' },
};

const HEALTH_PATH: Record<Health, string> = {
  onTrack: 'M4 9.6 6.2 7.2 8.2 9.1 12 5.4',
  atRisk: 'M4.6 8.1 6.9 10.5 8.6 6.6 11.6 5.4',
  offTrack: 'M4 6.6 6.2 9.6 8.2 7.4 12 10.6',
};

export function HealthIcon({ health, size = 16 }: { health: Health; size?: number }) {
  const m = HEALTH_META[health];
  return (
    <svg viewBox="0 0 16 16" style={{ width: size, height: size, flex: 'none' }} aria-hidden="true">
      <circle cx="8" cy="8" r="8" fill={m.bg} />
      <path d={HEALTH_PATH[health]} fill="none" stroke={m.color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function NoHealthIcon({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" style={{ width: size, height: size, flex: 'none' }} aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="none" stroke="var(--text-quaternary)" strokeWidth="1.2" strokeDasharray="2 2" />
    </svg>
  );
}

// Project / initiative glyphs (generic shapes, drawn for this replica)
export function Glyph({ name, color, size = 16 }: { name: string; color: string; size?: number }) {
  const s = { width: size, height: size, flex: 'none' as const, color };
  const g = { stroke: 'currentColor', strokeWidth: 1.4, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const shapes: Record<string, ReactNode> = {
    cart: <><path d="M1.8 2.5h2l1.6 7.3h7l1.4-5H4.4" {...g} /><circle cx="6.2" cy="12.6" r="1.1" fill="currentColor" /><circle cx="11.6" cy="12.6" r="1.1" fill="currentColor" /></>,
    clipboard: <><rect x="3" y="2.8" width="10" height="11.2" rx="1.8" {...g} /><path d="M6 2.8V2h4v.8M5.8 7h4.4M5.8 9.8h3" {...g} /></>,
    pen: <><path d="M10.6 2.4 13.6 5.4 6 13H3v-3l7.6-7.6Z" {...g} /><path d="m9 4 3 3" {...g} /></>,
    globe: <><circle cx="8" cy="8" r="5.8" {...g} /><path d="M2.3 8h11.4M8 2.2c1.6 1.6 2.4 3.6 2.4 5.8S9.6 12.2 8 13.8C6.4 12.2 5.6 10.2 5.6 8S6.4 3.8 8 2.2Z" {...g} /></>,
    book: <><path d="M2.5 3.5c1.9-.6 3.8-.4 5.5.8v9c-1.7-1.2-3.6-1.4-5.5-.8v-9ZM13.5 3.5c-1.9-.6-3.8-.4-5.5.8v9c1.7-1.2 3.6-1.4 5.5-.8v-9Z" {...g} /></>,
    cup: <><path d="M3 5.5h8v4a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-4ZM11 6.5h1a1.5 1.5 0 0 1 0 3h-1M5.5 2.5v1.2M8.5 2.5v1.2" {...g} /></>,
    cross: <><rect x="2.3" y="2.3" width="11.4" height="11.4" rx="3" {...g} /><path d="M8 5v6M5 8h6" {...g} /></>,
    bolt: <><path d="M9.2 1.8 4 9h4l-1.2 5.2L12 7H8l1.2-5.2Z" {...g} /></>,
  };
  return <svg viewBox="0 0 16 16" style={s} aria-hidden="true">{shapes[name] ?? shapes.globe}</svg>;
}
