import { useEffect, useState, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

/**
 * Inputs that keep a local draft and call onCommit when the user leaves the
 * field (or presses Enter), only if the value actually changed.
 */
export function CommitInput({
  value,
  onCommit,
  ...rest
}: { value: string; onCommit: (v: string) => void } & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const commit = () => {
    if (draft !== value) onCommit(draft);
  };
  return (
    <input
      {...rest}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        if (e.key === 'Escape') {
          setDraft(value);
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );
}

export function CommitTextarea({
  value,
  onCommit,
  ...rest
}: { value: string; onCommit: (v: string) => void } & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'>) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <textarea
      {...rest}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => draft !== value && onCommit(draft)}
    />
  );
}

export function clampProgress(v: string): number | null {
  const n = Math.round(Number(v));
  return v.trim() === '' || Number.isNaN(n) ? null : Math.min(100, Math.max(0, n));
}

export function Select<T extends string>({
  value,
  options,
  onChange,
  className = 'select',
  ariaLabel,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <select className={className} value={value} aria-label={ariaLabel} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
