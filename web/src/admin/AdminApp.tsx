import { useEffect, useState, type FormEvent } from 'react';
import { NavLink, Navigate, Route, Routes, useSearchParams } from 'react-router';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Logo, Spinner } from '../components/ui';
import { DataProvider, useData } from './data';
import Board from './Board';
import ProjectsTable from './ProjectsTable';
import ProjectDrawer from './ProjectDrawer';
import Clients from './Clients';
import Activity from './Activity';

type Access = 'checking' | 'staff' | 'denied';

export default function AdminApp() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [access, setAccess] = useState<Access>('checking');

  useEffect(() => {
    document.title = 'Staff console · Fieldwork Studio';
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const email = session?.user.email;
  useEffect(() => {
    if (!email) return;
    setAccess('checking');
    // RLS only returns staff rows to people on the staff list.
    supabase
      .from('staff')
      .select('email')
      .limit(1)
      .then(({ data }) => setAccess(data && data.length > 0 ? 'staff' : 'denied'));
  }, [email]);

  if (session === undefined) return <div className="center-page"><Spinner /></div>;
  if (!session) return <Login />;
  if (access === 'checking') return <div className="center-page"><Spinner label="Checking access…" /></div>;
  if (access === 'denied') {
    return (
      <div className="center-page">
        <div className="card auth-card">
          <Logo small />
          <h1>No staff access</h1>
          <p className="muted">
            You're signed in as <strong>{email}</strong>, but this account isn't on the staff list. Ask an admin to
            add you, or sign in with a different account.
          </p>
          <button className="btn btn-secondary" onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <DataProvider>
      <Console email={email ?? ''} />
    </DataProvider>
  );
}

const NAV = [
  { to: '/admin/board', label: 'Board', icon: 'M3 3h4v10H3zM9 3h4v6H9z' },
  { to: '/admin/projects', label: 'Projects', icon: 'M2 4h12M2 8h12M2 12h12' },
  { to: '/admin/clients', label: 'Clients', icon: 'M8 8a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 14c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5' },
  { to: '/admin/activity', label: 'Activity', icon: 'M2 8h3l2-5 2 10 2-5h3' },
];

function Console({ email }: { email: string }) {
  const { loading, loadError, reload } = useData();
  const [params, setParams] = useSearchParams();
  const openProject = params.get('project');

  function closeDrawer() {
    const next = new URLSearchParams(params);
    next.delete('project');
    setParams(next);
  }

  return (
    <div className="console">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Logo small />
        </div>
        <nav className="sidebar-nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className="nav-link">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d={n.icon} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <span className="sidebar-email" title={email}>{email}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="console-main">
        {loading ? (
          <Spinner />
        ) : loadError ? (
          <div className="card error-card">
            <p>Couldn't load data: {loadError}</p>
            <button className="btn btn-secondary btn-sm" onClick={reload}>Try again</button>
          </div>
        ) : (
          <Routes>
            <Route index element={<Navigate to="/admin/board" replace />} />
            <Route path="board" element={<Board />} />
            <Route path="projects" element={<ProjectsTable />} />
            <Route path="clients" element={<Clients />} />
            <Route path="activity" element={<Activity />} />
            <Route path="*" element={<Navigate to="/admin/board" replace />} />
          </Routes>
        )}
      </main>

      {openProject && !loading && <ProjectDrawer projectId={openProject} onClose={closeDrawer} />}
    </div>
  );
}

/** Returns a function that opens the project drawer on the current page. */
export function useOpenProject() {
  const [params, setParams] = useSearchParams();
  return (id: string) => {
    const next = new URLSearchParams(params);
    next.set('project', id);
    setParams(next);
  };
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message === 'Invalid login credentials' ? 'That email and password don’t match.' : error.message);
    setBusy(false);
  }

  return (
    <div className="center-page">
      <form className="card auth-card" onSubmit={submit}>
        <Logo small />
        <h1>Staff sign in</h1>
        <p className="muted">Manage projects and client status pages.</p>
        <label className="field">
          <span>Email</span>
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
