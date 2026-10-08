// All mock content for the replica lives in this file.
// Source: ../../seed/seed.json (fictional agency "Fieldwork Studio").
// Mapping: one portfolio per client inside a top-level "All clients" portfolio;
// seed projects become portfolio rows; seed updates become project status
// updates (Blocked -> Off track, Done -> Complete). Portfolio-level status
// updates are written from the same seed facts.

export type StatusKey = 'on_track' | 'at_risk' | 'off_track' | 'on_hold' | 'complete' | 'dropped';
export type ItemRef = { type: 'project' | 'portfolio'; id: string };

export interface Person {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: string;
  email?: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  ownerId: string;
  startDate: string | null;
  dueDate: string | null;
  progress: number; // task progress, 0-100
  description: string;
  clientId: string;
  archived?: boolean;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  dueDate: string;
  completedOn?: string;
}

export interface Portfolio {
  id: string;
  name: string;
  color: string;
  ownerId: string;
  items: ItemRef[];
  description: string;
  starred: boolean;
  memberIds: string[];
  startDate?: string | null;
  dueDate?: string | null;
}

export type HighlightKind =
  | 'milestones_completed'
  | 'milestones_upcoming'
  | 'milestones_overdue'
  | 'key_metrics'
  | 'projects_on_track'
  | 'projects_at_risk'
  | 'projects_off_track'
  | 'projects_on_hold'
  | 'portfolio_health'
  | 'projects_by_priority'
  | 'projects_by_owner';

export interface Highlight {
  id: string;
  kind: HighlightKind;
  asOf: string; // ISO date the snapshot refers to
}

export type SectionKind = 'summary' | 'accomplished' | 'next' | 'metrics';

export interface UpdateSection {
  id: string;
  kind: SectionKind;
  title: string;
  text: string;
  highlights: Highlight[];
}

export interface StatusComment {
  id: string;
  authorId: string;
  date: string;
  text: string;
}

export interface StatusUpdate {
  id: string;
  parent: ItemRef;
  title: string;
  status: StatusKey;
  authorId: string;
  date: string; // ISO date
  isPrivate: boolean;
  source?: string;
  sections: UpdateSection[];
  fields?: string[]; // which project fields the update shows; defaults to owner and dates
  likes: string[];
  comments: StatusComment[];
}

export type FieldType = 'single' | 'text' | 'number' | 'date' | 'people';

export interface FieldOption {
  id: string;
  name: string;
  color: string;
}

export interface FieldDef {
  id: string;
  name: string;
  type: FieldType | 'builtin';
  options?: FieldOption[];
  description?: string;
}

export interface ColumnState {
  fieldId: string;
  width: number;
  hidden?: boolean;
}

export interface SortRule {
  fieldId: string;
  dir: 'asc' | 'desc';
}

export interface FilterRule {
  id: string;
  fieldId: string;
  value: string;
}

export interface PortfolioView {
  columns: ColumnState[];
  sorts: SortRule[];
  filters: FilterRule[];
  groupBy: string | null;
  progressType: 'task' | 'milestone';
  nameWidth: number;
  charts?: string[]; // dashboard chart ids, in order
}

export interface Data {
  workspace: string;
  today: string;
  meId: string;
  people: Person[];
  projects: Project[];
  milestones: Milestone[];
  portfolios: Portfolio[];
  rootPortfolioId: string;
  updates: StatusUpdate[];
  fields: FieldDef[];
  values: Record<string, Record<string, string | number | null>>; // itemId -> fieldId -> value
  views: Record<string, PortfolioView>; // portfolioId -> view
}

// Fixed "today" so the demo always reads the same way as the seed (Oct 2026).
export const TODAY = '2026-10-08';

// Asana-style colour palette for project colours, pills and avatars.
export const PALETTE = {
  red: '#f06a6a',
  orange: '#ec8d71',
  yellowOrange: '#f1bd6c',
  yellow: '#f8df72',
  yellowGreen: '#aecf55',
  green: '#5da283',
  blueGreen: '#4ecbc4',
  aqua: '#9ee7e3',
  blue: '#4573d2',
  indigo: '#8d84e8',
  purple: '#b36bd4',
  magenta: '#f9aaef',
  hotPink: '#f26fb2',
  pink: '#fc979a',
  coolGray: '#6d6e6f',
} as const;

