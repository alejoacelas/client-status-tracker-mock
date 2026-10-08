import { useRef, useState } from 'react';
import type { FieldDef, FieldOption, FieldType } from '../data/mock';
import { PALETTE } from '../data/mock';
import { newId } from '../store';
import {
  IconCalendar, IconChevronDown, IconChevronRight, IconClose, IconColumns, IconDrag, IconNumber, IconPeople, IconPlus, IconSingleSelect, IconText,
} from './Icons';
import { MenuItem, MenuSep, Modal, Popover } from './ui';

export const FIELD_TYPES: { type: FieldType; label: string; icon: React.ReactNode }[] = [
  { type: 'single', label: 'Single-select', icon: <IconSingleSelect /> },
  { type: 'date', label: 'Date', icon: <IconCalendar /> },
  { type: 'people', label: 'People', icon: <IconPeople /> },
  { type: 'text', label: 'Text', icon: <IconText /> },
  { type: 'number', label: 'Number', icon: <IconNumber /> },
];

const COLORS = Object.values(PALETTE);

/** The "Field types" dropdown shown under the + column header. */
export function FieldTypeMenu({ anchor, onClose, onPick, onLibrary, libraryCount }: {
  anchor: HTMLElement | null;
  onClose: () => void;
  onPick: (t: FieldType) => void;
  onLibrary: () => void;
  libraryCount: number;
}) {
  return (
    <Popover anchor={anchor} onClose={onClose} align="right">
      <div className="menu field-type-menu">
        <div className="menu-title-row muted">Field types</div>
        {FIELD_TYPES.map((t) => (
          <MenuItem key={t.type} icon={t.icon} onClick={() => onPick(t.type)}>
            {t.label}
          </MenuItem>
        ))}
        <MenuSep />
        <MenuItem icon={<IconColumns />} onClick={onLibrary} right={<IconChevronRight size={12} />} disabled={libraryCount === 0}>
          Choose from library
        </MenuItem>
      </div>
    </Popover>
  );
}

