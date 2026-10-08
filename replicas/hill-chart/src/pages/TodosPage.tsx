import { useState } from 'react';
import { HILL_COLORS, PEOPLE, PROJECTS, type PersonKey, type TodoList } from '../data';
import { dueLabel } from '../format';
import { useStore } from '../store';
import { Avatar, Screen, ToolBar, usePopover } from '../components/Common';
import { HillPanel } from '../components/HillPanel';
import { Calendar, Check, ChevronDown, Dots, Note, Plus } from '../components/Icons';

export function Pie({ list, size = 20 }: { list: TodoList; size?: number }) {
  const total = list.todos.length;
  const done = list.todos.filter((t) => t.done).length;
  const pct = total ? (done / total) * 100 : 0;
  const c = HILL_COLORS[list.color];
  return (
    <span
      className="pie"
      style={{
        width: size,
        height: size,
        background:
          pct >= 100 ? c : `conic-gradient(${c} 0 ${pct}%, color-mix(in srgb, ${c} 35%, white) 0)`,
      }}
      aria-label={`${done} of ${total} completed`}
    />
  );
}

function ListMenu({ projectKey, list }: { projectKey: string; list: TodoList }) {
  const { dispatch } = useStore();
  const { open, setOpen, ref } = usePopover();
  return (
    <div className="listmenu" ref={ref}>
      <button className="listmenu__button" aria-label={`Options for ${list.name}`} aria-expanded={open} onClick={() => setOpen(!open)}>
        <Dots />
      </button>
      {open && (
        <div className="listmenu__menu" role="menu">
          <button role="menuitem" onClick={() => setOpen(false)}>Edit</button>
          <button role="menuitem" onClick={() => setOpen(false)}>Copy…</button>
          <hr />
          <button
            role="menuitem"
            onClick={() => {
              dispatch({ type: 'setTracked', project: projectKey, listId: list.id, tracked: !list.tracked });
              setOpen(false);
            }}
          >
            {list.tracked ? 'Stop tracking on the Hill Chart' : 'Track this on the Hill Chart'}
          </button>
        </div>
      )}
    </div>
  );
}

