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

      const moveTo = (cx: number, cy: number) => {
        pointer.current = { x: cx, y: cy };
        if (!started) {
          const dist = Math.hypot(cx - startX, cy - startY);
          if (isTouch) {
            if (dist > 8) cleanup.current();
            return;
          }
          if (dist < 5) return;
          begin();
        }
        setGhost((g) => (g ? { ...g, x: cx, y: cy } : g));
        const t = computeTarget(cx, cy);
        targetRef.current = t;
        setTarget(t);
      };
      const move = (ev: PointerEvent) => moveTo(ev.clientX, ev.clientY);
      const up = () => (started ? end(true) : cleanup.current());
      const cancel = () => (started ? end(false) : cleanup.current());
      // Browsers may cancel the pointer when a touch looks like a scroll; a started touch drag
      // keeps going on touch events.
      const pointerCancel = () => (isTouch && started ? undefined : cancel());
      const key = (ev: KeyboardEvent) => ev.key === 'Escape' && cancel();
      const touchMove = (ev: TouchEvent) => {
        if (!started) return;
        if (ev.cancelable) ev.preventDefault();
        const t = ev.touches[0];
        if (t) moveTo(t.clientX, t.clientY);
      };
      const touchEnd = () => {
        if (started) end(true);
      };
      const ctx = (ev: Event) => {
        if (started || isTouch) ev.preventDefault();
      };

      pointer.current = { x: startX, y: startY };
      if (isTouch) pressTimer = window.setTimeout(begin, 300);
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', pointerCancel);
      window.addEventListener('touchend', touchEnd);
      window.addEventListener('touchcancel', touchEnd);
      window.addEventListener('keydown', key);
      window.addEventListener('touchmove', touchMove, { passive: false });
      window.addEventListener('contextmenu', ctx);
      cleanup.current = () => {
        window.clearTimeout(pressTimer);
        window.clearInterval(scrollTimer);
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', pointerCancel);
        window.removeEventListener('touchend', touchEnd);
        window.removeEventListener('touchcancel', touchEnd);
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

  // A blocking touchmove listener has to exist before the touch starts, or the browser
  // commits to scrolling and won't let a long-press drag take over.
  useEffect(() => {
    const block = (e: TouchEvent) => {
      if (dragRef.current && e.cancelable) e.preventDefault();
    };
    window.addEventListener('touchmove', block, { passive: false });
    return () => window.removeEventListener('touchmove', block);
  }, []);

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
