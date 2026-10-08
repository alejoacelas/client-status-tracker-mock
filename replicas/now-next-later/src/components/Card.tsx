import { Check, Zap, Dumbbell } from 'lucide-react';
import type { DisplayOptions, Initiative } from '../types';
import { chipDate, ideasDone, longDate, plural, productById, TODAY } from '../util';
import { Avatar, ObjectiveTag } from './bits';
import { CalendarGlyph, ProgressDonut } from './Icons';

const stageClass = (s: string) =>
  s === 'Released' ? 'is-released' : s === 'In Development' ? 'is-dev' : s === 'In Review' ? 'is-review' : '';

interface Props {
  item: Initiative;
  all: Initiative[];
  opts: DisplayOptions;
  mode?: 'roadmap' | 'completed' | 'candidate';
  candidateNumber?: number;
  multiGroup?: boolean;
  dragging?: boolean;
  onOpen: (id: string) => void;
  onPointerDown?: (e: React.PointerEvent, item: Initiative) => void;
}

export function Card({ item, all, opts, mode = 'roadmap', candidateNumber, multiGroup, dragging, onOpen, onPointerDown }: Props) {
  const product = productById(item.product);
  const collapsed = opts.preset === 'collapsed';
  const showDesc = opts.description && !collapsed;
  const blockers = (item.blockedBy || [])
    .map((id) => all.find((x) => x.id === id))
    .filter((x): x is Initiative => !!x && x.column !== 'completed');
  const overdue = item.targetDate && mode === 'roadmap' && new Date(item.targetDate + 'T23:00:00') < TODAY;
  const done = ideasDone(item);
  const feedback = item.updates.length;
  const ideasLine =
    item.ideas.length === 0 && feedback === 0
      ? ''
      : `${plural(item.ideas.length, 'Idea')} with ${feedback === 1 ? '1 piece' : `${feedback} pieces`} of Linked Feedback`;

  return (
    <article
      className={`card card--${mode === 'completed' ? 'complete' : mode}${dragging ? ' is-dragging-source' : ''}`}
      data-card-id={item.id}
      onPointerDown={onPointerDown ? (e) => onPointerDown(e, item) : undefined}
      onClick={() => onOpen(item.id)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen(item.id))}
      tabIndex={0}
      aria-label={item.title}
    >
      {multiGroup && <div className="multi-group-note">This initiative is displayed in multiple objective groups</div>}
      {mode === 'completed' && item.completedOn && (
        <div className="completed-on">
          <span className="check-circle">
            <Check size={15} strokeWidth={3} />
          </span>
          Completed on {longDate(item.completedOn)}
        </div>
      )}
      {mode === 'candidate' && candidateNumber !== undefined && (
        <div className="candidate-label">
          <i>{candidateNumber}</i> Candidate
        </div>
      )}
      {opts.objectives && item.objectives.length > 0 && (
        <ul className="objective-tags">
          {item.objectives.map((o) => (
            <ObjectiveTag key={o} id={o} />
          ))}
        </ul>
      )}
      {opts.productName && (
        <div className="card__product">
          <span className="product-image product-image--sm" style={{ background: product.color }}>
            {product.name[0]}
          </span>
          {product.name}
        </div>
      )}
      <h3 className="card__title">{item.title}</h3>
      {showDesc && item.description && (
        <div className="card__desc">
          <p>{item.description}</p>
        </div>
      )}
      {mode === 'completed' && showDesc && item.outcome && (
        <div className="card__desc card__outcome">
          <strong>Outcome</strong>
          {item.outcome}
        </div>
      )}
      {!collapsed && (blockers.length > 0 || item.externalDependency) && (
        <div className="blocked-by">
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
            <rect x="1" y="1" width="14" height="14" rx="3" fill="currentColor" />
            <path d="M4.5 8h7" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>
            Blocked by:{' '}
            {blockers.map((b, n) => (
              <span key={b.id}>
                {n > 0 && ', '}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpen(b.id);
                  }}
                >
                  {b.title}
                </a>
              </span>
            ))}
            {item.externalDependency && (
              <span>
                {blockers.length > 0 && ', '}
                {item.externalDependency}
              </span>
            )}
          </span>
        </div>
      )}
      {!collapsed && ((opts.targetDate && item.targetDate && mode !== 'completed') || (opts.tags && item.tags.length > 0)) && (
        <div className="card__meta">
          {opts.targetDate && item.targetDate && mode !== 'completed' && (
            <span className={`date-chip${overdue ? ' is-overdue' : ''}`} title={overdue ? 'Target date has passed' : 'Target date'}>
              <CalendarGlyph />
              {chipDate(item.targetDate)}
            </span>
          )}
          {opts.tags &&
            item.tags.map((t) => (
              <span key={t} className={`tag-pill${t.startsWith('⚠') ? ' tag-pill--alert' : ''}`}>
                {t}
              </span>
            ))}
        </div>
      )}
      {opts.preset === 'detailed' && opts.ideas && item.ideas.length > 0 && (
        <ul className="card__ideas">
          {item.ideas.map((idea) => (
            <li key={idea.id}>
              <i className={`idea-bubble ${stageClass(idea.stage)}`} />
              <span className="idea-title">
                <span className="idea-id">#{idea.id}</span>
                {idea.title}
              </span>
              <span className="idea-stage">{idea.stage}</span>
            </li>
          ))}
        </ul>
      )}
      <footer className="card__foot">
        <div className="card__foot-left">
          {item.ideas.length > 0 && !collapsed && (
            <span className="chart-icon has-tip">
              <ProgressDonut done={done} total={item.ideas.length} />
              <span className="tip">
                {done} of {plural(item.ideas.length, 'idea')} released
              </span>
            </span>
          )}
          {opts.owners && !collapsed && item.owners.length > 0 && (
            <span className="card__owners">
              {item.owners.map((o) => (
                <Avatar key={o} id={o} size="sm" />
              ))}
            </span>
          )}
          {opts.preset === 'expanded' && (
            <span className="score-icons" title={`Impact ${item.impact}/10, effort ${item.effort}/10`}>
              <span>
                <Zap size={13} /> {item.impact}
              </span>
              <span>
                <Dumbbell size={13} /> {item.effort}
              </span>
            </span>
          )}
          <span>
            {ideasLine}
            {item.tags.length > 0 && (collapsed || !opts.tags) ? ` ${plural(item.tags.length, 'Tag')}` : ''}
          </span>
        </div>
        {opts.visibility && <div className="card__foot-right">{item.visibility === 'public' ? 'Public' : 'Internal'}</div>}
      </footer>
    </article>
  );
}
