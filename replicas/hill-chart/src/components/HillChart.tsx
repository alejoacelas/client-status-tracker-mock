import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

export interface HillDot {
  id: string;
  name: string;
  color: string;
  pos: number; // 0..100
}

type Variant = 'full' | 'thumb' | 'compact';

interface Geo {
  W: number;
  H: number;
  x0: number;
  x1: number;
  top: number;
  bottom: number;
  line: number;
  phaseY: number | null;
  r: number;
  font: number;
  phaseFont: number;
  labelGap: number; // centre of dot to start of label text
  stroke: number;
}

// The hill is a normal curve (sigma = 0.168 of the width), rescaled so both ends
// meet the baseline. Fitted to the curve Basecamp draws on its own marketing site.
const SIGMA = 0.168;
const gauss = (x: number) => Math.exp(-((x - 0.5) ** 2) / (2 * SIGMA * SIGMA));
const G0 = gauss(0);
export const hillHeight = (t: number) => (gauss(t) - G0) / (1 - G0);

function geometry(variant: Variant, width: number): Geo {
  if (variant === 'thumb') {
    return { W: 291, H: 120, x0: 9.5, x1: 281.5, top: 15, bottom: 78.5, line: 90, phaseY: null, r: 5.5, font: 8, phaseFont: 0, labelGap: 12.5, stroke: 1 };
  }
  const W = Math.max(280, Math.round(width));
  const small = W < 640;
  const H = variant === 'compact' ? (small ? 190 : 220) : small ? 210 : Math.round(Math.min(268, Math.max(230, W * 0.266)));
  const x0 = Math.round(Math.max(small ? 18 : 40, W * (64 / 1008)));
  return {
    W,
    H,
    x0,
    x1: W - x0,
    top: variant === 'compact' ? 28 : 42.8,
    bottom: H - 40.2,
    line: H - 30,
    phaseY: H - 14,
    r: small ? 8.5 : 9.5,
    font: small ? 13 : variant === 'compact' ? 13 : 14,
    phaseFont: small ? 10 : 10.9,
    labelGap: small ? 17 : 20,
    stroke: 1.5,
  };
}

const xFor = (g: Geo, pos: number) => g.x0 + (pos / 100) * (g.x1 - g.x0);
const yFor = (g: Geo, pos: number) => g.bottom - hillHeight(pos / 100) * (g.bottom - g.top);

let measureCtx: CanvasRenderingContext2D | null = null;
function textWidth(text: string, font: number) {
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
  if (!measureCtx) return text.length * font * 0.55;
  measureCtx.font = `${font}px "Inter Variable", system-ui, sans-serif`;
  return measureCtx.measureText(text).width;
}

interface Placed extends HillDot {
  cx: number;
  cy: number;
  side: 'left' | 'right';
  ly: number;
  faded: boolean;
}

