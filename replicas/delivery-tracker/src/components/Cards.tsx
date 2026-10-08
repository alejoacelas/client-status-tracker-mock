import { useState, type FormEvent, type ReactNode } from 'react';
import { agency, clientFor, clients, projects, type Project } from '../data';
import { shortDate, stepName } from '../messages';
import { MessageIcon, StarIcon } from './Icons';

export function Card({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`}>
      <h2 className="card__header">{title}</h2>
      <div className="card__body">{children}</div>
    </section>
  );
}

/** "Get updates for your delivery" opt-in, mapped to launch email updates. */
export function UpdatesCard({ project }: { project: Project }) {
  const [lead, setLead] = useState('2');
  const [email, setEmail] = useState(clientFor(project).contactEmail);
  const [agreed, setAgreed] = useState(false);
  const [done, setDone] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (agreed && email) setDone(true);
  };
  return (
    <section className="updates">
      <div className="updates__head">
        <MessageIcon />
        <h2>Get updates for your project</h2>
      </div>
      {done ? (
        <p className="updates__done">
          You're signed up. We'll email {email} when each phase starts and {lead} {lead === '1' ? 'day' : 'days'} before launch.
        </p>
      ) : (
        <form onSubmit={submit}>
          <p className="updates__intro">
            Receive an email when a new phase starts, a heads-up when launch is close, and when your project goes live.
          </p>
          <label className="updates__timing">
            <span>Choose your custom heads-up timing:</span>
            <span className="updates__timing-row">
              <select value={lead} onChange={(e) => setLead(e.target.value)} aria-label="Days before launch">
                {['1', '2', '3', '5', '7'].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
              days before launch (estimated)
            </span>
          </label>
          <label className="updates__field">
            <span>
              <abbr title="required">*</abbr> Email
            </span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="updates__agree">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /> Yes. I agree to the Terms of Use and
            want email updates about this project.
          </label>
          <button type="submit" className="btn btn--red" disabled={!agreed || !email}>
            Sign up for updates
          </button>
        </form>
      )}
    </section>
  );
}

/** Order details → project summary and milestones. */
export function ProjectDetailsCard({ project, step }: { project: Project; step: number }) {
  const client = clientFor(project);
  return (
    <Card title="Project details" className="card--details">
      <p className="details__name">
        {client.name} · {project.name}
      </p>
      <p className="details__summary">{project.clientSummary}</p>
      <ul className="details__items">
        {project.milestones.map((m) => (
          <li key={m.name}>
            <span className="details__qty">({m.status === 'Done' ? '✓' : m.status === 'In progress' ? '•' : ' '})</span>
            <span className="details__item">{m.name}</span>
            <span className="details__date">
              {m.status === 'Done' ? `Done ${shortDate(m.completedOn ?? m.due)}` : `Due ${shortDate(m.due)}`}
            </span>
          </li>
        ))}
      </ul>
      <dl className="details__totals">
        <dt>Current phase:</dt>
        <dd>{stepName(step)}</dd>
        <dt>Started:</dt>
        <dd>{shortDate(project.startDate)}</dd>
        <dt>Project lead:</dt>
        <dd>{project.owner}</dd>
      </dl>
    </Card>
  );
}

/** Store profile → studio contact details. */
export function StudioCard({ project }: { project: Project }) {
  const client = clientFor(project);
  return (
    <Card title="Your studio" className="card--studio">
      <p>
        Contact {agency.name} with any questions:
        <br />
        {agency.address.slice(1).map((line) => (
          <span key={line}>
            {line}
            <br />
          </span>
        ))}
        {agency.phone}
        <br />
        <a href={`mailto:${agency.email}`}>{agency.email}</a>
      </p>
      <p className="studio__hours">{agency.hours}</p>
      <p className="studio__contact">Your contact: {client.contactName}</p>
    </Card>
  );
}

/** Star rating card. */
export function RatingCard() {
  const [hover, setHover] = useState(0);
  const [rating, setRating] = useState(0);
  const shown = hover || rating;
  return (
    <Card title="Rate your project experience" className="card--rating">
      <div className="rating">
        <p className="rating__question">How is the project going so far?</p>
        <div className="rating__stars" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              aria-pressed={rating === n}
              onMouseEnter={() => setHover(n)}
              onClick={() => setRating(n)}
            >
              <StarIcon filled={n <= shown} />
            </button>
          ))}
        </div>
      </div>
      {rating > 0 && <p className="rating__thanks">Thank you for your feedback!</p>}
    </Card>
  );
}

/** Tracker lookup → find a project and the list of recent projects. */
export function LookupCard() {
  const [email, setEmail] = useState('');
  const [searched, setSearched] = useState<string | null>(null);
  const matchClient = searched ? clients.find((c) => c.contactEmail.toLowerCase() === searched.toLowerCase()) : undefined;
  const list = matchClient ? projects.filter((p) => p.client === matchClient.key) : projects;
  return (
    <Card title="Track your project" className="card--lookup">
      <form
        className="lookup__form"
        onSubmit={(e) => {
          e.preventDefault();
          setSearched(email.trim());
        }}
      >
        <p>Enter your email address below</p>
        <label>
          <span>
            <abbr title="required">*</abbr> Email:
          </span>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <div className="lookup__actions">
          <button type="submit" className="btn btn--red btn--big">
            Track your project
          </button>
          <p className="lookup__terms">By tracking your project you agree to our Terms of Use.</p>
        </div>
      </form>
      {searched !== null && !matchClient && (
        <p className="lookup__error">We couldn't find projects for that email. Showing all recent projects.</p>
      )}
      <div className="lookup__recent">
        <h3>{matchClient ? `Projects for ${matchClient.name}` : 'Recent projects'}</h3>
        <ul>
          {list.map((p) => (
            <li key={p.key}>
              <a href={`#/track/${p.key}`}>
                <strong>{clientFor(p).name}</strong> — {p.name}
                <span className="lookup__phase">{stepName(p.step)}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
