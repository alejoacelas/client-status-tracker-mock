import { useState, type DragEvent } from 'react';
import { STATUSES, type Status } from '../lib/types';
import { dueLabel, daysUntil, statusSlug } from '../lib/format';
import { ProgressBar } from '../components/ui';
import { useData } from './data';
import { useOpenProject } from './AdminApp';

export default function Board() {
  const { projects, clients, updateProject } = useData();
  const openProject = useOpenProject();
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? '';

  async function drop(e: DragEvent, status: Status) {
    e.preventDefault();
    setOver(null);
    const id = e.dataTransfer.getData('text/plain');
    const project = projects.find((p) => p.id === id);
    if (!project || project.status === status) return;
    const err = await updateProject(id, { status });
    setError(err ? `Couldn't move "${project.name}": ${err}` : null);
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Board</h1>
          <p className="muted">Drag a card to another column to change its status.</p>
        </div>
      </header>
      {error && <p className="form-error">{error}</p>}
      <div className="board">
        {STATUSES.map((status) => {
          const cards = projects.filter((p) => p.status === status);
          return (
            <section
              key={status}
              className={`column ${over === status ? 'column-over' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (over !== status) setOver(status);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null);
              }}
              onDrop={(e) => drop(e, status)}
            >
              <header className="column-head">
                <span className={`dot dot-${statusSlug(status)}`} />
                <span>{status}</span>
                <span className="count">{cards.length}</span>
              </header>
              <div className="column-body">
                {cards.map((p) => {
                  const overdue = p.due_date && p.status !== 'Done' && daysUntil(p.due_date) < 0;
                  return (
                    <article
                      key={p.id}
                      className={`kcard ${dragging === p.id ? 'kcard-dragging' : ''}`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', p.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setDragging(p.id);
                      }}
                      onDragEnd={() => setDragging(null)}
                      onClick={() => openProject(p.id)}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && openProject(p.id)}
                    >
                      <span className="kcard-client">{clientName(p.client_id)}</span>
                      <span className="kcard-name">{p.name}</span>
                      <div className="kcard-progress">
                        <ProgressBar value={p.progress} status={p.status} />
                        <span className="tabular small muted">{p.progress}%</span>
                      </div>
                      <div className="kcard-meta">
                        <span className={overdue ? 'text-danger' : ''}>
                          {p.status === 'Done' ? 'Complete' : dueLabel(p.due_date)}
                        </span>
                        {p.owner && <Avatar name={p.owner} />}
                      </div>
                    </article>
                  );
                })}
                {cards.length === 0 && <div className="column-empty">Drop here</div>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  return (
    <span className="avatar" title={name} style={{ background: `hsl(${hash} 45% 92%)`, color: `hsl(${hash} 40% 32%)` }}>
      {initials}
    </span>
  );
}
