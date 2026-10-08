import { useState } from 'react';
import { TODAY } from '../data/mock';
import { fmtDate, MONTHS_LONG, parse, toIso } from '../lib/dates';
import { IconChevronLeft, IconChevronRight, IconClose } from './Icons';

/** Start/due date picker modelled on the original's calendar popover. */
export function DatePicker({
  start,
  due,
  onChange,
  onDone,
  allowStart = true,
}: {
  start: string | null;
  due: string | null;
  onChange: (start: string | null, due: string | null) => void;
  onDone: () => void;
  allowStart?: boolean;
}) {
  const [active, setActive] = useState<'start' | 'due'>(allowStart && !start && !due ? 'start' : 'due');
  const base = parse(due ?? start ?? TODAY);
  const [month, setMonth] = useState(new Date(base.getFullYear(), base.getMonth(), 1));

  const first = new Date(month);
  const offset = first.getDay();
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) days.push(new Date(month.getFullYear(), month.getMonth(), i - offset + 1));

  const pick = (iso: string) => {
    if (active === 'start') {
      const nd = due && due < iso ? null : due;
      onChange(iso, nd);
      setActive('due');
    } else {
      if (start && iso < start) onChange(iso, start);
      else onChange(start, iso);
    }
  };

  return (
    <div className="datepicker">
      <div className="dp-fields">
        {allowStart && (
          <button className={`dp-field ${active === 'start' ? 'active' : ''}`} onClick={() => setActive('start')}>
            <span className={start ? '' : 'placeholder'}>{start ? fmtDate(start, { relative: false }) : 'Start date'}</span>
            {start && (
              <span
                className="dp-clear"
                role="button"
                aria-label="Clear start date"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null, due);
                }}
              >
                <IconClose size={10} />
              </span>
            )}
          </button>
        )}
        <button className={`dp-field ${active === 'due' ? 'active' : ''}`} onClick={() => setActive('due')}>
          <span className={due ? '' : 'placeholder'}>{due ? fmtDate(due, { relative: false }) : 'Due date'}</span>
          {due && (
            <span
              className="dp-clear"
              role="button"
              aria-label="Clear due date"
              onClick={(e) => {
                e.stopPropagation();
                onChange(start, null);
              }}
            >
              <IconClose size={10} />
            </span>
          )}
        </button>
      </div>
      <div className="dp-head">
        <span className="dp-month">
          {MONTHS_LONG[month.getMonth()]} {month.getFullYear()}
        </span>
        <span>
          <button className="icon-btn sm" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
            <IconChevronLeft />
          </button>
          <button className="icon-btn sm" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
            <IconChevronRight />
          </button>
        </span>
      </div>
      <div className="dp-grid">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <span key={d} className="dp-dow">
            {d}
          </span>
        ))}
        {days.map((d) => {
          const iso = toIso(d);
          const inMonth = d.getMonth() === month.getMonth();
          const sel = iso === start || iso === due;
          const inRange = start && due && iso > start && iso < due;
          return (
            <button
              key={iso}
              className={`dp-day ${inMonth ? '' : 'out'} ${sel ? 'sel' : ''} ${inRange ? 'range' : ''} ${iso === TODAY ? 'today' : ''}`}
              onClick={() => pick(iso)}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
      <div className="dp-foot">
        <button className="btn-link" onClick={() => onChange(null, null)}>
          Clear all
        </button>
        <button className="btn btn-secondary sm" onClick={onDone}>
          Done
        </button>
      </div>
    </div>
  );
}
