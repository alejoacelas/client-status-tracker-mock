import { CalendarIcon, PlusIcon, SortAscIcon, SortDescIcon } from '@primer/octicons-react'
import type { SortSpec, ViewConfig, Zoom } from '../types'
import { FIELDS } from '../store'
import { GROUPABLE, MARKABLE, SORTABLE } from '../lib/fields'
import { FieldIcon, fieldName } from './FieldIcon'
import { MenuDivider, MenuHeading, MenuItem } from './primitives'

type Update = (patch: Partial<ViewConfig>) => void

export function GroupByMenu({ view, update, onDone, label = 'Group by' }: { view: ViewConfig; update: Update; onDone: () => void; label?: string }) {
  const options = view.layout === 'board' ? FIELDS.filter((f) => f.type === 'single_select' || f.type === 'iteration').map((f) => f.id) : GROUPABLE
  return (
    <ul className="Menu" role="menu">
      <MenuHeading>{label}</MenuHeading>
      {options.map((id) => (
        <MenuItem
          key={id}
          role="menuitemradio"
          leading={<FieldIcon fieldId={id} />}
          active={view.groupBy === id}
          onSelect={() => {
            update({ groupBy: id })
            onDone()
          }}
        >
          {fieldName(id)}
        </MenuItem>
      ))}
      {view.layout !== 'board' && (
        <>
          <MenuDivider />
          <MenuItem
            role="menuitemradio"
            selectable
            checked={!view.groupBy}
            onSelect={() => {
              update({ groupBy: null })
              onDone()
            }}
          >
            No grouping
          </MenuItem>
        </>
      )}
    </ul>
  )
}

/** Sort menu: pick up to two fields; picking a sorted field flips its direction. */
export function SortMenu({ view, update, onDone }: { view: ViewConfig; update: Update; onDone: () => void }) {
  const toggle = (id: string) => {
    const idx = view.sort.findIndex((s) => s.field === id)
    let sort: SortSpec[]
    if (idx >= 0) sort = view.sort.map((s, i) => (i === idx ? { ...s, dir: s.dir === 'asc' ? 'desc' : 'asc' } : s))
    else sort = [...view.sort, { field: id, dir: 'asc' as const }].slice(-2)
    update({ sort })
  }
  return (
    <ul className="Menu" role="menu">
      <MenuHeading sub="Select up to 2 fields">Sort by</MenuHeading>
      {SORTABLE.map((id) => {
        const idx = view.sort.findIndex((s) => s.field === id)
        const s = view.sort[idx]
        return (
          <MenuItem
            key={id}
            role="menuitemcheckbox"
            selectable
            checked={idx >= 0}
            leading={<FieldIcon fieldId={id} />}
            trailing={
              s && (
                <span className="SortIndicator" aria-label={`${s.dir === 'asc' ? 'Ascending' : 'Descending'}, sort ${idx + 1}`}>
                  {s.dir === 'asc' ? <SortAscIcon size={16} /> : <SortDescIcon size={16} />}
                  {idx + 1}
                </span>
              )
            }
            onSelect={() => toggle(id)}
          >
            {fieldName(id)}
          </MenuItem>
        )
      })}
      <MenuDivider />
      <MenuItem
        role="menuitemradio"
        selectable
        checked={view.sort.length === 0}
        onSelect={() => {
          update({ sort: [] })
          onDone()
        }}
      >
        No sorting
      </MenuItem>
    </ul>
  )
}

export function MarkersMenu({ view, update }: { view: ViewConfig; update: Update }) {
  const toggle = (id: string) => update({ markers: view.markers.includes(id) ? view.markers.filter((m) => m !== id) : [...view.markers, id] })
  return (
    <ul className="Menu" role="menu">
      <MenuHeading>Markers</MenuHeading>
      {MARKABLE.map((id) => (
        <MenuItem key={id} role="menuitemcheckbox" selectable checked={view.markers.includes(id)} leading={<FieldIcon fieldId={id} />} onSelect={() => toggle(id)}>
          {fieldName(id)}
        </MenuItem>
      ))}
    </ul>
  )
}

export function DateFieldsMenu({ view, update, onDone }: { view: ViewConfig; update: Update; onDone: () => void }) {
  const dateFields = FIELDS.filter((f) => f.type === 'date' || f.type === 'iteration')
  return (
    <ul className="Menu" role="menu">
      <MenuItem leading={<PlusIcon />} onSelect={onDone}>
        <span className="fgMuted">New field</span>
      </MenuItem>
      <MenuDivider />
      <MenuHeading>Start date</MenuHeading>
      {dateFields.map((f) => (
        <MenuItem key={f.id} role="menuitemradio" selectable checked={view.startField === f.id} leading={<FieldIcon fieldId={f.id} />} onSelect={() => update({ startField: f.id })}>
          {f.name}
        </MenuItem>
      ))}
      <MenuItem role="menuitemradio" selectable checked={!view.startField} onSelect={() => update({ startField: null })}>
        No start date
      </MenuItem>
      <MenuDivider />
      <MenuHeading>Target date</MenuHeading>
      {dateFields.map((f) => (
        <MenuItem key={f.id} role="menuitemradio" selectable checked={view.targetField === f.id} leading={<FieldIcon fieldId={f.id} />} onSelect={() => update({ targetField: f.id })}>
          {f.name}
        </MenuItem>
      ))}
      <MenuItem role="menuitemradio" selectable checked={!view.targetField} onSelect={() => update({ targetField: null })}>
        No target date
      </MenuItem>
    </ul>
  )
}

export const ZOOM_LABEL: Record<Zoom, string> = { month: 'Month', quarter: 'Quarter', year: 'Year' }

export function ZoomMenu({ view, update, onDone }: { view: ViewConfig; update: Update; onDone: () => void }) {
  return (
    <ul className="Menu" role="menu">
      <MenuHeading>Zoom level</MenuHeading>
      {(['month', 'quarter', 'year'] as Zoom[]).map((z) => (
        <MenuItem
          key={z}
          role="menuitemradio"
          selectable
          checked={view.zoom === z}
          onSelect={() => {
            update({ zoom: z })
            onDone()
          }}
        >
          {ZOOM_LABEL[z]}
        </MenuItem>
      ))}
    </ul>
  )
}

export function FieldsMenu({ view, update }: { view: ViewConfig; update: Update }) {
  const toggle = (id: string) => update({ fields: view.fields.includes(id) ? view.fields.filter((f) => f !== id) : [...view.fields, id] })
  return (
    <ul className="Menu" role="menu">
      <MenuHeading>Visible fields</MenuHeading>
      {FIELDS.filter((f) => f.id !== 'title').map((f) => (
        <MenuItem key={f.id} role="menuitemcheckbox" selectable checked={view.fields.includes(f.id)} leading={<FieldIcon fieldId={f.id} />} onSelect={() => toggle(f.id)}>
          {f.name}
        </MenuItem>
      ))}
    </ul>
  )
}

export function sortSummary(view: ViewConfig) {
  if (view.sort.length === 0) return 'manual'
  return view.sort.map((s) => fieldName(s.field)).join(', ')
}

export function datesSummary(view: ViewConfig) {
  const parts = [view.startField, view.targetField].filter(Boolean).map((f) => fieldName(f!))
  const uniq = [...new Set(parts)]
  return uniq.length ? uniq.join(', ') : 'none'
}

export function markersSummary(view: ViewConfig) {
  return view.markers.length ? view.markers.map(fieldName).join(', ') : 'none'
}

export { CalendarIcon }
