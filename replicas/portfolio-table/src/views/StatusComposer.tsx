import { useEffect, useMemo, useRef, useState } from 'react';
import type { Highlight, HighlightKind, ItemRef, SectionKind, StatusKey, StatusUpdate, UpdateSection } from '../data/mock';
import { SECTION_PLACEHOLDERS, SECTION_TITLES, TODAY } from '../data/mock';
import { fmtDate } from '../lib/dates';
import { STATUS } from '../lib/status';
import { getPortfolio, getProject, hrefFor, itemInfo, latestUpdate, navigate, newId, projectsDeep, useStore, useToast } from '../store';
import { HighlightBlock, highlightLabel, milestoneSets, STATUS_HIGHLIGHT, statusAsOf } from '../components/Highlights';
import {
  IconCheck, IconChevronDown, IconChevronRight, IconClose, IconDiamond, IconDrag, IconLock, IconPaperclip, IconPeople, IconPlus,
} from '../components/Icons';
import { FieldValue, UPDATE_FIELD_CHOICES, UpdateSections } from '../components/StatusCard';
import { Avatar, FolderIcon, MenuItem, MenuSep, Modal, Popover, StatusChip, Toggle } from '../components/ui';
import { StatusMenu } from './list/cells';

const PROJECT_HIGHLIGHTS: HighlightKind[] = ['milestones_completed', 'milestones_upcoming', 'milestones_overdue', 'key_metrics'];
const PORTFOLIO_HIGHLIGHTS: HighlightKind[] = [
  'projects_on_track', 'projects_off_track', 'projects_at_risk', 'projects_on_hold', 'portfolio_health', 'projects_by_priority',
  'projects_by_owner', 'milestones_completed', 'milestones_overdue', 'milestones_upcoming',
];

const emptySections = (): UpdateSection[] =>
  (['summary', 'accomplished', 'next', 'metrics'] as SectionKind[]).map((k) => ({ id: newId('s'), kind: k, title: SECTION_TITLES[k], text: '', highlights: [] }));

