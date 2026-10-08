import { useEffect, useState } from 'react';
import { AGENCY, PEOPLE, PROJECTS } from '../data';
import { shortDate, parse, clock, daysSince } from '../format';
import { useStore } from '../store';
import { Avatar, Mark } from '../components/Common';
import { Activity, Calendar, Globe, Pie, Plus, Star, Folder } from '../components/Icons';

export function HomePage() {
  const { state, dispatch } = useStore();
  const [q, setQ] = useState('');
  useEffect(() => {
    document.body.style.background = 'rgb(254 250 246)';
  }, []);
  const projects = PROJECTS.filter((p) => `${p.name} ${p.client}`.toLowerCase().includes(q.toLowerCase()));
  const activity = Object.entries(state.snapshots)
    .flatMap(([key, snaps]) => snaps.map((s) => ({ key, s })))
    .sort((a, b) => b.s.at.localeCompare(a.s.at))
    .slice(0, 6);

  return (
    <div className="home">
      <nav className="home__nav">
        <a href="#/"><Activity width={18} height={18} /> Activity</a>
        <a href="#/"><Calendar width={18} height={18} /> Calendar</a>
        <a href="#/" className="home__brand">
          <Mark size={38} /> {AGENCY}
        </a>
        <a href="#/"><Pie width={18} height={18} /> Reports</a>
        <a href="#/"><Globe width={18} height={18} /> Everything</a>
      </nav>
      <div className="home__grid">
        <aside className="home__left">
          <h2>Good morning, Maya</h2>
          <button className="home__btn"><Plus width={20} height={20} /> Make a new project</button>
          <button className="home__btn"><Folder color="rgb(35 119 210)" /> Add a folder</button>
        </aside>
        <section className="home__center">
          <div className="home__logo"><Mark size={64} /></div>
          <input className="home__search" placeholder="Search or jump to a project, person, or recent page" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search projects" />
          <div className="home__cards">
            {projects.map((p) => (
              <a key={p.key} className="pcard" href={`#/p/${p.key}`}>
                <div className="pcard__top">
                  <strong>{p.name}</strong>
                  <span className={p.starred ? '' : 'pcard__star--off'}><Star size={26} /></span>
                </div>
                <div className="pcard__client">{p.client}</div>
                <div className="avatars avatars--sm">
                  {p.people.map((k) => (
                    <Avatar key={k} who={k} size={22} />
                  ))}
                </div>
              </a>
            ))}
          </div>
        </section>
        <aside className="home__right">
          <h2>
            Most recent activity
          </h2>
          <ol className="timeline">
            {activity.map(({ key, s }) => {
              const p = PROJECTS.find((x) => x.key === key)!;
              const d = parse(s.at);
              return (
                <li key={s.id}>
                  <div className="subtle">{daysSince(s.at) === 0 ? clock(d) : shortDate(d)}</div>
                  <div>
                    <Avatar who={s.author} size={20} /> <strong>{PEOPLE[s.author].short}</strong> updated the{' '}
                    <a href={`#/p/${key}/todos`}>Hill Chart</a> — {p.name}
                  </div>
                </li>
              );
            })}
          </ol>
          <button className="linkish" onClick={() => confirm('Reset all demo changes stored in this browser?') && dispatch({ type: 'reset' })}>
            Reset demo data
          </button>
        </aside>
      </div>
      <footer className="home__bar">
        <Avatar who="maya" size={32} />
        <nav>
          <span>My Tasks</span>
          <span>My Events</span>
          <span>Do Today</span>
          <span>My Bookmarks</span>
          <span>My Notes</span>
        </nav>
        <span />
      </footer>
    </div>
  );
}
