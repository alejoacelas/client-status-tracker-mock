// Hand-drawn stroke icons approximating the original's 16px icon set.
import type { CSSProperties, ReactNode } from 'react';

type P = { size?: number; className?: string; style?: CSSProperties; title?: string };

const S = ({ size = 16, className, style, children, fill = 'none', title }: P & { children: ReactNode; fill?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={fill}
    stroke="currentColor"
    strokeWidth={1.25}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={'icon ' + (className ?? '')}
    style={style}
    aria-hidden={title ? undefined : true}
    role={title ? 'img' : undefined}
  >
    {title && <title>{title}</title>}
    {children}
  </svg>
);

export const IconMenu = (p: P) => (<S {...p}><path d="M2 4h12M2 8h12M2 12h12" /></S>);
export const IconPlus = (p: P) => (<S {...p}><path d="M8 2.5v11M2.5 8h11" /></S>);
export const IconSearch = (p: P) => (<S {...p}><circle cx="7" cy="7" r="4.5" /><path d="m10.4 10.4 3.3 3.3" /></S>);
export const IconHome = (p: P) => (<S {...p}><path d="M2.5 7.2 8 2.5l5.5 4.7V13a.5.5 0 0 1-.5.5H9.6V10H6.4v3.5H3a.5.5 0 0 1-.5-.5Z" /></S>);
export const IconCheckCircle = (p: P) => (<S {...p}><circle cx="8" cy="8" r="6" /><path d="m5.5 8.2 1.7 1.7 3.4-3.6" /></S>);
export const IconBell = (p: P) => (<S {...p}><path d="M4 11.5V7.2a4 4 0 0 1 8 0v4.3l1 1H3Z" /><path d="M6.6 13.8a1.5 1.5 0 0 0 2.8 0" /></S>);
export const IconReporting = (p: P) => (<S {...p}><path d="M2 12.5 6 8l3 2.5 5-6" /><circle cx="6" cy="8" r=".6" fill="currentColor" /><circle cx="9" cy="10.5" r=".6" fill="currentColor" /></S>);
export const IconFolder = (p: P) => (<S {...p}><path d="M1.8 4a1 1 0 0 1 1-1h3.4l1.5 1.6h5.5a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1H2.8a1 1 0 0 1-1-1Z" /></S>);
export const IconGoal = (p: P) => (<S {...p}><circle cx="8" cy="5.4" r="2.6" /><path d="M3 13.5c.7-2.5 2.6-3.8 5-3.8s4.3 1.3 5 3.8" /></S>);
export const IconPerson = IconGoal;
export const IconPeople = (p: P) => (<S {...p}><circle cx="6" cy="5.5" r="2.3" /><path d="M1.8 13c.5-2.2 2.1-3.4 4.2-3.4s3.7 1.2 4.2 3.4" /><path d="M10.4 3.4a2.3 2.3 0 0 1 0 4.3M11.6 9.8c1.4.4 2.3 1.5 2.6 3.2" /></S>);
export const IconChevronDown = (p: P) => (<S {...p}><path d="m4 6 4 4 4-4" /></S>);
export const IconChevronRight = (p: P) => (<S {...p}><path d="m6 4 4 4-4 4" /></S>);
export const IconChevronLeft = (p: P) => (<S {...p}><path d="m10 4-4 4 4 4" /></S>);
export const IconTriangleDown = (p: P) => (<S {...p} fill="currentColor"><path d="M4 6h8l-4 5Z" stroke="none" /></S>);
export const IconTriangleRight = (p: P) => (<S {...p} fill="currentColor"><path d="M6 4v8l5-4Z" stroke="none" /></S>);
export const IconStar = ({ filled, ...p }: P & { filled?: boolean }) => (
  <S {...p} fill={filled ? 'currentColor' : 'none'}><path d="m8 1.9 1.8 3.8 4.1.5-3 2.9.8 4.1L8 11.2l-3.7 2 .8-4.1-3-2.9 4.1-.5Z" /></S>
);
export const IconFilter = (p: P) => (<S {...p}><path d="M2.5 4.5h11M4.5 8h7M6.5 11.5h3" /></S>);
export const IconSort = (p: P) => (<S {...p}><path d="M5 13V3M2.8 5.2 5 3l2.2 2.2M11 3v10M8.8 10.8 11 13l2.2-2.2" /></S>);
export const IconSortAsc = (p: P) => (<S {...p}><path d="M5 13V3M2.8 5.2 5 3l2.2 2.2M9 5h4.5M9 8.5h3.2M9 12h2" /></S>);
export const IconSortDesc = (p: P) => (<S {...p}><path d="M5 3v10M2.8 10.8 5 13l2.2-2.2M9 5h2M9 8.5h3.2M9 12h4.5" /></S>);
export const IconGroup = (p: P) => (<S {...p}><rect x="2" y="2.5" width="12" height="11" rx="1" /><path d="M2 6.5h12M5.5 6.5v7" /></S>);
export const IconMore = (p: P) => (<S {...p} fill="currentColor"><circle cx="3" cy="8" r="1.15" stroke="none" /><circle cx="8" cy="8" r="1.15" stroke="none" /><circle cx="13" cy="8" r="1.15" stroke="none" /></S>);
export const IconClose = (p: P) => (<S {...p}><path d="m3.5 3.5 9 9M12.5 3.5l-9 9" /></S>);
export const IconDrag = (p: P) => (
  <S {...p} fill="currentColor">
    {[4, 8, 12].map((y) => (<g key={y}><circle cx="6" cy={y} r="1" stroke="none" /><circle cx="10" cy={y} r="1" stroke="none" /></g>))}
  </S>
);
export const IconCalendar = (p: P) => (<S {...p}><rect x="2" y="3" width="12" height="10.5" rx="1.5" /><path d="M2 6.5h12M5 1.8v2.4M11 1.8v2.4" /></S>);
export const IconLink = (p: P) => (<S {...p}><path d="M6.8 9.2a2.6 2.6 0 0 0 3.7 0l2.3-2.3a2.6 2.6 0 0 0-3.7-3.7l-.9.9" /><path d="M9.2 6.8a2.6 2.6 0 0 0-3.7 0L3.2 9.1a2.6 2.6 0 0 0 3.7 3.7l.9-.9" /></S>);
export const IconThumb = ({ filled, ...p }: P & { filled?: boolean }) => (
  <S {...p} fill={filled ? 'currentColor' : 'none'}><path d="M5 7.2 7.6 2.5c.9 0 1.6.8 1.4 1.7L8.6 6.3h4a1.2 1.2 0 0 1 1.2 1.4l-.9 4.8a1.2 1.2 0 0 1-1.2 1H5Z" /><path d="M2.2 7.2H5v6.3H2.2Z" /></S>
);
export const IconLock = (p: P) => (<S {...p}><rect x="3" y="7" width="10" height="7" rx="1.2" /><path d="M5.3 7V5a2.7 2.7 0 0 1 5.4 0v2" /></S>);
export const IconLockFilled = (p: P) => (<S {...p} fill="currentColor"><rect x="3" y="7" width="10" height="7" rx="1.2" /><path d="M5.3 7V5a2.7 2.7 0 0 1 5.4 0v2" fill="none" /></S>);
export const IconPaperclip = (p: P) => (<S {...p}><path d="m12.6 7.4-4.9 4.9a2.8 2.8 0 0 1-4-4l5.2-5.1a1.9 1.9 0 0 1 2.6 2.6L6.4 10.9a.9.9 0 0 1-1.3-1.3l4.5-4.5" /></S>);
export const IconCheck = (p: P) => (<S {...p}><path d="m3 8.4 3.2 3.1L13 4.7" /></S>);
export const IconDiamond = ({ filled, ...p }: P & { filled?: boolean }) => (
  <S {...p} fill={filled ? 'currentColor' : 'none'}><path d="M8 1.8 14.2 8 8 14.2 1.8 8Z" /></S>
);
export const IconComment = (p: P) => (<S {...p}><path d="M2.5 3.5h11v7.5H7l-3 2.5V11H2.5Z" /></S>);
export const IconOpen = (p: P) => (<S {...p}><path d="M9.5 2.5h4v4M13.3 2.7 7.5 8.5" /><path d="M12 9.5v3a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3" /></S>);
export const IconPencil = (p: P) => (<S {...p}><path d="M10.6 2.6 13.4 5.4 5.6 13.2 2.4 13.6l.4-3.2Z" /></S>);
export const IconTrash = (p: P) => (<S {...p}><path d="M2.5 4.2h11M6 4V2.6h4V4M4 4.2l.7 9.3h6.6l.7-9.3" /></S>);
export const IconArchive = (p: P) => (<S {...p}><rect x="2" y="2.5" width="12" height="3" rx=".6" /><path d="M3 5.5v7.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V5.5M6.3 8.5h3.4" /></S>);
export const IconEyeOff = (p: P) => (<S {...p}><path d="M2 8s2.2-4 6-4 6 4 6 4-2.2 4-6 4-6-4-6-4Z" /><path d="M2.5 13.5 13.5 2.5" /></S>);
export const IconList = (p: P) => (<S {...p}><path d="M5.5 4h8M5.5 8h8M5.5 12h8" /><circle cx="2.7" cy="4" r=".5" fill="currentColor" /><circle cx="2.7" cy="8" r=".5" fill="currentColor" /><circle cx="2.7" cy="12" r=".5" fill="currentColor" /></S>);
export const IconTimeline = (p: P) => (<S {...p}><path d="M2.5 2v12M2.5 4.5h6M5 8h8M2.5 11.5h6" /></S>);
export const IconDashboard = (p: P) => (<S {...p}><path d="M2.5 13.5h11M4.5 11V8M8 11V4.5M11.5 11V6.5" /></S>);
export const IconProgress = (p: P) => (<S {...p}><path d="M3 6.2v3.6h2L10.5 13V3L5 6.2Z" /><path d="M5.3 9.8 6.3 13.5" /></S>);
export const IconWorkload = (p: P) => (<S {...p}><circle cx="8" cy="8" r="5.8" /><path d="M8 8 11 5.2" /><circle cx="8" cy="8" r=".6" fill="currentColor" /></S>);
export const IconMessage = (p: P) => (<S {...p}><path d="M13.5 7.6c0 3-2.5 5.2-5.5 5.2-.9 0-1.7-.2-2.4-.5L2.5 13.2l.9-2.6A5 5 0 0 1 2.5 7.6c0-3 2.5-5.1 5.5-5.1s5.5 2.2 5.5 5.1Z" /></S>);
export const IconText = (p: P) => (<S {...p}><path d="M3.2 13.2 8 2.8l4.8 10.4M5 9.4h6" /></S>);
export const IconNumber = (p: P) => (<S {...p}><path d="M6 2.5 4.8 13.5M11.2 2.5 10 13.5M2.5 6h11M2.5 10h11" /></S>);
export const IconSingleSelect = (p: P) => (<S {...p}><circle cx="8" cy="8" r="6" /><path d="m5.6 7.2 2.4 2.4 2.4-2.4" /></S>);
export const IconMultiSelect = (p: P) => (<S {...p}><rect x="2.2" y="2.2" width="11.6" height="11.6" rx="2" /><path d="m5 8.1 2.1 2.1L11 6" /></S>);
export const IconFormula = (p: P) => (<S {...p}><path d="M10.5 2.6c-1.6-.4-2.6.3-2.9 1.9L6.2 12c-.3 1.5-1.2 2-2.7 1.6M4.6 6.3h5.2M9.8 9l3.4 3.7M13.2 9l-3.4 3.7" /></S>);
export const IconClock = (p: P) => (<S {...p}><circle cx="8" cy="8" r="6" /><path d="M8 4.6V8l2.3 1.6" /></S>);
export const IconCollapseRight = (p: P) => (<S {...p}><path d="M2.5 8h8.5M7.8 4.7 11 8l-3.2 3.3M13.5 3v10" /></S>);
export const IconHelp = (p: P) => (<S {...p}><circle cx="8" cy="8" r="6" /><path d="M6.2 6.3a1.9 1.9 0 0 1 3.7.5c0 1.3-1.9 1.6-1.9 2.8" /><circle cx="8" cy="11.5" r=".5" fill="currentColor" /></S>);
export const IconFlag = (p: P) => (<S {...p}><path d="M3.5 14V2.5h8.2l-1.6 3 1.6 3H3.5" /></S>);
export const IconColumns = (p: P) => (<S {...p}><rect x="2" y="2.5" width="12" height="11" rx="1" /><path d="M6 2.5v11M10 2.5v11" /></S>);
export const IconSparkle = (p: P) => (<S {...p}><path d="M8 2.2c.5 2.8 1.2 3.5 4 4-2.8.5-3.5 1.2-4 4-.5-2.8-1.2-3.5-4-4 2.8-.5 3.5-1.2 4-4ZM12.5 10.4c.2 1.1.5 1.4 1.6 1.6-1.1.2-1.4.5-1.6 1.6-.2-1.1-.5-1.4-1.6-1.6 1.1-.2 1.4-.5 1.6-1.6Z" /></S>);
export const IconGlobe = IconPeople;
export const IconArrowUp = (p: P) => (<S {...p}><path d="M8 13V3M4.5 6.5 8 3l3.5 3.5" /></S>);
export const IconArrowDown = (p: P) => (<S {...p}><path d="M8 3v10M4.5 9.5 8 13l3.5-3.5" /></S>);
export const IconArrowLeft = (p: P) => (<S {...p}><path d="M13 8H3M6.5 4.5 3 8l3.5 3.5" /></S>);
export const IconArrowRight = (p: P) => (<S {...p}><path d="M3 8h10M9.5 4.5 13 8l-3.5 3.5" /></S>);
export const IconZoom = (p: P) => (<S {...p}><circle cx="7" cy="7" r="4.5" /><path d="m10.4 10.4 3.3 3.3M5 7h4M7 5v4" /></S>);
export const IconOptions = (p: P) => (<S {...p}><path d="M2 5h7M12 5h2M2 11h2M7 11h7" /><circle cx="10.5" cy="5" r="1.5" /><circle cx="5.5" cy="11" r="1.5" /></S>);
export const IconInvite = (p: P) => (<S {...p}><circle cx="6.5" cy="5.5" r="2.5" /><path d="M2 13.3c.5-2.3 2.2-3.6 4.5-3.6 1 0 1.9.2 2.6.7M12 9.5v4M10 11.5h4" /></S>);
export const IconSidebarCollapse = (p: P) => (<S {...p}><rect x="2" y="2.5" width="12" height="11" rx="1.5" /><path d="M6 2.5v11" /></S>);
export const IconBriefcase = (p: P) => (<S {...p}><rect x="2" y="4.5" width="12" height="9" rx="1.2" /><path d="M5.8 4.5V3a.8.8 0 0 1 .8-.8h2.8a.8.8 0 0 1 .8.8v1.5M2 8.5h12" /></S>);

/** The four-square "Customize" glyph. */
export const IconCustomize = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden className="icon">
    <rect x="1" y="1" width="5.2" height="5.2" rx="1" fill="#f06a6a" />
    <rect x="7.8" y="1" width="5.2" height="5.2" rx="1" fill="#f1bd6c" />
    <rect x="1" y="7.8" width="5.2" height="5.2" rx="1" fill="#5da283" />
    <rect x="7.8" y="7.8" width="5.2" height="5.2" rx="1" fill="#4573d2" opacity=".0" stroke="#4573d2" strokeWidth="1.3" />
  </svg>
);
