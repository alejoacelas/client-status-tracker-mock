import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import { COLOR_ORDER, COMMENTS, LISTS, ME, SNAPSHOTS, type HillComment, type PersonKey, type Snapshot, type TodoList } from './data';

export interface State {
  lists: Record<string, TodoList[]>;
  snapshots: Record<string, Snapshot[]>;
  comments: HillComment[];
}

const STORAGE_KEY = 'fieldwork-hill-chart-replica-v1';

function seed(): State {
  return structuredClone({ lists: LISTS, snapshots: SNAPSHOTS, comments: COMMENTS });
}

function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as State;
  } catch {
    /* storage unavailable */
  }
  return seed();
}

const uid = () => Math.random().toString(36).slice(2, 10);

function localIso(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

type Action =
  | { type: 'saveSnapshot'; project: string; positions: Record<string, number>; id: string }
  | { type: 'setNote'; project: string; snapshotId: string; note: string }
  | { type: 'toggleTodo'; project: string; listId: string; todoId: string }
  | { type: 'addTodo'; project: string; listId: string; title: string; assignee?: PersonKey; due?: string }
  | { type: 'addList'; project: string; name: string; description: string; tracked: boolean }
  | { type: 'setTracked'; project: string; listId: string; tracked: boolean }
  | { type: 'addComment'; snapshotId: string; body: string }
  | { type: 'reset' };

function mapList(state: State, project: string, listId: string, fn: (l: TodoList) => TodoList): State {
  return { ...state, lists: { ...state.lists, [project]: state.lists[project].map((l) => (l.id === listId ? fn(l) : l)) } };
}

function reducer(state: State, a: Action): State {
  switch (a.type) {
    case 'saveSnapshot': {
      const s: Snapshot = { id: a.id, at: localIso(), author: ME, positions: a.positions };
      return { ...state, snapshots: { ...state.snapshots, [a.project]: [...(state.snapshots[a.project] ?? []), s] } };
    }
    case 'setNote':
      return {
        ...state,
        snapshots: {
          ...state.snapshots,
          [a.project]: state.snapshots[a.project].map((s) => (s.id === a.snapshotId ? { ...s, note: a.note } : s)),
        },
      };
    case 'toggleTodo':
      return mapList(state, a.project, a.listId, (l) => ({
        ...l,
        todos: l.todos.map((t) => (t.id === a.todoId ? { ...t, done: !t.done } : t)),
      }));
    case 'addTodo':
      return mapList(state, a.project, a.listId, (l) => ({
        ...l,
        todos: [...l.todos, { id: `${l.id}-${uid()}`, title: a.title, assignee: a.assignee, due: a.due, done: false }],
      }));
    case 'addList': {
      const lists = state.lists[a.project] ?? [];
      const used = new Set(lists.map((l) => l.color));
      const color = COLOR_ORDER.find((c) => !used.has(c)) ?? COLOR_ORDER[lists.length % COLOR_ORDER.length];
      const l: TodoList = { id: `list-${uid()}`, name: a.name, description: a.description, color, tracked: a.tracked, todos: [] };
      return { ...state, lists: { ...state.lists, [a.project]: [l, ...lists] } };
    }
    case 'setTracked':
      return mapList(state, a.project, a.listId, (l) => ({ ...l, tracked: a.tracked }));
    case 'addComment':
      return { ...state, comments: [...state.comments, { id: uid(), snapshotId: a.snapshotId, author: ME, at: localIso(), body: a.body }] };
    case 'reset':
      return seed();
  }
}

const Ctx = createContext<{ state: State; dispatch: (a: Action) => void } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('StoreProvider missing');
  return v;
}

export const newId = uid;

/** Positions of every tracked list in a snapshot. Lists tracked after the snapshot sit at the start of the hill. */
export function positionsFor(lists: TodoList[], snapshot: Snapshot | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  for (const l of lists) if (l.tracked) out[l.id] = snapshot?.positions[l.id] ?? 0;
  return out;
}