function layout(g: Geo, dots: HillDot[], draggingId: string | null): Placed[] {
  const sorted = [...dots].sort((a, b) => a.pos - b.pos);
  const placed: Placed[] = [];
  const minDist = g.r * 2 + (g.r > 6 ? 1 : 0.5);
  for (const d of sorted) {
    const cx = xFor(g, d.pos);
    let cy = yFor(g, d.pos);
    // Dots that would sit on top of each other stack upwards, as Basecamp does at the ends of the hill.
    for (let guard = 0; guard < 20; guard++) {
      const hit = placed.find((p) => (p.cx - cx) ** 2 + (p.cy - cy) ** 2 < minDist * minDist);
      if (!hit) break;
      cy = hit.cy - minDist;
    }
    placed.push({
      ...d,
      cx,
      cy,
      ly: cy,
      side: d.pos < 50 ? 'right' : 'left',
      faded: d.pos <= 1 || d.pos >= 99 || d.id === draggingId,
    });
  }
  // Keep labels from overprinting each other or other dots. Each label tries its usual
  // side first, then the other side, then nudges upwards (or downwards) until it is clear.
  const lh = g.font * 1.2;
  const boxes: { x0: number; x1: number; y0: number; y1: number }[] = placed.map((p) => ({
    x0: p.cx - g.r,
    x1: p.cx + g.r,
    y0: p.cy - g.r,
    y1: p.cy + g.r,
  }));
  const free = (b: { x0: number; x1: number; y0: number; y1: number }, skip: number) =>
    b.x0 >= -2 &&
    b.x1 <= g.W + 2 &&
    b.y1 <= g.line + 3 &&
    b.y0 >= 0 &&
    !boxes.some((o, i) => i !== skip && o.x0 < b.x1 && b.x0 < o.x1 && o.y0 < b.y1 && b.y0 < o.y1);
  const order = placed.map((p, i) => ({ p, i })).sort((a, b) => b.p.cy - a.p.cy);
  for (const { p, i } of order) {
    const w = textWidth(p.name, g.font);
    const rect = (side: 'left' | 'right', y: number) => {
      const x0 = side === 'right' ? p.cx + g.labelGap : p.cx - g.labelGap - w;
      return { x0, x1: x0 + w, y0: y - lh / 2 + 1, y1: y + lh / 2 - 1 };
    };
    const other = p.side === 'right' ? 'left' : 'right';
    const tries: ['left' | 'right', number][] = [[p.side, p.cy], [other, p.cy]];
    for (let k = 1; k <= 8; k++) tries.push([p.side, p.cy - k * lh], [p.side, p.cy + k * lh]);
    const pick = tries.find(([side, y]) => free(rect(side, y), i)) ?? tries[0];
    p.side = pick[0];
    p.ly = pick[1];
    boxes.push(rect(pick[0], pick[1]));
  }
  return placed;
}

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

/** Animate positions towards the target so dots glide along the hill when stepping through history. */
function useAnimatedPositions(target: HillDot[], animate: boolean) {
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);
  shownRef.current = shown;
  const key = target.map((d) => `${d.id}:${d.pos}:${d.name}:${d.color}`).join('|');
  useEffect(() => {
    if (!animate) {
      setShown(target);
      return;
    }
    const from = new Map(shownRef.current.map((d) => [d.id, d.pos]));
    const start = performance.now();
    const dur = 650;
    let raf = 0;
    const tick = (now: number) => {
      const k = ease(Math.min(1, (now - start) / dur));
      setShown(target.map((d) => {
        const f = from.get(d.id);
        return f === undefined ? d : { ...d, pos: f + (d.pos - f) * k };
      }));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, animate]);
  return shown;
}

interface Props {
  dots: HillDot[];
  variant?: Variant;
  editing?: boolean;
  animate?: boolean;
  onMove?: (id: string, pos: number) => void;
}

