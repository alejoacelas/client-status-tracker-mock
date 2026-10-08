import { useCallback, useEffect, useState } from 'react';
import { agency, clientFor, projects } from './data';
import { STEP_COUNT } from './messages';
import { LookupCard, ProjectDetailsCard, RatingCard, StudioCard, UpdatesCard } from './components/Cards';
import { DemoBar } from './components/DemoBar';
import { DriverMap } from './components/DriverMap';
import { SiteFooter, SiteHeader } from './components/SiteChrome';
import { TrackerCard } from './components/TrackerCard';

type Route = { name: 'lookup' } | { name: 'track'; key: string; step: number | null };

function parseHash(): Route {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [path, query = ''] = raw.split('?');
  const m = path.match(/^\/track\/([\w-]+)\/?$/);
  if (m && projects.some((p) => p.key === m[1])) {
    const s = new URLSearchParams(query).get('step');
    const n = s === null ? null : Number(s);
    return { name: 'track', key: m[1], step: n !== null && Number.isInteger(n) && n >= 0 && n < STEP_COUNT ? n : null };
  }
  return { name: 'lookup' };
}

function useRoute() {
  const [route, setRoute] = useState(parseHash);
  useEffect(() => {
    const on = () => setRoute(parseHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function App() {
  const route = useRoute();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route.name, route.name === 'track' ? route.key : '']);
  return (
    <div className="page">
      <SiteHeader />
      <main className="content">{route.name === 'track' ? <TrackerPage key={route.key} projectKey={route.key} initialStep={route.step} /> : <LookupPage />}</main>
      <SiteFooter />
    </div>
  );
}

function LookupPage() {
  useEffect(() => {
    document.title = `${agency.trackerName} — Track your project`;
  }, []);
  return (
    <div className="content__inner">
      <TrackerCard step={0} />
      <LookupCard />
    </div>
  );
}

function TrackerPage({ projectKey, initialStep }: { projectKey: string; initialStep: number | null }) {
  const project = projects.find((p) => p.key === projectKey)!;
  const [step, setStep] = useState(initialStep ?? project.step);

  useEffect(() => {
    document.title = `${agency.trackerName} — ${clientFor(project).name}: ${project.name}`;
  }, [project]);

  const changeStep = useCallback(
    (s: number) => {
      setStep(s);
      const url = `#/track/${project.key}${s === project.step ? '' : `?step=${s}`}`;
      window.history.replaceState(null, '', url);
    },
    [project],
  );

  return (
    <div className="content__inner">
      <TrackerCard project={project} step={step} />
      <DriverMap project={project} step={step} />
      <div className="tracker-grid">
        <div className="tracker-grid__main">
          <UpdatesCard project={project} />
          <ProjectDetailsCard project={project} step={step} />
        </div>
        <div className="tracker-grid__side">
          <StudioCard project={project} />
          <RatingCard />
        </div>
      </div>
      <DemoBar project={project} step={step} onStep={changeStep} />
    </div>
  );
}
