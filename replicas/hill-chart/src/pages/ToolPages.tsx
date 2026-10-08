import { PEOPLE, PROJECTS } from '../data';
import { dueLabel, monthShort, parse, shortDate } from '../format';
import { Avatar, Screen, ToolBar } from '../components/Common';
import { FileGlyph, Folder, Plus } from '../components/Icons';
import { MonthGrid } from './ProjectPage';

const project = (k: string) => PROJECTS.find((p) => p.key === k)!;

export function MessagesPage({ projectKey }: { projectKey: string }) {
  const p = project(projectKey);
  const msgs = [...p.messages].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Screen tint={p.tint} bar={<ToolBar projectKey={projectKey} />}>
      <div className="page">
        <h1 className="page__heading">Message Board</h1>
        <div className="filters">
          <button className="btn btn--new">
            <Plus width={18} height={18} strokeWidth={2.4} /> New message
          </button>
        </div>
        <ul className="msglist">
          {msgs.map((m) => (
            <li key={m.id}>
              <Avatar who={m.author} size={44} />
              <div>
                <strong>
                  {m.category && <span className="category">{m.category}</span>}
                  {m.title}
                </strong>
                <p className="subtle">
                  {PEOPLE[m.author].name} • {shortDate(parse(m.date))} — {m.body}
                </p>
              </div>
              <span className="balloon" title={`${m.comments} comments`}>
                {m.comments}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Screen>
  );
}

export function SchedulePage({ projectKey }: { projectKey: string }) {
  const p = project(projectKey);
  return (
    <Screen tint={p.tint} bar={<ToolBar projectKey={projectKey} />}>
      <div className="page">
        <h1 className="page__heading">Schedule</h1>
        <div className="schedule-layout">
          <MonthGrid p={p} small={false} />
          <ul className="scard__events scard__events--page">
            {p.milestones.map((m) => {
              const d = parse(m.due);
              return (
                <li key={m.name}>
                  <span className="datebadge">
                    <span>{monthShort(d)}</span>
                    <b>{d.getDate()}</b>
                  </span>
                  <div>
                    <strong className={m.status === 'Done' ? 'is-done' : ''}>{m.name}</strong>
                    <span className="subtle">
                      {dueLabel(m.due)} · {m.status}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Screen>
  );
}

export function DocsPage({ projectKey }: { projectKey: string }) {
  const p = project(projectKey);
  let f = 0;
  const colors = ['rgb(70 155 245)', 'rgb(240 140 20)', 'rgb(222 108 181)'];
  return (
    <Screen tint={p.tint} bar={<ToolBar projectKey={projectKey} />}>
      <div className="page">
        <h1 className="page__heading">Docs &amp; Files</h1>
        <ul className="docgrid">
          {p.docs.map((d) => (
            <li key={d.name}>
              {d.kind === 'folder' ? <Folder color={colors[f++ % colors.length]} /> : <FileGlyph kind={d.kind} />}
              <strong>{d.name}</strong>
              <span className="subtle">{d.meta}</span>
            </li>
          ))}
        </ul>
      </div>
    </Screen>
  );
}

export function ChatPage({ projectKey }: { projectKey: string }) {
  const p = project(projectKey);
  return (
    <Screen tint={p.tint} bar={<ToolBar projectKey={projectKey} />}>
      <div className="page page--narrow">
        <h1 className="page__heading">Chat</h1>
        <div className="ccard ccard--page">
          {p.chat.map((c, i) => (
            <div className="ccard__line" key={i}>
              <Avatar who={c.author} size={36} />
              <div className="ccard__bubble">
                <div>
                  <strong>{PEOPLE[c.author].name}</strong> <span className="subtle">{c.time}</span>
                </div>
                <p>{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}

export function CardsPage({ projectKey }: { projectKey: string }) {
  const p = project(projectKey);
  return (
    <Screen tint={p.tint} bar={<ToolBar projectKey={projectKey} />}>
      <div className="page">
        <h1 className="page__heading">Card Table</h1>
        <div className="kt">
          {p.cardColumns.map((c) => (
            <div key={c.name} className="kt__col" style={{ borderTopColor: c.color, background: c.tint }}>
              <strong>{c.name}</strong> <span className="subtle">({c.count})</span>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}
