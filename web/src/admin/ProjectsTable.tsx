import { useMemo, type MouseEvent } from 'react';
import { PHASES, STATUSES, type Project } from '../lib/types';
import { statusSlug } from '../lib/format';
import { SaveIndicator, useSaveState } from '../components/ui';
import { useData } from './data';
import { useOpenProject } from './AdminApp';
import { CommitInput, Select, clampProgress } from './fields';

export default function ProjectsTable() {
  const { projects, clients } = useData();
  const owners = useMemo(() => [...new Set(projects.map((p) => p.owner).filter(Boolean))] as string[], [projects]);
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? '';
  const rows = [...projects].sort(
    (a, b) => Number(a.status === 'Done') - Number(b.status === 'Done') || (a.due_date ?? '').localeCompare(b.due_date ?? ''),
  );

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Projects</h1>
          <p className="muted">Edit fields inline; changes save automatically. Click a project to see everything.</p>
        </div>
      </header>
      <datalist id="owners">
        {owners.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
      <div className="table-wrap card">
        <table className="table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Status</th>
              <th>Phase</th>
              <th>Progress</th>
              <th>Due</th>
              <th>Owner</th>
              <th aria-label="Save state" />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <ProjectRow key={p.id} project={p} client={clientName(p.client_id)} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProjectRow({ project: p, client }: { project: Project; client: string }) {
  const { updateProject } = useData();
  const openProject = useOpenProject();
  const save = useSaveState();
  const set = (patch: Partial<Project>) => save.track(() => updateProject(p.id, patch));
  const stop = { onClick: (e: MouseEvent) => e.stopPropagation() };

  return (
    <tr className="row-click" onClick={() => openProject(p.id)}>
      <td>
        <button className="link-cell" onClick={() => openProject(p.id)}>
          <span className="cell-name">{p.name}</span>
          <span className="cell-sub">{client}</span>
        </button>
      </td>
      <td {...stop}>
        <Select
          className={`select select-status status-${statusSlug(p.status)}`}
          ariaLabel="Status"
          value={p.status}
          options={STATUSES}
          onChange={(status) => set({ status })}
        />
      </td>
      <td {...stop}>
        <Select ariaLabel="Phase" value={p.phase} options={PHASES} onChange={(phase) => set({ phase })} />
      </td>
      <td {...stop}>
        <span className="input-suffix">
          <CommitInput
            className="input input-num"
            type="number"
            min={0}
            max={100}
            step={5}
            aria-label="Progress"
            value={String(p.progress)}
            onCommit={(v) => {
              const n = clampProgress(v);
              if (n !== null) set({ progress: n });
            }}
          />
          <span>%</span>
        </span>
      </td>
      <td {...stop}>
        <input
          className="input input-date"
          type="date"
          aria-label="Due date"
          value={p.due_date ?? ''}
          onChange={(e) => set({ due_date: e.target.value || null })}
        />
      </td>
      <td {...stop}>
        <CommitInput
          className="input input-owner"
          list="owners"
          aria-label="Owner"
          placeholder="Unassigned"
          value={p.owner ?? ''}
          onCommit={(v) => set({ owner: v.trim() || null })}
        />
      </td>
      <td className="cell-save">
        <SaveIndicator state={save.state} error={save.error} />
      </td>
    </tr>
  );
}
