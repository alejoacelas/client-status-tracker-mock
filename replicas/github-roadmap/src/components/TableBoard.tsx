import { useState } from 'react'
import { ChevronDownIcon, KebabHorizontalIcon, SortAscIcon, SortDescIcon, TriangleDownIcon } from '@primer/octicons-react'
import type { Item, ItemFields, ViewConfig } from '../types'
import { FIELDS, useStore } from '../store'
import type { Group } from '../lib/view'
import { AddItem } from './AddItem'
import { EDITABLE, FieldEditor, FieldValue } from './FieldEditors'
import { fieldName } from './FieldIcon'
import { Avatar, AvatarStack, ColorDecorator, Counter, ItemIcon, MenuDivider, MenuItem, Overlay, Token, useMenu } from './primitives'
import { optionFor } from '../lib/fields'

const COL_W: Record<string, number> = { title: 400, assignees: 180, progress: 110, subIssuesProgress: 220 }

function preset(view: ViewConfig, g: Group): ItemFields {
  if (!view.groupBy || !g.value) return {}
  if (view.groupBy === 'assignees') return { assignees: [g.value] }
  if (['status', 'client', 'phase', 'start', 'target', 'milestone'].includes(view.groupBy)) return { [view.groupBy]: g.value } as ItemFields
  return {}
}

function ColumnHeader({ view, fieldId }: { view: ViewConfig; fieldId: string }) {
  const store = useStore()
  const m = useMenu()
  const s = view.sort.findIndex((x) => x.field === fieldId)
  const spec = view.sort[s]
  const update = (patch: Partial<ViewConfig>) => store.updateView(view.id, patch)
  return (
    <div className="Table-th" style={{ width: COL_W[fieldId] ?? 160 }} role="columnheader">
      <span className="Table-thName">{fieldName(fieldId)}</span>
      {spec && (
        <span className="SortIndicator fgMuted">
          {spec.dir === 'asc' ? <SortAscIcon size={16} /> : <SortDescIcon size={16} />}
          {view.sort.length > 1 ? s + 1 : ''}
        </span>
      )}
      <button ref={m.ref} type="button" className="Table-thMenu" aria-label={`${fieldName(fieldId)} column options`} onClick={m.toggle}>
        <KebabHorizontalIcon />
      </button>
      {m.open && (
        <Overlay anchor={m.ref.current} onClose={m.close} width={220} align="end">
          <ul className="Menu" role="menu">
            <MenuItem
              leading={<SortAscIcon />}
              onSelect={() => {
                update({ sort: [{ field: fieldId, dir: 'asc' }] })
                m.close()
              }}
            >
              Sort ascending
            </MenuItem>
            <MenuItem
              leading={<SortDescIcon />}
              onSelect={() => {
                update({ sort: [{ field: fieldId, dir: 'desc' }] })
                m.close()
              }}
            >
              Sort descending
            </MenuItem>
            {['status', 'client', 'phase', 'assignees', 'milestone', 'parent'].includes(fieldId) && (
              <MenuItem
                onSelect={() => {
                  update({ groupBy: fieldId })
                  m.close()
                }}
              >
                Group by values
              </MenuItem>
            )}
            {fieldId !== 'title' && (
              <>
                <MenuDivider />
                <MenuItem
                  onSelect={() => {
                    update({ fields: view.fields.filter((f) => f !== fieldId) })
                    m.close()
                  }}
                >
                  Hide field
                </MenuItem>
              </>
            )}
          </ul>
        </Overlay>
      )}
    </div>
  )
}

function Cell({ item, fieldId, items }: { item: Item; fieldId: string; items: Item[] }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const editable = EDITABLE.has(fieldId) && fieldId !== 'title'
  return (
    <div
      className={`Table-td${editable ? ' is-editable' : ''}${fieldId === 'progress' ? ' is-number' : ''}`}
      style={{ width: COL_W[fieldId] ?? 160 }}
      role="gridcell"
      tabIndex={editable ? 0 : -1}
      onClick={(e) => editable && setAnchor(e.currentTarget)}
      onKeyDown={(e) => editable && e.key === 'Enter' && setAnchor(e.currentTarget)}
    >
      <span className="Table-tdValue">
        <FieldValue item={item} fieldId={fieldId} items={items} />
      </span>
      {editable && FIELDS.find((f) => f.id === fieldId)?.type === 'single_select' && (
        <span className="Table-tdCaret">
          <TriangleDownIcon size={16} />
        </span>
      )}
      {anchor && <FieldEditor item={item} fieldId={fieldId} anchor={anchor} onClose={() => setAnchor(null)} />}
    </div>
  )
}