const people: Person[] = [
  { id: 'maya', name: 'Maya Chen', initials: 'MC', color: PALETTE.yellowOrange, role: 'Project manager', email: 'maya@fieldwork.example' },
  { id: 'tom', name: 'Tom Okafor', initials: 'TO', color: PALETTE.blueGreen, role: 'Development lead', email: 'tom@fieldwork.example' },
  { id: 'priya', name: 'Priya Nair', initials: 'PN', color: PALETTE.magenta, role: 'Design lead', email: 'priya@fieldwork.example' },
];

const clients = [
  { key: 'harbor', name: 'Harbor & Pine Coffee', contact: 'Dana Ruiz', color: PALETTE.orange },
  { key: 'meridian', name: 'Meridian Family Clinic', contact: 'Dr. Sam Patel', color: PALETTE.blueGreen },
  { key: 'lumen', name: 'Lumen Books', contact: 'Iris Novak', color: PALETTE.indigo },
  { key: 'atlas', name: 'Atlas Robotics', contact: 'Kofi Mensah', color: PALETTE.green },
];

const projects: Project[] = [
  {
    id: 'harbor-shop', name: 'Online shop rebuild', color: PALETTE.yellowOrange, ownerId: 'tom', clientId: 'harbor',
    startDate: '2026-08-04', dueDate: '2026-11-14', progress: 60,
    description: "The product catalogue is fully imported. We're now building checkout and payments, on schedule for a mid-November launch.",
  },
  {
    id: 'meridian-portal', name: 'Patient intake portal', color: PALETTE.blueGreen, ownerId: 'maya', clientId: 'meridian',
    startDate: '2026-07-14', dueDate: '2026-10-30', progress: 70,
    description: 'Forms and the patient dashboard are built. Connecting to your records system is waiting on sandbox access from your EHR vendor, which puts the 30 October go-live at risk.',
  },
  {
    id: 'lumen-brand', name: 'Brand refresh', color: PALETTE.purple, ownerId: 'priya', clientId: 'lumen',
    startDate: '2026-08-18', dueDate: '2026-10-24', progress: 45,
    description: "Round two logo concepts were shared on 25 September. We need your team's feedback before we can start the brand guidelines.",
  },
  {
    id: 'atlas-site', name: 'Investor website', color: PALETTE.green, ownerId: 'maya', clientId: 'atlas',
    startDate: '2026-06-30', dueDate: '2026-09-19', progress: 100,
    description: 'Launched on 19 September. Analytics are live and the handoff documentation is in your shared folder.',
  },
  {
    id: 'atlas-docs', name: 'Developer docs migration', color: PALETTE.blue, ownerId: 'tom', clientId: 'atlas',
    startDate: '2026-09-29', dueDate: '2026-12-12', progress: 10,
    description: "We're auditing the 140 existing docs pages and mapping them to the new structure. Expect the migration plan by 16 October.",
  },
];

const internalNotes: Record<string, string> = {
  'harbor-shop': "Stripe account is in Dana's name; she needs to add Tom as a developer before we can test live payments.",
  'meridian-portal': "CareStack still hasn't issued sandbox API keys. Escalate to Sam if nothing arrives by Thursday 8 Oct.",
  'lumen-brand': 'Iris said the board meets 9 Oct. Due date will slip a week if feedback lands after that.',
  'atlas-site': 'Invoice for final 30% sent 22 Sep.',
  'atlas-docs': 'Old docs use a custom Markdown dialect; budget extra time for the converter.',
};

