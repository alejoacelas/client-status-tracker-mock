import { useEffect, useRef, useState, type ReactNode } from 'react';
import { objectiveById, staffById } from '../util';
import { ObjectiveIcon } from './Icons';

export function ObjectiveTag({ id }: { id: string }) {
  const o = objectiveById(id);
  if (!o) return null;
  return (
    <li className="objective-tag" style={{ ['--obj-color' as string]: `var(--obj-${o.color})` }} title={o.name}>
      {o.line === null && <ObjectiveIcon />}
      <span>{o.name}</span>
    </li>
  );
}

export function Avatar({ id, size }: { id: string; size?: 'sm' | 'lg' }) {
  const s = staffById(id);
  if (!s) return null;
  return (
    <span className={`avatar avatar--${s.id}${size ? ' avatar--' + size : ''}`} title={s.name}>
      {s.initials}
    </span>
  );
}

export function useClickOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const on = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const key = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', on);
    document.addEventListener('touchstart', on);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', on);
      document.removeEventListener('touchstart', on);
      document.removeEventListener('keydown', key);
    };
  }, [open, close]);
  return ref;
}

/** Anchor + dropdown that closes on outside click or Escape. */
export function Menu({
  trigger,
  children,
  align = 'left',
  className = '',
}: {
  trigger: (open: boolean, toggle: () => void) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: 'left' | 'right';
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const ref = useClickOutside(open, close);
  return (
    <div className="menu-anchor" ref={ref}>
      {trigger(open, () => setOpen(!open))}
      {open && <div className={`dropdown ${align === 'right' ? 'dropdown--right' : ''} ${className}`}>{children(close)}</div>}
    </div>
  );
}

let toastTimer: number | undefined;
export function toast(msg: string) {
  window.dispatchEvent(new CustomEvent('nnl-toast', { detail: msg }));
}
export function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    const on = (e: Event) => {
      setMsg((e as CustomEvent<string>).detail);
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => setMsg(null), 2600);
    };
    window.addEventListener('nnl-toast', on);
    return () => window.removeEventListener('nnl-toast', on);
  }, []);
  return msg ? (
    <div className="toast" role="status">
      {msg}
    </div>
  ) : null;
}

export const notInReplica = (what: string) => toast(`${what} isn't part of this replica.`);
