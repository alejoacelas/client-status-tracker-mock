import { useState } from 'react';
import { SOURCES } from '../lib/types';
import { formatDate } from '../lib/format';
import { useData } from './data';
import { useOpenProject } from './AdminApp';

export default function Activity() {
  const { updates, projects, clients } = useData();
  const openProject = useOpenProject();
  const [clientId, setClientId] = useState('');
  const [source, setSource] = useState('');

  const projectById = new Map(projects.map((p) => [p.id, p]));
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const rows = updates.filter((u) => {
    const p = projectById.get(u.project_id);
    return (!clientId || p?.client_id === clientId) && (!source || u.source === source);
  });

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Activity</h1>
          <p className="muted">Every update across projects, newest first.</p>
        </div>
        <div className="filters">
          <select className="select" aria-label="Filter by client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">All clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select className="select" aria-label="Filter by source" value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="">All sources</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </header>
      <div className="card feed">
        {rows.map((u) => {
          const p = projectById.get(u.project_id);
          const c = p && clientById.get(p.client_id);
          return (
            <article key={u.id} className="feed-item">
              <time className="feed-date">{formatDate(u.date)}</time>
              <div className="feed-body">
                <div className="feed-meta">
                  <button className="link" onClick={() => p && openProject(p.id)}>
                    {c?.name} · {p?.name}
                  </button>
                  <span className="source">{u.source}</span>
                  <span className={`tag ${u.client_visible ? 'tag-visible' : 'tag-internal'}`}>
                    {u.client_visible ? 'Visible to client' : 'Internal'}
                  </span>
                </div>
                <p>{u.summary}</p>
              </div>
            </article>
          );
        })}
        {rows.length === 0 && <p className="empty muted">No updates match these filters.</p>}
      </div>
    </div>
  );
}