function AddTodo({ projectKey, listId, people }: { projectKey: string; listId: string; people: PersonKey[] }) {
  const { dispatch } = useStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState<string>('');
  const [due, setDue] = useState('');
  if (!open)
    return (
      <button className="todo-add" onClick={() => setOpen(true)}>
        Add a to-do
      </button>
    );
  return (
    <form
      className="todo-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        dispatch({ type: 'addTodo', project: projectKey, listId, title: title.trim(), assignee: (assignee || undefined) as PersonKey | undefined, due: due || undefined });
        setTitle('');
      }}
    >
      <span className="check" aria-hidden="true" />
      <div className="todo-form__fields">
        <input autoFocus placeholder="Describe this to-do…" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="To-do" />
        <div className="todo-form__row">
          <label>
            Assigned to
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              <option value="">Type names to assign…</option>
              {people.map((k) => (
                <option key={k} value={k}>
                  {PEOPLE[k].name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Due on
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </label>
        </div>
        <div className="todo-form__actions">
          <button className="btn btn--primary" type="submit" disabled={!title.trim()}>
            Add this to-do
          </button>
          <button className="btn btn--plain" type="button" onClick={() => setOpen(false)}>
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

function TodoListBlock({ projectKey, list, filter }: { projectKey: string; list: TodoList; filter: string }) {
  const { dispatch } = useStore();
  const project = PROJECTS.find((p) => p.key === projectKey)!;
  const [showDone, setShowDone] = useState(false);
  const match = (s: string) => !filter || s.toLowerCase().includes(filter.toLowerCase());
  const open = list.todos.filter((t) => !t.done && match(t.title));
  const done = list.todos.filter((t) => t.done && match(t.title));
  if (filter && open.length + done.length === 0) return null;

  const row = (t: (typeof list.todos)[number]) => (
    <li key={t.id} className={t.done ? 'todo todo--done' : 'todo'}>
      <button
        className={`check${t.done ? ' check--on' : ''}`}
        role="checkbox"
        aria-checked={t.done}
        aria-label={t.title}
        onClick={() => dispatch({ type: 'toggleTodo', project: projectKey, listId: list.id, todoId: t.id })}
      >
        {t.done && <Check />}
      </button>
      <span className="todo__text">
        <span className="todo__title">{t.title}</span>{' '}
        {(t.assignee || t.due || t.notes || t.comments) && (
          <span className="task">
            {t.comments ? <span className="task__balloon">{t.comments}</span> : null}
            {t.assignee && (
              <span className="task__person">
                <Avatar who={t.assignee} size={16} />
                {PEOPLE[t.assignee].short}
              </span>
            )}
            {t.due && (
              <span className="task__date">
                <Calendar width={14} height={14} />
                {dueLabel(t.due)}
              </span>
            )}
            {t.notes && <Note width={14} height={14} />}
          </span>
        )}
      </span>
    </li>
  );

  return (
    <section className="todolist" id={list.id}>
      <div className="todolist__title">
        <Pie list={list} />
        <h2>{list.name}</h2>
        <ListMenu projectKey={projectKey} list={list} />
      </div>
      {list.description && <p className="todolist__desc">{list.description}</p>}
      <ul className="todo-items">{open.map(row)}</ul>
      {done.length > 0 && (
        <>
          <button className={`todo-completed${showDone ? ' todo-completed--open' : ''}`} onClick={() => setShowDone(!showDone)} aria-expanded={showDone}>
            <span className="todo-completed__box" aria-hidden="true">
              <ChevronDown width={14} height={14} strokeWidth={2.4} />
            </span>
            {done.length} completed
          </button>
          {showDone && <ul className="todo-items todo-items--done">{done.map(row)}</ul>}
        </>
      )}
      <AddTodo projectKey={projectKey} listId={list.id} people={project.people} />
    </section>
  );
}

function NewListForm({ projectKey, onClose }: { projectKey: string; onClose: () => void }) {
  const { dispatch } = useStore();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [tracked, setTracked] = useState(true);
  return (
    <form
      className="newlist"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        dispatch({ type: 'addList', project: projectKey, name: name.trim(), description: desc.trim(), tracked });
        onClose();
      }}
    >
      <div className="newlist__head">
        <input className="newlist__name" placeholder="Name this list…" value={name} onChange={(e) => setName(e.target.value)} autoFocus aria-label="List name" />
        <span className="newlist__template">Use a to-do list template…</span>
      </div>
      <div className="newlist__body">
        <textarea placeholder="Add extra details or attach a file…" value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} aria-label="Details" />
        <div className="newlist__actions">
          <button className="btn btn--primary" type="submit" disabled={!name.trim()}>
            Add this list
          </button>
          <button className="btn btn--plain" type="button" onClick={onClose}>
            Cancel
          </button>
          <label className="newlist__track">
            <input type="checkbox" checked={tracked} onChange={(e) => setTracked(e.target.checked)} />
            Track this list on the Hill Chart
          </label>
        </div>
      </div>
    </form>
  );
}

export function TodosPage({ projectKey }: { projectKey: string }) {
  const { state } = useStore();
  const project = PROJECTS.find((p) => p.key === projectKey)!;
  const lists = state.lists[projectKey] ?? [];
  const [newList, setNewList] = useState(false);
  const [filter, setFilter] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const viewAs = usePopover();
  return (
    <Screen tint={project.tint} bar={<ToolBar projectKey={projectKey} />}>
      <div className="page">
        <h1 className="page__heading">To-dos</h1>
        <div className="filters">
          <button className="btn btn--new" onClick={() => setNewList(true)}>
            <Plus width={18} height={18} strokeWidth={2.4} /> New list
          </button>
          <div className="viewas" ref={viewAs.ref}>
            <button className="filter filter--menu" onClick={() => viewAs.setOpen(!viewAs.open)} aria-expanded={viewAs.open}>
              View as <ChevronDown width={14} height={14} />
            </button>
            {viewAs.open && (
              <div className="listmenu__menu viewas__menu" role="menu">
                <button role="menuitem" onClick={() => viewAs.setOpen(false)}>✓ List</button>
                <button role="menuitem" onClick={() => viewAs.setOpen(false)}>Columns</button>
              </div>
            )}
          </div>
          {filterOpen ? (
            <input className="filter filter--input" autoFocus placeholder="Filter…" value={filter} onChange={(e) => setFilter(e.target.value)} onBlur={() => !filter && setFilterOpen(false)} aria-label="Filter to-dos" />
          ) : (
            <button className="filter" onClick={() => setFilterOpen(true)}>
              Filter…
            </button>
          )}
        </div>
        {newList && <NewListForm projectKey={projectKey} onClose={() => setNewList(false)} />}
        <HillPanel projectKey={projectKey} />
        {lists.map((l) => (
          <TodoListBlock key={l.id} projectKey={projectKey} list={l} filter={filter} />
        ))}
      </div>
    </Screen>
  );
}
