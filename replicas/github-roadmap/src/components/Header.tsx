import { useRef, useState } from 'react'
import {
  ArchiveIcon,
  CopyIcon,
  GearIcon,
  GitPullRequestIcon,
  GraphIcon,
  InboxIcon,
  IssueOpenedIcon,
  KebabHorizontalIcon,
  LockIcon,
  PencilIcon,
  PlusIcon,
  ProjectIcon,
  ProjectRoadmapIcon,
  SearchIcon,
  SidebarCollapseIcon,
  SidebarExpandIcon,
  TableIcon,
  ThreeBarsIcon,
  TrashIcon,
  TriangleDownIcon,
  WorkflowIcon,
  XIcon,
} from '@primer/octicons-react'
import type { Layout } from '../types'
import { DATA, useStore } from '../store'
import { navigate } from '../lib/router'
import { fmtShort, toDay } from '../lib/dates'
import { Avatar, Button, MenuDivider, MenuItem, Overlay, Token, useMenu } from './primitives'

export function BrandMark({ size = 32 }: { size?: number }) {
  // Placeholder mark: no third-party logo.
  return (
    <span className="BrandMark" style={{ width: size, height: size, fontSize: size * 0.5 }} aria-hidden="true">
      F
    </span>
  )
}

export function AppHeader() {
  const [navOpen, setNavOpen] = useState(false)
  return (
    <header className="AppHeader">
      <div className="AppHeader-left">
        <Button variant="default" ariaLabel="Open global navigation menu" leading={<ThreeBarsIcon />} onClick={() => setNavOpen(true)} className="AppHeader-button" />
        <a className="AppHeader-logo" href="#/" aria-label="Fieldwork Studio home">
          <BrandMark />
        </a>
        <nav className="AppHeader-context" aria-label="Breadcrumbs">
          <a href="#/" className="AppHeader-crumb">
            fieldwork-studio
          </a>
        </nav>
      </div>
      <div className="AppHeader-right">
        <button className="AppHeader-search" type="button">
          <SearchIcon />
          <span className="AppHeader-searchText">
            Type <kbd>/</kbd> to search
          </span>
        </button>
        <span className="AppHeader-divider" />
        <Button variant="default" ariaLabel="Create something new" leading={<PlusIcon />} trailing={<TriangleDownIcon />} className="AppHeader-button AppHeader-wide hide-sm" />
        <Button variant="default" ariaLabel="Your issues" leading={<IssueOpenedIcon />} className="AppHeader-button hide-sm" />
        <Button variant="default" ariaLabel="Your pull requests" leading={<GitPullRequestIcon />} className="AppHeader-button hide-sm" />
        <Button variant="default" ariaLabel="You have unread notifications" leading={<InboxIcon />} className="AppHeader-button AppHeader-inbox" />
        <Avatar login="maya-chen" size={32} />
      </div>
      {navOpen && (
        <div className="Dialog-backdrop" onClick={() => setNavOpen(false)}>
          <aside className="GlobalNav" onClick={(e) => e.stopPropagation()} aria-label="Global navigation">
            <div className="GlobalNav-header">
              <BrandMark />
              <Button variant="invisible" ariaLabel="Close" leading={<XIcon />} onClick={() => setNavOpen(false)} />
            </div>
            <ul className="GlobalNav-list">
              {['Home', 'Issues', 'Pull requests', 'Projects', 'Discussions'].map((l) => (
                <li key={l} className={l === 'Projects' ? 'is-active' : ''}>
                  {l}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      )}
    </header>
  )
}

export function ProjectHeader({ paneOpen, onTogglePane }: { paneOpen: boolean; onTogglePane: () => void }) {
  const { project, reset } = useStore()
  const menu = useMenu()
  return (
    <div className="ProjectHeader">
      <h1 className="ProjectHeader-title">
        <LockIcon size={16} className="ProjectHeader-visibility" aria-label="Private project" />
        <span className="ProjectHeader-name">{project.title}</span>
      </h1>
      <div className="ProjectHeader-actions">
        <span className="hide-sm">
          <Token name={project.status.label} color={project.status.color} title={`Status update: ${project.status.label}`} onClick={onTogglePane} />
        </span>
        <Button leading={<GraphIcon />} ariaLabel="Insights" className="ProjectHeader-insights">
          <span className="hide-sm">Insights</span>
        </Button>
        <div className="ButtonGroup">
          <Button
            leading={paneOpen ? <SidebarExpandIcon /> : <SidebarCollapseIcon />}
            ariaLabel={paneOpen ? 'Close project details' : 'Open project details'}
            onClick={onTogglePane}
          />
          <Button leading={<KebabHorizontalIcon />} ariaLabel="View more options" btnRef={menu.ref} onClick={menu.toggle} ariaExpanded={menu.open} />
        </div>
        {menu.open && (
          <Overlay anchor={menu.ref.current} onClose={menu.close} align="end" width={240}>
            <ul className="Menu" role="menu">
              <MenuItem leading={<WorkflowIcon />} onSelect={menu.close}>
                Workflows
              </MenuItem>
              <MenuItem leading={<ArchiveIcon />} onSelect={menu.close}>
                Archived items
              </MenuItem>
              <MenuItem leading={<CopyIcon />} onSelect={menu.close}>
                Make a copy
              </MenuItem>
              <MenuItem leading={<GearIcon />} onSelect={menu.close}>
                Settings
              </MenuItem>
              <MenuDivider />
              <MenuItem
                danger
                leading={<TrashIcon />}
                description="Clears edits stored in this browser"
                onSelect={() => {
                  if (window.confirm('Reset the demo data? Your edits in this browser will be lost.')) {
                    reset()
                    navigate(1)
                  }
                  menu.close()
                }}
              >
                Reset demo data
              </MenuItem>
            </ul>
          </Overlay>
        )}
      </div>
    </div>
  )
}

export function LayoutIcon({ layout, size = 16 }: { layout: Layout; size?: number }) {
  if (layout === 'board') return <ProjectIcon size={size} />
  if (layout === 'roadmap') return <ProjectRoadmapIcon size={size} />
  return <TableIcon size={size} />
}

export function ViewTabs({ activeId }: { activeId: number }) {
  const store = useStore()
  const tabMenu = useMenu()
  const newMenu = useMenu()
  const [renaming, setRenaming] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="ViewTabs">
      <nav className="ViewTabs-list" aria-label="Views">
        {store.views.map((saved) => {
          const v = store.viewFor(saved.id)!
          const active = v.id === activeId
          return (
            <div key={v.id} className={`ViewTab${active ? ' is-active' : ''}`}>
              <a
                href={`#/views/${v.id}`}
                className="ViewTab-link"
                aria-current={active ? 'page' : undefined}
                onDoubleClick={(e) => {
                  e.preventDefault()
                  setRenaming(v.id)
                }}
              >
                <LayoutIcon layout={v.layout} />
                {renaming === v.id ? (
                  <input
                    ref={inputRef}
                    autoFocus
                    className="ViewTab-input"
                    defaultValue={v.name}
                    onFocus={(e) => e.currentTarget.select()}
                    onBlur={(e) => {
                      store.renameView(v.id, e.currentTarget.value.trim() || v.name)
                      setRenaming(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur()
                      if (e.key === 'Escape') setRenaming(null)
                    }}
                  />
                ) : (
                  <span className="ViewTab-name">{v.name}</span>
                )}
              </a>
              {active && (
                <button
                  ref={tabMenu.ref}
                  type="button"
                  className="ViewTab-menu"
                  aria-label={`View options for ${v.name}`}
                  aria-expanded={tabMenu.open}
                  onClick={tabMenu.toggle}
                >
                  <TriangleDownIcon size={16} />
                  {store.isDirty(v.id) && <span className="ViewTab-dirty" aria-label="Unsaved changes" />}
                </button>
              )}
            </div>
          )
        })}
        <button ref={newMenu.ref} type="button" className="ViewTabs-new" onClick={newMenu.toggle} aria-expanded={newMenu.open}>
          <PlusIcon />
          <span>New view</span>
        </button>
      </nav>
      {tabMenu.open && (
        <Overlay anchor={tabMenu.ref.current} onClose={tabMenu.close} width={256}>
          <ul className="Menu" role="menu">
            <MenuItem
              leading={<PencilIcon />}
              onSelect={() => {
                setRenaming(activeId)
                tabMenu.close()
              }}
            >
              Rename view
            </MenuItem>
            {store.isDirty(activeId) && (
              <>
                <MenuItem
                  onSelect={() => {
                    store.saveView(activeId)
                    tabMenu.close()
                  }}
                >
                  Save changes
                </MenuItem>
                <MenuItem
                  onSelect={() => {
                    store.discardView(activeId)
                    tabMenu.close()
                  }}
                >
                  Discard changes
                </MenuItem>
              </>
            )}
            <MenuItem
              leading={<CopyIcon />}
              onSelect={() => {
                const id = store.duplicateView(activeId)
                tabMenu.close()
                navigate(id)
              }}
            >
              Duplicate view
            </MenuItem>
            <MenuDivider />
            <MenuItem
              danger
              leading={<TrashIcon />}
              onSelect={() => {
                tabMenu.close()
                if (store.views.length <= 1) return
                if (window.confirm('Delete this view? This cannot be undone.')) {
                  const next = store.views.find((v) => v.id !== activeId)!
                  store.deleteView(activeId)
                  navigate(next.id)
                }
              }}
            >
              Delete view
            </MenuItem>
          </ul>
        </Overlay>
      )}
      {newMenu.open && (
        <Overlay anchor={newMenu.ref.current} onClose={newMenu.close} width={200}>
          <ul className="Menu" role="menu">
            {(['table', 'board', 'roadmap'] as Layout[]).map((l) => (
              <MenuItem
                key={l}
                leading={<LayoutIcon layout={l} />}
                onSelect={() => {
                  const id = store.addView(l)
                  newMenu.close()
                  navigate(id)
                }}
              >
                {l[0].toUpperCase() + l.slice(1)}
              </MenuItem>
            ))}
          </ul>
        </Overlay>
      )}
    </div>
  )
}

export function ProjectDetailsPane({ onClose }: { onClose: () => void }) {
  const { project } = useStore()
  return (
    <aside className="ProjectPane" aria-label="Project details">
      <div className="ProjectPane-header">
        <h2>Project details</h2>
        <Button variant="invisible" ariaLabel="Close project details" leading={<XIcon />} onClick={onClose} />
      </div>
      <section className="ProjectPane-section">
        <h3>Status update</h3>
        <div className="StatusUpdate">
          <div className="StatusUpdate-meta">
            <Token name={project.status.label} color={project.status.color} />
            <span className="fgMuted">
              <Avatar login="maya-chen" size={16} /> maya-chen · {fmtShort(toDay(project.status.date))}
            </span>
          </div>
          <p>{project.status.body}</p>
        </div>
      </section>
      <section className="ProjectPane-section">
        <h3>Short description</h3>
        <p>{project.shortDescription}</p>
      </section>
      <section className="ProjectPane-section">
        <h3>README</h3>
        <p className="fgMuted">
          Internal delivery tracker for {DATA.org}. Each issue is one client project; milestones are tracked as sub-issues. Client-facing summaries live in
          each issue body.
        </p>
      </section>
    </aside>
  )
}
