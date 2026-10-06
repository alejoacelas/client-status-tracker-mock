import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Client, Milestone, Project, Update } from '../lib/types';

interface Tables {
  clients: Client[];
  projects: Project[];
  milestones: Milestone[];
  updates: Update[];
}

/** Every mutation resolves to an error message, or null on success. */
type Result = Promise<string | null>;

interface DataContext extends Tables {
  loading: boolean;
  loadError: string | null;
  reload: () => Promise<void>;
  updateProject: (id: string, patch: Partial<Project>) => Result;
  addClient: (input: Pick<Client, 'name' | 'contact_name' | 'contact_email' | 'share_token'>) => Result;
  updateClient: (id: string, patch: Partial<Client>) => Result;
  addMilestone: (input: Pick<Milestone, 'project_id' | 'name' | 'due_date' | 'position'>) => Result;
  updateMilestone: (id: string, patch: Partial<Milestone>) => Result;
  deleteMilestone: (id: string) => Result;
  addUpdate: (input: Pick<Update, 'project_id' | 'date' | 'source' | 'summary' | 'client_visible'>) => Result;
  deleteUpdate: (id: string) => Result;
}

const Ctx = createContext<DataContext | null>(null);

export function useData(): DataContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useData must be used inside <DataProvider>');
  return ctx;
}

const empty: Tables = { clients: [], projects: [], milestones: [], updates: [] };

export function DataProvider({ children }: { children: ReactNode }) {
  const [tables, setTables] = useState<Tables>(empty);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [c, p, m, u] = await Promise.all([
      supabase.from('clients').select('*').order('name'),
      supabase.from('projects').select('*').order('due_date'),
      supabase.from('milestones').select('*').order('position'),
      supabase.from('updates').select('*').order('date', { ascending: false }).order('created_at', { ascending: false }),
    ]);
    const error = c.error ?? p.error ?? m.error ?? u.error;
    setLoadError(error ? error.message : null);
    if (!error) {
      setTables({ clients: c.data, projects: p.data, milestones: m.data, updates: u.data } as Tables);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const value = useMemo<DataContext>(() => {
    // Applies a change locally first so the UI responds instantly, then
    // reconciles with the database row (or reloads everything on failure).
    function patchRow<K extends keyof Tables>(table: K, id: string, patch: Partial<Tables[K][number]>) {
      setTables((t) => ({ ...t, [table]: t[table].map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
    }

    async function update<K extends keyof Tables>(table: K, id: string, patch: Partial<Tables[K][number]>): Result {
      patchRow(table, id, patch);
      const { data, error } = await supabase.from(table).update(patch as never).eq('id', id).select().single();
      if (error) {
        await reload();
        return error.message;
      }
      patchRow(table, id, data);
      return null;
    }

    async function insert<K extends keyof Tables>(table: K, row: object): Result {
      const { data, error } = await supabase.from(table).insert(row).select().single();
      if (error) return error.message;
      setTables((t) => ({ ...t, [table]: [...t[table], data] }));
      return null;
    }

    async function remove<K extends keyof Tables>(table: K, id: string): Result {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) return error.message;
      setTables((t) => ({ ...t, [table]: t[table].filter((r) => r.id !== id) }));
      return null;
    }

    return {
      ...tables,
      loading,
      loadError,
      reload,
      updateProject: (id, patch) => update('projects', id, patch),
      addClient: async (input) => {
        const err = await insert('clients', input);
        if (!err) setTables((t) => ({ ...t, clients: [...t.clients].sort((a, b) => a.name.localeCompare(b.name)) }));
        return err;
      },
      updateClient: (id, patch) => update('clients', id, patch),
      addMilestone: (input) => insert('milestones', input),
      updateMilestone: (id, patch) => update('milestones', id, patch),
      deleteMilestone: (id) => remove('milestones', id),
      addUpdate: async (input) => {
        const { data, error } = await supabase.from('updates').insert(input).select().single();
        if (error) return error.message;
        setTables((t) => ({ ...t, updates: [data as Update, ...t.updates].sort(byNewest) }));
        return null;
      },
      deleteUpdate: (id) => remove('updates', id),
    };
  }, [tables, loading, loadError, reload]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function byNewest(a: Update, b: Update): number {
  return b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at);
}
