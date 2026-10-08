// Simple icons drawn for this replica.

const CAR_BODY =
  'M45 60 L75 18 Q78 14 84 14 L172 14 Q178 14 181 18 L210 60 L232 62 Q246 64 246 80 L246 112 Q246 118 240 118 L222 118 A 30 30 0 0 0 166 118 L92 118 A 30 30 0 0 0 36 118 L16 118 Q10 118 10 112 L10 78 Q10 62 26 61 Z M86 26 L64 58 L122 58 L122 26 Z M134 26 L134 58 L194 58 L172 26 Z';

export function CarIcon({ fill = 'currentColor', asGroup = false }: { fill?: string; asGroup?: boolean }) {
  const shapes = (
    <g fill={fill}>
      <path d={CAR_BODY} fillRule="evenodd" />
      <circle cx="64" cy="124" r="22" />
      <circle cx="194" cy="124" r="22" />
    </g>
  );
  if (asGroup) return shapes;
  return (
    <svg viewBox="0 0 256 150" className="icon-car" aria-hidden="true">
      {shapes}
    </svg>
  );
}

export function PinIcon() {
  return (
    <svg viewBox="0 0 40 56" className="icon-pin" aria-hidden="true">
      <path d="M20 0C9 0 0 9 0 20c0 14 20 36 20 36s20-22 20-36C40 9 31 0 20 0z" fill="#e31837" />
      <circle cx="20" cy="20" r="7.5" fill="#fff" />
    </svg>
  );
}

export function ExpandIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M1 1h7v2H4.4l4 4L7 8.4l-4-4V8H1V1zm18 0v7h-2V4.4l-4 4L11.6 7l4-4H12V1h7zM1 19v-7h2v3.6l4-4 1.4 1.4-4 4H8v2H1zm18 0h-7v-2h3.6l-4-4 1.4-1.4 4 4V12h2v7z"
      />
    </svg>
  );
}

export function MenuIcon() {
  return (
    <svg viewBox="0 0 24 20" width="24" height="20" aria-hidden="true">
      <rect y="1" width="24" height="3" rx="1" fill="currentColor" />
      <rect y="8.5" width="24" height="3" rx="1" fill="currentColor" />
      <rect y="16" width="24" height="3" rx="1" fill="currentColor" />
    </svg>
  );
}

export function MessageIcon() {
  return (
    <svg viewBox="0 0 64 60" className="icon-message" aria-hidden="true">
      <rect x="22" y="14" width="24" height="44" rx="4" fill="none" stroke="currentColor" strokeWidth="3" />
      <line x1="30" y1="52" x2="38" y2="52" stroke="currentColor" strokeWidth="3" />
      <path d="M3 3h38a2 2 0 012 2v20a2 2 0 01-2 2H18l-8 8v-8H3a2 2 0 01-2-2V5a2 2 0 012-2z" fill="#fff" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <line x1="9" y1="11" x2="35" y2="11" stroke="currentColor" strokeWidth="3" />
      <line x1="9" y1="18" x2="28" y2="18" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}

export function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <path
        d="M12 1.8l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 17.9l-6.4 3.5L7 14.3l-5.3-5 7.2-.9z"
        fill={filled ? '#e31837' : '#c9c9c9'}
      />
    </svg>
  );
}

export function CartIcon() {
  return (
    <svg viewBox="0 0 30 26" width="30" height="26" aria-hidden="true">
      <path d="M1 2h5l4 15h15l3-11H8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx="12" cy="22" r="2.2" fill="currentColor" />
      <circle cx="23" cy="22" r="2.2" fill="currentColor" />
    </svg>
  );
}
