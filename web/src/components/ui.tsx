import { useEffect, useState, type ReactNode } from 'react';
import { PHASES, type Phase } from '../lib/types';
import { statusSlug } from '../lib/format';

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={`pill pill-${statusSlug(status)}`}>
      <span className="pill-dot" />
      {status}
    </span>
  );
}

export function ProgressBar({ value, status }: { value: number; status?: string }) {
  return (
    <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={`progress-fill ${status ? `fill-${statusSlug(status)}` : ''}`} style={{ width: `${value}%` }} />
    </div>
  );
}

export function PhaseSteps({ phase, done }: { phase: Phase; done?: boolean }) {
  const current = PHASES.indexOf(phase);
  return (
    <ol className="phases" aria-label={`Phase: ${phase}`}>
      {PHASES.map((p, i) => {
        const state = done || i < current ? 'complete' : i === current ? 'current' : 'upcoming';
        return (
          <li key={p} className={`phase phase-${state}`}>
            <span className="phase-marker">{state === 'complete' ? <Check /> : i + 1}</span>
            <span className="phase-label">{p}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function Check({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ small }: { small?: boolean }) {
  return (
    <span className={`logo ${small ? 'logo-small' : ''}`}>
      <span className="logo-mark">F</span>
      <span className="logo-text">Fieldwork Studio</span>
    </span>
  );
}

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function SaveIndicator({ state, error }: { state: SaveState; error?: string }) {
  if (state === 'idle') return <span className="save save-idle" />;
  return (
    <span className={`save save-${state}`} title={error}>
      {state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved' : 'Not saved'}
    </span>
  );
}

/** Tracks a save in flight and fades "Saved" back to idle after a moment. */
export function useSaveState() {
  const [state, setState] = useState<SaveState>('idle');
  const [error, setError] = useState<string>();
  useEffect(() => {
    if (state !== 'saved') return;
    const t = setTimeout(() => setState('idle'), 1800);
    return () => clearTimeout(t);
  }, [state]);
  async function track(run: () => Promise<string | null>) {
    setState('saving');
    const err = await run();
    setError(err ?? undefined);
    setState(err ? 'error' : 'saved');
  }
  return { state, error, track };
}

/** A button that asks for a second click before running a destructive action. */
export function ConfirmButton({
  onConfirm,
  children,
  confirmLabel = 'Confirm',
  prompt,
  className = 'btn btn-ghost btn-sm',
}: {
  onConfirm: () => void;
  children: ReactNode;
  confirmLabel?: string;
  prompt?: string;
  className?: string;
}) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button type="button" className={className} onClick={() => setAsking(true)}>
        {children}
      </button>
    );
  }
  return (
    <span className="confirm">
      {prompt && <span className="confirm-prompt">{prompt}</span>}
      <button
        type="button"
        className="btn btn-danger btn-sm"
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
      >
        {confirmLabel}
      </button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAsking(false)}>
        Cancel
      </button>
    </span>
  );
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="spinner-wrap">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}
