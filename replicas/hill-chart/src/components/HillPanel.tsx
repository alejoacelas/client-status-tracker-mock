import { useEffect, useState } from 'react';
import { HILL_COLORS, PEOPLE, PROJECTS, type Snapshot, type TodoList } from '../data';
import { daysSince, updatedPhrase } from '../format';
import { newId, positionsFor, useStore } from '../store';
import { Avatar } from './Common';
import { HillChart, type HillDot } from './HillChart';
import { ChevronLeft, ChevronRight } from './Icons';

export function dotsFor(lists: TodoList[], positions: Record<string, number>): HillDot[] {
  return lists
    .filter((l) => positions[l.id] !== undefined)
    .map((l) => ({ id: l.id, name: l.name, color: HILL_COLORS[l.color], pos: positions[l.id] }));
}

/** Lists shown for a snapshot: the latest shows every tracked list; older ones show what they recorded. */
export function snapshotDots(lists: TodoList[], snaps: Snapshot[], index: number): HillDot[] {
  const latest = index === snaps.length - 1 || snaps.length === 0;
  const s = snaps[index];
  if (latest) return dotsFor(lists, positionsFor(lists, s));
  return dotsFor(lists, s.positions);
}

export function HillPanel({ projectKey }: { projectKey: string }) {
  const { state, dispatch } = useStore();
  const project = PROJECTS.find((p) => p.key === projectKey)!;
  const lists = state.lists[projectKey] ?? [];
  const snaps = state.snapshots[projectKey] ?? [];
  const last = snaps.length - 1;
  const [index, setIndex] = useState(last);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, number>>({});
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [, tick] = useState(0);

  // Keep showing the newest snapshot when one is added.
  useEffect(() => setIndex(snaps.length - 1), [snaps.length]);
  // Refresh relative times ("a second ago") while the page is open.
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const tracked = lists.filter((l) => l.tracked);
  if (tracked.length === 0 && snaps.length === 0) {
    return (
      <div className="hillbox hillbox--empty">
        <p>
          Track a to-do list on the Hill Chart to see where the work really stands. Choose <strong>Track this on the Hill Chart</strong> from a
          list’s <span aria-label="options">•••</span> menu.
        </p>
      </div>
    );
  }

  const shownIndex = Math.min(Math.max(index, 0), Math.max(last, 0));
  const snapshot = snaps[shownIndex] as Snapshot | undefined;
  const dots = editing ? dotsFor(lists, draft) : snapshotDots(lists, snaps, shownIndex);

  const lastSnap = snaps[last];
  const allDone = lastSnap && Object.values(positionsFor(lists, lastSnap)).every((v) => v >= 99);
  const stale = !editing && lastSnap && project.status !== 'Done' && !allDone && daysSince(lastSnap.at) >= 14;

  const startUpdate = () => {
    setIndex(last);
    setDraft(positionsFor(lists, lastSnap));
    setNoteFor(null);
    setEditing(true);
  };
  const save = () => {
    const id = `${projectKey}-${newId()}`;
    dispatch({ type: 'saveSnapshot', project: projectKey, positions: draft, id });
    setEditing(false);
    setNoteFor(id);
    setNote('');
  };
  const postNote = () => {
    if (noteFor && note.trim()) dispatch({ type: 'setNote', project: projectKey, snapshotId: noteFor, note: note.trim() });
    setNoteFor(null);
  };

  return (
    <div className="hillbox">
      {stale && (
        <div className="hillbox__stale">
          <span>It’s been a while since the last update</span>
        </div>
      )}
      <div className={`hillbox__panel${editing ? ' hillbox__panel--editing' : ''}`}>
        {!editing && snapshot && (
          <div className="hillbox__author">
            <Avatar who={snapshot.author} size={32} />
            <span>
              <strong>{PEOPLE[snapshot.author].name}</strong>
              {snapshot.note && (
                <a className="hillbox__note-link" href={`#/p/${projectKey}/hill#${snapshot.id}`}>
                  Read the note
                </a>
              )}
            </span>
          </div>
        )}
        <HillChart dots={dots} editing={editing} animate={!editing} onMove={(id, pos) => setDraft((d) => ({ ...d, [id]: pos }))} />
        <div className="hillbox__footer">
          {editing ? (
            <>
              <button className="btn btn--plain" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <span className="hillbox__status">Drag each dot to adjust its position on the chart</span>
              <button className="btn btn--primary hillbox__save" onClick={save}>
                Save this update
              </button>
            </>
          ) : (
            <>
              <button className="btn btn--update" onClick={startUpdate}>
                Update
              </button>
              <span className="hillbox__status">
                {snapshot ? `Updated ${updatedPhrase(snapshot.at)}` : 'Not updated yet'}
                {snaps.length > 0 && (
                  <>
                    {' · '}
                    <a href={`#/p/${projectKey}/hill`}>See history</a>
                  </>
                )}
              </span>
              {snaps.length > 0 ? (
                <span className="hillbox__pager">
                  <button aria-label="Previous update" disabled={shownIndex <= 0} onClick={() => setIndex(shownIndex - 1)}>
                    <ChevronLeft />
                  </button>
                  <span aria-live="polite">
                    {shownIndex + 1}/{snaps.length}
                  </span>
                  <button aria-label="Next update" disabled={shownIndex >= last} onClick={() => setIndex(shownIndex + 1)}>
                    <ChevronRight />
                  </button>
                </span>
              ) : (
                <span />
              )}
            </>
          )}
        </div>
      </div>
      {noteFor && (
        <form
          className="hillnote"
          onSubmit={(e) => {
            e.preventDefault();
            postNote();
          }}
        >
          <Avatar who="maya" size={32} />
          <div className="hillnote__body">
            <label htmlFor="hill-note">
              <strong>Update saved.</strong> Want to add a note? It helps everyone understand what changed.
            </label>
            <textarea id="hill-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Write a note about this update…" rows={3} autoFocus />
            <div className="hillnote__actions">
              <button className="btn btn--primary" type="submit" disabled={!note.trim()}>
                Add this note
              </button>
              <button className="btn btn--plain" type="button" onClick={() => setNoteFor(null)}>
                No thanks
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