export function FieldModal({ initial, type, onClose, onSave, library, onAddExisting }: {
  initial?: FieldDef;
  type?: FieldType;
  onClose: () => void;
  onSave: (f: FieldDef) => void;
  library?: FieldDef[];
  onAddExisting?: (id: string) => void;
}) {
  const [tab, setTab] = useState<'new' | 'library'>(library && !type && !initial ? 'library' : 'new');
  const [name, setName] = useState(initial?.name ?? '');
  const [ftype, setFtype] = useState<FieldType>((initial?.type as FieldType) ?? type ?? 'single');
  const [desc, setDesc] = useState(initial?.description ?? '');
  const [showDesc, setShowDesc] = useState(!!initial?.description);
  const [options, setOptions] = useState<FieldOption[]>(
    initial?.options ?? [
      { id: newId('o'), name: 'Option 1', color: PALETTE.green },
      { id: newId('o'), name: 'Option 2', color: PALETTE.yellowOrange },
    ],
  );
  const [touched, setTouched] = useState(false);
  const typeRef = useRef<HTMLButtonElement>(null);
  const [typeOpen, setTypeOpen] = useState(false);
  const [colorFor, setColorFor] = useState<{ id: string; el: HTMLElement } | null>(null);
  const isEdit = !!initial;
  const t = FIELD_TYPES.find((x) => x.type === ftype)!;

  const save = () => {
    setTouched(true);
    if (!name.trim()) return;
    onSave({
      id: initial?.id ?? newId('cf'),
      name: name.trim(),
      type: ftype,
      description: desc.trim() || undefined,
      options: ftype === 'single' ? options.filter((o) => o.name.trim()) : undefined,
    });
  };

  return (
    <Modal
      title={isEdit ? 'Edit field' : 'Add field'}
      onClose={onClose}
      width={560}
      footer={
        tab === 'new' ? (
          <>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={!name.trim() && touched}>
              {isEdit ? 'Save changes' : 'Create field'}
            </button>
          </>
        ) : (
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        )
      }
    >
      {!isEdit && (
        <div className="modal-tabs">
          <button className={tab === 'new' ? 'active' : ''} onClick={() => setTab('new')}>Create new</button>
          <button className={tab === 'library' ? 'active' : ''} onClick={() => setTab('library')}>Choose from library</button>
        </div>
      )}
      {tab === 'library' ? (
        <div className="library">
          {(library ?? []).length === 0 && <div className="muted">Every field in the library is already in this portfolio.</div>}
          {(library ?? []).map((f) => (
            <button key={f.id} className="library-item" onClick={() => onAddExisting?.(f.id)}>
              <span className="menu-icon">{FIELD_TYPES.find((x) => x.type === f.type)?.icon ?? <IconText />}</span>
              <span className="grow">{f.name}</span>
              <span className="muted small">{FIELD_TYPES.find((x) => x.type === f.type)?.label ?? 'Built-in'}</span>
              <IconPlus size={12} />
            </button>
          ))}
        </div>
      ) : (
        <div className="form">
          <div className="form-row two">
            <label className="form-field">
              <span className="form-label">Field title <span className="req">*</span></span>
              <input
                autoFocus
                className={`input ${touched && !name.trim() ? 'invalid' : ''}`}
                placeholder="Budget, risk level, account manager..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && ftype !== 'single' && save()}
              />
              {touched && !name.trim() && <span className="form-error">Field title is required</span>}
            </label>
            <div className="form-field">
              <span className="form-label">Field type</span>
              <button ref={typeRef} className="select" disabled={isEdit} onClick={() => setTypeOpen(true)}>
                <span className="select-icon">{t.icon}</span>
                <span className="select-label">{t.label}</span>
                <IconChevronDown size={12} />
              </button>
              {typeOpen && (
                <Popover anchor={typeRef.current} onClose={() => setTypeOpen(false)} matchWidth>
                  <div className="menu">
                    {FIELD_TYPES.map((x) => (
                      <MenuItem key={x.type} icon={x.icon} active={x.type === ftype} onClick={() => { setFtype(x.type); setTypeOpen(false); }}>
                        {x.label}
                      </MenuItem>
                    ))}
                  </div>
                </Popover>
              )}
            </div>
          </div>
          {showDesc ? (
            <label className="form-field">
              <span className="form-label">Description</span>
              <textarea className="input" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What is this field for?" />
            </label>
          ) : (
            <button className="btn-subtle" onClick={() => setShowDesc(true)}>
              <IconPlus size={12} /> Add description
            </button>
          )}
          {ftype === 'single' && (
            <div className="form-field">
              <span className="form-label">Options <span className="req">*</span></span>
              <div className="options-list">
                {options.map((o, i) => (
                  <div key={o.id} className="option-row">
                    <span className="drag-handle"><IconDrag size={12} /></span>
                    <button className="color-dot" style={{ background: o.color }} aria-label="Choose colour" onClick={(e) => setColorFor({ id: o.id, el: e.currentTarget })} />
                    <input
                      className="input"
                      value={o.name}
                      onChange={(e) => setOptions(options.map((x) => (x.id === o.id ? { ...x, name: e.target.value } : x)))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setOptions([...options.slice(0, i + 1), { id: newId('o'), name: '', color: COLORS[(i + 3) % COLORS.length] }, ...options.slice(i + 1)]);
                      }}
                    />
                    <button className="icon-btn" aria-label="Remove option" onClick={() => setOptions(options.filter((x) => x.id !== o.id))}>
                      <IconClose size={12} />
                    </button>
                  </div>
                ))}
                <button className="btn-subtle" onClick={() => setOptions([...options, { id: newId('o'), name: '', color: COLORS[(options.length * 3) % COLORS.length] }])}>
                  <IconPlus size={12} /> Add an option
                </button>
              </div>
              {colorFor && (
                <Popover anchor={colorFor.el} onClose={() => setColorFor(null)}>
                  <div className="color-grid">
                    {COLORS.map((c) => (
                      <button key={c} className="color-dot lg" style={{ background: c }} aria-label={c} onClick={() => { setOptions(options.map((x) => (x.id === colorFor.id ? { ...x, color: c } : x))); setColorFor(null); }} />
                    ))}
                  </div>
                </Popover>
              )}
            </div>
          )}
          <p className="muted small">This field is added to the current portfolio and saved to the field library so other portfolios can use it.</p>
        </div>
      )}
    </Modal>
  );
}
