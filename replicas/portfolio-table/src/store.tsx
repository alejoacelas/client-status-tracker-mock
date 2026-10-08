import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  defaultView,
  initialData,
  TODAY,
  type Data,
  type FieldDef,
  type ItemRef,
  type Milestone,
  type Portfolio,
  type PortfolioView,
  type Project,
  type StatusKey,
  type StatusUpdate,
} from './data/mock';
import { diffDays } from './lib/dates';

const STORAGE_KEY = 'fieldwork-portfolio-replica-v1';

function load(): Data {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Data;
  } catch {
    /* storage unavailable */
  }
  return initialData();
}

let idCounter = Date.now() % 100000;
export const newId = (prefix: string) => `${prefix}${(idCounter++).toString(36)}`;

/* ------------------------------------------------------------------ */
/* Selectors                                                           */
/* ------------------------------------------------------------------ */

export const refKey = (r: ItemRef) => `${r.type}:${r.id}`;

export function latestUpdate(data: Data, ref: ItemRef): StatusUpdate | undefined {
  const list = data.updates.filter((u) => u.parent.type === ref.type && u.parent.id === ref.id);
  list.sort((a, b) => (a.date === b.date ? data.updates.indexOf(b) - data.updates.indexOf(a) : b.date.localeCompare(a.date)));
  return list[0];
}

export function updatesFor(data: Data, ref: ItemRef): StatusUpdate[] {
  const list = data.updates.filter((u) => u.parent.type === ref.type && u.parent.id === ref.id);
  return list.sort((a, b) => (a.date === b.date ? data.updates.indexOf(b) - data.updates.indexOf(a) : b.date.localeCompare(a.date)));
}

/** Status shown in the portfolio's Status column. Updates older than ~3 months don't count. */
export function itemStatus(data: Data, ref: ItemRef): { status: StatusKey | null; date: string | null; update?: StatusUpdate } {
  const u = latestUpdate(data, ref);
  if (!u || diffDays(u.date, TODAY) > 92) return { status: null, date: null, update: u };
  return { status: u.status, date: u.date, update: u };
}

export const getProject = (data: Data, id: string) => data.projects.find((p) => p.id === id);
export const getPortfolio = (data: Data, id: string) => data.portfolios.find((p) => p.id === id);
export const getPerson = (data: Data, id: string | null | undefined) => data.people.find((p) => p.id === id);
export const getField = (data: Data, id: string) => data.fields.find((f) => f.id === id);

export function projectsDeep(data: Data, portfolioId: string, seen = new Set<string>()): Project[] {
  if (seen.has(portfolioId)) return [];
  seen.add(portfolioId);
  const pf = getPortfolio(data, portfolioId);
  if (!pf) return [];
  const out: Project[] = [];
  for (const it of pf.items) {
    if (it.type === 'project') {
      const p = getProject(data, it.id);
      if (p && !out.includes(p)) out.push(p);
    } else {
      for (const p of projectsDeep(data, it.id, seen)) if (!out.includes(p)) out.push(p);
    }
  }
  return out;
}

export const milestonesFor = (data: Data, projectId: string): Milestone[] =>
  data.milestones.filter((m) => m.projectId === projectId).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

export interface ItemInfo {
  ref: ItemRef;
  name: string;
  color: string;
  ownerId: string | null;
  startDate: string | null;
  dueDate: string | null;
  progress: number;
  milestones: Milestone[];
  projectCount: number;
  portfolioCount: number;
  archived?: boolean;
}

export function itemInfo(data: Data, ref: ItemRef): ItemInfo | null {
  if (ref.type === 'project') {
    const p = getProject(data, ref.id);
    if (!p) return null;
    return {
      ref, name: p.name, color: p.color, ownerId: p.ownerId, startDate: p.startDate, dueDate: p.dueDate,
      progress: p.progress, milestones: milestonesFor(data, p.id), projectCount: 0, portfolioCount: 0, archived: p.archived,
    };
  }
  const pf = getPortfolio(data, ref.id);
  if (!pf) return null;
  const projs = projectsDeep(data, pf.id);
  const starts = projs.map((p) => p.startDate).filter(Boolean) as string[];
  const dues = projs.map((p) => p.dueDate).filter(Boolean) as string[];
  const progress = projs.length ? Math.round(projs.reduce((s, p) => s + p.progress, 0) / projs.length) : 0;
  return {
    ref,
    name: pf.name,
    color: pf.color,
    ownerId: pf.ownerId,
    startDate: pf.startDate !== undefined ? pf.startDate : starts.sort()[0] ?? null,
    dueDate: pf.dueDate !== undefined ? pf.dueDate : dues.sort().reverse()[0] ?? null,
    progress,
    milestones: projs.flatMap((p) => milestonesFor(data, p.id)),
    projectCount: pf.items.filter((i) => i.type === 'project').length,
    portfolioCount: pf.items.filter((i) => i.type === 'portfolio').length,
  };
}

