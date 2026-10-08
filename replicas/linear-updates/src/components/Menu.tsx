import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { I } from '../icons';
import { cx } from '../util';

export interface MenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  meta?: string;
  checked?: boolean;
  danger?: boolean;
  sep?: boolean; // render a separator before this item
}

function usePosition(anchor: DOMRect, ref: React.RefObject<HTMLDivElement>, align: 'left' | 'right') {
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: -9999, top: -9999 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    let left = align === 'right' ? anchor.right - w : anchor.left;
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    let top = anchor.bottom + 4;
    if (top + h > window.innerHeight - 8) top = Math.max(8, anchor.top - h - 4);
    setPos({ left, top });
  }, [anchor, align, ref]);
  return pos;
}

function useDismiss(ref: React.RefObject<HTMLElement>, onClose: () => void) {
  useEffect(() => {
    const down = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    const t = window.setTimeout(() => document.addEventListener('mousedown', down), 0);
    window.addEventListener('keydown', key, true);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('mousedown', down);
      window.removeEventListener('keydown', key, true);
    };
  }, [ref, onClose]);
}

export function Menu({
  anchor, items, onSelect, onClose, searchable, placeholder, align = 'left', width,
}: {
  anchor: DOMRect;
  items: MenuItem[];
  onSelect: (id: string) => void;
  onClose: () => void;
  searchable?: boolean;
  placeholder?: string;
  align?: 'left' | 'right';
  width?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState('');
  const [hl, setHl] = useState(0);
  const shown = useMemo(() => items.filter((i) => i.label.toLowerCase().includes(q.toLowerCase())), [items, q]);
  const pos = usePosition(anchor, ref, align);
  useDismiss(ref, onClose);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setHl((h) => Math.min(shown.length - 1, h + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setHl((h) => Math.max(0, h - 1)); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        const it = shown[hl];
        if (it) { onSelect(it.id); onClose(); }
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [shown, hl, onSelect, onClose]);
  useEffect(() => setHl(0), [q]);

  return createPortal(
    <div ref={ref} className="menu" style={{ left: pos.left, top: pos.top, width }} role="menu">
      {searchable && (
        <input autoFocus className="menu-search" placeholder={placeholder ?? 'Search…'} value={q} onChange={(e) => setQ(e.target.value)} />
      )}
      {shown.map((it, i) => (
        <div key={it.id}>
          {it.sep && i > 0 && <div className="menu-sep" />}
          <button
            className={cx('menu-item', i === hl && 'hl', it.danger && 'danger')}
            role="menuitem"
            onMouseEnter={() => setHl(i)}
            onClick={() => { onSelect(it.id); onClose(); }}
          >
            {it.icon}
            <span className="grow">{it.label}</span>
            {it.meta && <span className="meta">{it.meta}</span>}
            {it.checked && <I.check className="tick" size={14} />}
          </button>
        </div>
      ))}
      {shown.length === 0 && <div className="menu-label">No results</div>}
    </div>,
    document.body,
  );
}

export function Popover({ anchor, onClose, children, align = 'left', className }: { anchor: DOMRect; onClose: () => void; children: ReactNode; align?: 'left' | 'right'; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const pos = usePosition(anchor, ref, align);
  useDismiss(ref, onClose);
  return createPortal(
    <div ref={ref} className={cx('menu', className)} style={{ left: pos.left, top: pos.top }}>
      {children}
    </div>,
    document.body,
  );
}

export function useAnchor() {
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  return {
    anchor,
    open: (e: React.MouseEvent | { currentTarget: Element }) => setAnchor((e.currentTarget as Element).getBoundingClientRect()),
    close: () => setAnchor(null),
  };
}

export function Tooltip({ label, children }: { label: string; children: React.ReactElement }) {
  const [r, setR] = useState<DOMRect | null>(null);
  const t = useRef<number>();
  return (
    <span
      style={{ display: 'contents' }}
      onMouseOver={(e) => {
        const target = (e.target as HTMLElement).closest('button, a, span');
        window.clearTimeout(t.current);
        t.current = window.setTimeout(() => target && setR(target.getBoundingClientRect()), 450);
      }}
      onMouseOut={() => { window.clearTimeout(t.current); setR(null); }}
      onMouseDown={() => { window.clearTimeout(t.current); setR(null); }}
    >
      {children}
      {r && createPortal(
        <div className="tooltip" style={{ left: Math.max(8, Math.min(r.left + r.width / 2 - label.length * 3.4, window.innerWidth - label.length * 7 - 16)), top: r.bottom + 6 }}>{label}</div>,
        document.body,
      )}
    </span>
  );
}
