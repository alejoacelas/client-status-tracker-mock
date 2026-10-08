import { useEffect, useState } from 'react';
import { clientFor, projects, type Project } from '../data';
import { STEP_COUNT, stepName } from '../messages';

type Props = {
  project: Project;
  step: number;
  onStep: (step: number) => void;
};

const AUTO_MS = 3500;

/** Demo control, not part of the original page: steps the tracker through its stages. */
export function DemoBar({ project, step, onStep }: Props) {
  const [auto, setAuto] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!auto) return;
    const t = window.setTimeout(() => onStep(step >= STEP_COUNT - 1 ? 0 : step + 1), step >= STEP_COUNT - 1 ? AUTO_MS + 1500 : AUTO_MS);
    return () => window.clearTimeout(t);
  }, [auto, step, onStep]);

  if (collapsed) {
    return (
      <button type="button" className="demo demo--collapsed" onClick={() => setCollapsed(false)}>
        Demo controls
      </button>
    );
  }

  return (
    <div className="demo" role="region" aria-label="Demo controls">
      <div className="demo__row">
        <span className="demo__tag">Demo</span>
        <select
          className="demo__project"
          value={project.key}
          aria-label="Project"
          onChange={(e) => {
            setAuto(false);
            window.location.hash = `#/track/${e.target.value}`;
          }}
        >
          {projects.map((p) => (
            <option key={p.key} value={p.key}>
              {clientFor(p).name} — {p.name}
            </option>
          ))}
        </select>
        <button type="button" className="demo__close" aria-label="Hide demo controls" onClick={() => setCollapsed(true)}>
          ×
        </button>
      </div>
      <div className="demo__row">
        <button type="button" onClick={() => onStep(Math.max(0, step - 1))} disabled={step <= 0} aria-label="Previous stage">
          ‹ Back
        </button>
        <span className="demo__step" aria-live="polite">
          {step + 1}/{STEP_COUNT} · {stepName(step)}
          {step === project.step && <em> (today)</em>}
        </span>
        <button type="button" onClick={() => onStep(Math.min(STEP_COUNT - 1, step + 1))} disabled={step >= STEP_COUNT - 1} aria-label="Next stage">
          Next ›
        </button>
        <button type="button" className={auto ? 'is-on' : ''} onClick={() => setAuto((v) => !v)} aria-pressed={auto}>
          {auto ? '❚❚ Pause' : '▶ Play'}
        </button>
        <button type="button" onClick={() => { setAuto(false); onStep(project.step); }} disabled={step === project.step} title="Back to today's real stage">
          Today
        </button>
      </div>
    </div>
  );
}
