import { useRef, useState } from 'react';
import type { StatusUpdate } from '../data/mock';
import { fmtDate, fmtRange } from '../lib/dates';
import { STATUS } from '../lib/status';
import { getPerson, hrefFor, itemInfo, navigate, useStore, useToast } from '../store';
import { HighlightBlock } from './Highlights';
import { IconLink, IconLockFilled, IconMore, IconPencil, IconThumb, IconTrash } from './Icons';
import { Avatar, MenuItem, MenuSep, Popover, StatusChip } from './ui';

export function UpdateFields({ u }: { u: StatusUpdate }) {
  const { data } = useStore();
  const info = itemInfo(data, u.parent);
  const owner = getPerson(data, info?.ownerId);
  return (
    <div className="su-fields">
      <div className="su-field">
        <span className="su-field-label">Status</span>
        <StatusChip status={u.status} size="sm" />
      </div>
      <div className="su-field">
        <span className="su-field-label">Owner</span>
        <span>{owner?.name ?? '—'}</span>
      </div>
      <div className="su-field">
        <span className="su-field-label">Dates</span>
        <span>{info ? fmtRange(info.startDate, info.dueDate) || '—' : '—'}</span>
      </div>
      {u.source && (
        <div className="su-field">
          <span className="su-field-label">Source</span>
          <span>{u.source}</span>
        </div>
      )}
    </div>
  );
}

export function UpdateSections({ u, compact }: { u: StatusUpdate; compact?: boolean }) {
  const { data } = useStore();
  const sections = u.sections.filter((s) => s.text.trim() || s.highlights.length);
  return (
    <div className={`su-sections ${compact ? 'compact' : ''}`}>
      {sections.map((s) => (
        <section key={s.id} className="su-section">
          <h3>{s.title}</h3>
          {s.text.trim() && <p className="su-text">{s.text}</p>}
          {s.highlights.map((h) => (
            <HighlightBlock key={h.id} data={data} parent={u.parent} h={h} />
          ))}
        </section>
      ))}
    </div>
  );
}

export function UpdateMenu({ u, anchor, onClose }: { u: StatusUpdate; anchor: HTMLElement | null; onClose: () => void }) {
  const { actions } = useStore();
  const toast = useToast();
  return (
    <Popover anchor={anchor} onClose={onClose} align="right">
      <div className="menu">
        <MenuItem icon={<IconPencil />} onClick={() => { onClose(); navigate(`/edit/${u.id}`); }}>Edit status update</MenuItem>
        <MenuItem
          icon={<IconLink />}
          onClick={() => {
            onClose();
            copyLink(hrefFor.update(u.id));
            toast('Status update link copied to clipboard');
          }}
        >
          Copy status update link
        </MenuItem>
        <MenuSep />
        <MenuItem
          danger
          icon={<IconTrash />}
          onClick={() => {
            onClose();
            const backup = u;
            actions.deleteUpdate(u.id);
            toast('Status update deleted', { label: 'Undo', run: () => actions.postUpdate(backup) });
          }}
        >
          Delete status update
        </MenuItem>
      </div>
    </Popover>
  );
}

export function copyLink(hash: string) {
  const url = location.href.split('#')[0] + hash;
  try {
    void navigator.clipboard?.writeText(url);
  } catch {
    /* ignore */
  }
}

export function StatusCard({ u, compact }: { u: StatusUpdate; compact?: boolean }) {
  const { data, actions } = useStore();
  const toast = useToast();
  const moreRef = useRef<HTMLButtonElement>(null);
  const [menu, setMenu] = useState(false);
  const author = getPerson(data, u.authorId);
  const liked = u.likes.includes(data.meId);
  return (
    <article className="status-card" style={{ borderTopColor: STATUS[u.status].bar }}>
      <div className="sc-head">
        <a className="sc-title" href={hrefFor.update(u.id)}>
          {u.title}
        </a>
        <div className="sc-actions">
          <button className={`icon-btn ${liked ? 'liked' : ''}`} aria-label={liked ? 'Unlike' : 'Like'} onClick={() => actions.toggleLike(u.id)}>
            <IconThumb filled={liked} />
            {u.likes.length > 0 && <span className="like-count">{u.likes.length}</span>}
          </button>
          <button
            className="icon-btn"
            aria-label="Copy link"
            onClick={() => {
              copyLink(hrefFor.update(u.id));
              toast('Status update link copied to clipboard');
            }}
          >
            <IconLink />
          </button>
          <button ref={moreRef} className="icon-btn" aria-label="More actions" onClick={() => setMenu(true)}>
            <IconMore />
          </button>
        </div>
      </div>
      <div className="sc-author">
        <Avatar person={author} size={28} />
        <span className="strong">{author?.name}</span>
        <span className="muted">{fmtDate(u.date)}</span>
        {u.isPrivate && (
          <span className="private-badge" title="Only visible to Fieldwork Studio staff">
            <IconLockFilled size={11} /> Private
          </span>
        )}
      </div>
      <UpdateFields u={u} />
      <UpdateSections u={u} compact={compact} />
      {menu && <UpdateMenu u={u} anchor={moreRef.current} onClose={() => setMenu(false)} />}
    </article>
  );
}