export function parentPortfolios(data: Data, ref: ItemRef): Portfolio[] {
  return data.portfolios.filter((pf) => pf.items.some((i) => i.type === ref.type && i.id === ref.id));
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

type Mutator = (d: Data) => void;

interface StoreValue {
  data: Data;
  mutate: (fn: Mutator) => void;
  reset: () => void;
  actions: ReturnType<typeof makeActions>;
}

function makeActions(mutate: (fn: Mutator) => void) {
  return {
    setValue(itemId: string, fieldId: string, value: string | number | null) {
      mutate((d) => {
        d.values[itemId] = { ...(d.values[itemId] || {}), [fieldId]: value };
      });
    },
    rename(ref: ItemRef, name: string) {
      mutate((d) => {
        const t = ref.type === 'project' ? getProject(d, ref.id) : getPortfolio(d, ref.id);
        if (t && name.trim()) t.name = name.trim();
      });
    },
    setOwner(ref: ItemRef, ownerId: string | null) {
      mutate((d) => {
        const t = ref.type === 'project' ? getProject(d, ref.id) : getPortfolio(d, ref.id);
        if (t) t.ownerId = ownerId ?? '';
      });
    },
    setDates(ref: ItemRef, start: string | null, due: string | null) {
      mutate((d) => {
        const t = ref.type === 'project' ? getProject(d, ref.id) : getPortfolio(d, ref.id);
        if (t) {
          t.startDate = start;
          t.dueDate = due;
        }
      });
    },
    setColor(ref: ItemRef, color: string) {
      mutate((d) => {
        const t = ref.type === 'project' ? getProject(d, ref.id) : getPortfolio(d, ref.id);
        if (t) t.color = color;
      });
    },
    setView(portfolioId: string, patch: Partial<PortfolioView>) {
      mutate((d) => {
        d.views[portfolioId] = { ...(d.views[portfolioId] || defaultView()), ...patch };
      });
    },
    addField(portfolioId: string, def: FieldDef) {
      mutate((d) => {
        d.fields.push(def);
        for (const [pid, v] of Object.entries(d.views)) {
          v.columns.push({ fieldId: def.id, width: def.type === 'text' ? 180 : 140, hidden: pid !== portfolioId });
        }
      });
    },
    updateField(def: FieldDef) {
      mutate((d) => {
        const i = d.fields.findIndex((f) => f.id === def.id);
        if (i >= 0) d.fields[i] = def;
      });
    },
    removeFieldFromPortfolio(portfolioId: string, fieldId: string) {
      mutate((d) => {
        const v = d.views[portfolioId];
        if (v) {
          v.columns = v.columns.filter((c) => c.fieldId !== fieldId);
          v.sorts = v.sorts.filter((s) => s.fieldId !== fieldId);
          v.filters = v.filters.filter((f) => f.fieldId !== fieldId);
          if (v.groupBy === fieldId) v.groupBy = null;
        }
      });
    },
    addProject(portfolioId: string, name: string): string {
      const id = newId('p');
      mutate((d) => {
        const pf = getPortfolio(d, portfolioId);
        d.projects.push({
          id, name: name.trim() || 'Untitled project', color: '#4573d2', ownerId: d.meId,
          startDate: null, dueDate: null, progress: 0, description: '', clientId: pf?.id ?? '',
        });
        pf?.items.push({ type: 'project', id });
      });
      return id;
    },
    addPortfolio(parentId: string, name: string): string {
      const id = newId('pf');
      mutate((d) => {
        d.portfolios.push({
          id, name: name.trim() || 'Untitled portfolio', color: '#8d84e8', ownerId: d.meId,
          items: [], description: '', starred: false, memberIds: [d.meId],
        });
        d.views[id] = defaultView();
        getPortfolio(d, parentId)?.items.push({ type: 'portfolio', id });
      });
      return id;
    },
    addExisting(portfolioId: string, ref: ItemRef) {
      mutate((d) => {
        const pf = getPortfolio(d, portfolioId);
        if (pf && !pf.items.some((i) => i.type === ref.type && i.id === ref.id) && !(ref.type === 'portfolio' && ref.id === portfolioId)) {
          pf.items.push(ref);
        }
      });
    },
    removeFromPortfolio(portfolioId: string, ref: ItemRef) {
      mutate((d) => {
        const pf = getPortfolio(d, portfolioId);
        if (pf) pf.items = pf.items.filter((i) => !(i.type === ref.type && i.id === ref.id));
      });
    },
    moveItem(portfolioId: string, from: number, to: number) {
      mutate((d) => {
        const pf = getPortfolio(d, portfolioId);
        if (!pf) return;
        const [it] = pf.items.splice(from, 1);
        pf.items.splice(to, 0, it);
      });
    },
    archiveProject(id: string, archived: boolean) {
      mutate((d) => {
        const p = getProject(d, id);
        if (p) p.archived = archived;
      });
    },
    deleteItem(ref: ItemRef) {
      mutate((d) => {
        for (const pf of d.portfolios) pf.items = pf.items.filter((i) => !(i.type === ref.type && i.id === ref.id));
        if (ref.type === 'project') {
          d.projects = d.projects.filter((p) => p.id !== ref.id);
          d.milestones = d.milestones.filter((m) => m.projectId !== ref.id);
        } else {
          d.portfolios = d.portfolios.filter((p) => p.id !== ref.id);
        }
        d.updates = d.updates.filter((u) => !(u.parent.type === ref.type && u.parent.id === ref.id));
      });
    },
    toggleStar(portfolioId: string) {
      mutate((d) => {
        const pf = getPortfolio(d, portfolioId);
        if (pf) pf.starred = !pf.starred;
      });
    },
    setDescription(ref: ItemRef, text: string) {
      mutate((d) => {
        const t = ref.type === 'project' ? getProject(d, ref.id) : getPortfolio(d, ref.id);
        if (t) t.description = text;
      });
    },
    postUpdate(u: StatusUpdate) {
      mutate((d) => {
        const i = d.updates.findIndex((x) => x.id === u.id);
        if (i >= 0) d.updates[i] = u;
        else d.updates.push(u);
      });
    },
    deleteUpdate(id: string) {
      mutate((d) => {
        d.updates = d.updates.filter((u) => u.id !== id);
      });
    },
    toggleLike(updateId: string) {
      mutate((d) => {
        const u = d.updates.find((x) => x.id === updateId);
        if (!u) return;
        u.likes = u.likes.includes(d.meId) ? u.likes.filter((x) => x !== d.meId) : [...u.likes, d.meId];
      });
    },
    addComment(updateId: string, text: string) {
      mutate((d) => {
        const u = d.updates.find((x) => x.id === updateId);
        if (u && text.trim()) u.comments.push({ id: newId('c'), authorId: d.meId, date: TODAY, text: text.trim() });
      });
    },
    toggleMilestone(id: string) {
      mutate((d) => {
        const m = d.milestones.find((x) => x.id === id);
        if (m) m.completedOn = m.completedOn ? undefined : TODAY;
      });
    },
  };
}

const StoreCtx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(load);
  const mutate = useCallback((fn: Mutator) => {
    setData((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
  }, []);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [data]);
  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setData(initialData());
  }, []);
  const actions = useMemo(() => makeActions(mutate), [mutate]);
  const value = useMemo(() => ({ data, mutate, reset, actions }), [data, mutate, reset, actions]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const v = useContext(StoreCtx);
  if (!v) throw new Error('StoreProvider missing');
  return v;
}

