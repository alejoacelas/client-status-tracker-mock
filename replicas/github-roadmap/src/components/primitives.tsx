import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { CheckIcon, IssueClosedIcon, IssueDraftIcon, IssueOpenedIcon } from '@primer/octicons-react'
import type { Color, Item } from '../types'
import { userByLogin } from '../store'

export const colorVar = (c: Color | undefined) => (c ?? 'GRAY').toLowerCase()

export function Token({ name, color, onClick, title }: { name: string; color?: Color; onClick?: () => void; title?: string }) {
  const c = colorVar(color)
  return (
    <span
      className={`Token${onClick ? ' Token--interactive' : ''}`}
      title={title ?? name}
      onClick={onClick}
      style={
        {
          '--tok-bg': `var(--display-${c}-bgColor-muted)`,
          '--tok-fg': `var(--display-${c}-fgColor)`,
          '--tok-border': `var(--display-${c}-borderColor-emphasis)`,
        } as CSSProperties
      }
    >
      <span className="Token-text">{name}</span>
    </span>
  )
}

export function ColorDecorator({ color }: { color?: Color }) {
  const c = colorVar(color)
  const style =
    !color || color === 'GRAY'
      ? { backgroundColor: 'var(--bgColor-muted)', borderColor: 'var(--fgColor-muted)' }
      : { backgroundColor: `var(--display-${c}-bgColor-muted)`, borderColor: `var(--display-${c}-borderColor-emphasis)` }
  return <span className="ColorDecorator" style={style} />
}

export function Counter({ children, emphasis }: { children: ReactNode; emphasis?: boolean }) {
  return <span className={`Counter${emphasis ? ' Counter--emphasis' : ''}`}>{children}</span>
}

export function Avatar({ login, size = 20 }: { login: string; size?: number }) {
  const u = userByLogin(login)
  const initials = (u?.name ?? login)
    .split(/[\s-]+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <span
      className="Avatar"
      title={login}
      style={{ width: size, height: size, fontSize: Math.max(8, Math.round(size * 0.42)), background: u?.color ?? 'var(--bgColor-neutral-emphasis)' }}
    >
      {initials}
    </span>
  )
}

export function AvatarStack({ logins, size = 20 }: { logins: string[]; size?: number }) {
  return (
    <span className="AvatarStack">
      {logins.map((l) => (
        <Avatar key={l} login={l} size={size} />
      ))}
    </span>
  )
}

export function ItemIcon({ item, size = 16 }: { item: Item; size?: number }) {
  if (item.type === 'draft') return <IssueDraftIcon size={size} className="ItemIcon ItemIcon--draft" aria-label="Draft issue" />
  if (item.state === 'closed') return <IssueClosedIcon size={size} className="ItemIcon ItemIcon--closed" aria-label="Closed issue" />
  return <IssueOpenedIcon size={size} className="ItemIcon ItemIcon--open" aria-label="Open issue" />
}

