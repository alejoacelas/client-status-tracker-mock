// Simple line icons drawn for this replica.
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export const ChevronDown = (p: P) => (
  <svg {...base} {...p}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);
export const ChevronLeft = (p: P) => (
  <svg {...base} {...p}>
    <path d="m15 6-6 6 6 6" />
  </svg>
);
export const ChevronRight = (p: P) => (
  <svg {...base} {...p}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);
export const Plus = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const Dots = (p: P) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" {...p}>
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
  </svg>
);
export const Bell = (p: P) => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 3a6 6 0 0 0-6 6v3.6L4.3 15.5A1 1 0 0 0 5.2 17h13.6a1 1 0 0 0 .9-1.5L18 12.6V9a6 6 0 0 0-6-6Zm-2.5 15.5a2.5 2.5 0 0 0 5 0Z" />
  </svg>
);
export const People = (p: P) => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor" {...p}>
    <circle cx="9" cy="8" r="3.6" />
    <path d="M2 19.5c0-3.6 3.1-6 7-6s7 2.4 7 6v.5H2Z" />
    <circle cx="16.8" cy="8.6" r="2.9" />
    <path d="M17.6 13.6c2.7.3 4.9 2.3 4.9 5.4v1h-5v-.5c0-2.4-.8-4.4-2.3-5.6.7-.2 1.5-.3 2.4-.3Z" />
  </svg>
);
export const Calendar = (p: P) => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M3.5 10h17" />
    <rect x="7" y="13" width="3" height="3" fill="currentColor" stroke="none" />
  </svg>
);
export const Bookmark = (p: P) => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" {...p}>
    <path d="M7 3.5h10v17l-5-4-5 4Z" />
  </svg>
);
export const Note = (p: P) => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...p}>
    <path d="M6 3h8l4 4v14H6Z" />
    <path d="M9 11h6M9 14.5h6M9 18h4" />
  </svg>
);
export const Activity = (p: P) => (
  <svg {...base} {...p}>
    <path d="m3 17 6-6 4 4 8-8" />
  </svg>
);
export const Pie = (p: P) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3v9l6.4 6.4A9 9 0 0 0 12 3Z" fill="currentColor" />
  </svg>
);
export const Globe = (p: P) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3.5 9h17M3.5 15h17M12 3c2.5 2.6 3.6 5.6 3.6 9s-1.1 6.4-3.6 9c-2.5-2.6-3.6-5.6-3.6-9S9.5 5.6 12 3Z" />
  </svg>
);
export const Check = (p: P) => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
export const Close = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const Star = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <defs>
      <linearGradient id="star-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="rgb(255 232 139)" />
        <stop offset="0.5" stopColor="rgb(249 212 94)" />
        <stop offset="0.54" stopColor="rgb(250 185 106)" />
        <stop offset="1" stopColor="rgb(245 142 2)" />
      </linearGradient>
    </defs>
    <path
      transform="translate(1.8 1.8) scale(0.85)"
      d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.45 4.73L5.82 21 12 17.27Z"
      fill="url(#star-g)"
      stroke="url(#star-g)"
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
  </svg>
);

/** Folder glyph tinted per item */
export const Folder = ({ color }: { color: string }) => (
  <svg width={32} height={28} viewBox="0 0 32 28" aria-hidden="true">
    <path d="M2 5a3 3 0 0 1 3-3h7l3 3h12a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3Z" fill={color} />
    <path d="M2 9h28v14a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3Z" fill={color} style={{ filter: 'brightness(1.08)' }} />
  </svg>
);

/** Document glyph: a page with a coloured badge */
export const FileGlyph = ({ kind }: { kind: 'doc' | 'sheet' | 'file' }) => {
  const color = kind === 'sheet' ? 'rgb(52 168 83)' : kind === 'doc' ? 'rgb(66 133 244)' : 'rgb(154 159 162)';
  return (
    <svg width={32} height={36} viewBox="0 0 32 36" aria-hidden="true">
      <path d="M5 1h16l8 8v24a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2Z" fill={kind === 'file' ? 'rgb(240 242 243)' : color} />
      <path d="M21 1v6a2 2 0 0 0 2 2h6" fill="rgb(255 255 255 / 0.35)" />
      {kind === 'sheet' && <path d="M9 17h14v10H9Zm0 5h14M16 17v10" stroke="#fff" strokeWidth="2" fill="none" />}
      {kind === 'doc' && <path d="M9 17h14M9 21h14M9 25h9" stroke="#fff" strokeWidth="2" />}
      {kind === 'file' && <path d="M9 17h14M9 21h14M9 25h9" stroke="rgb(154 159 162)" strokeWidth="2" />}
    </svg>
  );
};
