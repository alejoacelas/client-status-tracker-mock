import { useCallback, useEffect, useRef, useState } from 'react';
import type { ColumnId, Initiative, Stage } from './types';

export type DropTarget = { kind: 'column'; column: ColumnId; index: number } | { kind: 'stage'; stage: Stage };

interface Ghost { x: number; y: number; w: number; h: number; dx: number; dy: number }

/**
 * Pointer-based drag and drop for roadmap cards. Mouse drags start after a 5px move;
 * touch drags start after a 300ms press so normal scrolling still works.
 */
export function useDnd(enabled: boolean, onDrop: (id: string, target: DropTarget) => void) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const [target, setTarget] = useState<DropTarget | null>(null);
  const [ghostHtml, setGhostHtml] = useState<string>('');
  const targetRef = useRef<DropTarget | null>(null);
  const dragRef = useRef<string | null>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const cleanup = useRef<() => void>(() => {});
  const suppressClick = useRef(false);

  const computeTarget = useCallback((x: number, y: number): DropTarget | null => {
    const els = document.elementsFromPoint(x, y) as HTMLElement[];
    for (const el of els) {
      const stage = el.closest<HTMLElement>('[data-drop-stage]');
      if (stage) return { kind: 'stage', stage: stage.dataset.dropStage as Stage };
      const col = el.closest<HTMLElement>('[data-drop-column]');
      if (col) {
        const cards = Array.from(col.querySelectorAll<HTMLElement>('[data-card-id]')).filter(
          (c) => c.dataset.cardId !== dragRef.current,
        );
        let index = cards.length;
        for (let n = 0; n < cards.length; n++) {
          const r = cards[n].getBoundingClientRect();
          if (y < r.top + r.height / 2) {
            index = n;
            break;
          }
        }
        return { kind: 'column', column: col.dataset.dropColumn as ColumnId, index };
      }
    }
    return null;
  }, []);

  const end = useCallback(
    (commit: boolean) => {
      const id = dragRef.current;
      const t = targetRef.current;
      cleanup.current();
      dragRef.current = null;
      targetRef.current = null;
      setDragId(null);
      setGhost(null);
      setTarget(null);
      if (commit && id && t) onDrop(id, t);
    },
    [onDrop],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent, item: Initiative) => {
      if (!enabled || e.button !== 0) return;
      if ((e.target as HTMLElement).closest('a,button,input,textarea,select')) return;
      const card = e.currentTarget as HTMLElement;
      const startX = e.clientX;
      const startY = e.clientY;
      const isTouch = e.pointerType !== 'mouse';
      let started = false;
      let pressTimer: number | undefined;
      let scrollTimer: number | undefined;

      const begin = () => {
        started = true;
        const r = card.getBoundingClientRect();
        dragRef.current = item.id;
        setGhostHtml(card.outerHTML);
        setGhost({ x: pointer.current.x, y: pointer.current.y, w: r.width, h: r.height, dx: startX - r.left, dy: startY - r.top });
        setDragId(item.id);
        const t = computeTarget(pointer.current.x, pointer.current.y);
        targetRef.current = t;
        setTarget(t);
        suppressClick.current = true;
        if (navigator.vibrate && isTouch) navigator.vibrate(15);
        scrollTimer = window.setInterval(() => {
          const { y } = pointer.current;
          const edge = 70;
          if (y < edge) window.scrollBy(0, -12);
          else if (y > window.innerHeight - edge) window.scrollBy(0, 12);
        }, 16);
      };

      const move = (ev: PointerEvent) => {
        pointer.current = { x: ev.clientX, y: ev.clientY };
        if (!started) {
          const dist = Math.hypot(ev.clientX - startX, ev.clientY - startY);
          if (isTouch) {
            if (dist > 8) cleanup.current();
            return;
          }
          if (dist < 5) return;
          begin();
        }
        setGhost((g) => (g ? { ...g, x: ev.clientX, y: ev.clientY } : g));
        const t = computeTarget(ev.clientX, ev.clientY);
        targetRef.current = t;
        setTarget(t);
      };
      const up = () => (started ? end(true) : cleanup.current());
      const cancel = () => (started ? end(false) : cleanup.current());
      const key = (ev: KeyboardEvent) => ev.key === 'Escape' && cancel();
      const touchMove = (ev: TouchEvent) => {
        if (started) ev.preventDefault();
      };
      const ctx = (ev: Event) => {
        if (started || isTouch) ev.preventDefault();
      };

      pointer.current = { x: startX, y: startY };
      if (isTouch) pressTimer = window.setTimeout(begin, 300);
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', cancel);
      window.addEventListener('keydown', key);
      window.addEventListener('touchmove', touchMove, { passive: false });
      window.addEventListener('contextmenu', ctx);
      cleanup.current = () => {
        window.clearTimeout(pressTimer);
        window.clearInterval(scrollTimer);
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', cancel);
        window.removeEventListener('keydown', key);
        window.removeEventListener('touchmove', touchMove);
        window.removeEventListener('contextmenu', ctx);
        cleanup.current = () => {};
      };
    },
    [enabled, computeTarget, end],
  );

  // Swallow the click that follows a drag so the card doesn't open.
  useEffect(() => {
    const on = (e: MouseEvent) => {
      if (suppressClick.current) {
        e.stopPropagation();
        e.preventDefault();
        suppressClick.current = false;
      }
    };
    const reset = () => window.setTimeout(() => (suppressClick.current = false), 0);
    window.addEventListener('click', on, true);
    window.addEventListener('pointerup', reset);
    return () => {
      window.removeEventListener('click', on, true);
      window.removeEventListener('pointerup', reset);
    };
  }, []);

  useEffect(() => () => cleanup.current(), []);

  const ghostEl =
    ghost && dragId ? (
      <div
        className="drag-ghost"
        style={{ left: ghost.x - ghost.dx, top: ghost.y - ghost.dy, width: ghost.w }}
        dangerouslySetInnerHTML={{ __html: ghostHtml }}
      />
    ) : null;

  return { dragId, target, onPointerDown, ghostEl };
}