export function HillChart({ dots, variant = 'full', editing = false, animate = false, onMove }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(1008);
  const [dragging, setDragging] = useState<string | null>(null);

  useLayoutEffect(() => {
    if (variant === 'thumb' || !wrapRef.current) return;
    const el = wrapRef.current;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, [variant]);

  const g = geometry(variant, width);
  const shown = useAnimatedPositions(dots, animate && !editing);
  const placed = useMemo(() => layout(g, shown, dragging), [g.W, g.H, shown, dragging]); // eslint-disable-line react-hooks/exhaustive-deps

  const curve = useMemo(() => {
    const pts: string[] = [];
    const n = 110;
    for (let i = 0; i <= n; i++) {
      const pos = (i / n) * 100;
      pts.push(`${xFor(g, pos).toFixed(1)} ${yFor(g, pos).toFixed(1)}`);
    }
    return `M${pts.join('L')}`;
  }, [g.W, g.H]); // eslint-disable-line react-hooks/exhaustive-deps

  const posFromEvent = (e: PointerEvent<SVGSVGElement | SVGGElement>) => {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * g.W;
    return Math.round(Math.min(100, Math.max(0, ((x - g.x0) / (g.x1 - g.x0)) * 100)) * 10) / 10;
  };

  const onDown = (id: string) => (e: PointerEvent<SVGGElement>) => {
    if (!editing) return;
    e.preventDefault();
    svgRef.current?.setPointerCapture(e.pointerId);
    setDragging(id);
  };
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!dragging) return;
    onMove?.(dragging, posFromEvent(e));
  };
  const endDrag = (e: PointerEvent<SVGSVGElement>) => {
    if (!dragging) return;
    svgRef.current?.releasePointerCapture?.(e.pointerId);
    setDragging(null);
  };
  const onKey = (d: HillDot) => (e: KeyboardEvent<SVGGElement>) => {
    if (!editing) return;
    const step = e.shiftKey ? 5 : 1;
    let next: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = d.pos + step;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = d.pos - step;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = 100;
    if (next !== null) {
      e.preventDefault();
      onMove?.(d.id, Math.min(100, Math.max(0, Math.round(next))));
    }
  };

  // Draw the dot being dragged last so it stays on top.
  const order = dragging ? [...placed.filter((p) => p.id !== dragging), ...placed.filter((p) => p.id === dragging)] : placed;
  const mid = (g.x0 + g.x1) / 2;

  const svg = (
    <svg
      ref={svgRef}
      className={`hill hill--${variant}${editing ? ' hill--editing' : ''}${dragging ? ' hill--dragging' : ''}`}
      viewBox={`0 0 ${g.W} ${g.H}`}
      width={variant === 'thumb' ? '100%' : g.W}
      height={variant === 'thumb' ? undefined : g.H}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      role="img"
      aria-label="Hill chart"
    >
      <path className="hill__line" d={`M${g.x0} ${g.line}H${g.x1}`} />
      <path className="hill__middle" d={`M${mid} ${g.top - 0.3}V${g.bottom + 0.2}`} />
      <path className="hill__curve" d={curve} strokeWidth={g.stroke} />
      {g.phaseY !== null && (
        <>
          <text className="hill__phase" x={g.x0 + (mid - g.x0) / 2} y={g.phaseY} fontSize={g.phaseFont}>
            FIGURING THINGS OUT
          </text>
          <text className="hill__phase" x={mid + (g.x1 - mid) / 2} y={g.phaseY} fontSize={g.phaseFont}>
            MAKING IT HAPPEN
          </text>
        </>
      )}
      {order.map((p) => {
        const dir = p.side === 'right' ? 1 : -1;
        const tx = p.cx + dir * g.labelGap;
        const connStart = p.cx + dir * (variant === 'thumb' ? 0 : g.r + 0.5);
        const connEnd = p.cx + dir * (g.labelGap - (variant === 'thumb' ? 1.5 : 0));
        const conn = p.ly === p.cy ? `M${connStart} ${p.cy}H${connEnd}` : `M${connStart} ${p.cy}L${connEnd - dir * 3} ${p.ly}H${connEnd}`;
        return (
          <g
            key={p.id}
            className={`hill__dot${p.faded ? ' hill__dot--faded' : ''}${dragging === p.id ? ' hill__dot--dragging' : ''}`}
            onPointerDown={onDown(p.id)}
            onKeyDown={onKey(p)}
            tabIndex={editing ? 0 : undefined}
            role={editing ? 'slider' : undefined}
            aria-label={editing ? p.name : undefined}
            aria-valuemin={editing ? 0 : undefined}
            aria-valuemax={editing ? 100 : undefined}
            aria-valuenow={editing ? Math.round(p.pos) : undefined}
            aria-valuetext={editing ? `${Math.round(p.pos)}% ${p.pos < 50 ? 'uphill, figuring things out' : 'downhill, making it happen'}` : undefined}
          >
            <path d={conn} stroke={p.color} className="hill__conn" />
            <text x={tx} y={p.ly} fontSize={g.font} textAnchor={p.side === 'right' ? 'start' : 'end'} className="hill__label">
              {p.name}
            </text>
            {editing && <circle cx={p.cx} cy={p.cy} r={Math.max(g.r + 10, 22)} className="hill__hit" />}
            <circle cx={p.cx} cy={p.cy} r={g.r} fill={p.color} className="hill__circle" strokeWidth={variant === 'thumb' ? 0.75 : 1.5} />
          </g>
        );
      })}
    </svg>
  );

  if (variant === 'thumb') return svg;
  return (
    <div ref={wrapRef} className="hill-wrap">
      {svg}
    </div>
  );
}
