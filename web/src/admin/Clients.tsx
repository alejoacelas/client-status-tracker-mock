import { useState, type FormEvent } from 'react';
import type { Client } from '../lib/types';
import { newShareToken } from '../lib/format';
import { ConfirmButton } from '../components/ui';
import { useData } from './data';

const clientUrl = (token: string) => `${window.location.origin}/c/${token}`;

export default function Clients() {
  const { clients, projects } = useData();
  const [adding, setAdding] = useState(false);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Clients</h1>
          <p className="muted">Each client has a private status page. Share the link; regenerate it to revoke old copies.</p>
        </div>
        {!adding && (
          <button className="btn btn-primary" onClick={() => setAdding(true)}>
            Add client
          </button>
        )}
      </header>
      {adding && <AddClient onDone={() => setAdding(false)} />}
      <div className="client-list">
        {clients.map((c) => (
          <ClientRow
            key={c.id}
            client={c}
            projectCount={projects.filter((p) => p.client_id === c.id).length}
            activeCount={projects.filter((p) => p.client_id === c.id && p.status !== 'Done').length}
          />
        ))}
        {clients.length === 0 && <div className="card empty">No clients yet.</div>}
      </div>
    </div>
  );
}

function ClientRow({ client: c, projectCount, activeCount }: { client: Client; projectCount: number; activeCount: number }) {
  const { updateClient } = useData();
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  function flash(kind: 'ok' | 'error', text: string) {
    setMessage({ kind, text });
    setTimeout(() => setMessage(null), 2200);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(clientUrl(c.share_token));
      flash('ok', 'Link copied');
    } catch {
      flash('error', 'Copy failed');
    }
  }

  async function regenerate() {
    const err = await updateClient(c.id, { share_token: newShareToken() });
    flash(err ? 'error' : 'ok', err ? `Couldn't regenerate: ${err}` : 'New link created; the old one no longer works');
  }

  return (
    <article className="card client-row">
      <div className="client-row-main">
        <h2>{c.name}</h2>
        <p className="muted small">
          {c.contact_name ?? 'No contact'}
          {c.contact_email && (
            <>
              {' · '}
              <a href={`mailto:${c.contact_email}`}>{c.contact_email}</a>
            </>
          )}
        </p>
      </div>
      <div className="client-row-count">
        <strong>{projectCount}</strong> project{projectCount === 1 ? '' : 's'}
        <span className="muted small">{activeCount} active</span>
      </div>
      <div className="client-row-link">
        <code className="link-preview" title={clientUrl(c.share_token)}>/c/{c.share_token}</code>
        <div className="client-row-actions">
          <button className="btn btn-secondary btn-sm" onClick={copy}>Copy client link</button>
          <a className="btn btn-secondary btn-sm" href={`/c/${c.share_token}`} target="_blank" rel="noreferrer">
            Open client page ↗
          </a>
          <ConfirmButton prompt="Old link stops working." confirmLabel="Regenerate" onConfirm={regenerate}>
            Regenerate link
          </ConfirmButton>
        </div>
        {message && <span className={`flash flash-${message.kind}`}>{message.text}</span>}
      </div>
    </article>
  );
}

function AddClient({ onDone }: { onDone: () => void }) {
  const { addClient } = useData();
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const err = await addClient({
      name: name.trim(),
      contact_name: contactName.trim() || null,
      contact_email: contactEmail.trim() || null,
      share_token: newShareToken(),
    });
    setBusy(false);
    if (err) setError(err);
    else onDone();
  }

  return (
    <form className="card add-client" onSubmit={submit}>
      <h2>New client</h2>
      <div className="field-grid">
        <label className="field">
          <span>Company name</span>
          <input className="input" required autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">
          <span>Contact name</span>
          <input className="input" value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </label>
        <label className="field">
          <span>Contact email</span>
          <input className="input" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
        </label>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onDone}>Cancel</button>
        <button className="btn btn-primary" disabled={busy || !name.trim()}>
          {busy ? 'Adding…' : 'Add client'}
        </button>
      </div>
    </form>
  );
}
