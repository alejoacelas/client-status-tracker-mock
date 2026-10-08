import { useRef, useState, type ReactNode } from 'react';
import type { Update } from '../data/mock';
import { CURRENT_USER_ID, initiatives } from '../data/mock';
import { HEALTH_META, I } from '../icons';
import { actions, getState, userById } from '../store';
import { toast } from '../ui';
import { ago, copyText, fullDateTime, Markdown } from '../util';
import { Avatar, HealthLabel } from './bits';
import { Composer } from './Composer';
import { Menu, Popover, Tooltip, useAnchor } from './Menu';

const EMOJI = ['👍', '👎', '❤️', '🎉', '🚀', '🔥', '👀', '🙌', '✋', '▶️', '😄', '🤔', '💡', '😍', '✅', '🙏'];

export function EmojiButton({ onPick, plain = true }: { onPick: (e: string) => void; plain?: boolean }) {
  const a = useAnchor();
  return (
    <>
      <Tooltip label="Add reaction">
        <button className={`round-btn ${plain ? 'plain' : ''}`} onClick={a.open} aria-label="Add reaction">
          <I.emojiAdd size={16} />
        </button>
      </Tooltip>
      {a.anchor && (
        <Popover anchor={a.anchor} onClose={a.close}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 30px)', gap: 2, padding: 2 }}>
            {EMOJI.map((e) => (
              <button key={e} className="menu-item" style={{ height: 30, padding: 0, justifyContent: 'center', fontSize: 17 }} onClick={() => { onPick(e); a.close(); }}>
                {e}
              </button>
            ))}
          </div>
        </Popover>
      )}
    </>
  );
}

function Reactions({ list, onToggle }: { list: Update['reactions']; onToggle: (e: string) => void }) {
  return (
    <>
      {list.map((r) => {
        const names = r.userIds.map((id) => userById(id).name).join(', ');
        return (
          <Tooltip key={r.emoji} label={`${names} reacted with ${r.emoji}`}>
            <button className={`reaction ${r.userIds.includes(CURRENT_USER_ID) ? 'mine' : ''}`} onClick={() => onToggle(r.emoji)}>
              <span className="e">{r.emoji}</span>
              {r.userIds.length}
            </button>
          </Tooltip>
        );
      })}
    </>
  );
}

export function ProgressDetails({ progress, action }: { progress: NonNullable<Update['progress']>; action?: ReactNode }) {
  return (
    <div className="progress-box">
      <div className="progress-row" style={{ justifyContent: 'space-between' }}>
        <span>Progress since last update</span>
        {action}
      </div>
      <div className="progress-row">
        <I.progress size={14} />
        <span>Project progress</span>
        <span className="val">{progress.from}%</span>
        <I.arrowRight size={12} />
        <span className="val">{progress.to}%</span>
        <div className="bar"><div style={{ width: `${progress.to}%` }} /></div>
      </div>
      {progress.milestone && (
        <div className="progress-row">
          <I.diamond size={14} />
          <span>Milestone</span>
          <span className="val">{progress.milestone}</span>
        </div>
      )}
    </div>
  );
}

function CommentThread({ u }: { u: Update }) {
  const [text, setText] = useState('');
  const ta = useRef<HTMLTextAreaElement>(null);
  const send = () => {
    if (!text.trim()) return;
    actions.addComment(u.id, text.trim());
    setText('');
    if (ta.current) ta.current.style.height = '';
  };
  return (
    <div className="thread">
      {u.comments.map((c) => (
        <div className="comment" key={c.id}>
          <div className="comment-head">
            <Avatar userId={c.authorId} size={18} />
            <span className="name">{userById(c.authorId).name}</span>
            <Tooltip label={fullDateTime(c.createdAt)}><span className="time">{ago(c.createdAt)}</span></Tooltip>
          </div>
          <div className="comment-body"><Markdown text={c.body} className="small" /></div>
          {c.reactions && c.reactions.length > 0 && (
            <div className="comment-reacts"><Reactions list={c.reactions} onToggle={(e) => actions.toggleReaction(u.id, e, c.id)} /></div>
          )}
          <div className="comment-tools">
            <EmojiButton onPick={(e) => actions.toggleReaction(u.id, e, c.id)} />
            <Tooltip label="Copy comment">
              <button className="round-btn plain" aria-label="Copy comment" onClick={() => { copyText(c.body); toast('Comment copied to clipboard'); }}><I.copy size={14} /></button>
            </Tooltip>
            {c.authorId === CURRENT_USER_ID && (
              <Tooltip label="Delete comment">
                <button className="round-btn plain" aria-label="Delete comment" onClick={() => actions.deleteComment(u.id, c.id)}><I.trash size={14} /></button>
              </Tooltip>
            )}
          </div>
        </div>
      ))}
      <div className="reply">
        <Avatar userId={CURRENT_USER_ID} size={18} />
        <textarea
          ref={ta}
          className="reply-input"
          rows={1}
          autoFocus={u.comments.length === 0}
          placeholder={u.comments.length ? 'Leave a reply…' : 'Leave a comment…'}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = '';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || !e.shiftKey)) { e.preventDefault(); send(); }
          }}
        />
        {text.trim() && <button className="btn btn-primary" style={{ height: 24, padding: '0 8px' }} onClick={send}>Reply</button>}
      </div>
    </div>
  );
}