const seedMilestones: [string, string, string, string?][] = [
  ['harbor-shop', 'Discovery workshop', '2026-08-08', '2026-08-08'],
  ['harbor-shop', 'Design sign-off', '2026-09-05', '2026-09-04'],
  ['harbor-shop', 'Product catalogue import', '2026-09-26', '2026-09-25'],
  ['harbor-shop', 'Checkout and payments', '2026-10-17'],
  ['harbor-shop', 'Content load and QA', '2026-10-31'],
  ['harbor-shop', 'Launch', '2026-11-14'],
  ['meridian-portal', 'Requirements sign-off', '2026-07-25', '2026-07-24'],
  ['meridian-portal', 'Form designs approved', '2026-08-22', '2026-08-26'],
  ['meridian-portal', 'EHR integration', '2026-10-10'],
  ['meridian-portal', 'Accessibility audit', '2026-10-20'],
  ['meridian-portal', 'Staff training', '2026-10-27'],
  ['meridian-portal', 'Go-live', '2026-10-30'],
  ['lumen-brand', 'Brand audit', '2026-08-28', '2026-08-27'],
  ['lumen-brand', 'Logo concepts, round one', '2026-09-11', '2026-09-11'],
  ['lumen-brand', 'Logo concepts, round two', '2026-09-25', '2026-09-25'],
  ['lumen-brand', 'Client feedback on round two', '2026-10-02'],
  ['lumen-brand', 'Brand guidelines', '2026-10-17'],
  ['lumen-brand', 'Final asset handoff', '2026-10-24'],
  ['atlas-site', 'Content outline', '2026-07-17', '2026-07-16'],
  ['atlas-site', 'Design and copy approved', '2026-08-14', '2026-08-14'],
  ['atlas-site', 'Launch', '2026-09-19', '2026-09-19'],
  ['atlas-docs', 'Docs audit', '2026-10-09'],
  ['atlas-docs', 'Migration plan', '2026-10-16'],
  ['atlas-docs', 'Converter and first 50 pages', '2026-11-13'],
  ['atlas-docs', 'Full migration and redirects', '2026-12-12'],
];

const milestones: Milestone[] = seedMilestones.map(([projectId, name, dueDate, completedOn], i) => ({
  id: `m${i + 1}`,
  projectId,
  name,
  dueDate,
  completedOn,
}));

const portfolios: Portfolio[] = [
  {
    id: 'all-clients', name: 'All clients', color: PALETTE.blue, ownerId: 'maya', starred: true,
    items: clients.map((c) => ({ type: 'portfolio' as const, id: c.key })),
    description: 'Every active Fieldwork Studio client, one portfolio per client.',
    memberIds: ['maya', 'tom', 'priya'],
  },
  ...clients.map((c) => ({
    id: c.key,
    name: c.name,
    color: c.color,
    ownerId: 'maya',
    starred: false,
    items: projects.filter((p) => p.clientId === c.key).map((p) => ({ type: 'project' as const, id: p.id })),
    description: `Client contact: ${c.contact}.`,
    memberIds: ['maya', 'tom', 'priya'],
  })),
];

let sid = 0;
const sec = (kind: SectionKind, text: string, highlights: [HighlightKind, string][] = []): UpdateSection => {
  sid += 1;
  return {
    id: `s${sid}`,
    kind,
    title: SECTION_TITLES[kind],
    text,
    highlights: highlights.map(([k, asOf], i) => ({ id: `h${sid}-${i}`, kind: k, asOf })),
  };
};

export const SECTION_TITLES: Record<SectionKind, string> = {
  summary: 'Summary',
  accomplished: "What we've accomplished",
  next: "What's next",
  metrics: 'Key metrics',
};

export const SECTION_PLACEHOLDERS: Record<SectionKind, string> = {
  summary: "How's this project going?",
  accomplished: 'What did the team get done?',
  next: "What's next for the team?",
  metrics: 'Which numbers show how the work is going?',
};

