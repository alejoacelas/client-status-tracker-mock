import { useEffect, useRef, useState } from 'react';
import {
  CalendarDays,
  CalendarPlus,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Eye,
  Link2,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Package,
  Sparkles,
  Tag,
  UserCircle2,
  X,
  Ban,
} from 'lucide-react';
import type { Initiative, Placement } from '../types';
import { useStore } from '../store';
import { DATA, chipDate, longDate, productById, stampDate, staffById } from '../util';
import { href, go } from '../router';
import { Avatar, Menu, notInReplica, toast } from './bits';
import { ColumnsIcon, InitiativeIcon } from './Icons';

const PLACEMENT_LABEL: Record<Placement, string> = { completed: 'Completed', now: 'Now', next: 'Next', later: 'Later', candidate: 'Candidate' };

function useEscape(fn: () => void) {
  useEffect(() => {
    const on = (e: KeyboardEvent) => e.key === 'Escape' && fn();
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [fn]);
}

/* ---------- Complete initiative ---------- */

export function CompleteDialog({ item, onCancel, onConfirm }: { item: Initiative; onCancel: () => void; onConfirm: (date: string, outcome: string) => void }) {
  const [date, setDate] = useState(DATA.today);
  const [outcome, setOutcome] = useState(item.outcome || '');
  useEscape(onCancel);
  return (
    <div className="overlay" style={{ zIndex: 700 }} onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <form
        className="dialog"
        role="dialog"
        aria-label="Complete initiative"
        onSubmit={(e) => {
          e.preventDefault();
          onConfirm(date, outcome.trim());
        }}
      >
        <h2>Complete initiative</h2>
        <p className="muted" style={{ marginBottom: 16 }}>
          “{item.title}” will move to the Completed section.
        </p>
        <div className="field">
          <label htmlFor="cd">Completion date</label>
          <input id="cd" type="date" className="text-input" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="co">Outcome</label>
          <textarea id="co" className="text-input" placeholder="Did the work have the impact you expected?" value={outcome} onChange={(e) => setOutcome(e.target.value)} />
        </div>
        <div className="dialog__actions">
          <button type="button" className="btn btn--outline" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn--navy">
            Complete initiative
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------- Add initiative ---------- */

export function AddInitiativeDialog({ defaultProduct, defaultColumn, onCancel, onCreate }: { defaultProduct: string; defaultColumn: Placement; onCancel: () => void; onCreate: (i: Initiative) => void }) {
  const [title, setTitle] = useState('');
  const [product, setProduct] = useState(defaultProduct);
  const [column, setColumn] = useState<Placement>(defaultColumn);
  useEscape(onCancel);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <form
        className="dialog"
        role="dialog"
        aria-label="Add an initiative"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          const stamp = `${DATA.today}T09:00:00`;
          onCreate({
            id: 'i-' + Date.now().toString(36),
            product,
            column,
            order: 0,
            title: title.trim(),
            description: '',
            objectives: [],
            tags: [],
            owners: [productById(product).owner],
            visibility: 'internal',
            milestoneStatus: 'Not started',
            impact: 0,
            effort: 0,
            dateAdded: stamp,
            lastUpdated: stamp,
            ideas: [],
            updates: [],
          });
        }}
      >
        <h2>Add an initiative</h2>
        <div className="field">
          <label htmlFor="at">Title</label>
          <input id="at" className="text-input" autoFocus placeholder="What problem are you solving?" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="ap">Product</label>
          <select id="ap" className="select" style={{ width: '100%', height: 40 }} value={product} onChange={(e) => setProduct(e.target.value)}>
            {DATA.productLines.map((l) => (
              <optgroup key={l.id} label={l.name}>
                {DATA.products
                  .filter((p) => p.line === l.id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="ac">Roadmap column</label>
          <select id="ac" className="select" style={{ width: '100%', height: 40 }} value={column} onChange={(e) => setColumn(e.target.value as Placement)}>
            {(['now', 'next', 'later', 'candidate'] as Placement[]).map((c) => (
              <option key={c} value={c}>
                {PLACEMENT_LABEL[c]}
              </option>
            ))}
          </select>
        </div>
        <div className="dialog__actions">
          <button type="button" className="btn btn--outline" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn--navy" disabled={!title.trim()}>
            Add initiative
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------- Initiative canvas ---------- */

function Collapsible({ title, defaultOpen = false, actions, children }: { title: string; defaultOpen?: boolean; actions?: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="canvas-block">
      <div className="collapse-head">
        <button className="collapse-head" style={{ width: 'auto', flex: 1 }} onClick={() => setOpen(!open)} aria-expanded={open}>
          <ChevronRight size={14} className={`caret${open ? ' is-open' : ''}`} />
          {title}
        </button>
        {actions && <span className="actions">{actions}</span>}
      </div>
      {open && <div style={{ marginTop: 8 }}>{children}</div>}
    </div>
  );
}

function EditableBlock({ value, placeholder, onSave, className = 'canvas-desc' }: { value: string; placeholder: string; onSave: (v: string) => void; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  if (editing)
    return (
      <div style={{ marginTop: 8 }}>
        <textarea className="text-input" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} />
        <div className="dialog__actions">
          <button className="btn btn--outline btn--sm" onClick={() => (setDraft(value), setEditing(false))}>
            Cancel
          </button>
          <button className="btn btn--navy btn--sm" onClick={() => (onSave(draft.trim()), setEditing(false))}>
            Save
          </button>
        </div>
      </div>
    );
  return (
    <div className={className} onClick={() => setEditing(true)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setEditing(true)}>
      {value || <span className="muted">{placeholder}</span>}
    </div>
  );
}

const stageClass = (s: string) => (s === 'Released' ? 'is-released' : s === 'In Development' ? 'is-dev' : s === 'In Review' ? 'is-review' : '');

export function InitiativeCanvas({ id, siblings, onClose }: { id: string; siblings: string[]; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const item = state.initiatives.find((i) => i.id === id);
  const [full, setFull] = useState(false);
  const [following, setFollowing] = useState(false);
  const [editTitle, setEditTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editObj, setEditObj] = useState(false);
  const [editAttr, setEditAttr] = useState(false);
  const [showMore, setShowMore] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [comment, setComment] = useState('');
  const [commentPublic, setCommentPublic] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEscape(() => {
    if (!completing) onClose();
  });
  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
    setEditTitle(false);
    setEditObj(false);
    setEditAttr(false);
  }, [id]);
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!item) return null;
  const product = productById(item.product);
  const update = (patch: Partial<Initiative>) => dispatch({ type: 'update', id: item.id, patch });
  const pos = siblings.indexOf(item.id);
  const nav = (d: number) => {
    const next = siblings[pos + d];
    if (next) go(window.location.hash.slice(2).split('?')[0], { ...Object.fromEntries(new URLSearchParams(window.location.hash.split('?')[1] || '')), i: next });
  };
  const blockers = (item.blockedBy || []).map((b) => state.initiatives.find((x) => x.id === b)).filter((x): x is Initiative => !!x);
  const blocking = state.initiatives.filter((x) => x.blockedBy?.includes(item.id));
  const setPlacement = (p: Placement) => {
    if (p === item.column) return;
    if (p === 'completed') return setCompleting(true);
    dispatch({ type: 'move', id: item.id, to: p, index: p === 'candidate' ? undefined : 0 });
    toast(`Moved to ${PLACEMENT_LABEL[p]}`);
  };
  const toggleArr = (key: 'objectives' | 'tags' | 'owners', v: string) => {
    const arr = item[key];
    update({ [key]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] });
  };
  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url).catch(() => {});
    toast('Link copied to clipboard');
  };

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`canvas${full ? ' is-full' : ''}`} role="dialog" aria-modal="true" aria-label={item.title}>
        <div className="canvas__scroll" ref={scrollRef}>
          <div className="canvas__top">
            <div className="canvas__crumbs">
              <a href={href(`product/${product.id}/roadmap`)} onClick={onClose}>
                {product.name}
              </a>
              <span className="muted">/</span>
              <span className="kind">
                <InitiativeIcon size={15} /> Initiative
              </span>
              <button className="icon-btn" aria-label="Copy link" onClick={copyLink}>
                <Link2 size={16} />
              </button>
            </div>
            <div className="canvas__nav">
              <button className={`btn btn--outline btn--sm hide-sm`} onClick={() => setFollowing(!following)}>
                <Eye size={15} /> {following ? 'Following' : 'Follow'}
              </button>
              {siblings.length > 0 && pos >= 0 && (
                <span className="nav-count">
                  {pos + 1} / {siblings.length}
                  <button aria-label="Next initiative" onClick={() => nav(1)} disabled={pos >= siblings.length - 1}>
                    <ChevronDown size={15} />
                  </button>
                  <button aria-label="Previous initiative" onClick={() => nav(-1)} disabled={pos <= 0}>
                    <ChevronUp size={15} />
                  </button>
                </span>
              )}
              <button className="icon-btn hide-sm" aria-label={full ? 'Exit full screen' : 'Full screen'} onClick={() => setFull(!full)}>
                {full ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
              </button>
              <Menu align="right" trigger={(_, t) => <button className="icon-btn" aria-label="More actions" onClick={t}><MoreHorizontal size={18} /></button>}>
                {(close) => (
                  <>
                    <button className="dropdown__item" onClick={() => (copyLink(), close())}>
                      Copy link
                    </button>
                    <button className="dropdown__item" onClick={() => (notInReplica('Duplicating initiatives'), close())}>
                      Duplicate
                    </button>
                    <div className="dropdown__sep" />
                    <button
                      className="dropdown__item"
                      style={{ color: 'var(--red-600)' }}
                      onClick={() => {
                        close();
                        if (window.confirm(`Delete “${item.title}”? This can't be undone (use “Reset demo data” to restore).`)) {
                          dispatch({ type: 'remove', id: item.id });
                          onClose();
                          toast('Initiative deleted');
                        }
                      }}
                    >
                      Delete initiative
                    </button>
                  </>
                )}
              </Menu>
              <button className="icon-btn" aria-label="Close" onClick={onClose}>
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="canvas__head">
            {editTitle ? (
              <h1 className="canvas__title" style={{ background: 'none' }}>
                <textarea
                  className="title-input"
                  autoFocus
                  rows={2}
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={() => {
                    setEditTitle(false);
                    if (titleDraft.trim()) update({ title: titleDraft.trim() });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      (e.target as HTMLTextAreaElement).blur();
                    }
                  }}
                />
              </h1>
            ) : (
              <h1 className="canvas__title" onClick={() => (setTitleDraft(item.title), setEditTitle(true))} title="Click to edit">
                {item.title}
              </h1>
            )}
            <div className="roadmap-select">
              Roadmap
              <Menu
                trigger={(_, t) => (
                  <button className="roadmap-select__btn" onClick={t}>
                    <ColumnsIcon /> {PLACEMENT_LABEL[item.column]} <ChevronDown size={14} />
                  </button>
                )}
              >
                {(close) =>
                  (['completed', 'now', 'next', 'later', 'candidate'] as Placement[]).map((p) => (
                    <button key={p} className={`dropdown__item${item.column === p ? ' is-selected' : ''}`} onClick={() => (close(), setPlacement(p))}>
                      {PLACEMENT_LABEL[p]}
                    </button>
                  ))
                }
              </Menu>
            </div>
          </div>

          <div className="canvas__cols">
            <div className="canvas__main">
              <button className="btn btn--ai btn--sm" onClick={() => notInReplica('The AI assistant')}>
                <Sparkles size={14} /> AI Assistant
              </button>
              <EditableBlock value={item.description} placeholder="Describe the problem this initiative solves…" onSave={(v) => update({ description: v })} />
              <div className="canvas-block">
                <h4>Target outcomes</h4>
                <EditableBlock
                  className="canvas-desc muted"
                  value={item.targetOutcomes || ''}
                  placeholder="Add the metrics you're looking to move e.g. adopted by 50% of our users"
                  onSave={(v) => update({ targetOutcomes: v })}
                />
              </div>
              <Collapsible title="Release outcomes" defaultOpen={item.column === 'completed'}>
                {item.completedOn && <p className="muted">Completed on {longDate(item.completedOn)}</p>}
                <EditableBlock value={item.outcome || ''} placeholder="What happened when this shipped? Did it have the impact you expected?" onSave={(v) => update({ outcome: v })} />
              </Collapsible>
              <Collapsible
                title={`Linked Ideas (${item.ideas.length})`}
                defaultOpen
                actions={
                  <>
                    <button className="btn btn--outline btn--sm" onClick={() => notInReplica('Linking ideas')}>
                      <Link2 size={14} /> Link Ideas
                    </button>
                    <button className="btn btn--ai btn--sm hide-sm" onClick={() => notInReplica('Generating ideas')}>
                      <Sparkles size={14} /> Generate Ideas
                    </button>
                  </>
                }
              >
                {item.ideas.length === 0 ? (
                  <p className="muted">No ideas are linked to this initiative yet.</p>
                ) : (
                  <ul className="linked-ideas">
                    {item.ideas.map((idea) => (
                      <li key={idea.id} className={stageClass(idea.stage)}>
                        <span className="t">
                          {idea.title} <small>(Idea {idea.id})</small>
                        </span>
                        <select
                          className={`stage-badge ${stageClass(idea.stage)}`}
                          aria-label={`Workflow stage for ${idea.title}`}
                          value={idea.stage}
                          onChange={(e) => update({ ideas: item.ideas.map((x) => (x.id === idea.id ? { ...x, stage: e.target.value } : x)) })}
                          style={{ border: 0, cursor: 'pointer' }}
                        >
                          {DATA.workflowStages.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </li>
                    ))}
                  </ul>
                )}
              </Collapsible>
              <Collapsible title="User Stories (0)">
                <p className="muted">Once a User Story is linked to your Roadmap Initiative, you will be able to view it here.</p>
              </Collapsible>
              <Collapsible title={`Comments (${item.updates.length + (item.internalNote ? 1 : 0)})`} defaultOpen={item.updates.length > 0 || !!item.internalNote}>
                {item.internalNote && (
                  <div className="update">
                    <Avatar id={product.owner} />
                    <div>
                      <div className="update__meta">
                        <strong>{staffById(product.owner)?.name}</strong> <span>Internal note</span>
                        <span className="vis-badge vis-badge--internal">Internal</span>
                      </div>
                      {item.internalNote}
                    </div>
                  </div>
                )}
                {[...item.updates].reverse().map((u, n) => (
                  <div className="update" key={n}>
                    <Avatar id={u.author} />
                    <div>
                      <div className="update__meta">
                        <strong>{staffById(u.author)?.name}</strong>
                        <span>{longDate(u.date)}</span>
                        <span>via {u.source}</span>
                        <span className={`vis-badge${u.clientVisible ? '' : ' vis-badge--internal'}`}>{u.clientVisible ? 'Client can see' : 'Internal'}</span>
                      </div>
                      {u.text}
                    </div>
                  </div>
                ))}
                <form
                  className="comment-box"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!comment.trim()) return;
                    update({ updates: [...item.updates, { date: DATA.today, source: 'Manual', clientVisible: commentPublic, author: 'maya', text: comment.trim() }] });
                    setComment('');
                  }}
                >
                  <input className="text-input" placeholder="Add a comment…" value={comment} onChange={(e) => setComment(e.target.value)} />
                  <button className="btn btn--navy" type="submit" disabled={!comment.trim()}>
                    Post
                  </button>
                </form>
                <label className="check" style={{ marginTop: 8, fontSize: 13 }}>
                  <input type="checkbox" checked={commentPublic} onChange={(e) => setCommentPublic(e.target.checked)} /> Visible to the client
                </label>
              </Collapsible>
            </div>

            <aside className="canvas__side">
              <div className="side-block">
                <div className="side-block__head">
                  <span className="collapse-head" style={{ width: 'auto' }}>
                    <ChevronDown size={14} /> Objectives ({item.objectives.length})
                  </span>
                  <button className="btn btn--outline btn--xs" onClick={() => setEditObj(!editObj)}>
                    {editObj ? 'Done' : item.objectives.length ? 'Edit' : 'Add'}
                  </button>
                </div>
                {editObj ? (
                  <div className="filter-options" style={{ paddingTop: 8 }}>
                    {DATA.objectives.map((o) => (
                      <label key={o.id} className="check">
                        <input type="checkbox" checked={item.objectives.includes(o.id)} onChange={() => toggleArr('objectives', o.id)} />
                        <span className="obj-swatch" style={{ background: `var(--obj-${o.color})` }} />
                        {o.name}
                      </label>
                    ))}
                  </div>
                ) : item.objectives.length === 0 ? (
                  <p className="muted">Which Objectives is this Initiative contributing to?</p>
                ) : (
                  item.objectives.map((oid) => {
                    const o = DATA.objectives.find((x) => x.id === oid);
                    return o ? (
                      <div key={oid} className="obj-link" style={{ ['--obj-color' as string]: `var(--obj-${o.color})` }}>
                        {o.name} <ChevronRight size={14} />
                      </div>
                    ) : null;
                  })
                )}
              </div>

              <div className="side-block">
                <div className="side-block__head">
                  <span className="collapse-head" style={{ width: 'auto' }}>
                    <ChevronDown size={14} /> Attributes
                  </span>
                  <button className="btn btn--outline btn--xs" onClick={() => setEditAttr(!editAttr)}>
                    {editAttr ? 'Done' : 'Edit'}
                  </button>
                </div>
                <div className="attr">
                  <span className="attr__label">
                    <Package size={18} /> Product
                  </span>
                  <span className="attr__value">
                    <a className="product-chip" href={href(`product/${product.id}/roadmap`)} onClick={onClose}>
                      <span className="product-image product-image--sm" style={{ background: product.color, width: 22, height: 22, borderRadius: 11 }}>
                        {product.name[0]}
                      </span>
                      {product.name}
                    </a>
                  </span>
                </div>
                <div className="attr">
                  <span className="attr__label">
                    <Tag size={18} /> Tags
                  </span>
                  <span className="attr__value">
                    {editAttr
                      ? DATA.tags.map((t) => (
                          <button key={t} className={`chip-toggle${item.tags.includes(t) ? ' is-on' : ''}`} onClick={() => toggleArr('tags', t)}>
                            {t}
                          </button>
                        ))
                      : item.tags.map((t) => (
                          <span key={t} className="tag-pill" style={{ background: 'var(--neutral-800)' }}>
                            {t}
                          </span>
                        ))}
                  </span>
                </div>
                <div className="attr">
                  <span className="attr__label">
                    <UserCircle2 size={18} /> Owners
                  </span>
                  <span className="attr__value">
                    {editAttr
                      ? DATA.staff.map((s) => (
                          <button key={s.id} className={`chip-toggle${item.owners.includes(s.id) ? ' is-on' : ''}`} onClick={() => toggleArr('owners', s.id)}>
                            {s.name}
                          </button>
                        ))
                      : item.owners.map((o) => <Avatar key={o} id={o} />)}
                  </span>
                </div>
                <div className="attr">
                  <span className="attr__label">
                    <Eye size={18} /> Make public
                  </span>
                  <button
                    className={`switch${item.visibility === 'public' ? ' is-on' : ''}`}
                    role="switch"
                    aria-checked={item.visibility === 'public'}
                    aria-label="Make public"
                    onClick={() => update({ visibility: item.visibility === 'public' ? 'internal' : 'public' })}
                  />
                </div>
                <div className="attr">
                  <span className="attr__label">
                    <CalendarDays size={18} /> Target date
                  </span>
                  <span className="attr__value">
                    {editAttr ? (
                      <input type="date" className="select" value={item.targetDate || ''} onChange={(e) => update({ targetDate: e.target.value || undefined })} />
                    ) : item.targetDate ? (
                      chipDate(item.targetDate)
                    ) : (
                      <span className="muted">None</span>
                    )}
                  </span>
                </div>
                <button className="switch-product" style={{ margin: '4px 0' }} onClick={() => setShowMore(!showMore)}>
                  {showMore ? 'Show less' : 'Show more'}
                </button>
                {showMore && (
                  <>
                    <div className="attr">
                      <span className="attr__label">
                        <CalendarPlus size={18} /> Date added
                      </span>
                      <span>{stampDate(item.dateAdded)}</span>
                    </div>
                    <div className="attr">
                      <span className="attr__label">
                        <CalendarClock size={18} /> Last updated
                      </span>
                      <span>{stampDate(item.lastUpdated)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="side-block">
                <span className="collapse-head">
                  <ChevronDown size={14} /> Dependencies
                </span>
                {blockers.length === 0 && blocking.length === 0 && !item.externalDependency && <p className="muted">No dependencies.</p>}
                {(blockers.length > 0 || item.externalDependency) && (
                  <div style={{ marginTop: 6 }}>
                    <div className="muted" style={{ fontSize: 12 }}>
                      Blocked by
                    </div>
                    {blockers.map((b) => (
                      <div key={b.id} className="blocked-by" style={{ marginTop: 4 }}>
                        <Ban size={14} />
                        <a href={href(window.location.hash.slice(2).split('?')[0], { ...Object.fromEntries(new URLSearchParams(window.location.hash.split('?')[1] || '')), i: b.id })}>{b.title}</a>
                        <span className="muted">({PLACEMENT_LABEL[b.column]})</span>
                      </div>
                    ))}
                    {item.externalDependency && (
                      <div className="blocked-by" style={{ marginTop: 4 }}>
                        <Ban size={14} /> {item.externalDependency} <span className="muted">(external)</span>
                      </div>
                    )}
                  </div>
                )}
                {blocking.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div className="muted" style={{ fontSize: 12 }}>
                      Blocking
                    </div>
                    {blocking.map((b) => (
                      <div key={b.id} style={{ marginTop: 4 }}>
                        <a href={href(window.location.hash.slice(2).split('?')[0], { ...Object.fromEntries(new URLSearchParams(window.location.hash.split('?')[1] || '')), i: b.id })}>{b.title}</a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="side-block">
                <span className="collapse-head">
                  <ChevronDown size={14} /> Scoring
                </span>
                {(['impact', 'effort'] as const).map((k) => (
                  <div className="attr" key={k}>
                    <span className="attr__label">{k === 'impact' ? 'Impact' : 'Effort'}</span>
                    <span className="dots" aria-hidden>
                      {Array.from({ length: 10 }, (_, n) => (
                        <i key={n} className={n < item[k] ? 'on' : ''} />
                      ))}
                    </span>
                    <select className="select" aria-label={k} value={item[k]} onChange={(e) => update({ [k]: Number(e.target.value) })}>
                      <option value={0}>Unknown</option>
                      {Array.from({ length: 10 }, (_, n) => (
                        <option key={n + 1} value={n + 1}>
                          {n + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
      {completing && (
        <CompleteDialog
          item={item}
          onCancel={() => setCompleting(false)}
          onConfirm={(date, outcome) => {
            dispatch({ type: 'move', id: item.id, to: 'completed', index: 0, completedOn: date, outcome });
            setCompleting(false);
            toast('Initiative marked as completed');
          }}
        />
      )}
    </div>
  );
}