export function StatusComposer({ parent: parentProp, preset, editId }: { parent?: ItemRef; preset?: string; editId?: string }) {
  const { data, actions } = useStore();
  const toast = useToast();
  const editing = editId ? data.updates.find((u) => u.id === editId) : undefined;
  const parent: ItemRef | undefined = editing?.parent ?? parentProp;
  const info = parent ? itemInfo(data, parent) : null;

  const [title, setTitle] = useState(editing?.title ?? `Status update - ${fmtDate(TODAY, { relative: false })}`);
  const [status, setStatus] = useState<StatusKey | null>(editing?.status ?? (preset && preset in STATUS ? (preset as StatusKey) : null));
  const [sections, setSections] = useState<UpdateSection[]>(() => (editing ? structuredClone(editing.sections) : emptySections()));
  const [fields, setFields] = useState<string[]>(editing?.fields ?? ['owner', 'dates']);
  const [isPrivate, setPrivate] = useState(editing?.isPrivate ?? false);
  const [remind, setRemind] = useState(false);
  const [tab, setTab] = useState<'previous' | 'highlights'>('highlights');
  const [focusSection, setFocusSection] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [dragSection, setDragSection] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ kind: 'status' | 'fields' | 'recipients' | 'addsection'; el: HTMLElement } | null>(null);
  const [touched, setTouched] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [recipients, setRecipients] = useState<string[]>(() => data.people.filter((p) => p.id !== data.meId).map((p) => p.id));
  const [panelOpen, setPanelOpen] = useState(() => window.innerWidth >= 900);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) titleRef.current?.focus();
  }, [editing]);

  const prev = useMemo(() => (parent ? latestUpdate(data, parent) : undefined), [data, parent]);

  if (!parent || !info) {
    return (
      <div className="not-replicated">
        <h2>Nothing to update</h2>
        <a className="btn btn-secondary" href="#/portfolio/all-clients/list">Back to All clients</a>
      </div>
    );
  }

  const backHref = parent.type === 'project' ? hrefFor.project(parent.id) : hrefFor.portfolio(parent.id, 'progress');
  const leave = () => (dirty ? setConfirmLeave(true) : (window.location.hash = backHref));
  const change = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setDirty(true);
  };

  const kinds = parent.type === 'project' ? PROJECT_HIGHLIGHTS : PORTFOLIO_HIGHLIGHTS;
  const addHighlight = (sectionId: string, kind: HighlightKind) => {
    setSections((ss) => ss.map((s) => (s.id === sectionId ? { ...s, highlights: [...s.highlights, { id: newId('h'), kind, asOf: TODAY }] } : s)));
    setDirty(true);
  };
  const targetSection = () => focusSection ?? sections[0]?.id;

  const post = () => {
    setTouched(true);
    if (!status) {
      toast('Choose a status before posting');
      return;
    }
    const u: StatusUpdate = {
      id: editing?.id ?? newId('u'),
      parent,
      title: title.trim() || `Status update - ${fmtDate(TODAY, { relative: false })}`,
      status,
      authorId: editing?.authorId ?? data.meId,
      date: editing?.date ?? TODAY,
      isPrivate,
      source: editing?.source,
      sections: sections.map((s) => ({ ...s, text: s.text.trim() })),
      fields,
      likes: editing?.likes ?? [],
      comments: editing?.comments ?? [],
    };
    actions.postUpdate(u);
    window.location.hash = backHref;
    toast(editing ? 'Status update saved' : 'Status update posted', { label: 'View', run: () => navigate(`/update/${u.id}`) });
  };

  const notified = isPrivate ? 0 : recipients.length;
  const removed = (['summary', 'accomplished', 'next', 'metrics'] as SectionKind[]).filter((k) => !sections.some((s) => s.kind === k));

  return (
    <div className="composer" style={{ ['--status-color' as string]: status ? STATUS[status].bar : '#cfcbcb' }}>
      <header className="composer-bar">
        <nav className="composer-crumb">
          <a href={backHref} onClick={(e) => { e.preventDefault(); leave(); }}>
            {parent.type === 'project' ? <span className="dot" style={{ background: info.color }} /> : <FolderIcon color={info.color} size={16} />}
            <span className="crumb-name">{info.name}</span>
          </a>
          <IconChevronRight size={12} />
          <span className="strong">Status update</span>
        </nav>
        <div className="composer-actions">
          <label className="remind hide-narrow">
            <Toggle on={remind} onChange={(v) => { setRemind(v); toast(v ? 'We’ll remind you every Friday' : 'Reminder turned off'); }} label="Remind me to update every Friday" />
            Remind me to update every Friday
          </label>
          <span className="vsep hide-narrow" />
          <button className="btn-ghost sm" onClick={() => change(setPrivate)(!isPrivate)} title={isPrivate ? 'Only Fieldwork Studio staff can see this update' : 'Clients with access can see this update'}>
            {isPrivate ? <IconLock size={14} /> : <IconPeople size={14} />} {isPrivate ? 'Private' : 'Public'}
          </button>
          <span className="vsep hide-narrow" />
          <span className="muted small hide-narrow">{notified} {notified === 1 ? 'person' : 'people'} will be notified</span>
          <button className="btn btn-secondary sm hide-narrow" onClick={(e) => setMenu({ kind: 'recipients', el: e.currentTarget })}>
            <IconPlus size={12} /> Add recipients
          </button>
          <button className="btn btn-primary sm" onClick={post}>{editing ? 'Save' : 'Post'}</button>
          <button className="icon-btn" aria-label="Close" onClick={leave}><IconClose /></button>
        </div>
      </header>
      <div className="composer-body">
        <div className="composer-main">
          <div className="composer-doc">
            <input
              ref={titleRef}
              className="composer-title"
              value={title}
              onChange={(e) => change(setTitle)(e.target.value)}
              aria-label="Status update title"
            />
            <div className="su-fields composer-fields">
              <div className="su-field">
                <span className="su-field-label">Status <span className="req">*</span></span>
                <span>
                  <button className={`status-picker ${touched && !status ? 'invalid' : ''}`} onClick={(e) => setMenu({ kind: 'status', el: e.currentTarget })}>
                    {status ? <StatusChip status={status} size="sm" /> : <span className="set-a-status">Set a status <IconChevronDown size={12} /></span>}
                  </button>
                  {touched && !status && <span className="form-error"> Status is required</span>}
                </span>
              </div>
              {fields.map((f) => (
                <div key={f} className="su-field">
                  <span className="su-field-label">{UPDATE_FIELD_CHOICES.find((c) => c.id === f)?.label}</span>
                  <FieldValue u={{ parent, source: editing?.source }} fieldId={f} />
                </div>
              ))}
            </div>
            <button className="btn-subtle" onClick={(e) => setMenu({ kind: 'fields', el: e.currentTarget })}>
              Show or hide fields <IconChevronDown size={12} />
            </button>
            <button className="btn-subtle" onClick={() => toast('Attachments are not part of this replica')}>
              <IconPaperclip size={14} /> Add attachment
            </button>
            <hr className="composer-hr" />
            {sections.map((s) => (
              <section
                key={s.id}
                className={`composer-section ${dropTarget === s.id ? 'drop' : ''} ${focusSection === s.id ? 'focused' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dropTarget !== s.id) setDropTarget(s.id);
                }}
                onDragLeave={(e) => {
                  if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) setDropTarget(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDropTarget(null);
                  const kind = e.dataTransfer.getData('application/x-highlight') as HighlightKind;
                  if (kind) addHighlight(s.id, kind);
                  else if (dragSection && dragSection !== s.id) {
                    const from = sections.findIndex((x) => x.id === dragSection);
                    const to = sections.findIndex((x) => x.id === s.id);
                    const next = [...sections];
                    const [m] = next.splice(from, 1);
                    next.splice(to, 0, m);
                    setSections(next);
                  }
                  setDragSection(null);
                }}
              >
                <div className="cs-head">
                  <span
                    className="cs-drag"
                    draggable
                    onDragStart={(e) => {
                      setDragSection(s.id);
                      e.dataTransfer.setData('text/plain', s.id);
                    }}
                    title="Drag to reorder"
                  >
                    <IconDrag size={14} />
                  </span>
                  <h3>{s.title}</h3>
                  <button
                    className="icon-btn sm cs-remove"
                    aria-label={`Remove ${s.title}`}
                    onClick={() => {
                      setSections(sections.filter((x) => x.id !== s.id));
                      setDirty(true);
                    }}
                  >
                    <IconClose size={12} />
                  </button>
                </div>
                <AutoText
                  value={s.text}
                  placeholder={SECTION_PLACEHOLDERS[s.kind]}
                  onFocus={() => setFocusSection(s.id)}
                  onChange={(v) => {
                    setSections((ss) => ss.map((x) => (x.id === s.id ? { ...x, text: v } : x)));
                    setDirty(true);
                  }}
                />
                {s.highlights.map((h: Highlight) => (
                  <HighlightBlock
                    key={h.id}
                    data={data}
                    parent={parent}
                    h={h}
                    onRemove={() => setSections((ss) => ss.map((x) => (x.id === s.id ? { ...x, highlights: x.highlights.filter((y) => y.id !== h.id) } : x)))}
                  />
                ))}
                {dropTarget === s.id && <div className="drop-hint">Drop to add to {s.title}</div>}
              </section>
            ))}
            {removed.length > 0 && (
              <button className="dashed-btn add-section" onClick={(e) => setMenu({ kind: 'addsection', el: e.currentTarget })}>
                <IconPlus size={14} /> Add section
              </button>
            )}
          </div>
        </div>
        <aside className={`build-panel ${panelOpen ? '' : 'closed'}`}>
          <button className="build-toggle" onClick={() => setPanelOpen(!panelOpen)} aria-expanded={panelOpen}>
            {panelOpen ? 'Hide highlights' : 'Build your update'}
          </button>
          {panelOpen && (
            <>
              <h2>Build your update</h2>
              <div className="build-tabs">
                <button className={tab === 'previous' ? 'active' : ''} onClick={() => setTab('previous')}>Previous update</button>
                <button className={tab === 'highlights' ? 'active' : ''} onClick={() => setTab('highlights')}>Highlights</button>
              </div>
              {tab === 'highlights' ? (
                <div className="build-list">
                  <p className="build-hint">Drag these into your update, or click one to add it to the {sections.find((s) => s.id === targetSection())?.title ?? 'first'} section.</p>
                  {kinds.map((k) => (
                    <button
                      key={k}
                      className="hl-card"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/x-highlight', k);
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      onClick={() => {
                        const t = targetSection();
                        if (t) {
                          addHighlight(t, k);
                          toast(`Added to ${sections.find((s) => s.id === t)?.title}`);
                        }
                      }}
                    >
                      <span className="hl-card-title">{highlightLabel(data, parent, k, TODAY)}</span>
                      <MiniPreview kind={k} parent={parent} />
                    </button>
                  ))}
                </div>
              ) : prev ? (
                <div className="build-prev">
                  <div className="prev-head">
                    <span className="strong">{prev.title}</span>
                    <span className="muted small">{fmtDate(prev.date)}</span>
                  </div>
                  <StatusChip status={prev.status} size="sm" />
                  <UpdateSections u={prev} compact />
                  <button
                    className="btn btn-secondary sm"
                    onClick={() => {
                      setSections(structuredClone(prev.sections).map((s) => ({ ...s, id: newId('s'), highlights: s.highlights.map((h) => ({ ...h, id: newId('h'), asOf: TODAY })) })));
                      setStatus(prev.status);
                      setDirty(true);
                      toast('Copied the previous update into this one');
                    }}
                  >
                    Start from this update
                  </button>
                </div>
              ) : (
                <div className="muted build-prev">This is the first status update.</div>
              )}
            </>
          )}
        </aside>
      </div>

      {menu?.kind === 'status' && (
        <StatusMenu anchor={menu.el} current={status} onClose={() => setMenu(null)} onPick={(s) => { change(setStatus)(s); setMenu(null); }} />
      )}
      {menu?.kind === 'fields' && (
        <Popover anchor={menu.el} onClose={() => setMenu(null)}>
          <div className="menu">
            {UPDATE_FIELD_CHOICES.filter((c) => c.id !== 'source' || editing?.source).map((c) => (
              <MenuItem key={c.id} checked={fields.includes(c.id)} onClick={() => change(setFields)(fields.includes(c.id) ? fields.filter((x) => x !== c.id) : [...fields, c.id])}>
                {c.label}
              </MenuItem>
            ))}
          </div>
        </Popover>
      )}
      {menu?.kind === 'addsection' && (
        <Popover anchor={menu.el} onClose={() => setMenu(null)}>
          <div className="menu">
            {removed.map((k) => (
              <MenuItem key={k} onClick={() => { setSections([...sections, { id: newId('s'), kind: k, title: SECTION_TITLES[k], text: '', highlights: [] }]); setMenu(null); }}>
                {SECTION_TITLES[k]}
              </MenuItem>
            ))}
          </div>
        </Popover>
      )}
      {menu?.kind === 'recipients' && (
        <Popover anchor={menu.el} onClose={() => setMenu(null)} align="right">
          <div className="menu">
            <div className="menu-title-row">Notify when posted</div>
            {data.people.filter((p) => p.id !== data.meId).map((p) => (
              <MenuItem key={p.id} icon={<Avatar person={p} size={22} />} right={recipients.includes(p.id) ? <IconCheck size={14} /> : undefined}
                onClick={() => setRecipients(recipients.includes(p.id) ? recipients.filter((x) => x !== p.id) : [...recipients, p.id])}>
                {p.name}
              </MenuItem>
            ))}
            <MenuSep />
            <MenuItem onClick={() => { setRecipients([]); setMenu(null); }}>Don’t notify anyone</MenuItem>
          </div>
        </Popover>
      )}
      {confirmLeave && (
        <Modal title="Discard this draft?" width={420} onClose={() => setConfirmLeave(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setConfirmLeave(false)}>Keep editing</button>
              <button className="btn btn-danger" onClick={() => { window.location.hash = backHref; }}>Discard</button>
            </>
          }>
          <p>Your status update hasn’t been posted. Leaving now discards it.</p>
        </Modal>
      )}
    </div>
  );
}

function AutoText({ value, placeholder, onChange, onFocus }: { value: string; placeholder: string; onChange: (v: string) => void; onFocus: () => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.max(44, el.scrollHeight) + 'px';
  }, [value]);
  return <textarea ref={ref} className="cs-text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} onFocus={onFocus} rows={2} />;
}

/** Small illustrations on the highlight cards, like the original's skeleton previews. */
function MiniPreview({ kind, parent }: { kind: HighlightKind; parent: ItemRef }) {
  const { data } = useStore();
  if (kind.startsWith('milestones_')) {
    const color = kind === 'milestones_completed' ? '#5da283' : kind === 'milestones_overdue' ? '#f06a6a' : '#6d6e6f';
    const n = milestoneSets(data, parent, TODAY)[kind === 'milestones_completed' ? 'done' : kind === 'milestones_overdue' ? 'overdue' : 'upcoming'].length;
    return (
      <span className="mini-lines">
        {[0, 1].map((i) => (
          <span key={i} className="mini-line" style={{ opacity: i < Math.max(1, n) ? 1 : 0.4 }}>
            <IconDiamond filled size={10} style={{ color }} />
            <span className="mini-bar" style={{ width: i ? '78%' : '58%' }} />
          </span>
        ))}
      </span>
    );
  }
  const st = STATUS_HIGHLIGHT[kind];
  if (st) {
    return (
      <span className="mini-lines">
        {[0, 1].map((i) => (
          <span key={i} className="mini-line">
            <span className="mini-sq" style={{ background: STATUS[st].dot }} />
            <span className="mini-bar" style={{ width: i ? '78%' : '58%' }} />
          </span>
        ))}
      </span>
    );
  }
  if (kind === 'portfolio_health') {
    const projs = parent.type === 'portfolio' ? projectsDeep(data, parent.id) : [getProject(data, parent.id)!];
    const segs = (['on_track', 'at_risk', 'off_track', 'on_hold', 'complete'] as StatusKey[]).map((k) => ({
      k,
      n: projs.filter((p) => p && statusAsOf(data, { type: 'project', id: p.id }, TODAY) === k).length,
    }));
    const total = Math.max(1, segs.reduce((s, x) => s + x.n, 0));
    let acc = 0;
    const c = 2 * Math.PI * 14;
    return (
      <span className="mini-chart">
        <svg width="44" height="44" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r="14" fill="none" stroke="#edeae9" strokeWidth="8" />
          {segs.map((s) => {
            if (!s.n) return null;
            const len = (s.n / total) * c;
            const el = <circle key={s.k} cx="22" cy="22" r="14" fill="none" stroke={s.k === 'complete' ? '#4f8a70' : STATUS[s.k].dot} strokeWidth="8" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-acc} transform="rotate(-90 22 22)" />;
            acc += len;
            return el;
          })}
        </svg>
        <span className="mini-lines">
          {segs.filter((s) => s.n).map((s) => (
            <span key={s.k} className="mini-line"><span className="mini-sq" style={{ background: STATUS[s.k].dot === '#ffffff' ? '#5da283' : STATUS[s.k].dot }} /><span className="mini-bar" style={{ width: 40 }} /></span>
          ))}
        </span>
      </span>
    );
  }
  if (kind === 'projects_by_priority') {
    return (
      <span className="mini-lines">
        {['#f06a6a', '#ec8d71', '#f1bd6c'].map((c, i) => (
          <span key={c} className="mini-hbar" style={{ background: c, width: `${[80, 55, 70][i]}%` }} />
        ))}
      </span>
    );
  }
  if (kind === 'projects_by_owner') {
    return (
      <span className="mini-lolli">
        {data.people.map((p, i) => (
          <span key={p.id} className="mini-lolli-col">
            <span className="mini-lolli-stick" style={{ height: [26, 18, 12][i % 3] }} />
            <Avatar person={p} size={14} />
          </span>
        ))}
      </span>
    );
  }
  if (kind === 'key_metrics') {
    const p = parent.type === 'project' ? getProject(data, parent.id) : undefined;
    const pf = parent.type === 'portfolio' ? getPortfolio(data, parent.id) : undefined;
    return (
      <span className="mini-metrics">
        <span><b>{p?.progress ?? itemInfo(data, parent)?.progress ?? 0}%</b> progress</span>
        <span><b>{milestoneSets(data, parent, TODAY).done.length}</b> milestones done</span>
        {pf && <span>{pf.name}</span>}
      </span>
    );
  }
  return null;
}
