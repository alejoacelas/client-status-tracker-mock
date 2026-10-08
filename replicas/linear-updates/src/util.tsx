import { Fragment, type ReactNode } from 'react';
import { now } from './store';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const parse = (s: string) => (s.length === 10 ? new Date(s + 'T00:00:00') : new Date(s));

export function ago(s: string, long = false): string {
  const d = parse(s);
  const diff = (now().getTime() - d.getTime()) / 1000;
  const min = Math.floor(diff / 60);
  const h = Math.floor(min / 60);
  const days = Math.floor(h / 24);
  const w = Math.floor(days / 7);
  if (min < 1) return 'just now';
  if (long) {
    if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`;
    if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
    if (w < 5) return `${w} week${w === 1 ? '' : 's'} ago`;
    return shortDate(s);
  }
  if (min < 60) return `${min}min ago`;
  if (h < 24) return `${h}h ago`;
  if (days < 7) return `${days}d ago`;
  if (w < 5) return `${w}w ago`;
  return shortDate(s);
}

export function agoCompact(s: string): string {
  return ago(s).replace(' ago', '');
}

export function shortDate(s: string, withYear = false): string {
  const d = parse(s);
  const y = d.getFullYear() !== now().getFullYear() || withYear ? `, ${d.getFullYear()}` : '';
  return `${MONTHS[d.getMonth()]} ${d.getDate()}${y}`;
}

export function fullDateTime(s: string): string {
  const d = parse(s);
  const t = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} at ${t}`;
}

export function dayKey(s: string) {
  return s.slice(0, 10);
}

export function dayLabel(s: string): string {
  const today = now();
  const d = parse(s.slice(0, 10));
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const diff = Math.round((t0 - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  const wd = d.toLocaleDateString('en-US', { weekday: 'long' });
  if (diff < 7) return wd;
  return `${wd}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function quarterLabel(s: string): string {
  const d = parse(s);
  return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
}

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

// ---- Markdown subset ----

function inline(text: string, key = 0): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|~~([^~]+)~~|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)|@(maya|tom|priya)\b)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}-${i++}`;
    if (m[2]) out.push(<strong key={k}>{m[2]}</strong>);
    else if (m[3]) out.push(<em key={k}>{m[3]}</em>);
    else if (m[4]) out.push(<s key={k}>{m[4]}</s>);
    else if (m[5]) out.push(<code key={k}>{m[5]}</code>);
    else if (m[6]) out.push(<a key={k} href={m[7]} target="_blank" rel="noreferrer">{m[6]}</a>);
    else if (m[8]) out.push(<span key={k} className="mention">@{m[8]}</span>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ text, className }: { text: string; className?: string }) {
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <div className={cx('prose', className)}>
      {blocks.map((b, bi) => {
        const lines = b.split('\n');
        if (lines.every((l) => /^\s*[-*] /.test(l)))
          return <ul key={bi}>{lines.map((l, li) => <li key={li}>{inline(l.replace(/^\s*[-*] /, ''), li)}</li>)}</ul>;
        if (lines.every((l) => /^\s*\d+\. /.test(l)))
          return <ol key={bi}>{lines.map((l, li) => <li key={li}>{inline(l.replace(/^\s*\d+\. /, ''), li)}</li>)}</ol>;
        return (
          <p key={bi}>
            {lines.map((l, li) => (
              <Fragment key={li}>{li > 0 && <br />}{inline(l, li)}</Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function inlineHtml(s: string) {
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/\*([^*]+)\*/g, '<i>$1</i>')
    .replace(/~~([^~]+)~~/g, '<s>$1</s>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

export function mdToHtml(md: string): string {
  if (!md.trim()) return '';
  return md
    .trim()
    .split(/\n\s*\n/)
    .map((b) => {
      const lines = b.split('\n');
      if (lines.every((l) => /^\s*[-*] /.test(l))) return `<ul>${lines.map((l) => `<li>${inlineHtml(l.replace(/^\s*[-*] /, ''))}</li>`).join('')}</ul>`;
      if (lines.every((l) => /^\s*\d+\. /.test(l))) return `<ol>${lines.map((l) => `<li>${inlineHtml(l.replace(/^\s*\d+\. /, ''))}</li>`).join('')}</ol>`;
      return `<p>${lines.map(inlineHtml).join('<br>')}</p>`;
    })
    .join('');
}

export function htmlToMd(root: HTMLElement): string {
  const inl = (n: Node): string => {
    if (n.nodeType === 3) return (n.textContent ?? '').replace(/ /g, ' ');
    if (!(n instanceof HTMLElement)) return '';
    const inner = [...n.childNodes].map(inl).join('');
    const tag = n.tagName;
    if (tag === 'B' || tag === 'STRONG') return inner.trim() ? `**${inner}**` : inner;
    if (tag === 'I' || tag === 'EM') return inner.trim() ? `*${inner}*` : inner;
    if (tag === 'S' || tag === 'STRIKE' || tag === 'DEL') return inner.trim() ? `~~${inner}~~` : inner;
    if (tag === 'CODE') return `\`${inner}\``;
    if (tag === 'A') return `[${inner}](${n.getAttribute('href') ?? ''})`;
    if (tag === 'BR') return '\n';
    if (tag === 'SPAN' && n.style.fontWeight && Number(n.style.fontWeight) >= 600) return `**${inner}**`;
    return inner;
  };
  const blocks: string[] = [];
  let buf = '';
  const flush = () => {
    if (buf.trim()) blocks.push(buf.trim());
    buf = '';
  };
  for (const n of [...root.childNodes]) {
    if (n instanceof HTMLElement && (n.tagName === 'UL' || n.tagName === 'OL')) {
      flush();
      const ordered = n.tagName === 'OL';
      blocks.push([...n.children].map((li, i) => `${ordered ? `${i + 1}.` : '-'} ${inl(li).replace(/\n/g, ' ').trim()}`).join('\n'));
    } else if (n instanceof HTMLElement && (n.tagName === 'P' || n.tagName === 'DIV')) {
      flush();
      const t = inl(n).replace(/\n$/, '');
      if (t.trim()) blocks.push(t.trim());
    } else {
      buf += inl(n);
    }
  }
  flush();
  return blocks.join('\n\n');
}

export function copyText(t: string) {
  try {
    void navigator.clipboard?.writeText(t);
  } catch {
    /* ignore */
  }
}
