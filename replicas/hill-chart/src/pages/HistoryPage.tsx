import { useEffect, useState } from 'react';
import { PEOPLE, PROJECTS, type Snapshot } from '../data';
import { dayHeading, dayKey, historyStamp } from '../format';
import { useStore } from '../store';
import { Avatar, Screen, ToolBar, usePopover } from '../components/Common';
import { HillChart } from '../components/HillChart';
import { snapshotDots } from '../components/HillPanel';
import { Dots } from '../components/Icons';

function HistoryCard({ projectKey, snap, index, highlight }: { projectKey: string; snap: Snapshot; index: number; highlight: boolean }) {
  const { state, dispatch } = useStore();
  const lists = state.lists[projectKey] ?? [];
  const snaps = state.snapshots[projectKey] ?? [];
  const comments = state.comments.filter((c) => c.snapshotId === snap.id);
  const [discuss, setDiscuss] = useState(comments.length > 0);
  const [body, setBody] = useState('');
  const menu = usePopover();
  const [copied, setCopied] = useState(false);

  return (
    <article className={`hcard${highlight ? ' hcard--highlight' : ''}`} id={snap.id}>
      <header className="hcard__head">
        <Avatar who={snap.author} size={40} />
        <div>
          <strong>{PEOPLE[snap.author].name}</strong>
          <div>{historyStamp(snap.at)}</div>
        </div>
        <div className="hcard__menu" ref={menu.ref}>
          <button className="listmenu__button" aria-label="Options" onClick={() => menu.setOpen(!menu.open)}>
            <Dots />
          </button>
          {menu.open && (
            <div className="listmenu__menu" role="menu">
              <button
                role="menuitem"
                onClick={() => {
                  navigator.clipboard?.writeText(`${location.origin}${location.pathname}#/p/${projectKey}/hill#${snap.id}`).catch(() => {});
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                  menu.setOpen(false);
                }}
              >
                Copy link
              </button>
            </div>
          )}
          {copied && <span className="hcard__copied">Link copied</span>}
        </div>
      </header>
      <div className="hcard__chart">
        <HillChart dots={snapshotDots(lists, snaps, index)} variant="compact" />
      </div>
      <div className="hcard__foot">
        {snap.note && <p className="hcard__note">{snap.note}</p>}
        {!discuss ? (
          <button className="btn btn--discuss" onClick={() => setDiscuss(true)}>
            Discuss
          </button>
        ) : (
          <div className="thread">
            {comments.map((c) => (
              <div className="comment" key={c.id}>
                <Avatar who={c.author} size={32} />
                <div>
                  <div className="comment__meta">
                    <strong>{PEOPLE[c.author].name}</strong> · {historyStamp(c.at)}
                  </div>
                  <p>{c.body}</p>
                </div>
              </div>
            ))}
            <form
              className="comment comment--new"
              onSubmit={(e) => {
                e.preventDefault();
                if (!body.trim()) return;
                dispatch({ type: 'addComment', snapshotId: snap.id, body: body.trim() });
                setBody('');
              }}
            >
              <Avatar who="maya" size={32} />
              <div>
                <textarea placeholder="Add a comment…" value={body} onChange={(e) => setBody(e.target.value)} rows={2} aria-label="Comment" />
                <button className="btn btn--primary" type="submit" disabled={!body.trim()}>
                  Add this comment
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </article>
  );
}

export function HistoryPage({ projectKey, anchor }: { projectKey: string; anchor?: string }) {
  const { state } = useStore();
  const project = PROJECTS.find((p) => p.key === projectKey)!;
  const snaps = state.snapshots[projectKey] ?? [];
  const ordered = snaps.map((s, i) => ({ s, i })).reverse();
  const groups: { key: string; items: typeof ordered }[] = [];
  for (const it of ordered) {
    const k = dayKey(it.s.at);
    const g = groups[groups.length - 1];
    if (g && g.key === k) g.items.push(it);
    else groups.push({ key: k, items: [it] });
  }
  useEffect(() => {
    if (anchor) document.getElementById(anchor)?.scrollIntoView({ block: 'center' });
    else window.scrollTo(0, 0);
  }, [anchor]);

  return (
    <Screen tint={project.tint} bar={<ToolBar projectKey={projectKey} sub={{ label: 'To-dos', href: `#/p/${projectKey}/todos` }} />}>
      <div className="page page--narrow">
        <h1 className="page__heading page__heading--center">Hill Chart Progress</h1>
        {groups.length === 0 && <p className="empty">Nobody has updated the Hill Chart yet.</p>}
        {groups.map((g) => (
          <section key={g.key} className="hday">
            <h2 className="hday__title">
              <span>{dayHeading(g.items[0].s.at)}</span>
            </h2>
            {g.items.map(({ s, i }) => (
              <HistoryCard key={s.id} projectKey={projectKey} snap={s} index={i} highlight={s.id === anchor} />
            ))}
          </section>
        ))}
      </div>
    </Screen>
  );
}
