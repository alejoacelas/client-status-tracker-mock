import { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@primer/octicons-react'
import type { Item, ItemFields } from '../types'
import { FIELDS, MILESTONES, SPRINTS, TODAY, USERS, useStore } from '../store'
import { MONTHS, WEEKDAYS_SHORT, dayOf, fmtShort, parts, toDay, toIso } from '../lib/dates'
import { optionFor, subIssueProgress } from '../lib/fields'
import { Avatar, AvatarStack, ColorDecorator, MenuDivider, MenuItem, Overlay, Token } from './primitives'

export function SingleSelectMenu({ fieldId, value, onChange }: { fieldId: string; value?: string; onChange: (v: string | undefined) => void }) {
  const field = FIELDS.find((f) => f.id === fieldId)!
  const [q, setQ] = useState('')
  const opts = (field.options ?? []).filter((o) => o.name.toLowerCase().includes(q.toLowerCase()))
  return (
    <div>
      <div className="Menu-filter">
        <input autoFocus placeholder="Filter options" value={q} onChange={(e) => setQ(e.target.value)} className="TextInput TextInput--block" />
      </div>
      <ul className="Menu" role="listbox">
        {opts.map((o) => (
          <MenuItem key={o.id} role="option" selectable checked={o.id === value} leading={<ColorDecorator color={o.color} />} description={o.description || undefined} onSelect={() => onChange(o.id)}>
            {o.name}
          </MenuItem>
        ))}
        {opts.length === 0 && <li className="Menu-empty">No options match</li>}
        {value && (
          <>
            <MenuDivider />
            <MenuItem onSelect={() => onChange(undefined)}>Clear {field.name.toLowerCase()}</MenuItem>
          </>
        )}
      </ul>
    </div>
  )
}

export function AssigneesMenu({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <ul className="Menu" role="listbox">
      {USERS.map((u) => (
        <MenuItem
          key={u.login}
          role="option"
          selectable
          checked={value.includes(u.login)}
          leading={<Avatar login={u.login} size={20} />}
          description={u.role}
          onSelect={() => onChange(value.includes(u.login) ? value.filter((l) => l !== u.login) : [...value, u.login])}
        >
          {u.login} <span className="fgMuted">{u.name}</span>
        </MenuItem>
      ))}
    </ul>
  )
}

export function Calendar({ value, onChange }: { value?: string; onChange: (v: string | undefined) => void }) {
  const sel = value ? toDay(value) : undefined
  const init = parts(sel ?? TODAY)
  const [ym, setYm] = useState({ y: init.y, m: init.m })
  const first = dayOf(ym.y, ym.m, 1)
  const lead = parts(first).wd
  const days = dayOf(ym.y, ym.m + 1, 1) - first
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => first + i)]
  const shift = (n: number) => {
    const p = parts(dayOf(ym.y, ym.m + n, 1))
    setYm({ y: p.y, m: p.m })
  }
  return (
    <div className="Calendar">
      <div className="Calendar-header">
        <button type="button" className="Calendar-nav" aria-label="Previous month" onClick={() => shift(-1)}>
          <ChevronLeftIcon />
        </button>
        <span className="Calendar-title">
          {MONTHS[ym.m]} {ym.y}
        </span>
        <button type="button" className="Calendar-nav" aria-label="Next month" onClick={() => shift(1)}>
          <ChevronRightIcon />
        </button>
      </div>
      <div className="Calendar-grid">
        {WEEKDAYS_SHORT.map((w) => (
          <span key={w} className="Calendar-weekday">
            {w.slice(0, 2)}
          </span>
        ))}
        {cells.map((d, i) =>
          d === null ? (
            <span key={`e${i}`} />
          ) : (
            <button
              key={d}
              type="button"
              className={`Calendar-day${d === sel ? ' is-selected' : ''}${d === TODAY ? ' is-today' : ''}`}
              onClick={() => onChange(toIso(d))}
              aria-label={fmtShort(d)}
            >
              {parts(d).d}
            </button>
          ),
        )}
      </div>
      <div className="Calendar-footer">
        <button type="button" className="Link" onClick={() => onChange(toIso(TODAY))}>
          Today
        </button>
        {value && (
          <button type="button" className="Link" onClick={() => onChange(undefined)}>
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

/** Read-only rendering of a field value, shared by the table, board and side panel. */
export function FieldValue({ item, fieldId, items }: { item: Item; fieldId: string; items: Item[] }) {
  const field = FIELDS.find((f) => f.id === fieldId)
  const f = item.fields
  switch (field?.type) {
    case 'single_select': {
      const o = optionFor(field, f[fieldId as 'status'])
      return o ? <Token name={o.name} color={o.color} /> : null
    }
    case 'assignees': {
      const a = f.assignees ?? []
      if (!a.length) return null
      return (
        <span className="AssigneeValue">
          <AvatarStack logins={a} />
          <span className="AssigneeValue-text">{a.join(', ')}</span>
        </span>
      )
    }
    case 'date': {
      const v = f[fieldId as 'start']
      return v ? <span>{fmtShort(toDay(v))}</span> : null
    }
    case 'number':
      return f.progress !== undefined ? <span className="NumberValue">{f.progress}</span> : null
    case 'milestone': {
      const m = MILESTONES.find((x) => x.id === f.milestone)
      return m ? <span className="TextValue">{m.title}</span> : null
    }
    case 'iteration': {
      const s = SPRINTS.find((x) => x.id === f.sprint)
      return s ? <span>{s.title}</span> : null
    }
    case 'parent_issue': {
      const p = items.find((x) => x.id === item.parent)
      return p ? (
        <span className="ParentToken">
          <span className="fgMuted">#{p.number}</span> {p.title}
        </span>
      ) : null
    }
    case 'sub_issues_progress': {
      const p = subIssueProgress(item, items)
      if (!p.total) return null
      return <SubIssueBar done={p.done} total={p.total} />
    }
  }
  return null
}

export function SubIssueBar({ done, total }: { done: number; total: number }) {
  return (
    <span className="SubIssueBar">
      <span className="SubIssueBar-count">
        {done} / {total}
      </span>
      <span className="SubIssueBar-track">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={i < done ? 'is-done' : ''} />
        ))}
      </span>
      <span className="SubIssueBar-pct">{Math.round((done / total) * 100)}%</span>
    </span>
  )
}