// Seed updates -> project status updates.
const seedUpdates: { project: string; date: string; source: string; visible: boolean; summary: string; status: StatusKey }[] = [
  { project: 'atlas-site', date: '2026-09-19', source: 'Manual', visible: true, status: 'complete', summary: 'Investor site launched. DNS switched at 10:00 and analytics confirmed live.' },
  { project: 'lumen-brand', date: '2026-09-25', source: 'Email', visible: true, status: 'on_track', summary: 'Shared round two logo concepts (three directions) with Iris for board review.' },
  { project: 'harbor-shop', date: '2026-09-25', source: 'Slack', visible: true, status: 'on_track', summary: 'All 212 products imported with photos and variants. Spot-checked 30 against the old shop.' },
  { project: 'meridian-portal', date: '2026-09-28', source: 'Email', visible: false, status: 'at_risk', summary: 'Asked CareStack support for sandbox API keys a second time; ticket #48213.' },
  { project: 'atlas-docs', date: '2026-09-29', source: 'Manual', visible: true, status: 'on_track', summary: 'Kickoff call with Kofi. Agreed to keep existing URLs where possible.' },
  { project: 'meridian-portal', date: '2026-09-30', source: 'Slack', visible: true, status: 'at_risk', summary: 'Patient dashboard and all six intake forms are built and in staging.' },
  { project: 'lumen-brand', date: '2026-10-01', source: 'Email', visible: false, status: 'off_track', summary: 'Iris replied that the board reviews logos on 9 Oct; no feedback before then.' },
  { project: 'harbor-shop', date: '2026-10-02', source: 'Slack', visible: false, status: 'on_track', summary: 'Waiting on Dana to add Tom to the Stripe account before testing live payments.' },
  { project: 'atlas-docs', date: '2026-10-05', source: 'Slack', visible: true, status: 'on_track', summary: 'Audited 60 of 140 pages. About a third are out of date and will be flagged for review.' },
  { project: 'meridian-portal', date: '2026-10-05', source: 'Email', visible: true, status: 'at_risk', summary: "Still waiting on EHR sandbox access. Go-live on 30 Oct is at risk if access isn't granted by 10 Oct." },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const shortDate = (iso: string) => {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}`;
};

const projectUpdates: StatusUpdate[] = seedUpdates.map((u, i) => {
  const p = projects.find((x) => x.id === u.project)!;
  return {
    id: `u${i + 1}`,
    parent: { type: 'project', id: u.project },
    title: `Status update - ${shortDate(u.date)}`,
    status: u.status,
    authorId: p.ownerId,
    date: u.date,
    isPrivate: !u.visible,
    source: u.source,
    sections: [
      sec('summary', u.summary),
      sec('accomplished', '', [['milestones_completed', u.date]]),
      sec('next', '', [['milestones_upcoming', u.date]]),
      sec('metrics', '', [['key_metrics', u.date]]),
    ],
    likes: [],
    comments: [],
  };
});

const portfolioUpdates: StatusUpdate[] = [
  {
    id: 'pu-all', parent: { type: 'portfolio', id: 'all-clients' }, title: 'Status update - 6 Oct', status: 'at_risk',
    authorId: 'maya', date: '2026-10-06', isPrivate: false, likes: ['tom'], comments: [],
    sections: [
      sec('summary', 'Two of five projects are waiting on clients: Meridian needs EHR sandbox access by 10 Oct, and Lumen needs board feedback on the logo concepts. Harbor & Pine and the Atlas docs migration are on schedule. The Atlas investor site launched on 19 Sep.', [['portfolio_health', '2026-10-06']]),
      sec('accomplished', 'Atlas investor site launched; Harbor & Pine catalogue import finished a day early.', [['projects_off_track', '2026-10-06'], ['projects_at_risk', '2026-10-06']]),
      sec('next', 'Escalate the CareStack sandbox request with Sam on 8 Oct. Lumen board meets 9 Oct.', []),
      sec('metrics', '', [['projects_by_owner', '2026-10-06']]),
    ],
  },
  {
    id: 'pu-harbor', parent: { type: 'portfolio', id: 'harbor' }, title: 'Status update - 6 Oct', status: 'on_track',
    authorId: 'maya', date: '2026-10-06', isPrivate: false, likes: [], comments: [],
    sections: [
      sec('summary', 'Checkout and payments are in progress for the 14 Nov launch. Live payment testing needs Dana to add Tom to the Stripe account.'),
      sec('accomplished', '', [['projects_on_track', '2026-10-06']]),
      sec('next', '', []),
      sec('metrics', '', []),
    ],
  },
  {
    id: 'pu-meridian', parent: { type: 'portfolio', id: 'meridian' }, title: 'Status update - 6 Oct', status: 'at_risk',
    authorId: 'maya', date: '2026-10-06', isPrivate: false, likes: [], comments: [],
    sections: [
      sec('summary', 'The intake portal is built and in staging. The 30 Oct go-live depends on CareStack issuing sandbox API keys by 10 Oct.'),
      sec('accomplished', '', [['projects_at_risk', '2026-10-06']]),
      sec('next', 'Escalate to Sam on Thursday 8 Oct if the keys have not arrived.', []),
      sec('metrics', '', []),
    ],
  },
  {
    id: 'pu-lumen', parent: { type: 'portfolio', id: 'lumen' }, title: 'Status update - 6 Oct', status: 'off_track',
    authorId: 'priya', date: '2026-10-06', isPrivate: false, likes: [], comments: [],
    sections: [
      sec('summary', 'Brand guidelines cannot start until the board reviews round two logo concepts on 9 Oct. The 24 Oct handoff will slip a week if feedback lands after that.'),
      sec('accomplished', '', [['projects_off_track', '2026-10-06']]),
      sec('next', '', []),
      sec('metrics', '', []),
    ],
  },
  {
    id: 'pu-atlas', parent: { type: 'portfolio', id: 'atlas' }, title: 'Status update - 6 Oct', status: 'on_track',
    authorId: 'maya', date: '2026-10-06', isPrivate: false, likes: [], comments: [],
    sections: [
      sec('summary', 'The investor website is live and handed off. The docs migration audit is 60 of 140 pages in, with the migration plan due 16 Oct.'),
      sec('accomplished', '', [['projects_on_track', '2026-10-06']]),
      sec('next', '', []),
      sec('metrics', '', []),
    ],
  },
];

const fields: FieldDef[] = [
  { id: 'status', name: 'Status', type: 'builtin' },
  { id: 'progress', name: 'Task progress', type: 'builtin' },
  { id: 'milestones', name: 'Milestones', type: 'builtin' },
  { id: 'date', name: 'Due date', type: 'builtin' },
  { id: 'owner', name: 'Owner', type: 'builtin' },
  { id: 'start', name: 'Start date', type: 'builtin' },
  { id: 'remaining', name: 'Time remaining', type: 'builtin' },
  { id: 'duration', name: 'Duration', type: 'builtin' },
  {
    id: 'priority', name: 'Priority', type: 'single',
    options: [
      { id: 'high', name: 'High', color: PALETTE.red },
      { id: 'medium', name: 'Medium', color: PALETTE.orange },
      { id: 'low', name: 'Low', color: PALETTE.yellowOrange },
    ],
  },
  {
    id: 'phase', name: 'Phase', type: 'single',
    options: [
      { id: 'discovery', name: 'Discovery', color: PALETTE.aqua },
      { id: 'design', name: 'Design', color: PALETTE.magenta },
      { id: 'build', name: 'Build', color: PALETTE.blue },
      { id: 'launch', name: 'Launch', color: PALETTE.green },
    ],
  },
  { id: 'contact', name: 'Client contact', type: 'text' },
  { id: 'notes', name: 'Internal notes', type: 'text', description: 'Never shown to clients.' },
];

const values: Data['values'] = {
  'harbor-shop': { priority: 'medium', phase: 'build', contact: 'Dana Ruiz', notes: internalNotes['harbor-shop'] },
  'meridian-portal': { priority: 'high', phase: 'build', contact: 'Dr. Sam Patel', notes: internalNotes['meridian-portal'] },
  'lumen-brand': { priority: 'high', phase: 'design', contact: 'Iris Novak', notes: internalNotes['lumen-brand'] },
  'atlas-site': { priority: 'low', phase: 'launch', contact: 'Kofi Mensah', notes: internalNotes['atlas-site'] },
  'atlas-docs': { priority: 'medium', phase: 'discovery', contact: 'Kofi Mensah', notes: internalNotes['atlas-docs'] },
  harbor: { contact: 'Dana Ruiz' },
  meridian: { priority: 'high', contact: 'Dr. Sam Patel' },
  lumen: { priority: 'high', contact: 'Iris Novak' },
  atlas: { contact: 'Kofi Mensah' },
};

export const defaultView = (): PortfolioView => ({
  columns: [
    { fieldId: 'status', width: 200 },
    { fieldId: 'progress', width: 170 },
    { fieldId: 'milestones', width: 170, hidden: true },
    { fieldId: 'date', width: 150 },
    { fieldId: 'priority', width: 110 },
    { fieldId: 'owner', width: 150 },
    { fieldId: 'phase', width: 120 },
    { fieldId: 'contact', width: 150 },
    { fieldId: 'notes', width: 220, hidden: true },
    { fieldId: 'start', width: 120, hidden: true },
    { fieldId: 'remaining', width: 130, hidden: true },
    { fieldId: 'duration', width: 120, hidden: true },
  ],
  sorts: [],
  filters: [],
  groupBy: null,
  progressType: 'task',
  nameWidth: 360,
});

export const initialData = (): Data => ({
  workspace: 'Fieldwork Studio',
  today: TODAY,
  meId: 'maya',
  people,
  projects: projects.map((p) => ({ ...p })),
  milestones: milestones.map((m) => ({ ...m })),
  portfolios: portfolios.map((p) => ({ ...p, items: [...p.items] })),
  rootPortfolioId: 'all-clients',
  updates: [...projectUpdates, ...portfolioUpdates],
  fields,
  values: JSON.parse(JSON.stringify(values)),
  views: Object.fromEntries(portfolios.map((p) => [p.id, defaultView()])),
});
