import { useEffect, useRef, useState } from 'react'
import {
  ChevronUpIcon,
  ChevronDownIcon,
  CopyIcon,
  IssueClosedIcon,
  IssueDraftIcon,
  IssueOpenedIcon,
  KebabHorizontalIcon,
  LockIcon,
  PinIcon,
  RepoIcon,
  TableIcon,
  XIcon,
} from '@primer/octicons-react'
import type { Item } from '../types'
import { FIELDS, MILESTONES, useStore } from '../store'
import { fmtShort, toDay } from '../lib/dates'
import { subIssueProgress } from '../lib/fields'
import { EDITABLE, FieldEditor, FieldValue } from './FieldEditors'
import { Avatar, Button, ItemIcon, MenuItem, Overlay, Token, useMenu } from './primitives'

function StateLabel({ item }: { item: Item }) {
  if (item.type === 'draft')
    return (
      <span className="StateLabel StateLabel--draft">
        <IssueDraftIcon /> Draft
      </span>
    )
  if (item.state === 'closed')
    return (
      <span className="StateLabel StateLabel--closed">
        <IssueClosedIcon /> Closed
      </span>
    )
  return (
    <span className="StateLabel StateLabel--open">
      <IssueOpenedIcon /> Open
    </span>
  )
}

function SidebarField({ item, fieldId, items }: { item: Item; fieldId: string; items: Item[] }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const field = FIELDS.find((f) => f.id === fieldId)!
  const editable = EDITABLE.has(fieldId)
  return (
    <div className="PanelField">
      <span className="PanelField-name">{field.name}</span>
      <button type="button" className={`PanelField-value${editable ? '' : ' is-readonly'}`} onClick={(e) => editable && setAnchor(e.currentTarget)} disabled={!editable}>
        <FieldValue item={item} fieldId={fieldId} items={items} />
        {!hasValue(item, fieldId, items) && <span className="fgMuted">{editable ? `Choose an option` : 'None'}</span>}
      </button>
      {anchor && <FieldEditor item={item} fieldId={fieldId} anchor={anchor} onClose={() => setAnchor(null)} />}
    </div>
  )
}

function hasValue(item: Item, fieldId: string, items: Item[]) {
  if (fieldId === 'subIssuesProgress') return subIssueProgress(item, items).total > 0
  if (fieldId === 'parent') return !!item.parent
  const v = item.fields[fieldId as keyof Item['fields']]
  return !(v === undefined || (Array.isArray(v) && v.length === 0))
}

