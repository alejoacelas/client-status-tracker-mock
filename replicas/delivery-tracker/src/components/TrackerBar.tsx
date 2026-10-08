import { useEffect, useState } from 'react';
import { PHASES } from '../data';

type Props = {
  /** 0 = nothing started (bar idle), 1–5 = active phase, 6 = complete. */
  step: number;
  /** Idle bar with no labels, as on the lookup page. */
  idle?: boolean;
};

const MOVE_MS = 1000; // the red block slides for 1s, then its text fades back in

/**
 * The skewed five-segment bar. The red "active" block slides between
 * segments; its label fades out before the move and back in after it.
 */
export function TrackerBar({ step, idle = false }: Props) {
  const [shownStep, setShownStep] = useState(step);
  const [textVisible, setTextVisible] = useState(true);

  useEffect(() => {
    if (shownStep === step) {
      setTextVisible(true);
      return;
    }
    setTextVisible(false);
    const t = window.setTimeout(() => setShownStep(step), MOVE_MS);
    return () => window.clearTimeout(t);
  }, [step, shownStep]);

  const activeLabel = shownStep >= 1 && shownStep <= 5 ? PHASES[shownStep - 1] : '';

  return (
    <div className="ft-bar" data-step={idle ? 0 : step} aria-hidden="true">
      <div className="ft-bar__base" />
      <div className="ft-bar__stages">
        {PHASES.map((_, i) => (
          <div key={i} className={`ft-bar__stage ft-bar__stage--${i + 1}`} />
        ))}
      </div>
      <ol className="ft-bar__labels">
        {PHASES.map((name, i) => (
          <li key={name} className={`ft-bar__label ft-bar__label--${i + 1}`}>
            {name}
          </li>
        ))}
      </ol>
      <div className="ft-bar__mask">
        <div className="ft-bar__active">
          <div className={`ft-bar__active-text${textVisible ? ' is-visible' : ''}`}>{activeLabel}</div>
        </div>
      </div>
      <span className="ft-bar__complete">complete</span>
    </div>
  );
}
