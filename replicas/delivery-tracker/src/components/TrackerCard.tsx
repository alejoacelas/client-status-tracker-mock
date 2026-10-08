import { agency, type Project } from '../data';
import { launchDate, shortDate, statusFor, stepName } from '../messages';
import { TrackerBar } from './TrackerBar';

type Props = { project?: Project; step: number };

/** White tracker card: title, estimate, bar, patent line and status lines. */
export function TrackerCard({ project, step }: Props) {
  const status = project ? statusFor(project, step) : null;
  return (
    <section className="ft-card" data-step={project ? step : 0}>
      <h1 className="ft-card__title">
        {agency.trackerName}
        <sup>®</sup>
      </h1>
      {project && (
        <p className="ft-card__estimate">
          {step >= 6
            ? `Launched on ${shortDate(launchDate(project))}`
            : `Current estimated launch date ${project.estimate}`}
        </p>
      )}
      <div className="ft-card__barwrap">
        <TrackerBar step={project ? step : 0} idle={!project} />
        <span className="ft-card__patent">Patent pending</span>
      </div>
      {status && (
        <div className="ft-card__status" aria-live="polite">
          <span className="visually-hidden">Current step: {stepName(step)}. </span>
          <p className="ft-card__major" key={`major-${step}`}>
            {status.major}
          </p>
          <p className="ft-card__minor" key={`minor-${step}`}>
            {status.minor}
          </p>
        </div>
      )}
    </section>
  );
}
