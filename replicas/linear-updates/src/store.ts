import { useSyncExternalStore } from 'react';
import * as mock from './data/mock';
import type { ActivityEvent, Comment, Health, Project, Update } from './data/mock';

const STATE_KEY = 'fw-linear-state-v1';
const THEME_KEY = 'fw-linear-theme';

export interface State {
  projects: Project[];
  updates: Update[];
  activity: ActivityEvent[];
  favorites: string[]; // project ids
  theme: 'dark' | 'light';
}

function initial(): State {
  return {
    projects: structuredClone(mock.projects),
    updates: structuredClone(mock.updates),
    activity: structuredClone(mock.activity),
    favorites: ['harbor-shop', 'meridian-portal'],
    theme: 'dark',
  };
}

function load(): State {
  const base = initial();
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) Object.assign(base, JSON.parse(raw));
    const t = localStorage.getItem(THEME_KEY);
    if (t === 'light' || t === 'dark') base.theme = t;
  } catch {
    /* storage unavailable: run on defaults */
  }
  return base;
}

let state: State = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    const { theme, ...rest } = state;
    localStorage.setItem(STATE_KEY, JSON.stringify(rest));
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
}

function set(next: Partial<State>) {
  state = { ...state, ...next };
  persist();
  listeners.forEach((l) => l());
}

export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => sel(state),
  );
}

export const getState = () => state;

// ---- clock ----
const loadedAt = Date.now();
const mockNowMs = new Date(mock.MOCK_NOW).getTime();
export const now = () => new Date(mockNowMs + (Date.now() - loadedAt));
const iso = () => {
  const d = now();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

export const me = () => mock.users.find((u) => u.id === mock.CURRENT_USER_ID)!;
export const userById = (id: string) => mock.users.find((u) => u.id === id)!;

// ---- actions ----
export const actions = {
  setTheme(theme: 'dark' | 'light') {
    document.documentElement.dataset.theme = theme;
    set({ theme });
  },
  toggleFavorite(projectId: string) {
    const f = state.favorites.includes(projectId)
      ? state.favorites.filter((x) => x !== projectId)
      : [...state.favorites, projectId];
    set({ favorites: f });
  },
  postUpdate(input: { projectId?: string; initiativeId?: string; health: Health; body: string; progress?: Update['progress'] }) {
    const u: Update = {
      id: uid('u'),
      projectId: input.projectId,
      initiativeId: input.initiativeId,
      authorId: mock.CURRENT_USER_ID,
      createdAt: iso(),
      health: input.health,
      body: input.body,
      reactions: [],
      comments: [],
      progress: input.progress,
    };
    set({ updates: [...state.updates, u] });
    return u;
  },
  editUpdate(id: string, patch: { health: Health; body: string }) {
    set({ updates: state.updates.map((u) => (u.id === id ? { ...u, ...patch, editedAt: iso() } : u)) });
  },
  deleteUpdate(id: string) {
    set({ updates: state.updates.filter((u) => u.id !== id) });
  },
  toggleReaction(updateId: string, emoji: string, commentId?: string) {
    const uidMe = mock.CURRENT_USER_ID;
    const flip = (list: { emoji: string; userIds: string[] }[] = []) => {
      const ex = list.find((x) => x.emoji === emoji);
      if (!ex) return [...list, { emoji, userIds: [uidMe] }];
      const has = ex.userIds.includes(uidMe);
      const userIds = has ? ex.userIds.filter((x) => x !== uidMe) : [...ex.userIds, uidMe];
      return userIds.length ? list.map((x) => (x.emoji === emoji ? { ...x, userIds } : x)) : list.filter((x) => x.emoji !== emoji);
    };
    set({
      updates: state.updates.map((u) => {
        if (u.id !== updateId) return u;
        if (!commentId) return { ...u, reactions: flip(u.reactions) };
        return { ...u, comments: u.comments.map((c) => (c.id === commentId ? { ...c, reactions: flip(c.reactions) } : c)) };
      }),
    });
  },
  addComment(updateId: string, body: string) {
    const c: Comment = { id: uid('c'), authorId: mock.CURRENT_USER_ID, createdAt: iso(), body };
    set({ updates: state.updates.map((u) => (u.id === updateId ? { ...u, comments: [...u.comments, c] } : u)) });
  },
  deleteComment(updateId: string, commentId: string) {
    set({ updates: state.updates.map((u) => (u.id === updateId ? { ...u, comments: u.comments.filter((c) => c.id !== commentId) } : u)) });
  },
  updateProject(id: string, patch: Partial<Project>, eventText?: string, kind: ActivityEvent['kind'] = 'status') {
    const projects = state.projects.map((p) => (p.id === id ? { ...p, ...patch } : p));
    const activity = eventText
      ? [...state.activity, { id: uid('a'), projectId: id, actorId: mock.CURRENT_USER_ID, createdAt: iso(), text: eventText, kind }]
      : state.activity;
    set({ projects, activity });
  },
  reset() {
    try {
      localStorage.removeItem(STATE_KEY);
    } catch {
      /* ignore */
    }
    const theme = state.theme;
    state = { ...initial(), theme };
    listeners.forEach((l) => l());
  },
};

// ---- derived helpers ----
export function projectUpdates(s: State, projectId: string) {
  return s.updates.filter((u) => u.projectId === projectId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function initiativeUpdates(s: State, initiativeId: string) {
  return s.updates.filter((u) => u.initiativeId === initiativeId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function latestProjectUpdate(s: State, projectId: string): Update | undefined {
  return projectUpdates(s, projectId)[0];
}
export function latestInitiativeUpdate(s: State, initiativeId: string): Update | undefined {
  return initiativeUpdates(s, initiativeId)[0];
}