export function updateMarkdown(u: Update): string {
  const s = getState();
  const target = u.projectId ? s.projects.find((p) => p.id === u.projectId)?.name : initiatives.find((i) => i.id === u.initiativeId)?.name;
  return `**${target}** · ${HEALTH_META[u.health].label} · ${userById(u.authorId).fullName} · ${fullDateTime(u.createdAt)}\n\n${u.body}`;
}

export function updateLink(u: Update): string {
  const path = u.projectId ? `project/${u.projectId}/updates/${u.id}` : `initiative/${u.initiativeId}/updates/${u.id}`;
  return `${window.location.origin}${window.location.pathname}#/${path}`;
}

export function UpdateItem({
  u, variant = 'feed', title, hideActions, highlight,
}: {
  u: Update;
  variant?: 'latest' | 'feed' | 'pulse' | 'popover';
  title?: ReactNode;
  hideActions?: boolean;
  highlight?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [thread, setThread] = useState(variant !== 'latest' && variant !== 'popover' && u.comments.length > 0 && variant !== 'pulse');
  const more = useAnchor();
  const mine = u.authorId === CURRENT_USER_ID;
  const kind = u.projectId ? 'Project' : 'Initiative';

  if (editing)
    return (
      <div style={{ padding: variant === 'feed' || variant === 'pulse' ? '18px 0' : 0 }}>
        <Composer
          initialHealth={u.health}
          initialBody={u.body}
          submitLabel="Save"
          onCancel={() => setEditing(false)}
          onSubmit={(health, body) => { actions.editUpdate(u.id, { health, body }); setEditing(false); toast('Update saved'); }}
        />
      </div>
    );

  const author = userById(u.authorId);
  const meta = (
    <div className="update-meta">
      <HealthLabel health={u.health} prefix={variant === 'pulse' ? `${kind} ` : ''} />
      <span className="meta-dot">·</span>
      <Avatar userId={u.authorId} size={16} />
      <span className="meta-name">{author.name}</span>
      <span className="meta-dot">·</span>
      <Tooltip label={fullDateTime(u.createdAt)}><span className="meta-time">{ago(u.createdAt)}</span></Tooltip>
      {u.editedAt && <span className="edited">(edited)</span>}
    </div>
  );

  const moreBtn = (
    <button className={`icon-btn sm more-btn ${more.anchor ? 'open' : ''}`} aria-label="Update options" onClick={more.open}>
      <I.more size={16} />
    </button>
  );

  return (
    <div className={variant === 'feed' || variant === 'pulse' ? 'feed-item' : undefined} id={`update-${u.id}`} style={highlight ? { boxShadow: 'inset 3px 0 0 var(--accent)', paddingLeft: 14, marginLeft: -14 } : undefined}>
      {variant === 'pulse' && (
        <div className="feed-item-head" style={{ marginBottom: 8 }}>
          {title}
          {moreBtn}
        </div>
      )}
      {variant !== 'popover' && (
        <div className="feed-item-head">
          {meta}
          {variant === 'feed' && moreBtn}
        </div>
      )}
      <div className="update-body" style={variant === 'popover' ? { marginTop: 8 } : undefined}><Markdown text={u.body} /></div>
      {u.progress && variant !== 'popover' && <ProgressDetails progress={u.progress} />}
      {!hideActions && (
        <div className="actions-row">
          <Tooltip label={thread ? 'Hide comments' : 'Comment'}>
            <button className={`round-btn ${thread ? 'on' : ''}`} onClick={() => setThread((t) => !t)} aria-label="Comments">
              <I.comment size={16} />
              {u.comments.length > 0 && <span>{u.comments.length}</span>}
            </button>
          </Tooltip>
          <Reactions list={u.reactions} onToggle={(e) => actions.toggleReaction(u.id, e)} />
          <EmojiButton onPick={(e) => actions.toggleReaction(u.id, e)} />
          {variant === 'latest' && <span style={{ marginLeft: 'auto' }}>{moreBtn}</span>}
        </div>
      )}
      {thread && !hideActions && <CommentThread u={u} />}
      {more.anchor && (
        <Menu
          anchor={more.anchor}
          align="right"
          onClose={more.close}
          onSelect={(id) => {
            if (id === 'link') { copyText(updateLink(u)); toast('Link copied to clipboard'); }
            if (id === 'md') { copyText(updateMarkdown(u)); toast('Update copied as Markdown'); }
            if (id === 'edit') setEditing(true);
            if (id === 'delete' && window.confirm('Delete this update? This can’t be undone.')) { actions.deleteUpdate(u.id); toast('Update deleted'); }
          }}
          items={[
            { id: 'link', label: 'Copy link', icon: <I.link size={14} /> },
            { id: 'md', label: 'Copy as Markdown', icon: <I.markdown size={14} /> },
            ...(mine
              ? [
                  { id: 'edit', label: 'Edit update', icon: <I.pencil size={14} />, sep: true },
                  { id: 'delete', label: 'Delete update…', icon: <I.trash size={14} />, danger: true },
                ]
              : []),
          ]}
        />
      )}
    </div>
  );
}
