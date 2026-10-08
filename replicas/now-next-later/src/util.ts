import data from './data/roadmap.json';
import type { RoadmapData, Initiative, Filters, Product } from './types';

export const DATA = data as unknown as RoadmapData;
export const TODAY = new Date(DATA.today + 'T12:00:00');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const parse = (iso: string) => new Date(iso.length <= 10 ? iso + 'T12:00:00' : iso);

/** "17 Oct '26", the card target-date chip format. */
export const chipDate = (iso: string) => {
  const d = parse(iso);
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
};
/** "25 Sep 2026" */
export const longDate = (iso: string) => {
  const d = parse(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
/** "30 Sep" in the current year, otherwise "15 Dec 2021" (published widget style). */
export const shortDate = (iso: string) => {
  const d = parse(iso);
  return d.getFullYear() === TODAY.getFullYear() ? `${d.getDate()} ${MONTHS[d.getMonth()]}` : longDate(iso);
};
/** "23 Sep 2022, 16:28" */
export const stampDate = (iso: string) => {
  const d = parse(iso);
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
export const quarter = (iso: string) => {
  const d = parse(iso);
  return `Q${Math.floor(d.getMonth() / 3) + 1} '${String(d.getFullYear()).slice(2)}`;
};
export const monthsAgo = (iso: string) => {
  const d = parse(iso);
  return (TODAY.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
};

export const productById = (id: string): Product => DATA.products.find((p) => p.id === id)!;
export const lineById = (id: string) => DATA.productLines.find((l) => l.id === id)!;
export const objectiveById = (id: string) => DATA.objectives.find((o) => o.id === id);
export const staffById = (id: string) => DATA.staff.find((s) => s.id === id);

export const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`;

export const emptyFilters = (): Filters => ({
  search: '', objectives: [], owners: [], lines: [], products: [], columns: [], tags: [], visibility: '',
});
export const countFilters = (f: Filters) =>
  (f.search ? 1 : 0) + f.objectives.length + f.owners.length + f.lines.length + f.products.length +
  f.columns.length + f.tags.length + (f.visibility ? 1 : 0);

export function matches(i: Initiative, f: Filters) {
  if (f.search && !i.title.toLowerCase().includes(f.search.toLowerCase())) return false;
  if (f.objectives.length && !f.objectives.some((o) => (o === '__none' ? i.objectives.length === 0 : i.objectives.includes(o)))) return false;
  if (f.owners.length && !f.owners.some((o) => i.owners.includes(o))) return false;
  if (f.lines.length && !f.lines.includes(productById(i.product).line)) return false;
  if (f.products.length && !f.products.includes(i.product)) return false;
  if (f.columns.length && !(f.columns as string[]).includes(i.column)) return false;
  if (f.tags.length && !f.tags.some((t) => i.tags.includes(t))) return false;
  if (f.visibility && i.visibility !== f.visibility) return false;
  return true;
}

export const ideasDone = (i: Initiative) => i.ideas.filter((x) => x.stage === 'Released').length;

export const byOrder = (a: Initiative, b: Initiative) => a.order - b.order;