export function SidePanel({ itemId, onClose, onOpenItem }: { itemId: string; onClose: () => void; onOpenItem: (id: string) => void }) {
  const store = useStore()
  const item = store.items.find((i) => i.id === itemId)
  const [projectOpen, setProjectOpen] = useState(true)
  const [editingTitle, setEditingTitle] = useState(false)
  const [comment, setComment] = useState('')
  const [assigneeAnchor, setAssigneeAnchor] = useState<HTMLElement | null>(null)
  const more = useMenu()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('.Overlay')) onClose()
    }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [onClose])

  useEffect(() => {
    panelRef.current?.focus()
  }, [itemId])

  if (!item) return null
  const parent = store.items.find((i) => i.id === item.parent)
  const subs = item.subIssues.map((id) => store.items.find((i) => i.id === id)).filter(Boolean) as Item[]
  const progress = subIssueProgress(item, store.items)
  const milestone = MILESTONES.find((m) => m.id === item.fields.milestone)
  const projectFields = ['client', 'phase', 'start', 'target', 'progress', 'sprint', 'subIssuesProgress', 'parent']

  return (
    <div className="SidePanel-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="SidePanel" role="dialog" aria-label={item.title} tabIndex={-1} ref={panelRef}>
        <div className="SidePanel-header">
          <div className="SidePanel-titleRow">
            {editingTitle ? (
              <input
                className="TextInput SidePanel-titleInput"
                autoFocus
                defaultValue={item.title}
                onBlur={(e) => {
                  const v = e.currentTarget.value.trim()
                  if (v) store.updateItem(item.id, { title: v })
                  setEditingTitle(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur()
                  if (e.key === 'Escape') setEditingTitle(false)
                }}
              />
            ) : (
              <h2 className="SidePanel-title">
                <span>{item.title}</span>
                {item.number !== undefined && <span className="SidePanel-number"> #{item.number}</span>}
              </h2>
            )}
            <div className="SidePanel-tools">
              <Button variant="invisible" leading={<CopyIcon />} ariaLabel="Copy link" onClick={() => navigator.clipboard?.writeText(window.location.href).catch(() => undefined)} />
              <Button variant="invisible" leading={<PinIcon />} ariaLabel="Pin" />
              <Button variant="invisible" leading={<KebabHorizontalIcon />} ariaLabel="More actions" btnRef={more.ref} onClick={more.toggle} />
              <Button variant="invisible" leading={<XIcon />} ariaLabel="Close panel" onClick={onClose} />
            </div>
          </div>
          <div className="SidePanel-meta">
            <StateLabel item={item} />
            {item.repo && (
              <span className="RepoPill">
                <RepoIcon size={16} />
                {item.repo}
                <span className="RepoPill-visibility">
                  <LockIcon size={12} /> Private
                </span>
              </span>
            )}
            <Button size="small" onClick={() => setEditingTitle(true)} className="SidePanel-edit">
              Edit title
            </Button>
          </div>
        </div>
        {more.open && (
          <Overlay anchor={more.ref.current} onClose={more.close} align="end" width={220}>
            <ul className="Menu" role="menu">
              <MenuItem
                onSelect={() => {
                  store.updateItem(item.id, { state: item.state === 'open' ? 'closed' : 'open' })
                  more.close()
                }}
              >
                {item.state === 'open' ? 'Close issue' : 'Reopen issue'}
              </MenuItem>
              <MenuItem onSelect={more.close}>Archive item</MenuItem>
            </ul>
          </Overlay>
        )}
        <div className="SidePanel-body">
          <div className="SidePanel-main">
            <div className="Comment">
              <div className="Comment-header">
                <Avatar login={item.author} size={24} />
                <strong>{item.author}</strong>
                <span className="fgMuted">opened on {fmtShort(toDay(item.createdAt))}</span>
              </div>
              <div className="Comment-body Markdown">
                {item.clientSummary !== undefined ? (
                  <>
                    <h3>Client summary</h3>
                    <p>{item.clientSummary}</p>
                    <h3>Internal notes</h3>
                    <p>{item.internalNotes}</p>
                  </>
                ) : parent ? (
                  <>
                    <p>
                      Milestone for{' '}
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          onOpenItem(parent.id)
                        }}
                      >
                        {parent.title} #{parent.number}
                      </a>
                      .
                    </p>
                    <p>
                      Due {item.fields.target ? fmtShort(toDay(item.fields.target)) : 'date not set'}
                      {item.closedOn ? `; completed ${fmtShort(toDay(item.closedOn))}.` : '.'}
                    </p>
                  </>
                ) : (
                  <p className="fgMuted">No description provided.</p>
                )}
              </div>
            </div>

            {subs.length > 0 && (
              <section className="SubIssues">
                <header className="SubIssues-header">
                  <h3>Sub-issues</h3>
                  <span className="Counter">
                    {progress.done} / {progress.total}
                  </span>
                  <span className="ProgressRing" style={{ '--pct': `${(progress.done / progress.total) * 100}%` } as React.CSSProperties} aria-hidden="true" />
                </header>
                <ul className="SubIssues-list">
                  {subs.map((s) => {
                    const st = FIELDS.find((f) => f.id === 'status')!.options!.find((o) => o.id === s.fields.status)
                    return (
                      <li key={s.id}>
                        <ItemIcon item={s} />
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            onOpenItem(s.id)
                          }}
                        >
                          {s.title}
                        </a>
                        <span className="fgMuted">#{s.number}</span>
                        <span className="SubIssues-right">
                          {s.fields.target && <span className="fgMuted">{fmtShort(toDay(s.fields.target))}</span>}
                          {st && <Token name={st.name} color={st.color} />}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}

            {item.comments.length > 0 && (
              <div className="Timeline">
                {item.comments.map((c, i) => (
                  <div key={i} className="Comment">
                    <div className="Comment-header">
                      <Avatar login={c.author} size={24} />
                      <strong>{c.author}</strong>
                      <span className="fgMuted">commented on {fmtShort(toDay(c.date))}</span>
                      <span className="Comment-labels">
                        <span className="Label">via {c.source}</span>
                        {!c.clientVisible && <span className="Label Label--attention">Internal</span>}
                      </span>
                    </div>
                    <div className="Comment-body">
                      <p>{c.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="CommentBox">
              <Avatar login="maya-chen" size={32} />
              <div className="CommentBox-main">
                <textarea className="TextInput CommentBox-input" placeholder="Use Markdown to format your comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />
                <div className="CommentBox-actions">
                  <Button
                    variant="primary"
                    disabled={!comment.trim()}
                    onClick={() => {
                      store.updateItem(item.id, { comments: [...item.comments, { author: 'maya-chen', date: '2026-10-08', source: 'Manual', clientVisible: true, body: comment.trim() }] })
                      setComment('')
                    }}
                  >
                    Comment
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <aside className="SidePanel-sidebar">
            <section className="Sidebar-section">
              <button type="button" className="Sidebar-heading Sidebar-headingButton" onClick={(e) => setAssigneeAnchor(e.currentTarget)}>
                Assignees
              </button>
              {(item.fields.assignees ?? []).length === 0 ? (
                <p className="fgMuted Sidebar-empty">No one assigned</p>
              ) : (
                (item.fields.assignees ?? []).map((a) => (
                  <div key={a} className="Sidebar-assignee">
                    <Avatar login={a} size={20} /> <span>{a}</span>
                  </div>
                ))
              )}
              {assigneeAnchor && <FieldEditor item={item} fieldId="assignees" anchor={assigneeAnchor} onClose={() => setAssigneeAnchor(null)} />}
            </section>
            <section className="Sidebar-section">
              <h3 className="Sidebar-heading">Labels</h3>
              <p className="fgMuted Sidebar-empty">No labels</p>
            </section>
            <section className="Sidebar-section">
              <h3 className="Sidebar-heading">Projects</h3>
              <div className="ProjectCard">
                <div className="ProjectCard-title">
                  <TableIcon size={16} />
                  <span>{store.project.title}</span>
                </div>
                <div className="ProjectCard-status">
                  <SidebarField item={item} fieldId="status" items={store.items} />
                  <button type="button" className="ProjectCard-toggle" aria-expanded={projectOpen} aria-label={projectOpen ? 'Collapse fields' : 'Expand fields'} onClick={() => setProjectOpen((o) => !o)}>
                    {projectOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  </button>
                </div>
                {projectOpen && (
                  <div className="ProjectCard-fields">
                    {projectFields.map((f) => (
                      <SidebarField key={f} item={item} fieldId={f} items={store.items} />
                    ))}
                  </div>
                )}
              </div>
            </section>
            <section className="Sidebar-section">
              <h3 className="Sidebar-heading">Milestone</h3>
              {milestone ? (
                <div className="Sidebar-milestone">
                  <div className="Sidebar-milestoneBar">
                    <span style={{ width: milestone.state === 'closed' ? '100%' : '0%' }} />
                  </div>
                  <span>{milestone.title}</span>
                  <span className="fgMuted">Due by {fmtShort(toDay(milestone.dueOn))}</span>
                </div>
              ) : (
                <p className="fgMuted Sidebar-empty">No milestone</p>
              )}
            </section>
            <section className="Sidebar-section">
              <h3 className="Sidebar-heading">Relationships</h3>
              {parent ? (
                <p className="Sidebar-empty">
                  Parent issue:{' '}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      onOpenItem(parent.id)
                    }}
                  >
                    {parent.title} #{parent.number}
                  </a>
                </p>
              ) : (
                <p className="fgMuted Sidebar-empty">{subs.length ? `${subs.length} sub-issues` : 'None yet'}</p>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