export function Button({
  children,
  variant = 'default',
  size = 'medium',
  leading,
  trailing,
  onClick,
  btnRef,
  className = '',
  ariaLabel,
  ariaExpanded,
  disabled,
  title,
}: {
  children?: ReactNode
  variant?: 'default' | 'primary' | 'invisible' | 'danger'
  size?: 'small' | 'medium'
  leading?: ReactNode
  trailing?: ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  btnRef?: RefObject<HTMLButtonElement>
  className?: string
  ariaLabel?: string
  ariaExpanded?: boolean
  disabled?: boolean
  title?: string
}) {
  return (
    <button
      type="button"
      ref={btnRef}
      className={`Btn Btn--${variant} Btn--${size}${!children ? ' Btn--iconOnly' : ''} ${className}`}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaExpanded !== undefined ? 'true' : undefined}
      disabled={disabled}
      title={title}
    >
      {leading && <span className="Btn-visual">{leading}</span>}
      {children && <span className="Btn-label">{children}</span>}
      {trailing && <span className="Btn-visual Btn-trailing">{trailing}</span>}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Anchored overlay used for every menu                                */
/* ------------------------------------------------------------------ */

export function useMediaQuery(q: string) {
  const [m, setM] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const h = () => setM(mq.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [q])
  return m
}

export function Overlay({
  anchor,
  onClose,
  children,
  align = 'start',
  side = 'bottom',
  width,
  className = '',
  ignore = [],
}: {
  anchor: HTMLElement | null
  onClose: () => void
  children: ReactNode
  align?: 'start' | 'end'
  side?: 'bottom' | 'left' | 'right'
  width?: number
  className?: string
  /** Extra elements whose clicks shouldn't close the overlay (parent menus). */
  ignore?: (HTMLElement | null)[]
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const ignoreRef = useRef(ignore)
  ignoreRef.current = ignore
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useLayoutEffect(() => {
    const place = () => {
      if (!anchor || !ref.current) return
      const a = anchor.getBoundingClientRect()
      const o = ref.current.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      let top: number
      let left: number
      if (side === 'bottom') {
        top = a.bottom + 4
        left = align === 'end' ? a.right - o.width : a.left
        if (top + o.height > vh - 8 && a.top - o.height - 4 > 8) top = a.top - o.height - 4
      } else if (side === 'left') {
        top = a.top - 8
        left = a.left - o.width - 4
        if (left < 8) left = a.right + 4
      } else {
        top = a.top - 8
        left = a.right + 4
        if (left + o.width > vw - 8) left = a.left - o.width - 4
      }
      left = Math.max(8, Math.min(left, vw - o.width - 8))
      top = Math.max(8, Math.min(top, vh - o.height - 8))
      setPos({ top, left })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [anchor, align, side])

  useEffect(() => {
    const down = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node
      if (ref.current?.contains(t) || anchor?.contains(t)) return
      if (ignoreRef.current.some((el) => el?.contains(t))) return
      // Clicks inside another overlay opened from this one are handled there.
      if ((t as HTMLElement).closest?.('.Overlay')) return
      closeRef.current()
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeRef.current()
      }
    }
    document.addEventListener('mousedown', down)
    document.addEventListener('touchstart', down)
    document.addEventListener('keydown', key, true)
    return () => {
      document.removeEventListener('mousedown', down)
      document.removeEventListener('touchstart', down)
      document.removeEventListener('keydown', key, true)
    }
  }, [anchor])

  return createPortal(
    <div
      ref={ref}
      className={`Overlay ${className}`}
      style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, width, visibility: pos ? 'visible' : 'hidden' }}
      role="dialog"
    >
      {children}
    </div>,
    document.body,
  )
}

export function MenuHeading({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="Menu-heading">
      <div>{children}</div>
      {sub && <div className="Menu-subheading">{sub}</div>}
    </div>
  )
}

export function MenuItem({
  children,
  leading,
  trailing,
  description,
  checked,
  selectable,
  onSelect,
  danger,
  active,
  itemRef,
  onMouseEnter,
  role = 'menuitem',
}: {
  children: ReactNode
  leading?: ReactNode
  trailing?: ReactNode
  description?: ReactNode
  checked?: boolean
  selectable?: boolean
  onSelect?: (e: React.MouseEvent | React.KeyboardEvent) => void
  danger?: boolean
  active?: boolean
  itemRef?: (el: HTMLLIElement | null) => void
  onMouseEnter?: () => void
  role?: string
}) {
  return (
    <li
      ref={itemRef}
      role={role}
      aria-checked={selectable ? !!checked : undefined}
      tabIndex={0}
      className={`MenuItem${danger ? ' MenuItem--danger' : ''}${active ? ' MenuItem--active' : ''}`}
      onClick={(e) => onSelect?.(e)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect?.(e)
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          ;((e.currentTarget.nextElementSibling ?? e.currentTarget.parentElement?.firstElementChild) as HTMLElement | null)?.focus()
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          ;((e.currentTarget.previousElementSibling ?? e.currentTarget.parentElement?.lastElementChild) as HTMLElement | null)?.focus()
        }
      }}
      onMouseEnter={onMouseEnter}
    >
      {selectable && <span className="MenuItem-check">{checked && <CheckIcon size={16} />}</span>}
      {leading && <span className="MenuItem-leading">{leading}</span>}
      <span className="MenuItem-main">
        <span className="MenuItem-label">{children}</span>
        {description && <span className="MenuItem-description">{description}</span>}
      </span>
      {trailing && <span className="MenuItem-trailing">{trailing}</span>}
    </li>
  )
}

export function MenuDivider() {
  return <li className="Menu-divider" role="separator" />
}

/** Button + overlay pair with its open state handled internally. */
export function useMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)
  return { open, setOpen, ref, toggle: () => setOpen((o) => !o), close: () => setOpen(false) }
}
