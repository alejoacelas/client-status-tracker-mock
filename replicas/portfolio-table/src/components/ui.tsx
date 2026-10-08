import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Person, StatusKey } from '../data/mock';
import { STATUS } from '../lib/status';
import { IconCheck, IconClose } from './Icons';

/* ---------------- Avatar ---------------- */

export function Avatar({ person, size = 24, title }: { person?: Person | null; size?: number; title?: boolean }) {
  if (!person) {
    return (
      <span className="avatar avatar-empty" style={{ width: size, height: size }} aria-label="Unassigned">
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
          <circle cx="8" cy="5.4" r="2.6" />
          <path d="M3 13.5c.7-2.5 2.6-3.8 5-3.8s4.3 1.3 5 3.8" />
        </svg>
      </span>
    );
  }
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, background: person.color, fontSize: Math.max(8, Math.round(size * 0.42)) }}
      title={title === false ? undefined : person.name}
    >
      {person.initials}
    </span>
  );
}

export function AvatarStack({ people, max = 4, size = 24 }: { people: Person[]; max?: number; size?: number }) {
  const shown = people.slice(0, max);
  return (
    <span className="avatar-stack">
      {shown.map((p) => (
        <Avatar key={p.id} person={p} size={size} />
      ))}
      {people.length > max && <span className="avatar avatar-count" style={{ width: size, height: size }}>{people.length - max}</span>}
    </span>
  );
}

/* ---------------- Status chip ---------------- */

export function StatusChip({ status, size = 'md', noRecent }: { status: StatusKey | null; size?: 'sm' | 'md' | 'lg'; noRecent?: boolean }) {
  if (!status) {
    return (
      <span className={`status-chip status-none size-${size}`}>
        <span className="status-ring" />
        {noRecent ? 'No recent updates' : 'No status'}
      </span>
    );
  }
  const m = STATUS[status];
  return (
    <span className={`status-chip size-${size} status-${status}`} style={{ background: m.bg, color: m.text }}>
      {status === 'complete' ? <IconCheck size={12} /> : <span className="status-dot" style={{ background: m.dot }} />}
      {m.label}
    </span>
  );
}

/* ---------------- Pill (custom field option) ---------------- */

const DARK_OPTION = new Set(['#4573d2', '#8d84e8', '#b36bd4', '#6d6e6f']);
export function Pill({ name, color }: { name: string; color: string }) {
  return (
    <span className="pill" style={{ background: color, color: DARK_OPTION.has(color) ? '#fff' : '#1e1f21' }} title={name}>
      {name}
    </span>
  );
}

/* ---------------- Progress bar ---------------- */

export function ProgressBar({ value, width = 64 }: { value: number; width?: number }) {
  return (
    <span className="progress">
      <span className="progress-track" style={{ width }}>
        <span className="progress-fill" style={{ width: `${Math.max(value > 0 ? 6 : 0, Math.min(100, value))}%` }} />
      </span>
      <span className="progress-label">{value}%</span>
    </span>
  );
}

/* ---------------- Item icons ---------------- */

export function ProjectIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <span className="project-icon" style={{ width: size, height: size, background: color, borderRadius: Math.round(size * 0.27) }}>
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round">
        <path d="M6 4.5h7M6 8h7M6 11.5h7" />
        <circle cx="3" cy="4.5" r=".6" fill="#fff" />
        <circle cx="3" cy="8" r=".6" fill="#fff" />
        <circle cx="3" cy="11.5" r=".6" fill="#fff" />
      </svg>
    </span>
  );
}

export function FolderIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size * 0.86} viewBox="0 0 28 24" className="folder-icon" aria-hidden>
      <path d="M2 4.5A2.5 2.5 0 0 1 4.5 2h6.3c.7 0 1.3.3 1.8.8L14.4 5H23.5A2.5 2.5 0 0 1 26 7.5V9H2Z" fill={color} opacity=".55" />
      <rect x="2" y="7" width="24" height="15" rx="2.5" fill={color} />
    </svg>
  );
}

/* ---------------- Toggle ---------------- */

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={`toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)}>
      <span className="toggle-knob">{on && <IconCheck size={8} />}</span>
    </button>
  );
}

/* ---------------- Popover ---------------- */

export type Anchor = HTMLElement | DOMRect | null;

export function Popover({
  anchor,
  onClose,
  children,
  align = 'left',
  placement = 'bottom',
  offset = 4,
  className = '',
  style,
  matchWidth,
}: {
  anchor: Anchor;
  onClose: () => void;
  children: ReactNode;
  align?: 'left' | 'right';
  placement?: 'bottom' | 'top';
  offset?: number;
  className?: string;
  style?: CSSProperties;
  matchWidth?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; minWidth?: number } | null>(null);

  useLayoutEffect(() => {
    if (!anchor) return;
    const r = anchor instanceof HTMLElement ? anchor.getBoundingClientRect() : anchor;
    const el = ref.current;
    const w = el?.offsetWidth ?? 220;
    const h = el?.offsetHeight ?? 200;
    let left = align === 'right' ? r.right - w : r.left;
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    let top = placement === 'top' ? r.top - h - offset : r.bottom + offset;
    if (top + h > window.innerHeight - 8 && r.top - h - offset > 8) top = r.top - h - offset;
    top = Math.max(8, Math.min(top, window.innerHeight - h - 8));
    setPos({ top, left, minWidth: matchWidth ? r.width : undefined });
  }, [anchor, align, placement, offset, matchWidth]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t)) return;
      if (anchor instanceof HTMLElement && anchor.contains(t)) return;
      // Clicks inside nested popovers (rendered later in body) are allowed.
      const pops = Array.from(document.querySelectorAll('.popover'));
      const mine = ref.current ? pops.indexOf(ref.current) : -1;
      if (pops.slice(mine + 1).some((p) => p.contains(t))) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const t = setTimeout(() => document.addEventListener('mousedown', onDown), 0);
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [anchor, onClose]);

  if (!anchor) return null;
  return createPortal(
    <div
      ref={ref}
      className={`popover ${className}`}
      style={{ position: 'fixed', top: pos?.top ?? -9999, left: pos?.left ?? -9999, minWidth: pos?.minWidth, ...style }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body,
  );
}

export function MenuItem({
  icon,
  children,
  onClick,
  danger,
  disabled,
  checked,
  right,
  active,
}: {
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  checked?: boolean;
  right?: ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={`menu-item ${danger ? 'danger' : ''} ${active ? 'active' : ''}`}
      disabled={disabled}
      onClick={onClick}
      role="menuitem"
    >
      {checked !== undefined && <span className="menu-check">{checked && <IconCheck size={14} />}</span>}
      {icon && <span className="menu-icon">{icon}</span>}
      <span className="menu-label">{children}</span>
      {right && <span className="menu-right">{right}</span>}
    </button>
  );
}

export const MenuSep = () => <div className="menu-sep" />;

/* ---------------- Modal ---------------- */

export function Modal({ title, onClose, children, footer, width = 560, headerExtra }: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
  headerExtra?: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return createPortal(
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" style={{ width }} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>{title}</h2>
          {headerExtra}
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <IconClose />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/* ---------------- Tooltip (title-like) ---------------- */

export function Tip({ text, children }: { text: string; children: ReactNode }) {
  return (
    <span className="tip-wrap" data-tip={text}>
      {children}
    </span>
  );
}
