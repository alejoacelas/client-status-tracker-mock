import { useEffect, useRef, useState } from 'react';
import { agency, staff, type Project } from '../data';
import { daysBetween, launchProgress, shortDate } from '../messages';
import { CarIcon, ExpandIcon, PinIcon } from './Icons';

type Props = { project: Project; step: number };

// Route from the studio to the client along the simulated streets (map units).
const ROUTE: [number, number][] = [
  [452, 338],
  [600, 338],
  [600, 250],
  [700, 250],
  [700, 168],
  [748, 168],
];
const STUDIO = ROUTE[0];
const CLIENT = ROUTE[ROUTE.length - 1];

function segmentLengths() {
  return ROUTE.slice(1).map(([x, y], i) => Math.hypot(x - ROUTE[i][0], y - ROUTE[i][1]));
}
const SEGMENTS = segmentLengths();
const TOTAL = SEGMENTS.reduce((a, b) => a + b, 0);

function pointAt(t: number): [number, number] {
  let d = Math.min(1, Math.max(0, t)) * TOTAL;
  for (let i = 0; i < SEGMENTS.length; i++) {
    if (d <= SEGMENTS[i] || i === SEGMENTS.length - 1) {
      const f = SEGMENTS[i] ? Math.min(1, d / SEGMENTS[i]) : 0;
      const [x0, y0] = ROUTE[i];
      const [x1, y1] = ROUTE[i + 1];
      return [x0 + (x1 - x0) * f, y0 + (y1 - y0) * f];
    }
    d -= SEGMENTS[i];
  }
  return CLIENT;
}

/** Animates the driver along the route whenever the target position changes. */
function useAnimatedProgress(target: number) {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now();
    const begin = target > 0 && from.current === 0 ? 0 : from.current;
    const duration = 2600;
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      const v = begin + (target - begin) * eased;
      from.current = v;
      setValue(v);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return value;
}

export function DriverMap({ project, step }: Props) {
  const tracking = step >= 5;
  const target = launchProgress(project, step);
  const progress = useAnimatedProgress(tracking ? target : 0);
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const launch = project.phases[4];
  const lead = launch.lead;
  const firstName = lead.split(' ')[0];
  const launchDays = Math.max(1, daysBetween(launch.start, project.dueDate));
  const etaDays = step >= 6 ? 0 : Math.max(1, Math.round((1 - target) * launchDays));
  const near = progress > 0.66;
  const [dx, dy] = pointAt(progress);

  let mainText = 'Left the studio';
  let subText = `${lead} left the studio with your ${project.deliverable} on ${shortDate(launch.start)}`;
  if (step >= 6) {
    mainText = 'Launched';
    subText = `Your ${project.deliverable} is live. We hope you enjoy it!`;
  } else if (near) {
    mainText = 'In your neighborhood';
    subText = `${firstName} is in your neighborhood`;
  }

  const person = staff[lead];

  return (
    <section className={`ft-driver${fullscreen ? ' ft-driver--fullscreen' : ''}`}>
      {tracking && (
        <div className="ft-driver__status">
          <div className="ft-driver__text-card">
            <div className="ft-driver__status-line">
              <span className="ft-driver__main">{mainText}</span>
              <span className="ft-driver__sub">{subText}</span>
            </div>
            <div className="ft-driver__who">
              <span className="ft-driver__avatar" style={{ background: person.color }}>
                {person.initials}
              </span>
              <dl>
                <dt>Your launch lead is:</dt>
                <dd>{firstName}</dd>
                <dt>{step >= 6 ? 'Launched on:' : 'Your estimated launch time is:'}</dt>
                <dd>{step >= 6 ? shortDate(project.dueDate) : `${etaDays} ${etaDays === 1 ? 'day' : 'days'}`}</dd>
              </dl>
            </div>
            <button type="button" className="ft-driver__profile-btn" onClick={() => setProfileOpen((v) => !v)}>
              {profileOpen ? 'Hide profile' : 'See launch lead profile'}
            </button>
            {profileOpen && (
              <div className="ft-driver__profile">
                <h3>Meet your launch lead</h3>
                <p className="ft-driver__profile-name">
                  {lead} · {person.role}
                </p>
                <p>{person.about}</p>
                <p>
                  <strong>Other than English, I also speak</strong> {person.languages}.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className={`ft-map${tracking ? '' : ' ft-map--no-tracking'}`}>
        <svg className="ft-map__svg" viewBox="0 0 1200 500" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`Simulated map from ${agency.name} to ${project.name}`}>
          <g transform={`translate(600 250) scale(${zoom}) translate(-600 -250)`}>
            <MapBase />
            {tracking && (
              <>
                <polyline className="ft-map__route" points={ROUTE.map((p) => p.join(',')).join(' ')} />
                <polyline
                  className="ft-map__route-done"
                  points={[...ROUTE.filter((_, i) => i === 0 || SEGMENTS.slice(0, i).reduce((a, b) => a + b, 0) / TOTAL <= progress), [dx, dy]]
                    .map((p) => p.join(','))
                    .join(' ')}
                />
              </>
            )}
            {/* Studio marker: placeholder mark, not a logo */}
            <g transform={`translate(${STUDIO[0]} ${STUDIO[1]})`} className="ft-map__studio">
              <rect x="-17" y="-17" width="34" height="34" rx="7" transform="rotate(45)" />
              <text y="5" textAnchor="middle">
                FS
              </text>
            </g>
            {/* Client marker with ETA bubble */}
            <g transform={`translate(${CLIENT[0]} ${CLIENT[1]})`}>
              {tracking ? (
                <g className="ft-map__eta">
                  <circle r="27" />
                  <text y="-2" textAnchor="middle" className="ft-map__eta-num">
                    {step >= 6 ? '✓' : etaDays}
                  </text>
                  <text y="13" textAnchor="middle" className="ft-map__eta-unit">
                    {step >= 6 ? 'LIVE' : etaDays === 1 ? 'DAY' : 'DAYS'}
                  </text>
                </g>
              ) : (
                <g className="ft-map__home">
                  <circle r="9" />
                </g>
              )}
            </g>
            {tracking && step < 6 && (
              <g transform={`translate(${dx} ${dy})`} className="ft-map__driver">
                <path d="M0 0 C -6 -10 -22 -18 -22 -36 A 22 22 0 1 1 22 -36 C 22 -18 6 -10 0 0 Z" />
                <g transform="translate(-16.6 -45.5) scale(0.13)">
                  <CarIcon fill="#fff" asGroup />
                </g>
              </g>
            )}
          </g>
        </svg>

        {!tracking && (
          <div className="ft-map__overlay">
            <p>
              Follow your project from our studio to your launch with the new and improved {agency.trackerName}® with GPS.
            </p>
            <div className="ft-map__overlay-icons">
              <span className="ft-map__overlay-circle">
                <CarIcon fill="#006491" />
              </span>
              <span className="ft-map__overlay-divider" />
              <span className="ft-map__overlay-circle">
                <PinIcon />
              </span>
            </div>
          </div>
        )}

        {tracking && (
          <div className="ft-map__controls">
            <button type="button" aria-label="Expand map to full screen" onClick={() => setFullscreen((v) => !v)}>
              <ExpandIcon />
            </button>
            <button type="button" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(2, z + 0.25))}>
              +
            </button>
            <button type="button" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(0.75, z - 0.25))}>
              −
            </button>
          </div>
        )}
        <span className="ft-map__attribution">Map simulated</span>
      </div>
      <p className="ft-driver__disclaimer">Some launches may not have live tracking.</p>
    </section>
  );
}

