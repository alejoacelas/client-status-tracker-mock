import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Update } from '../data/mock';
import { HEALTH_META, HealthIcon, I } from '../icons';
import { userById } from '../store';
import { toast } from '../ui';
import { agoCompact, fullDateTime } from '../util';
import { Tooltip } from './Menu';
import { UpdateItem } from './UpdateItem';

// The floating "latest update" card that opens from a health cell in a list.
export function UpdatePopover({
  anchor, title, update, onClose, onWrite, onNav,
}: {
  anchor: DOMRect;
  title: ReactNode;
  update?: Update;
  onClose: () => void;
  onWrite: () => void;
  onNav: (dir: 1 | -1) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: -9999, top: -9999 });
  useLayoutEffect(() => {
    const el = ref.current!;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    let left = anchor.left - 20;
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    let top = anchor.bottom + 6;
    if (top + h > window.innerHeight - 8) top = Math.max(8, anchor.top - h - 6);
    setPos({ left, top });
  }, [anchor, update]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('textarea, input, [contenteditable="true"]')) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); onNav(1); }
      if (e.key === 'ArrowUp' || e.key === 'k') { e.preventDefault(); onNav(-1); }
    };
    const down = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (ref.current && !ref.current.contains(t) && !t.closest('.menu, .health-cell')) onClose();
    };
    window.addEventListener('keydown', key);
    const tm = window.setTimeout(() => document.addEventListener('mousedown', down), 0);
    return () => {
      window.removeEventListener('keydown', key);
      window.clearTimeout(tm);
      document.removeEventListener('mousedown', down);
    };
  }, [onClose, onNav]);

  return createPortal(
    <div ref={ref} className="upd-pop" style={pos} role="dialog" aria-label="Latest update">
      <div className="upd-pop-head">
        {title}
        <div style={{ flex: 1 }} />
        <Tooltip label="Subscribe to updates">
          <button className="icon-btn" aria-label="Subscribe" onClick={() => toast('Subscribed to updates')}><I.bell size={16} /></button>
        </Tooltip>
        <button className="btn btn-secondary" onClick={onWrite}><I.pencil size={14} />Write update</button>
      </div>
      <div className="upd-pop-body">
        {update ? (
          <>
            <div className="update-meta" style={{ justifyContent: 'space-between' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <HealthIcon health={update.health} />
                <span className="health-label" style={{ color: HEALTH_META[update.health].color }}>{HEALTH_META[update.health].label}</span>
                <span className="meta-dot">·</span>
                <Tooltip label={fullDateTime(update.createdAt)}><span className="meta-time">{agoCompact(update.createdAt)}</span></Tooltip>
              </span>
              <span className="meta-time">{userById(update.authorId).name}</span>
            </div>
            <UpdateItem u={update} variant="popover" key={update.id} />
          </>
        ) : (
          <div style={{ color: 'var(--text-tertiary)', padding: '12px 0' }}>No updates yet. Updates show health and progress at a glance.</div>
        )}
      </div>
      <div className="upd-pop-foot">
        <span className="kbd"><I.arrowUp size={10} /></span>
        <span className="kbd"><I.arrowDown size={10} /></span>
        <span>to navigate</span>
      </div>
    </div>,
    document.body,
  );
}