export function TableView({ view, groups, onOpenItem }: { view: ViewConfig; groups: Group[]; onOpenItem: (id: string) => void }) {
  const { items } = useStore()
  const cols = view.fields.filter((f) => f !== 'title')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const ungrouped = groups.length === 1 && groups[0].key === '__all'
  let n = 0
  return (
    <div className="Table-scroll">
      <div className="Table" role="grid">
        <div className="Table-head" role="row">
          <div className="Table-th Table-num" />
          <ColumnHeader view={view} fieldId="title" />
          {cols.map((c) => (
            <ColumnHeader key={c} view={view} fieldId={c} />
          ))}
          <div className="Table-th Table-fill" />
        </div>
        {groups.map((g) => {
          const isCollapsed = collapsed.has(g.key)
          return (
            <section key={g.key} className={`Table-group${ungrouped ? ' is-ungrouped' : ''}`}>
              {!ungrouped && (
                <div className="Table-groupHeader">
                  <button
                    type="button"
                    className="Roadmap-chevron"
                    aria-expanded={!isCollapsed}
                    aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} group ${g.name}`}
                    onClick={() =>
                      setCollapsed((s) => {
                        const x = new Set(s)
                        if (x.has(g.key)) x.delete(g.key)
                        else x.add(g.key)
                        return x
                      })
                    }
                  >
                    <ChevronDownIcon />
                  </button>
                  {g.color && <ColorDecorator color={g.color} />}
                  {view.groupBy === 'assignees' && g.value && <Avatar login={g.value} size={20} />}
                  <span className="Roadmap-groupName">{g.name}</span>
                  <Counter>{g.items.length}</Counter>
                </div>
              )}
              {!isCollapsed &&
                g.items.map((it) => {
                  n += 1
                  return (
                    <div key={it.id + g.key} className="Table-row" role="row">
                      <div className="Table-td Table-num">{n}</div>
                      <div className="Table-td Table-title" style={{ width: COL_W.title }}>
                        <ItemIcon item={it} />
                        <a
                          href={`#/views/${view.id}?pane=issue&item=${encodeURIComponent(it.id)}`}
                          className="Roadmap-titleLink"
                          onClick={(e) => {
                            e.preventDefault()
                            onOpenItem(it.id)
                          }}
                        >
                          {it.title}
                        </a>
                        {it.number !== undefined && <span className="Roadmap-number-ref">#{it.number}</span>}
                      </div>
                      {cols.map((c) => (
                        <Cell key={c} item={it} fieldId={c} items={items} />
                      ))}
                      <div className="Table-td Table-fill" />
                    </div>
                  )
                })}
              {!isCollapsed && (
                <div className="Table-row Table-addRow">
                  <AddItem preset={preset(view, g)} />
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

export function BoardView({ view, items: visible, onOpenItem }: { view: ViewConfig; items: Item[]; onOpenItem: (id: string) => void }) {
  const store = useStore()
  const field = FIELDS.find((f) => f.id === (view.groupBy ?? 'status'))!
  const [dragId, setDragId] = useState<string | null>(null)
  const [over, setOver] = useState<string | null>(null)
  const columns = [...(field.options ?? []).map((o) => ({ key: o.id, name: o.name, color: o.color, description: o.description })), { key: '__none', name: `No ${field.name}`, color: undefined, description: `Items without a ${field.name.toLowerCase()}` }]
  const valueOf = (it: Item) => (it.fields[field.id as 'status'] as string | undefined) ?? '__none'
  const cardFields = view.fields.filter((f) => f !== field.id && f !== 'title')

  return (
    <div className="Board">
      {columns
        .filter((c) => c.key !== '__none' || visible.some((i) => valueOf(i) === '__none'))
        .map((c) => {
          const colItems = visible.filter((i) => valueOf(i) === c.key)
          return (
            <section
              key={c.key}
              className={`Board-column${over === c.key ? ' is-over' : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                setOver(c.key)
              }}
              onDragLeave={() => setOver((o) => (o === c.key ? null : o))}
              onDrop={(e) => {
                e.preventDefault()
                if (dragId) store.setField(dragId, field.id as keyof ItemFields, c.key === '__none' ? undefined : c.key)
                setDragId(null)
                setOver(null)
              }}
            >
              <header className="Board-columnHeader">
                <div className="Board-columnTitle">
                  <ColorDecorator color={c.color} />
                  <h3>{c.name}</h3>
                  <Counter>{colItems.length}</Counter>
                  <span className="Board-columnMenu">
                    <KebabHorizontalIcon />
                  </span>
                </div>
                {c.description && <p className="Board-columnDescription">{c.description}</p>}
              </header>
              <div className="Board-cards">
                {colItems.map((it) => (
                  <article
                    key={it.id}
                    className={`Card${dragId === it.id ? ' is-dragging' : ''}`}
                    draggable
                    onDragStart={(e) => {
                      setDragId(it.id)
                      e.dataTransfer.effectAllowed = 'move'
                      e.dataTransfer.setData('text/plain', it.id)
                    }}
                    onDragEnd={() => {
                      setDragId(null)
                      setOver(null)
                    }}
                  >
                    <div className="Card-meta">
                      <ItemIcon item={it} />
                      <span>{it.type === 'draft' ? 'Draft' : `${it.repo?.split('/')[1]} #${it.number}`}</span>
                      {(it.fields.assignees ?? []).length > 0 && (
                        <span className="Card-avatars">
                          <AvatarStack logins={it.fields.assignees ?? []} />
                        </span>
                      )}
                    </div>
                    <a
                      className="Card-title"
                      href={`#/views/${view.id}?pane=issue&item=${encodeURIComponent(it.id)}`}
                      onClick={(e) => {
                        e.preventDefault()
                        onOpenItem(it.id)
                      }}
                    >
                      {it.title}
                    </a>
                    <div className="Card-fields">
                      {cardFields.map((f) => {
                        if (f === 'assignees') return null
                        const fd = FIELDS.find((x) => x.id === f)
                        if (fd?.type === 'single_select') {
                          const o = optionFor(fd, it.fields[f as 'client'])
                          return o ? <Token key={f} name={o.name} color={o.color} /> : null
                        }
                        return (
                          <span key={f} className="Card-field">
                            <FieldValue item={it} fieldId={f} items={store.items} />
                          </span>
                        )
                      })}
                    </div>
                  </article>
                ))}
              </div>
              <AddItem preset={c.key === '__none' ? {} : ({ [field.id]: c.key } as ItemFields)} className="Board-add" />
            </section>
          )
        })}
    </div>
  )
}
