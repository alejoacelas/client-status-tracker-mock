import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Health, Update } from '../data/mock';
import { HEALTH_META, HealthIcon, I } from '../icons';
import { htmlToMd, mdToHtml } from '../util';
import { Menu, useAnchor } from './Menu';
import { ProgressDetails } from './UpdateItem';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
export const MOD = isMac ? '⌘' : 'Ctrl';

export function RichEditor({
  initial, placeholder, onChange, onSubmit, onCancel, autoFocus = true, className = 'editor prose',
}: {
  initial: string;
  placeholder: string;
  onChange: (md: string, empty: boolean) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState<{ left: number; top: number } | null>(null);
  const [isEmpty, setIsEmpty] = useState(!initial.trim());

  useEffect(() => {
    const el = ref.current!;
    document.execCommand('defaultParagraphSeparator', false, 'p');
    el.innerHTML = mdToHtml(initial) || '<p><br></p>';
    if (autoFocus) {
      el.focus();
      const r = document.createRange();
      r.selectNodeContents(el);
      r.collapse(false);
      const s = window.getSelection();
      s?.removeAllRanges();
      s?.addRange(r);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const on = () => {
      const s = window.getSelection();
      const el = ref.current;
      if (!s || s.isCollapsed || !el || !s.rangeCount || !el.contains(s.anchorNode)) return setBar(null);
      const r = s.getRangeAt(0).getBoundingClientRect();
      setBar({ left: Math.max(8, r.left + r.width / 2 - 85), top: Math.max(8, r.top - 40) });
    };
    document.addEventListener('selectionchange', on);
    return () => document.removeEventListener('selectionchange', on);
  }, []);

  const emit = () => {
    const el = ref.current!;
    // Keep content inside block elements so lists and paragraphs convert cleanly.
    if (!el.firstElementChild || el.firstChild?.nodeType === 3) {
      const text = el.textContent ?? '';
      if (!el.querySelector('p, ul, ol, div')) {
        el.innerHTML = `<p>${text.replace(/</g, '&lt;') || '<br>'}</p>`;
        const r = document.createRange();
        r.selectNodeContents(el.firstElementChild!);
        r.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(r);
      }
    }
    const md = htmlToMd(el);
    const empty = !el.textContent?.trim() && !el.querySelector('li');
    setIsEmpty(empty);
    onChange(md, empty);
  };

  const exec = (cmd: string, val?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, val);
    emit();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key === 'Enter') { e.preventDefault(); onSubmit(); return; }
    if (e.key === 'Escape' && onCancel) { e.preventDefault(); e.stopPropagation(); onCancel(); return; }
    if (mod && e.key.toLowerCase() === 'b') { e.preventDefault(); exec('bold'); }
    if (mod && e.key.toLowerCase() === 'i') { e.preventDefault(); exec('italic'); }
    if (mod && e.shiftKey && e.key.toLowerCase() === 'x') { e.preventDefault(); exec('strikeThrough'); }
    if (e.key === ' ') {
      // Markdown shortcut: "-" or "*" at the start of a line becomes a bullet list.
      const s = window.getSelection();
      const node = s?.anchorNode;
      const block = node?.parentElement?.closest('p, div:not(.editor)');
      if (node && node.nodeType === 3 && s!.anchorOffset === 1 && /^[-*]$/.test(node.textContent?.slice(0, 1) ?? '') && block && block.textContent?.startsWith(node.textContent ?? '')) {
        if (!node.parentElement?.closest('li')) {
          e.preventDefault();
          node.textContent = (node.textContent ?? '').slice(1);
          if (!block.textContent) block.innerHTML = '<br>';
          const r = document.createRange();
          r.setStart(block, 0);
          r.collapse(true);
          s!.removeAllRanges();
          s!.addRange(r);
          exec('insertUnorderedList');
        }
      }
    }
  };

  const link = () => {
    const url = window.prompt('Link URL');
    if (url) exec('createLink', url);
  };

  return (
    <div style={{ position: 'relative' }}>
      {isEmpty && <div className="editor-placeholder">{placeholder}</div>}
      <div
        ref={ref}
        className={className}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        role="textbox"
        aria-multiline="true"
        onInput={emit}
        onKeyDown={onKeyDown}
        onPaste={(e) => {
          e.preventDefault();
          document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
        }}
      />
      {bar && createPortal(
        <div className="format-bar" style={bar} onMouseDown={(e) => e.preventDefault()}>
          <button title={`Bold (${MOD}B)`} onClick={() => exec('bold')}><I.bold size={14} /></button>
          <button title={`Italic (${MOD}I)`} onClick={() => exec('italic')}><I.italic size={14} /></button>
          <button title="Strikethrough" onClick={() => exec('strikeThrough')}><I.strike size={14} /></button>
          <button title="Link" onClick={link}><I.link size={14} /></button>
          <button title="Bulleted list" onClick={() => exec('insertUnorderedList')}><I.list size={14} /></button>
          <button title="Code" onClick={() => {
            const s = window.getSelection();
            if (s && !s.isCollapsed) exec('insertHTML', `<code>${s.toString().replace(/</g, '&lt;')}</code>`);
          }}><I.code size={14} /></button>
        </div>,
        document.body,
      )}
    </div>
  );
}