/** Opens the right editor for a field, anchored to `anchor`. */
export function FieldEditor({ item, fieldId, anchor, onClose }: { item: Item; fieldId: string; anchor: HTMLElement | null; onClose: () => void }) {
  const { setField } = useStore()
  const field = FIELDS.find((f) => f.id === fieldId)
  const set = (v: ItemFields[keyof ItemFields] | undefined) => setField(item.id, fieldId as keyof ItemFields, v)
  if (!field) return null
  if (field.type === 'single_select')
    return (
      <Overlay anchor={anchor} onClose={onClose} width={280}>
        <SingleSelectMenu
          fieldId={fieldId}
          value={item.fields[fieldId as 'status']}
          onChange={(v) => {
            set(v)
            onClose()
          }}
        />
      </Overlay>
    )
  if (field.type === 'assignees')
    return (
      <Overlay anchor={anchor} onClose={onClose} width={280}>
        <AssigneesMenu value={item.fields.assignees ?? []} onChange={(v) => set(v)} />
      </Overlay>
    )
  if (field.type === 'date')
    return (
      <Overlay anchor={anchor} onClose={onClose} width={264}>
        <Calendar
          value={item.fields[fieldId as 'start']}
          onChange={(v) => {
            set(v)
            onClose()
          }}
        />
      </Overlay>
    )
  if (field.type === 'iteration')
    return (
      <Overlay anchor={anchor} onClose={onClose} width={260}>
        <ul className="Menu" role="listbox">
          {SPRINTS.map((s) => (
            <MenuItem
              key={s.id}
              role="option"
              selectable
              checked={item.fields.sprint === s.id}
              description={`${fmtShort(toDay(s.startDate))} – ${fmtShort(toDay(s.startDate) + s.duration - 1)}`}
              onSelect={() => {
                set(s.id)
                onClose()
              }}
            >
              {s.title}
            </MenuItem>
          ))}
        </ul>
      </Overlay>
    )
  if (field.type === 'number')
    return (
      <Overlay anchor={anchor} onClose={onClose} width={200}>
        <div className="Menu-filter">
          <input
            autoFocus
            type="number"
            min={0}
            max={100}
            className="TextInput TextInput--block"
            defaultValue={item.fields.progress ?? ''}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const v = e.currentTarget.value
                set(v === '' ? undefined : Number(v))
                onClose()
              }
            }}
            onBlur={(e) => {
              const v = e.currentTarget.value
              set(v === '' ? undefined : Number(v))
            }}
          />
        </div>
      </Overlay>
    )
  return null
}

export const EDITABLE = new Set(['status', 'client', 'phase', 'assignees', 'start', 'target', 'progress', 'sprint'])
