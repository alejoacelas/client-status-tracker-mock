/* Small custom glyphs for shapes the icon library doesn't cover. Drawn from scratch. */
type P = { size?: number; className?: string };

/** Three linked circles: marks a portfolio-level objective. */
export const ObjectiveIcon = ({ size = 16, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" className={className} aria-hidden>
    <circle cx="8" cy="4.5" r="2.6" />
    <circle cx="4.4" cy="10.8" r="2.6" />
    <circle cx="11.6" cy="10.8" r="2.6" />
  </svg>
);

/** Column glyph used next to the roadmap position picker. */
export const ColumnsIcon = ({ size = 16, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className={className} aria-hidden>
    <rect x="1.5" y="3" width="3" height="8" rx="0.8" />
    <rect x="6.5" y="3" width="3" height="10" rx="0.8" />
    <rect x="11.5" y="3" width="3" height="6" rx="0.8" />
  </svg>
);

/** Initiative glyph: two filled bars and one short. */
export const InitiativeIcon = ({ size = 16, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden>
    <rect x="1.5" y="2" width="3" height="12" rx="0.6" />
    <rect x="6.5" y="2" width="3" height="12" rx="0.6" />
    <rect x="11.5" y="2" width="3" height="7" rx="0.6" />
  </svg>
);

/** Donut showing released ideas out of all linked ideas. */
export const ProgressDonut = ({ done, total, size = 22 }: { done: number; total: number; size?: number }) => {
  const r = 8;
  const c = 2 * Math.PI * r;
  const frac = total ? done / total : 0;
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden>
      <circle cx="11" cy="11" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
      {frac > 0 && (
        <circle cx="11" cy="11" r={r} fill="none" stroke="#22c55e" strokeWidth="4" strokeDasharray={`${c * frac} ${c}`} transform="rotate(-90 11 11)" />
      )}
    </svg>
  );
};

export const CalendarGlyph = ({ size = 14 }: P) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
    <rect x="2" y="3" width="12" height="11" rx="1.5" />
    <path d="M2 6.5h12M5 1.5v3M11 1.5v3M5 9h3M5 11.5h5" />
  </svg>
);