export function HealthPicker({ value, onChange }: { value: Health; onChange: (h: Health) => void }) {
  const m = useAnchor();
  return (
    <>
      <button className="health-pick" onClick={m.open} aria-haspopup="menu">
        <HealthIcon health={value} />
        <span style={{ color: HEALTH_META[value].color }}>{HEALTH_META[value].label}</span>
      </button>
      {m.anchor && (
        <Menu
          anchor={m.anchor}
          onClose={m.close}
          onSelect={(id) => onChange(id as Health)}
          width={176}
          items={(['onTrack', 'atRisk', 'offTrack'] as Health[]).map((h) => ({
            id: h, label: HEALTH_META[h].label, icon: <HealthIcon health={h} />, checked: h === value,
          }))}
        />
      )}
    </>
  );
}

export function Composer({
  initialHealth, initialBody = '', onSubmit, onCancel, submitLabel = 'Post update', placeholder = 'Write a project update…', progress,
}: {
  initialHealth: Health;
  initialBody?: string;
  onSubmit: (health: Health, body: string, progress?: Update['progress']) => void;
  onCancel: () => void;
  submitLabel?: string;
  placeholder?: string;
  progress?: Update['progress'];
}) {
  const [health, setHealth] = useState<Health>(initialHealth);
  const [body, setBody] = useState(initialBody);
  const [empty, setEmpty] = useState(!initialBody.trim());
  const [showProgress, setShowProgress] = useState(true);
  const submit = () => {
    if (empty) return;
    onSubmit(health, body, showProgress ? progress : undefined);
  };
  return (
    <div className="composer">
      <div className="composer-top">
        <HealthPicker value={health} onChange={setHealth} />
      </div>
      <RichEditor
        initial={initialBody}
        placeholder={placeholder}
        onChange={(md, e) => { setBody(md); setEmpty(e); }}
        onSubmit={submit}
        onCancel={onCancel}
      />
      {progress && (
        <div className="composer-progress">
          {showProgress ? (
            <ProgressDetails progress={progress} action={<button className="link-btn" onClick={() => setShowProgress(false)}>Hide details</button>} />
          ) : (
            <button className="link-btn" onClick={() => setShowProgress(true)}>Show progress details</button>
          )}
        </div>
      )}
      <div className="composer-foot">
        <span className="hint"><span className="kbd">{MOD}</span><span className="kbd">↵</span> to post</span>
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" disabled={empty} onClick={submit}>{submitLabel}</button>
      </div>
    </div>
  );
}
