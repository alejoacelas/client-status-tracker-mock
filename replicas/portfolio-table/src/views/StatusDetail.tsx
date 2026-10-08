import { useRef, useState } from 'react';
import { fmtDate } from '../lib/dates';
import { STATUS } from '../lib/status';
import { getPerson, hrefFor, itemInfo, updatesFor, useStore, useToast } from '../store';
import { IconChevronLeft, IconChevronRight, IconClose, IconLink, IconLockFilled, IconMore, IconThumb } from '../components/Icons';
import { copyLink, UpdateFields, UpdateMenu, UpdateSections } from '../components/StatusCard';
import { Avatar, FolderIcon } from '../components/ui';

export function StatusDetail({ id }: { id: string }) {
  const { data, actions } = useStore();
  const toast = useToast();
  const u = data.updates.find((x) => x.id === id);
  const moreRef = useRef<HTMLButtonElement>(null);
  const [menu, setMenu] = useState(false);
  const [comment, setComment] = useState('');
  const [focused, setFocused] = useState(false);

  if (!u) {
    return (
      <div className="not-replicated">
        <h2>This status update was deleted</h2>
        <a className="btn btn-secondary" href="#/portfolio/all-clients/list">Back to All clients</a>
      </div>
    );
  }
  const info = itemInfo(data, u.parent);
  const author = getPerson(data, u.authorId);
  const me = getPerson(data, data.meId);
  const liked = u.likes.includes(data.meId);
  const backHref = u.parent.type === 'project' ? hrefFor.project(u.parent.id) : hrefFor.portfolio(u.parent.id, 'progress');
  const siblings = updatesFor(data, u.parent);
  const idx = siblings.findIndex((x) => x.id === u.id);
  const newer = siblings[idx - 1];
  const older = siblings[idx + 1];

  return (
    <div className="composer detail" style={{ ['--status-color' as string]: STATUS[u.status].bar }}>
      <header className="composer-bar">
        <nav className="composer-crumb">
          <a href={backHref}>
            {u.parent.type === 'project' ? <span className="dot" style={{ background: info?.color }} /> : <FolderIcon color={info?.color ?? '#4573d2'} size={16} />}
            <span className="crumb-name">{info?.name ?? 'Deleted'}</span>
          </a>
          <IconChevronRight size={12} />
          <span className="strong">Status update</span>
        </nav>
        <div className="composer-actions">
          <button className={`icon-btn ${liked ? 'liked' : ''}`} aria-label={liked ? 'Unlike' : 'Like'} onClick={() => actions.toggleLike(u.id)}>
            <IconThumb filled={liked} />
            {u.likes.length > 0 && <span className="like-count">{u.likes.length}</span>}
          </button>
          <button className="icon-btn" aria-label="Copy link" onClick={() => { copyLink(hrefFor.update(u.id)); toast('Status update link copied to clipboard'); }}>
            <IconLink />
          </button>
          <button ref={moreRef} className="icon-btn" aria-label="More actions" onClick={() => setMenu(true)}>
            <IconMore />
          </button>
          <a className="icon-btn" aria-label="Close" href={backHref}>
            <IconClose />
          </a>
        </div>
      </header>
      <div className="composer-body">
        <div className="composer-main">
          <article className="composer-doc detail-doc">
            <h1 className="detail-title">{u.title}</h1>
            <div className="sc-author">
              <Avatar person={author} size={32} />
              <span className="strong">{author?.name}</span>
              <span className="muted">{fmtDate(u.date)}</span>
              {u.isPrivate && (
                <span className="private-badge" title="Only visible to Fieldwork Studio staff">
                  <IconLockFilled size={11} /> Private
                </span>
              )}
            </div>
            <UpdateFields u={u} />
            <hr className="composer-hr" />
            <UpdateSections u={u} />
            <div className="detail-nav">
              {older ? (
                <a href={hrefFor.update(older.id)} className="btn-subtle"><IconChevronLeft size={12} /> Older update</a>
              ) : <span />}
              {newer && <a href={hrefFor.update(newer.id)} className="btn-subtle">Newer update <IconChevronRight size={12} /></a>}
            </div>
            <section className="comments">
              {u.likes.length > 0 && (
                <div className="likes-line muted small">
                  <IconThumb size={12} filled /> Liked by {u.likes.map((l) => getPerson(data, l)?.name).filter(Boolean).join(', ')}
                </div>
              )}
              {u.comments.map((c) => (
                <div key={c.id} className="comment">
                  <Avatar person={getPerson(data, c.authorId)} size={32} />
                  <div>
                    <div><span className="strong">{getPerson(data, c.authorId)?.name}</span> <span className="muted small">{fmtDate(c.date)}</span></div>
                    <p className="comment-text">{c.text}</p>
                  </div>
                </div>
              ))}
              <div className={`comment-box ${focused || comment ? 'open' : ''}`}>
                <Avatar person={me} size={32} />
                <div className="comment-input-wrap">
                  <textarea
                    className="comment-input"
                    placeholder="Ask a question or post an update..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && comment.trim()) {
                        actions.addComment(u.id, comment);
                        setComment('');
                      }
                    }}
                    rows={focused || comment ? 3 : 1}
                  />
                  {(focused || comment) && (
                    <div className="comment-foot">
                      <button
                        className="btn btn-primary sm"
                        disabled={!comment.trim()}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          actions.addComment(u.id, comment);
                          setComment('');
                        }}
                      >
                        Comment
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </article>
        </div>
      </div>
      {menu && <UpdateMenu u={u} anchor={moreRef.current} onClose={() => setMenu(false)} />}
    </div>
  );
}
