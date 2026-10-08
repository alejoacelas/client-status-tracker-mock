import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** The small dark tooltip shown above "?" bubbles. */
export function HelpBubble({ text, label }: { text: string; label: string }) {
  const ref = useRef<HTMLButtonElement>(null)
  const [show, setShow] = useState(false)
  return (
    <>
      <button
        ref={ref}
        type="button"
        className="tooltip-base"
        aria-label={`More information about ${label}`}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        onClick={() => setShow((s) => !s)}
      >
        ?
      </button>
      {show && ref.current && <DarkTip anchor={ref.current}>{text}</DarkTip>}
    </>
  )
}

export function DarkTip({ anchor, children }: { anchor: HTMLElement; children: ReactNode }) {
  const tip = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: -9999, top: -9999 })
  useLayoutEffect(() => {
    const a = anchor.getBoundingClientRect()
    const t = tip.current!.getBoundingClientRect()
    let left = a.left + a.width / 2 - t.width / 2 + window.scrollX
    left = Math.max(8 + window.scrollX, Math.min(left, window.scrollX + document.documentElement.clientWidth - t.width - 8))
    setPos({ left, top: a.top + window.scrollY - t.height - 8 })
  }, [anchor])
  return createPortal(
    <div ref={tip} className="dark-tooltip" role="tooltip" style={pos}>
      {children}
    </div>,
    document.body,
  )
}

/** Close a floating element when the user clicks elsewhere or presses Escape. */
export function useDismiss(active: boolean, refs: React.RefObject<HTMLElement | null>[], onDismiss: () => void) {
  useEffect(() => {
    if (!active) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (refs.some((r) => r.current && r.current.contains(e.target as Node))) return
      onDismiss()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onDismiss()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [active, refs, onDismiss])
}
