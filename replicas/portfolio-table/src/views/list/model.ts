import type { Data, FieldDef, FilterRule, ItemRef, PortfolioView, SortRule, StatusKey } from '../../data/mock';
import { TODAY } from '../../data/mock';
import { diffDays } from '../../lib/dates';
import { STATUS, STATUS_ORDER } from '../../lib/status';
import { getField, getPerson, getPortfolio, itemInfo, itemStatus, type ItemInfo } from '../../store';

export interface Row {
  ref: ItemRef;
  info: ItemInfo;
  depth: number;
  parentId: string; // portfolio that directly contains this row
  index: number; // index in parent's items (for manual reordering)
  status: StatusKey | null;
  statusDate: string | null;
  expandable: boolean;
}

export const FIELD_LABEL = (data: Data, fieldId: string, view?: PortfolioView) => {
  if (fieldId === 'name') return 'Name';
  if (fieldId === 'progress') return view?.progressType === 'milestone' ? 'Milestones' : 'Task progress';
  return getField(data, fieldId)?.name ?? fieldId;
};

export function makeRow(data: Data, ref: ItemRef, depth: number, parentId: string, index: number): Row | null {
  const info = itemInfo(data, ref);
  if (!info) return null;
  const st = itemStatus(data, ref);
  return {
    ref, info, depth, parentId, index,
    status: st.status, statusDate: st.date,
    expandable: ref.type === 'portfolio' && (getPortfolio(data, ref.id)?.items.length ?? 0) > 0,
  };
}

/** Sort/group key for a row and field. */
export function sortValue(data: Data, row: Row, fieldId: string): string | number | null {
  const v = data.values[row.ref.id] ?? {};
  switch (fieldId) {
    case 'name':
      return row.info.name.toLowerCase();
    case 'status':
      return row.status ? STATUS_ORDER.indexOf(row.status) : null;
    case 'progress':
      return row.info.progress;
    case 'milestones': {
      const t = row.info.milestones.length;
      return t ? row.info.milestones.filter((m) => m.completedOn).length / t : null;
    }
    case 'date':
      return row.info.dueDate;
    case 'start':
      return row.info.startDate;
    case 'owner':
      return getPerson(data, row.info.ownerId)?.name ?? null;
    case 'remaining':
      return row.info.dueDate ? diffDays(TODAY, row.info.dueDate) : null;
    case 'duration':
      return row.info.startDate && row.info.dueDate ? diffDays(row.info.startDate, row.info.dueDate) : null;
    default: {
      const f = getField(data, fieldId);
      const raw = v[fieldId];
      if (raw === undefined || raw === null || raw === '') return null;
      if (f?.type === 'single') return f.options?.findIndex((o) => o.id === raw) ?? null;
      if (f?.type === 'number') return Number(raw);
      if (f?.type === 'people') return getPerson(data, String(raw))?.name ?? null;
      return String(raw).toLowerCase();
    }
  }
}

export function compareRows(data: Data, sorts: SortRule[]) {
  return (a: Row, b: Row) => {
    for (const s of sorts) {
      const av = sortValue(data, a, s.fieldId);
      const bv = sortValue(data, b, s.fieldId);
      if (av === bv) continue;
      // Empty values always sort last, as in the original.
      if (av === null) return 1;
      if (bv === null) return -1;
      const c = av < bv ? -1 : 1;
      return s.dir === 'asc' ? c : -c;
    }
    return a.index - b.index;
  };
}

/** Filterable fields and their choices. */
export function filterChoices(data: Data, fieldId: string): { id: string; label: string; color?: string }[] {
  if (fieldId === 'status') return [...STATUS_ORDER.map((k) => ({ id: k, label: STATUS[k].label, color: STATUS[k].dot })), { id: 'none', label: 'No status' }];
  if (fieldId === 'owner') return data.people.map((p) => ({ id: p.id, label: p.name }));
  if (fieldId === 'date') return [
    { id: 'overdue', label: 'Overdue' },
    { id: 'this_month', label: 'Due within 30 days' },
    { id: 'later', label: 'Due later' },
    { id: 'none', label: 'No due date' },
  ];
  const f = getField(data, fieldId);
  if (f?.type === 'single') return [...(f.options ?? []).map((o) => ({ id: o.id, label: o.name, color: o.color })), { id: 'none', label: 'No value' }];
  if (f?.type === 'people') return data.people.map((p) => ({ id: p.id, label: p.name }));
  return [];
}

export function filterableFields(data: Data, view: PortfolioView): FieldDef[] {
  const ids = ['status', 'owner', 'date', ...view.columns.map((c) => c.fieldId)];
  const out: FieldDef[] = [];
  for (const id of ids) {
    const f = getField(data, id);
    if (!f || out.includes(f)) continue;
    if (id === 'status' || id === 'owner' || id === 'date' || f.type === 'single' || f.type === 'people') out.push(f);
  }
  return out;
}

export function matchesFilter(data: Data, row: Row, rule: FilterRule): boolean {
  if (!rule.value) return true;
  switch (rule.fieldId) {
    case 'status':
      if (rule.value === '__incomplete') return row.status !== 'complete' && row.status !== 'dropped';
      return rule.value === 'none' ? !row.status : row.status === rule.value;
    case 'owner':
      return row.info.ownerId === rule.value;
    case 'date': {
      const d = row.info.dueDate;
      if (rule.value === 'none') return !d;
      if (!d) return false;
      const days = diffDays(TODAY, d);
      if (rule.value === 'overdue') return days < 0 && row.status !== 'complete';
      if (rule.value === 'this_month') return days >= 0 && days <= 30;
      return days > 30;
    }
    default: {
      const raw = data.values[row.ref.id]?.[rule.fieldId];
      if (rule.value === 'none') return raw === undefined || raw === null || raw === '';
      return raw === rule.value;
    }
  }
}

/** Grouping: returns a stable key and label for a row. */
export function groupKey(data: Data, row: Row, fieldId: string): { key: string; order: number } {
  if (fieldId === 'status') {
    return row.status ? { key: row.status, order: STATUS_ORDER.indexOf(row.status) } : { key: 'none', order: 99 };
  }
  if (fieldId === 'owner') {
    const i = data.people.findIndex((p) => p.id === row.info.ownerId);
    return i >= 0 ? { key: data.people[i].id, order: i } : { key: 'none', order: 99 };
  }
  const f = getField(data, fieldId);
  const raw = data.values[row.ref.id]?.[fieldId];
  if (f?.type === 'single') {
    const i = f.options?.findIndex((o) => o.id === raw) ?? -1;
    return i >= 0 ? { key: String(raw), order: i } : { key: 'none', order: 99 };
  }
  return raw ? { key: String(raw), order: 0 } : { key: 'none', order: 99 };
}

export function groupableFields(data: Data, view: PortfolioView): FieldDef[] {
  const out: FieldDef[] = [];
  for (const id of ['status', 'owner', ...view.columns.map((c) => c.fieldId)]) {
    const f = getField(data, id);
    if (f && !out.includes(f) && (id === 'status' || id === 'owner' || f.type === 'single')) out.push(f);
  }
  return out;
}

export const COLUMN_ICON_KIND = (data: Data, fieldId: string): string => {
  const f = getField(data, fieldId);
  if (!f) return 'text';
  if (f.type !== 'builtin') return f.type;
  return ({ status: 'status', progress: 'progress', milestones: 'milestone', date: 'date', start: 'date', owner: 'people', remaining: 'clock', duration: 'clock' } as Record<string, string>)[fieldId] ?? 'text';
};
