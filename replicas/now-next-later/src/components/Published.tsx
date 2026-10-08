import { Check, Copy, ExternalLink, Pencil } from 'lucide-react';
import type { Column, Initiative } from '../types';
import { useStore } from '../store';
import { DATA, byOrder, chipDate, lineById, monthsAgo, objectiveById, plural, shortDate, staffById } from '../util';
import { href } from '../router';
import { notInReplica, toast } from './bits';
import { CalendarGlyph, ObjectiveIcon } from './Icons';

const publicUrl = (token: string) => window.location.href.split('#')[0] + href(`p/${token}`);

/* ---------- In-app list of published roadmaps ---------- */

export function PublishedList() {
  const { state } = useStore();
  return (
    <>
      <div className="toolbar" style={{ gridTemplateColumns: '1fr auto' }}>
        <p className="muted" style={{ margin: 0 }}>
          Each client gets a read-only link showing only their public initiatives. Internal notes, internal comments and candidates are never shown.
        </p>
        <button className="btn btn--navy" onClick={() => notInReplica('Creating a new published roadmap')}>
          New published roadmap
        </button>
      </div>
      <div className="pub-list">
        {DATA.publishedRoadmaps.map((r) => {
          const products = DATA.products.filter((p) => p.line === r.line);
          const shown = state.initiatives.filter((i) => products.some((p) => p.id === i.product) && i.visibility === 'public' && i.column !== 'candidate');
          const url = publicUrl(r.token);
          return (
            <section className="pub-item" key={r.token}>
              <div>
                <h3>{r.name}</h3>
                <p className="muted" style={{ marginBottom: 8 }}>
                  {r.description}
                </p>
                <div className="url-box">{url}</div>
                <div className="pub-item__meta">
                  <span>Sections: Roadmap, Completed</span>
                  <span>Products: {products.map((p) => p.name).join(', ')}</span>
                  <span>{plural(shown.length, 'public initiative')}</span>
                  <span>Created by {staffById(r.createdBy)?.name}</span>
                  <span>Last updated {shortDate(r.lastUpdated)}</span>
                </div>
              </div>
              <div className="pub-item__actions">
                <button
                  className="btn btn--outline btn--sm"
                  onClick={() => {
                    navigator.clipboard?.writeText(url).catch(() => {});
                    toast('Published roadmap URL copied');
                  }}
                >
                  <Copy size={14} /> Copy URL
                </button>
                <button className="btn btn--outline btn--sm" onClick={() => notInReplica('Editing published roadmaps')}>
                  <Pencil size={14} /> Edit
                </button>
                <a className="btn btn--navy btn--sm" href={href(`p/${r.token}`)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  <ExternalLink size={14} /> View
                </a>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

/* ---------- The client-facing page ---------- */

function PubObjectives({ ids }: { ids: string[] }) {
  if (!ids.length) return null;
  return (
    <div className="pub-obj-list">
      {ids.map((id) => {
        const o = objectiveById(id);
        if (!o) return null;
        return (
          <span key={id} className={`pub-obj pub-obj--${o.color}`}>
            {o.line === null && <ObjectiveIcon />}
            <span>{o.name}</span>
          </span>
        );
      })}
    </div>
  );
}

function PubCard({ i, completed }: { i: Initiative; completed?: boolean }) {
  return (
    <div className="pub-card">
      {completed && i.completedOn && (
        <div className="pub-completed-on">
          <span className="pub-check">
            <Check size={14} strokeWidth={3} />
          </span>
          Completed on {shortDate(i.completedOn)}
        </div>
      )}
      <PubObjectives ids={i.objectives} />
      <div className="pub-card__body">
        <p className="pub-card__title">{i.title}</p>
        {i.description && (
          <div className="pub-card__desc">
            <p>{i.description}</p>
            {completed && i.outcome && (
              <>
                <p>
                  <strong>What we delivered:</strong>
                </p>
                <p>{i.outcome}</p>
              </>
            )}
          </div>
        )}
        {!completed && i.targetDate && (
          <span className="pub-date">
            <CalendarGlyph />
            {chipDate(i.targetDate)}
          </span>
        )}
      </div>
      <div className="pub-card__foot">
        <div className="pub-card__foot-left">{completed && <span>{plural(i.ideas.length, 'Idea')}</span>}</div>
        <span>Public</span>
      </div>
    </div>
  );
}

function PubHeader({ name, description }: { name: string; description?: string }) {
  return (
    <div className="pub-header">
      <h1>{name}</h1>
      {description && <p>{description}</p>}
    </div>
  );
}

function ProductHead({ name, color, summary }: { name: string; color: string; summary?: string }) {
  return (
    <>
      <div className="pub-roadmap__header">
        <span className="pub-product-image" style={{ background: color }}>
          {name[0]}
        </span>
        <h2>{name}</h2>
      </div>
      {summary && <p className="pub-roadmap__desc">{summary}</p>}
    </>
  );
}

function UpcomingProduct({ items, columns }: { items: Initiative[]; columns: Column[] }) {
  return (
    <div className="pub-columns">
      {columns.map((c) => {
        const list = items.filter((i) => i.column === c.id).sort(byOrder);
        const ideas = list.reduce((n, i) => n + i.ideas.length, 0);
        return (
          <div className="pub-column" key={c.id}>
            <div className="pub-column__head">
              <div className="pub-column__title">
                <h2>{c.title}</h2>
                <span className="pub-count">
                  ({plural(list.length, 'Initiative')}, {plural(ideas, 'Idea')})
                </span>
              </div>
              <div className="pub-column__desc">{c.description}</div>
            </div>
            <div className="pub-column__body">
              {list.map((i) => (
                <PubCard key={i.id} i={i} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CompletedProduct({ items }: { items: Initiative[] }) {
  const sorted = [...items].sort((a, b) => (b.completedOn || '').localeCompare(a.completedOn || ''));
  const periods = [
    { title: 'Completed in the last 3 months', list: sorted.filter((i) => monthsAgo(i.completedOn!) < 3) },
    { title: 'Completed 3 - 6 months ago', list: sorted.filter((i) => monthsAgo(i.completedOn!) >= 3 && monthsAgo(i.completedOn!) < 6) },
    { title: 'Completed more than 6 months ago', list: sorted.filter((i) => monthsAgo(i.completedOn!) >= 6) },
  ].filter((p) => p.list.length > 0);
  return (
    <div className="pub-completed">
      <div className="pub-completed__head">
        <h2>Completed</h2>
        <span className="pub-count">({plural(items.length, 'initiative')})</span>
      </div>
      {periods.map((p) => (
        <div key={p.title}>
          <div className="pub-period-title">{p.title}</div>
          <div className="pub-grid">
            {p.list.map((i) => (
              <PubCard key={i.id} i={i} completed />
            ))}
          </div>
        </div>
      ))}
      {periods.length === 0 && <p className="pub-empty">Nothing completed yet.</p>}
    </div>
  );
}

export function PublishedPage({ token }: { token: string }) {
  const { state } = useStore();
  const roadmap = DATA.publishedRoadmaps.find((r) => r.token === token);
  if (!roadmap) {
    return (
      <div className="pub-notfound">
        <h1 style={{ fontFamily: 'Arial', fontWeight: 300 }}>Roadmap not found</h1>
        <p>This link may have expired. Ask your contact at {DATA.agency} for a new one.</p>
      </div>
    );
  }
  const line = lineById(roadmap.line);
  const products = DATA.products.filter((p) => p.line === line.id);
  const pub = state.initiatives.filter((i) => i.visibility === 'public');
  const upcoming = products
    .map((p) => ({ p, items: pub.filter((i) => i.product === p.id && ['now', 'next', 'later'].includes(i.column)) }))
    .filter((x) => x.items.length > 0);
  const done = products
    .map((p) => ({ p, items: pub.filter((i) => i.product === p.id && i.column === 'completed') }))
    .filter((x) => x.items.length > 0);
  document.title = `${line.name} roadmap · ${DATA.agency}`;
  return (
    <div className="pub-page">
      <div className="pub-widget" id="published-roadmap">
        <PubHeader name="Upcoming" description={roadmap.description} />
        {upcoming.map(({ p, items }) => (
          <div className="pub-roadmap" key={p.id}>
            <ProductHead name={p.name} color={p.color} summary={p.clientSummary} />
            <UpcomingProduct items={items} columns={state.columns} />
          </div>
        ))}
        {upcoming.length === 0 && <p className="pub-empty" style={{ padding: '0 24px' }}>Nothing is planned right now.</p>}
        <div className="pub-footer">
          Powered By&nbsp;<a>{DATA.agency}</a>
        </div>
      </div>
      <div className="pub-widget">
        <PubHeader name="Recently Launched" />
        {done.map(({ p, items }) => (
          <div className="pub-roadmap" key={p.id}>
            <ProductHead name={p.name} color={p.color} summary={upcoming.some((u) => u.p.id === p.id) ? undefined : p.clientSummary} />
            <CompletedProduct items={items} />
          </div>
        ))}
        <div className="pub-footer">
          Powered By&nbsp;<a>{DATA.agency}</a>
        </div>
      </div>
    </div>
  );
}