/* ------------------------------------------------------------------ */
/* Toasts                                                              */
/* ------------------------------------------------------------------ */

interface Toast {
  id: number;
  text: string;
  action?: { label: string; run: () => void };
}
const ToastCtx = createContext<(text: string, action?: Toast['action']) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, action?: Toast['action']) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, action }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" role="status">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <span>{t.text}</span>
            {t.action && (
              <button
                className="toast-action"
                onClick={() => {
                  t.action!.run();
                  setToasts((x) => x.filter((y) => y.id !== t.id));
                }}
              >
                {t.action.label}
              </button>
            )}
            <button className="toast-close" aria-label="Dismiss" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}>
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

/* ------------------------------------------------------------------ */
/* Hash router                                                         */
/* ------------------------------------------------------------------ */

export function useRoute(): string[] {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return hash.replace(/^#\/?/, '').split('?')[0].split('/').filter(Boolean).map(decodeURIComponent);
}

export function navigate(path: string) {
  window.location.hash = path.startsWith('/') ? path : '/' + path;
}

export const hrefFor = {
  portfolio: (id: string, tab = 'list') => `#/portfolio/${id}/${tab}`,
  project: (id: string) => `#/project/${id}`,
  update: (id: string) => `#/update/${id}`,
  compose: (ref: ItemRef, status?: StatusKey) => `#/compose/${ref.type}/${ref.id}${status ? '/' + status : ''}`,
  edit: (updateId: string) => `#/edit/${updateId}`,
};
