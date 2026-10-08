import { useCallback, useEffect, useRef, useState } from 'react'
import type { ClientPage } from '../data/statusData'
import type { DayUptime } from '../lib/model'
import { UptimeTooltip, type Anchor } from './UptimeTooltip'

interface Open {
  key: string
  day: DayUptime
  anchor: Anchor
  isGroup: boolean
  pinned: boolean
}

/**
 * Hovering a day shows its tooltip; moving onto the tooltip keeps it open so
 * its links can be clicked. Clicking or tapping a day pins it with a close button.
 */
export function useDayTooltip(page: ClientPage) {
  const [open, setOpen] = useState<Open | null>(null)
  const hideTimer = useRef<number | undefined>(undefined)
  const tipRef = useRef<HTMLDivElement>(null)

  const cancelHide = useCallback(() => window.clearTimeout(hideTimer.current), [])
  const scheduleHide = useCallback(() => {
    window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => setOpen((o) => (o && o.pinned ? o : null)), 150)
  }, [])

  const anchorOf = (el: Element): Anchor => {
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width / 2 + window.scrollX, bottom: r.bottom + window.scrollY }
  }

  const show = useCallback(
    (key: string, day: DayUptime, el: Element, isGroup: boolean) => {
      cancelHide()
      setOpen((o) => (o && o.pinned && o.key !== key ? o : { key, day, anchor: anchorOf(el), isGroup, pinned: o?.key === key ? o.pinned : false }))
    },
    [cancelHide],
  )

  const pin = useCallback((key: string, day: DayUptime, el: Element, isGroup: boolean) => {
    window.clearTimeout(hideTimer.current)
    setOpen({ key, day, anchor: anchorOf(el), isGroup, pinned: true })
  }, [])

  const close = useCallback(() => setOpen(null), [])

  useEffect(() => {
    if (!open?.pinned) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Element
      if (tipRef.current?.contains(t)) return
      if (t.closest?.('[data-day-key]')) return
      setOpen(null)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open?.pinned])

  useEffect(() => {
    const onResize = () => setOpen(null)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  /** Props to spread on each day's element. */
  const bind = (key: string, day: DayUptime, isGroup: boolean) => ({
    'data-day-key': key,
    tabIndex: 0,
    onMouseEnter: (e: React.MouseEvent) => show(key, day, e.currentTarget, isGroup),
    onMouseLeave: scheduleHide,
    onFocus: (e: React.FocusEvent) => show(key, day, e.currentTarget, isGroup),
    onBlur: scheduleHide,
    onClick: (e: React.MouseEvent) => pin(key, day, e.currentTarget, isGroup),
  })

  const tooltip = open ? (
    <UptimeTooltip
      ref={tipRef}
      page={page}
      day={open.day}
      anchor={open.anchor}
      isGroup={open.isGroup}
      pinned={open.pinned}
      onClose={close}
      onMouseEnter={cancelHide}
      onMouseLeave={scheduleHide}
    />
  ) : null

  return { bind, tooltip, activeKey: open?.key ?? null }
}
