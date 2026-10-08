import type { ReactNode } from 'react';
import { PEOPLE, PROJECTS, SEED_TODAY, type Project } from '../data';
import { dueLabel, monthShort, monthTitle, parse, shortDate } from '../format';
import { useStore } from '../store';
import { Avatar, Screen } from '../components/Common';
import { HillChart } from '../components/HillChart';
import { dotsFor } from '../components/HillPanel';
import { Bell, Dots, FileGlyph, Folder, People, Plus, Star } from '../components/Icons';
import { positionsFor } from '../store';
import { Pie } from './TodosPage';

const FOLDER_COLORS = ['rgb(70 155 245)', 'rgb(240 140 20)', 'rgb(222 108 181)', 'rgb(167 130 247)'];

function Tool({ title, href, children, className = '' }: { title: string; href: string; children: ReactNode; className?: string }) {
  return (
    <section className={`tool ${className}`}>
      <h2 className="tool__title">
        <a href={href}>{title}</a>
      </h2>
      <a className="tool__card" href={href} aria-label={title}>
        {children}
      </a>
    </section>
  );
}

function MessagesCard({ p }: { p: Project }) {
  const [first, ...rest] = [...p.messages].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="mcard">
      <div className="mcard__featured">
        <div className="mcard__byline">
          <Avatar who={first.author} size={32} />
          <div>
            <div>{PEOPLE[first.author].name}</div>
            <div className="subtle">{shortDate(parse(first.date), parse('2025-01-01'))}</div>
          </div>
        </div>
        <strong>{first.title}</strong>
        <p>{first.body}</p>
      </div>
      <ul className="mcard__list">
        {rest.slice(0, 4).map((m) => (
          <li key={m.id}>
            <Avatar who={m.author} size={32} />
            <div>
              <strong>{m.title}</strong>
              <span className="subtle">{m.body}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DocsCard({ p }: { p: Project }) {
  let folder = 0;
  return (
    <ul className="dcard">
      {p.docs.map((d) => (
        <li key={d.name}>
          {d.kind === 'folder' ? <Folder color={FOLDER_COLORS[folder++ % FOLDER_COLORS.length]} /> : <FileGlyph kind={d.kind} />}
          <div>
            <strong>{d.name}</strong>
            <span className="subtle">{d.meta}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function TodosCard({ p }: { p: Project }) {
  const { state } = useStore();
  const lists = state.lists[p.key] ?? [];
  const snaps = state.snapshots[p.key] ?? [];
  const dots = dotsFor(lists, positionsFor(lists, snaps[snaps.length - 1]));
  const withOpen = lists.filter((l) => l.todos.some((t) => !t.done));
  return (
    <div className="tcard">
      {dots.length > 0 && (
        <div className="tcard__hill">
          <HillChart dots={dots} variant="thumb" />
        </div>
      )}
      {(withOpen.length ? withOpen : lists).slice(0, 3).map((l) => (
        <div className="tcard__list" key={l.id}>
          <strong>
            <Pie list={l} size={14} />
            {l.name}
          </strong>
          <ul>
            {l.todos
              .filter((t) => !t.done)
              .slice(0, 4)
              .map((t) => (
                <li key={t.id}>{t.title}</li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function ChatCard({ p }: { p: Project }) {
  return (
    <div className="ccard">
      {p.chat.map((c, i) => (
        <div className="ccard__line" key={i}>
          <Avatar who={c.author} size={32} />
          <div className="ccard__bubble">
            <div>
              <strong>{PEOPLE[c.author].name}</strong> <span className="subtle">{c.time}</span>
            </div>
            <p>{c.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MonthGrid({ p, small = true }: { p: Project; small?: boolean }) {
  const today = parse(SEED_TODAY);
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  const events = new Set(p.milestones.map((m) => m.due));
  const weeks: Date[][] = [];
  const cur = new Date(start);
  while (weeks.length < 6) {
    const w: Date[] = [];
    for (let i = 0; i < 7; i++) {
      w.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(w);
    if (cur.getMonth() !== today.getMonth()) break;
  }
  const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return (
    <div className={`cal${small ? ' cal--small' : ''}`}>
      <div className="cal__month">{monthTitle(today)}</div>
      <div className="cal__week cal__week--head">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      {weeks.map((w, i) => (
        <div className="cal__week" key={i}>
          {w.map((d) => (
            <span
              key={ymd(d)}
              className={[
                d.getMonth() !== today.getMonth() ? 'cal__day--outside' : '',
                ymd(d) === SEED_TODAY ? 'cal__day--today' : '',
                events.has(ymd(d)) ? 'cal__day--event' : '',
              ].join(' ')}
            >
              {d.getDate()}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function ScheduleCard({ p }: { p: Project }) {
  const upcoming = p.milestones.filter((m) => m.due >= SEED_TODAY).slice(0, 2);
  const shown = upcoming.length ? upcoming : p.milestones.slice(-2);
  return (
    <div className="scard">
      <MonthGrid p={p} />
      <ul className="scard__events">
        {shown.map((m) => {
          const d = parse(m.due);
          return (
            <li key={m.name}>
              <span className="datebadge">
                <span>{monthShort(d)}</span>
                <b>{d.getDate()}</b>
              </span>
              <div>
                <strong>{m.name}</strong>
                <span className="subtle">{dueLabel(m.due)}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CardTableCard({ p }: { p: Project }) {
  const [triage, ...cols] = p.cardColumns;
  return (
    <div className="ktcard">
      <div className="ktcard__triage">
        {triage.name.toUpperCase()} <span className="subtle">({triage.count})</span>
      </div>
      <div className="ktcard__cols">
        {cols.map((c) => (
          <div key={c.name} className="ktcard__col" style={{ borderTopColor: c.color, background: c.tint }}>
            <span className="subtle">({c.count})</span>
            <span className="ktcard__name">{c.name.toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProjectPage({ projectKey }: { projectKey: string }) {
  const p = PROJECTS.find((x) => x.key === projectKey)!;
  const base = `#/p/${p.key}`;
  return (
    <Screen
      tint={p.tint}
      bar={
        <>
          <span className="bar__people">
            <button className="bar__people-btn" aria-label="People on this project">
              <People width={18} height={18} />
            </button>
            <span className="avatars">
              {p.people.map((k) => (
                <Avatar key={k} who={k} size={24} />
              ))}
            </span>
          </span>
          <span className="bar__actions">
            <button className="bar__action">
              <Bell /> <span className="hide-sm">Notifications on</span>
            </button>
            <button className="bar__action bar__action--icon" aria-label="More">
              <Dots />
            </button>
          </span>
        </>
      }
    >
      <div className="project">
        <header className="project__header">
          <div className="project__client">{p.client}</div>
          <h1 className="project__name">
            {p.name} {p.starred && <Star size={32} />}
          </h1>
          <p className="project__desc">{p.description}</p>
        </header>
        <div className="tools">
          <Tool title="Message Board" href={`${base}/messages`}>
            <MessagesCard p={p} />
          </Tool>
          <Tool title="Docs & Files" href={`${base}/docs`}>
            <DocsCard p={p} />
          </Tool>
          <Tool title="To-dos" href={`${base}/todos`}>
            <TodosCard p={p} />
          </Tool>
          <Tool title="Chat" href={`${base}/chat`}>
            <ChatCard p={p} />
          </Tool>
          <Tool title="Schedule" href={`${base}/schedule`}>
            <ScheduleCard p={p} />
          </Tool>
          <Tool title="Card Table" href={`${base}/cards`}>
            <CardTableCard p={p} />
          </Tool>
        </div>
        <button className="add-tool" aria-label="Add a tool">
          <Plus width={30} height={30} strokeWidth={1.6} />
        </button>
      </div>
    </Screen>
  );
}
