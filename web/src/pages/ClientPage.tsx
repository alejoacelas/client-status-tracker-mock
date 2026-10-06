import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { supabase } from '../lib/supabase';
import type { Portal } from '../lib/types';
import { dueLabel, formatDate, relativeTime } from '../lib/format';
import { Check, Logo, PhaseSteps, ProgressBar, Spinner, StatusPill } from '../components/ui';

type Load = { state: 'loading' } | { state: 'missing' } | { state: 'error'; message: string } | { state: 'ok'; portal: Portal };

export default function ClientPage() {
  const { token = '' } = useParams();
  const [load, setLoad] = useState<Load>({ state: 'loading' });

  useEffect(() => {
    let cancelled = false;
    supabase.rpc('client_portal', { p_token: token }).then(({ data, error }) => {
      if (cancelled) return;
      if (error) setLoad({ state: 'error', message: error.message });
      else if (!data) setLoad({ state: 'missing' });
      else setLoad({ state: 'ok', portal: data as Portal });
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (load.state === 'ok') document.title = `${load.portal.client} · Fieldwork Studio`;
  }, [load]);

  if (load.state === 'loading') return <div className="client-shell"><Spinner /></div>;
  if (load.state === 'missing') return <LinkNotFound />;
  if (load.state === 'error') {
    return (
      <Notice title="Something went wrong" body="We couldn't load this page just now. Please refresh in a moment." detail={load.message} />
    );
  }

  const { portal } = load;
  const lastUpdated = latest([
    ...portal.projects.map((p) => p.updated_at),
    ...portal.projects.flatMap((p) => p.updates.map((u) => `${u.date}T12:00:00`)),
  ]);
  const active = portal.projects.filter((p) => p.status !== 'Done').length;

  return (
    <div className="client-shell">
      <header className="client-top">
        <Logo />
        <span className="client-top-note">Project status</span>
      </header>

      <section className="client-hero">
        <p className="eyebrow">Status report</p>
        <h1>{portal.client}</h1>
        <p className="client-sub">
          {portal.contact_name && <>Prepared for {portal.contact_name} · </>}
          {active} active project{active === 1 ? '' : 's'}
          {lastUpdated && <> · Last updated {relativeTime(lastUpdated)}</>}
        </p>
      </section>

      {portal.projects.length === 0 && (
        <div className="card empty">No projects to show yet. Your project lead will share updates here.</div>
      )}

      <div className="client-projects">
        {portal.projects.map((p) => (
          <article key={p.name} className="card client-project">
            <div className="cp-head">
              <div>
                <h2>{p.name}</h2>
                <p className="muted small">Updated {relativeTime(p.updated_at)}</p>
              </div>
              <StatusPill status={p.status} />
            </div>

            {p.summary && <p className="cp-summary">{p.summary}</p>}

            <dl className="cp-facts">
              <div>
                <dt>Due</dt>
                <dd>
                  {formatDate(p.due_date, { year: true })}
                  {p.status !== 'Done' && p.due_date && <span className="muted small"> · {dueLabel(p.due_date)}</span>}
                </dd>
              </div>
              <div>
                <dt>Project lead</dt>
                <dd>{p.owner ?? '—'}</dd>
              </div>
              <div className="cp-progress">
                <dt>Progress</dt>
                <dd>
                  <ProgressBar value={p.progress} status={p.status} />
                  <span className="tabular">{p.progress}%</span>
                </dd>
              </div>
            </dl>

            <PhaseSteps phase={p.phase} done={p.status === 'Done'} />

            <div className="cp-columns">
              <section>
                <h3>Milestones</h3>
                {p.milestones.length === 0 ? (
                  <p className="muted small">No milestones yet.</p>
                ) : (
                  <ol className="timeline">
                    {p.milestones.map((m) => {
                      const state = m.status === 'Done' ? 'done' : m.status === 'In progress' ? 'active' : 'upcoming';
                      return (
                        <li key={m.name} className={`tl-item tl-${state}`}>
                          <span className="tl-dot">{state === 'done' && <Check size={10} />}</span>
                          <div className="tl-body">
                            <span className="tl-name">{m.name}</span>
                            <span className="tl-meta">
                              {state === 'done'
                                ? `Completed ${formatDate(m.completed_on ?? m.due_date)}`
                                : state === 'active'
                                  ? `In progress · due ${formatDate(m.due_date)}`
                                  : `Due ${formatDate(m.due_date)}`}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </section>
              <section>
                <h3>Recent updates</h3>
                {p.updates.length === 0 ? (
                  <p className="muted small">No updates yet.</p>
                ) : (
                  <ul className="updates">
                    {p.updates.slice(0, 5).map((u, i) => (
                      <li key={i}>
                        <time>{formatDate(u.date)}</time>
                        <p>{u.summary}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </article>
        ))}
      </div>

      <footer className="client-footer">
        Questions? Reply to any email from your project lead at Fieldwork Studio.
      </footer>
    </div>
  );
}

function latest(dates: string[]): string | null {
  if (dates.length === 0) return null;
  return dates.reduce((a, b) => (new Date(a) > new Date(b) ? a : b));
}

function LinkNotFound() {
  return (
    <Notice
      title="This link isn't working"
      body="The status page you're looking for doesn't exist, or the link has been replaced with a new one. Ask your Fieldwork Studio contact for the latest link."
    />
  );
}

export function Notice({ title, body, detail }: { title: string; body: string; detail?: string }) {
  return (
    <div className="notice-page">
      <div className="notice card">
        <Logo small />
        <h1>{title}</h1>
        <p>{body}</p>
        {detail && <p className="muted small mono">{detail}</p>}
      </div>
    </div>
  );
}
