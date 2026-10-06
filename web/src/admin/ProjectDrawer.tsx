import { useEffect, useState, type FormEvent } from 'react';
import { PHASES, SOURCES, STATUSES, type Milestone, type Project, type Source } from '../lib/types';
import { formatDate, statusSlug, todayISO } from '../lib/format';
import { Check, ConfirmButton, SaveIndicator, StatusPill, useSaveState } from '../components/ui';
import { useData } from './data';
import { CommitInput, CommitTextarea, Select, clampProgress } from './fields';

export default function ProjectDrawer({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const data = useData();
  const project = data.projects.find((p) => p.id === projectId);
  const client = data.clients.find((c) => c.id === project?.client_id);
  const save = useSaveState();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const run = (fn: () => Promise<string | null>) => save.track(fn);
  const set = (patch: Partial<Project>) => run(() => data.updateProject(projectId, patch));

  return (
    <div className="drawer-layer">
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Project details">
        {!project ? (
          <div className="drawer-section">
            <p className="muted">This project no longer exists.</p>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <header className="drawer-head">
              <div className="drawer-title">
                <span className="eyebrow">{client?.name}</span>
                <h2>{project.name}</h2>
                <div className="drawer-title-meta">
                  <StatusPill status={project.status} />
                  <SaveIndicator state={save.state} error={save.error} />
                </div>
              </div>
              <div className="drawer-actions">
                {client && (
                  <a className="btn btn-secondary btn-sm" href={`/c/${client.share_token}`} target="_blank" rel="noreferrer">
                    View as client ↗
                  </a>
                )}
                <button className="icon-btn" onClick={onClose} aria-label="Close">
                  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </header>

            <div className="drawer-body">
              <section className="drawer-section">
                <div className="field-grid">
                  <label className="field">
                    <span>Status</span>
                    <Select
                      className={`select select-status status-${statusSlug(project.status)}`}
                      value={project.status}
                      options={STATUSES}
                      onChange={(status) => set({ status })}
                    />
                  </label>
                  <label className="field">
                    <span>Phase</span>
                    <Select value={project.phase} options={PHASES} onChange={(phase) => set({ phase })} />
                  </label>
                  <label className="field">
                    <span>Progress (%)</span>
                    <CommitInput
                      className="input"
                      type="number"
                      min={0}
                      max={100}
                      step={5}
                      value={String(project.progress)}
                      onCommit={(v) => {
                        const n = clampProgress(v);
                        if (n !== null) set({ progress: n });
                      }}
                    />
                  </label>
                  <label className="field">
                    <span>Due date</span>
                    <input
                      className="input"
                      type="date"
                      value={project.due_date ?? ''}
                      onChange={(e) => set({ due_date: e.target.value || null })}
                    />
                  </label>
                  <label className="field">
                    <span>Owner</span>
                    <CommitInput
                      className="input"
                      placeholder="Unassigned"
                      value={project.owner ?? ''}
                      onCommit={(v) => set({ owner: v.trim() || null })}
                    />
                  </label>
                </div>
              </section>

              <section className="drawer-section">
                <label className="field">
                  <span className="field-label-row">
                    Client summary <span className="tag tag-visible">Visible to client</span>
                  </span>
                  <CommitTextarea
                    className="input textarea"
                    rows={3}
                    placeholder="What the client sees at the top of this project."
                    value={project.client_summary ?? ''}
                    onCommit={(v) => set({ client_summary: v.trim() || null })}
                  />
                </label>
                <label className="field">
                  <span className="field-label-row">
                    Internal notes <span className="tag tag-internal">Internal only</span>
                  </span>
                  <CommitTextarea
                    className="input textarea textarea-internal"
                    rows={3}
                    placeholder="Context for the team. Never shown to the client."
                    value={project.internal_notes ?? ''}
                    onCommit={(v) => set({ internal_notes: v.trim() || null })}
                  />
                </label>
              </section>

              <Milestones projectId={project.id} run={run} />
              <UpdatesLog projectId={project.id} run={run} />
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

type Run = (fn: () => Promise<string | null>) => Promise<void>;

function Milestones({ projectId, run }: { projectId: string; run: Run }) {
  const { milestones, addMilestone, updateMilestone, deleteMilestone } = useData();
  const list = milestones.filter((m) => m.project_id === projectId).sort((a, b) => a.position - b.position);
  const [name, setName] = useState('');
  const [due, setDue] = useState('');

  const set = (id: string, patch: Partial<Milestone>) => run(() => updateMilestone(id, patch));

  function add(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const position = Math.max(-1, ...milestones.map((m) => m.position)) + 1;
    run(() => addMilestone({ project_id: projectId, name: name.trim(), due_date: due || null, position }));
    setName('');
    setDue('');
  }

  return (
    <section className="drawer-section">
      <h3 className="section-title">
        Milestones <span className="tag tag-visible">Visible to client</span>
      </h3>
      <ul className="ms-list">
        {list.map((m) => {
          const done = m.status === 'Done';
          return (
            <li key={m.id} className={`ms-row ${done ? 'ms-done' : ''}`}>
              <button
                type="button"
                className={`checkbox ${done ? 'checkbox-on' : ''}`}
                aria-pressed={done}
                aria-label={done ? 'Mark not done' : 'Mark done'}
                onClick={() =>
                  set(m.id, done ? { status: 'Not started', completed_on: null } : { status: 'Done', completed_on: todayISO() })
                }
              >
                {done && <Check size={11} />}
              </button>
              <div className="ms-main">
                <CommitInput
                  className="input input-bare"
                  aria-label="Milestone name"
                  value={m.name}
                  onCommit={(v) => v.trim() && set(m.id, { name: v.trim() })}
                />
                <div className="ms-meta">
                  <input
                    className="input input-date input-sm"
                    type="date"
                    aria-label="Milestone due date"
                    value={m.due_date ?? ''}
                    onChange={(e) => set(m.id, { due_date: e.target.value || null })}
                  />
                  {done ? (
                    <span className="small muted">Completed {formatDate(m.completed_on)}</span>
                  ) : (
                    <button
                      type="button"
                      className={`chip ${m.status === 'In progress' ? 'chip-on' : ''}`}
                      onClick={() => set(m.id, { status: m.status === 'In progress' ? 'Not started' : 'In progress' })}
                      title="Toggle in progress"
                    >
                      {m.status === 'In progress' ? 'In progress' : 'Upcoming'}
                    </button>
                  )}
                </div>
              </div>
              <ConfirmButton className="btn btn-ghost btn-sm btn-quiet" confirmLabel="Delete" onConfirm={() => run(() => deleteMilestone(m.id))}>
                Delete
              </ConfirmButton>
            </li>
          );
        })}
        {list.length === 0 && <li className="muted small">No milestones yet.</li>}
      </ul>
      <form className="inline-form" onSubmit={add}>
        <input className="input" placeholder="New milestone" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input input-date" type="date" aria-label="Due date" value={due} onChange={(e) => setDue(e.target.value)} />
        <button className="btn btn-secondary" disabled={!name.trim()}>Add</button>
      </form>
    </section>
  );
}

function UpdatesLog({ projectId, run }: { projectId: string; run: Run }) {
  const { updates, addUpdate, deleteUpdate } = useData();
  const list = updates.filter((u) => u.project_id === projectId);
  const [date, setDate] = useState(todayISO());
  const [source, setSource] = useState<Source>('Manual');
  const [summary, setSummary] = useState('');
  const [visible, setVisible] = useState(false);

  function add(e: FormEvent) {
    e.preventDefault();
    if (!summary.trim()) return;
    run(() => addUpdate({ project_id: projectId, date, source, summary: summary.trim(), client_visible: visible }));
    setSummary('');
    setVisible(false);
  }

  return (
    <section className="drawer-section">
      <h3 className="section-title">Updates log</h3>
      <form className="update-form" onSubmit={add}>
        <textarea
          className="input textarea"
          rows={2}
          placeholder="What happened?"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
        <div className="update-form-row">
          <input className="input input-date" type="date" aria-label="Date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Select ariaLabel="Source" value={source} options={SOURCES} onChange={setSource} />
          <label className="toggle">
            <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
            <span className="toggle-track" />
            <span>Visible to client</span>
          </label>
          <button className="btn btn-primary" disabled={!summary.trim()}>Add update</button>
        </div>
      </form>
      <ul className="log">
        {list.map((u) => (
          <li key={u.id} className="log-item">
            <div className="log-meta">
              <time>{formatDate(u.date)}</time>
              <span className="source">{u.source}</span>
              <span className={`tag ${u.client_visible ? 'tag-visible' : 'tag-internal'}`}>
                {u.client_visible ? 'Visible to client' : 'Internal'}
              </span>
              <ConfirmButton className="btn btn-ghost btn-sm btn-quiet log-delete" confirmLabel="Delete" onConfirm={() => run(() => deleteUpdate(u.id))}>
                Delete
              </ConfirmButton>
            </div>
            <p>{u.summary}</p>
          </li>
        ))}
        {list.length === 0 && <li className="muted small">No updates yet.</li>}
      </ul>
    </section>
  );
}
