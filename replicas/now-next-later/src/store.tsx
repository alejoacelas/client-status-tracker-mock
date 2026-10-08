import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import type { Column, Initiative, Placement } from './types';
import { DATA } from './util';

const KEY = 'fieldwork-nnl-replica-v1';

export interface State { initiatives: Initiative[]; columns: Column[] }

type Action =
  | { type: 'move'; id: string; to: Placement; index?: number; completedOn?: string; outcome?: string }
  | { type: 'update'; id: string; patch: Partial<Initiative> }
  | { type: 'add'; initiative: Initiative }
  | { type: 'remove'; id: string }
  | { type: 'column'; id: string; patch: Partial<Column> }
  | { type: 'reset' };

const fresh = (): State => ({
  initiatives: structuredClone(DATA.initiatives),
  columns: structuredClone(DATA.columns),
});

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as State;
      if (Array.isArray(s.initiatives) && Array.isArray(s.columns)) return s;
    }
  } catch {
    /* ignore unreadable storage */
  }
  return fresh();
}

const nowStamp = () => {
  const d = new Date();
  return `${DATA.today}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`;
};

/** Renumber `order` within each placement so it is 1..n. */
function renumber(list: Initiative[]): Initiative[] {
  const counters: Record<string, number> = {};
  return [...list]
    .sort((a, b) => a.order - b.order)
    .map((i) => ({ ...i, order: (counters[i.column] = (counters[i.column] || 0) + 1) }));
}

function reducer(state: State, a: Action): State {
  switch (a.type) {
    case 'move': {
      const item = state.initiatives.find((i) => i.id === a.id);
      if (!item) return state;
      const others = state.initiatives.filter((i) => i.id !== a.id);
      const target = others.filter((i) => i.column === a.to).sort((x, y) => x.order - y.order);
      const index = a.index === undefined ? target.length : Math.max(0, Math.min(a.index, target.length));
      const moved: Initiative = {
        ...item,
        column: a.to,
        lastUpdated: nowStamp(),
        completedOn: a.to === 'completed' ? a.completedOn ?? item.completedOn ?? DATA.today : undefined,
        outcome: a.to === 'completed' ? a.outcome ?? item.outcome : item.outcome,
      };
      target.splice(index, 0, moved);
      const reordered = target.map((i, n) => ({ ...i, order: n + 1 }));
      const rest = others.filter((i) => i.column !== a.to);
      return { ...state, initiatives: renumber([...rest, ...reordered]) };
    }
    case 'update':
      return {
        ...state,
        initiatives: state.initiatives.map((i) => (i.id === a.id ? { ...i, ...a.patch, lastUpdated: nowStamp() } : i)),
      };
    case 'add':
      return { ...state, initiatives: renumber([...state.initiatives, a.initiative]) };
    case 'remove':
      return { ...state, initiatives: renumber(state.initiatives.filter((i) => i.id !== a.id)) };
    case 'column':
      return { ...state, columns: state.columns.map((c) => (c.id === a.id ? { ...c, ...a.patch } : c)) };
    case 'reset':
      return fresh();
  }
}

const Ctx = createContext<{ state: State; dispatch: (a: Action) => void } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage may be unavailable */
    }
  }, [state]);
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error('StoreProvider missing');
  return c;
}

/** Small persisted UI preference hook. */
import { useState } from 'react';
export function usePref<T>(key: string, initial: T): [T, (v: T) => void] {
  const k = 'fieldwork-nnl-pref-' + key;
  const [v, setV] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(k);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  const set = (nv: T) => {
    setV(nv);
    try {
      localStorage.setItem(k, JSON.stringify(nv));
    } catch {
      /* ignore */
    }
  };
  return [v, set];
}