/** Simulated street map: blocks, a park, a river and fictional street names. */
function MapBase() {
  const avenues = [120, 300, 452, 600, 700, 860, 1040];
  const streets = [60, 168, 250, 338, 430];
  return (
    <g className="ft-map__base">
      <rect width="1200" height="500" className="ft-map__land" />
      <path className="ft-map__water" d="M-20 470 C 180 420 260 470 380 455 S 620 400 760 430 S 1020 480 1220 440 L 1220 520 L -20 520 Z" />
      <rect className="ft-map__park" x="760" y="268" width="210" height="132" rx="6" />
      <rect className="ft-map__park" x="140" y="80" width="120" height="70" rx="6" />
      {streets.map((y) => (
        <line key={`s${y}`} className="ft-map__road" x1="-20" y1={y} x2="1220" y2={y} />
      ))}
      {avenues.map((x) => (
        <line key={`a${x}`} className="ft-map__road" x1={x} y1="-20" x2={x} y2="520" />
      ))}
      <line className="ft-map__road ft-map__road--minor" x1="452" y1="80" x2="600" y2="80" />
      <line className="ft-map__road ft-map__road--minor" x1="860" y1="200" x2="1040" y2="200" />
      <line className="ft-map__highway" x1="-20" y1="20" x2="1220" y2="120" />
      <text className="ft-map__label" x="470" y="330">
        Mill St
      </text>
      <text className="ft-map__label" x="612" y="242">
        Cedar Ave
      </text>
      <text className="ft-map__label" x="300" y="245" transform="rotate(-90 300 245)">
        Orchard Rd
      </text>
      <text className="ft-map__label" x="790" y="160">
        Harbor St
      </text>
      <text className="ft-map__label" x="1000" y="425">
        Riverside Dr
      </text>
      <text className="ft-map__label ft-map__label--park" x="865" y="338" textAnchor="middle">
        Linden Park
      </text>
      <text className="ft-map__label" x="860" y="100" transform="rotate(-90 860 100)">
        Elm Ave
      </text>
    </g>
  );
}
