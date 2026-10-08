import { TriangleDownIcon, XIcon } from '@primer/octicons-react'
import type { Item, ViewConfig } from '../types'
import { FIELDS, MILESTONES } from '../store'
import { FieldIcon, fieldName } from './FieldIcon'
import { Avatar, ColorDecorator, Counter, MenuDivider, MenuHeading, MenuItem, Overlay, useMenu } from './primitives'

export const SLICEABLE = ['status', 'client', 'phase', 'assignees', 'milestone']

export interface SliceValue {
  key: string
  name: string
  count: number
  color?: Parameters<typeof ColorDecorator>[0]['color']
  avatar?: string
}

/** Values of the slice field among the filtered items, in field order, with counts. */
export function sliceValues(fieldId: string, items: Item[]): SliceValue[] {
  const field = FIELDS.find((f) => f.id === fieldId)
  const out: SliceValue[] = []
  const none = { key: '__none', name: `No ${field?.name ?? fieldId}`, count: 0 }
  if (field?.type === 'single_select') {
    for (const o of field.options ?? []) out.push({ key: o.id, name: o.name, color: o.color, count: items.filter((i) => i.fields[fieldId as 'status'] === o.id).length })
    none.count = items.filter((i) => !i.fields[fieldId as 'status']).length
  } else if (fieldId === 'assignees') {
    const logins = [...new Set(items.flatMap((i) => i.fields.assignees ?? []))].sort()
    for (const l of logins) out.push({ key: l, name: l, avatar: l, count: items.filter((i) => i.fields.assignees?.includes(l)).length })
    none.count = items.filter((i) => !(i.fields.assignees ?? []).length).length
  } else if (fieldId === 'milestone') {
    for (const m of MILESTONES) {
      const c = items.filter((i) => i.fields.milestone === m.id).length
      if (c) out.push({ key: m.id, name: m.title, count: c })
    }
    none.count = items.filter((i) => !i.fields.milestone).length
  }
  return none.count ? [...out, none] : out
}

export function matchesSlice(item: Item, fieldId: string, key: string) {
  if (fieldId === 'assignees') return key === '__none' ? !(item.fields.assignees ?? []).length : !!item.fields.assignees?.includes(key)
  const v = item.fields[fieldId as 'status']
  return key === '__none' ? !v : v === key
}

export function SliceMenu({ view, update, onDone }: { view: ViewConfig; update: (p: Partial<ViewConfig>) => void; onDone: () => void }) {
  return (
    <ul className="Menu" role="menu">
      <MenuHeading>Slice by</MenuHeading>
      {SLICEABLE.map((id) => (
        <MenuItem
          key={id}
          role="menuitemradio"
          leading={<FieldIcon fieldId={id} />}
          active={view.sliceBy === id}
          onSelect={() => {
            update({ sliceBy: id })
            onDone()
          }}
        >
          {fieldName(id)}
        </MenuItem>
      ))}
      <MenuDivider />
      <MenuItem
        role="menuitemradio"
        selectable
        checked={!view.sliceBy}
        onSelect={() => {
          update({ sliceBy: null })
          onDone()
        }}
      >
        No slicing
      </MenuItem>
    </ul>
  )
}

export function SlicePanel({
  view,
  items,
  selected,
  onSelect,
  update,
}: {
  view: ViewConfig
  items: Item[]
  selected: string | null
  onSelect: (key: string | null) => void
  update: (p: Partial<ViewConfig>) => void
}) {
  const m = useMenu()
  const values = sliceValues(view.sliceBy!, items)
  return (
    <aside className="SlicePanel" aria-label={`Slice by ${fieldName(view.sliceBy!)}`}>
      <div className="SlicePanel-header">
        <button ref={m.ref} type="button" className="SlicePanel-field" onClick={m.toggle} aria-expanded={m.open}>
          <FieldIcon fieldId={view.sliceBy!} />
          <span>{fieldName(view.sliceBy!)}</span>
          <TriangleDownIcon />
        </button>
        <button type="button" className="SlicePanel-close" aria-label="Turn off slicing" onClick={() => update({ sliceBy: null })}>
          <XIcon />
        </button>
      </div>
      <ul className="SlicePanel-list">
        {values.map((v) => (
          <li key={v.key}>
            <button type="button" className={`SlicePanel-item${selected === v.key ? ' is-selected' : ''}`} aria-pressed={selected === v.key} onClick={() => onSelect(selected === v.key ? null : v.key)}>
              {v.color && <ColorDecorator color={v.color} />}
              {v.avatar && <Avatar login={v.avatar} size={16} />}
              <span className="SlicePanel-name">{v.name}</span>
              <Counter>{v.count}</Counter>
            </button>
          </li>
        ))}
      </ul>
      {m.open && (
        <Overlay anchor={m.ref.current} onClose={m.close} width={240}>
          <SliceMenu view={view} update={update} onDone={m.close} />
        </Overlay>
      )}
    </aside>
  )
}
