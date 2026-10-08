import { useCallback, useEffect, useMemo, useState } from 'react'
import { useStore } from './store'
import { navigate, useRoute } from './lib/router'
import { groupItems, visibleItems } from './lib/view'
import { AppHeader, ProjectDetailsPane, ProjectHeader, ViewTabs } from './components/Header'
import { FilterBar } from './components/FilterBar'
import { RoadmapView } from './components/Roadmap'
import { BoardView, TableView } from './components/TableBoard'
import { SidePanel } from './components/SidePanel'
import { SlicePanel, matchesSlice, sliceValues } from './components/SlicePanel'

export default function App() {
  const store = useStore()
  const route = useRoute()
  const [paneOpen, setPaneOpen] = useState(false)
  const view = route.viewId !== null ? store.viewFor(route.viewId) : undefined

  useEffect(() => {
    if (!view && store.views.length) navigate(store.views[0].id, route.itemId)
  }, [view, store.views, route.itemId])

  const filtered = useMemo(() => (view ? visibleItems(store.items, view) : []), [store.items, view])
  const [slices, setSlices] = useState<Record<string, string | null>>({})
  const sliceKey = view?.sliceBy ? `${view.id}:${view.sliceBy}` : ''
  const sliceSel = useMemo(() => {
    if (!view?.sliceBy) return null
    if (sliceKey in slices) return slices[sliceKey]
    return sliceValues(view.sliceBy, filtered).find((v) => v.count > 0)?.key ?? null
  }, [view?.sliceBy, sliceKey, slices, filtered])
  const items = useMemo(() => (view?.sliceBy && sliceSel ? filtered.filter((i) => matchesSlice(i, view.sliceBy!, sliceSel)) : filtered), [filtered, view?.sliceBy, sliceSel])
  const groups = useMemo(() => (view ? groupItems(items, view.layout === 'board' ? null : view.groupBy, store.items) : []), [items, view, store.items])
  const openItem = useCallback((id: string) => navigate(route.viewId, id), [route.viewId])
  const closeItem = useCallback(() => navigate(route.viewId, null), [route.viewId])

  useEffect(() => {
    document.title = view ? `${view.name} · ${store.project.title}` : store.project.title
  }, [view, store.project.title])

  if (!view) return null
  return (
    <div className="App">
      <AppHeader />
      <main className="ProjectView">
        <ProjectHeader paneOpen={paneOpen} onTogglePane={() => setPaneOpen((o) => !o)} />
        <ViewTabs activeId={view.id} />
        <FilterBar view={view} count={items.length} />
        <div className={`ViewBody ViewBody--${view.layout}`}>
          {view.sliceBy && (
            <SlicePanel
              view={view}
              items={filtered}
              selected={sliceSel}
              onSelect={(k) => setSlices((s) => ({ ...s, [sliceKey]: k }))}
              update={(p) => store.updateView(view.id, p)}
            />
          )}
          <div className="ViewBody-main">
          {view.layout === 'roadmap' && <RoadmapView key={view.id} view={view} groups={groups} onOpenItem={openItem} />}
          {view.layout === 'table' && <TableView view={view} groups={groups} onOpenItem={openItem} />}
          {view.layout === 'board' && <BoardView view={view} items={items} onOpenItem={openItem} />}
          </div>
        </div>
      </main>
      {paneOpen && <ProjectDetailsPane onClose={() => setPaneOpen(false)} />}
      {route.itemId && <SidePanel itemId={route.itemId} onClose={closeItem} onOpenItem={openItem} />}
    </div>
  )
}
