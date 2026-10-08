// All mock content for the replica lives in this file.
// Projects, people and milestones come from ../../seed/seed.json (Fieldwork Studio).
// To-do lists ("scopes"), to-dos, hill chart snapshots, messages, docs and chat
// lines are invented to fit each project's phase and milestones.

export type PersonKey = 'maya' | 'tom' | 'priya' | 'dana' | 'sam' | 'iris' | 'kofi';

export interface Person {
  key: PersonKey;
  name: string;
  short: string; // "Maya C."
  role: string;
  color: string; // avatar background
}

export interface Todo {
  id: string;
  title: string;
  assignee?: PersonKey;
  due?: string; // YYYY-MM-DD
  done: boolean;
  notes?: boolean;
  comments?: number;
}

export interface TodoList {
  id: string;
  name: string;
  description: string;
  color: HillColor;
  tracked: boolean;
  todos: Todo[];
}

export interface Snapshot {
  id: string;
  at: string; // ISO local time
  author: PersonKey;
  positions: Record<string, number>; // list id -> 0..100
  note?: string;
}

export interface HillComment {
  id: string;
  snapshotId: string;
  author: PersonKey;
  at: string;
  body: string;
}

export interface Message {
  id: string;
  title: string;
  author: PersonKey;
  date: string;
  category?: string;
  body: string;
  comments: number;
}

export interface DocItem {
  kind: 'folder' | 'doc' | 'sheet' | 'file';
  name: string;
  meta: string;
}

export interface ChatLine {
  author: PersonKey;
  time: string;
  body: string;
}

export interface Milestone {
  name: string;
  due: string;
  status: 'Done' | 'In progress' | 'Not started';
}

export interface Project {
  key: string;
  client: string;
  name: string;
  description: string;
  status: 'On track' | 'At risk' | 'Blocked' | 'Done';
  phase: string;
  owner: PersonKey;
  start: string;
  due: string;
  tint: string; // page background tint, as Basecamp colours each project
  people: PersonKey[];
  starred: boolean;
  milestones: Milestone[];
  messages: Message[];
  docs: DocItem[];
  chat: ChatLine[];
  cardColumns: { name: string; count: number; color: string; tint: string }[];
}

export type HillColor = 'blue' | 'teal' | 'red' | 'orange' | 'green' | 'purple' | 'pink';

// Dot colours, from the app palette Basecamp publishes on its marketing site.
export const HILL_COLORS: Record<HillColor, string> = {
  blue: 'rgb(93 161 248)',
  teal: 'rgb(81 176 191)',
  red: 'rgb(235 117 80)',
  orange: 'rgb(231 147 53)',
  green: 'rgb(111 180 118)',
  purple: 'rgb(167 130 247)',
  pink: 'rgb(222 108 181)',
};
export const COLOR_ORDER: HillColor[] = ['blue', 'teal', 'red', 'orange', 'green', 'purple', 'pink'];

export const AGENCY = 'Fieldwork Studio';
export const ME: PersonKey = 'maya';
// The mock's "today". Seeded dates are written relative to this.
export const SEED_TODAY = '2026-10-08';

export const PEOPLE: Record<PersonKey, Person> = {
  maya: { key: 'maya', name: 'Maya Chen', short: 'Maya C.', role: 'Project manager', color: '#c2577a' },
  tom: { key: 'tom', name: 'Tom Okafor', short: 'Tom O.', role: 'Development lead', color: '#3d6fb6' },
  priya: { key: 'priya', name: 'Priya Nair', short: 'Priya N.', role: 'Design lead', color: '#7a5bc4' },
  dana: { key: 'dana', name: 'Dana Ruiz', short: 'Dana R.', role: 'Harbor & Pine Coffee', color: '#b9762c' },
  sam: { key: 'sam', name: 'Dr. Sam Patel', short: 'Sam P.', role: 'Meridian Family Clinic', color: '#2f8a6e' },
  iris: { key: 'iris', name: 'Iris Novak', short: 'Iris N.', role: 'Lumen Books', color: '#a6483c' },
  kofi: { key: 'kofi', name: 'Kofi Mensah', short: 'Kofi M.', role: 'Atlas Robotics', color: '#4b6a7d' },
};

const t = (title: string, assignee?: PersonKey, due?: string, done = false, extra: Partial<Todo> = {}): Omit<Todo, 'id'> => ({
  title,
  assignee,
  due,
  done,
  ...extra,
});

function list(id: string, name: string, description: string, color: HillColor, todos: Omit<Todo, 'id'>[], tracked = true): TodoList {
  return { id, name, description, color, tracked, todos: todos.map((td, i) => ({ ...td, id: `${id}-t${i + 1}` })) };
}

export const PROJECTS: Project[] = [
  {
    key: 'harbor-shop',
    client: 'Harbor & Pine Coffee',
    name: 'Online shop rebuild',
    description:
      "The product catalogue is fully imported. We're now building checkout and payments, on schedule for a mid-November launch.",
    status: 'On track',
    phase: 'Build',
    owner: 'tom',
    start: '2026-08-04',
    due: '2026-11-14',
    tint: 'rgb(245 249 255)',
    people: ['maya', 'tom', 'priya', 'dana'],
    starred: true,
    milestones: [
      { name: 'Discovery workshop', due: '2026-08-08', status: 'Done' },
      { name: 'Design sign-off', due: '2026-09-05', status: 'Done' },
      { name: 'Product catalogue import', due: '2026-09-26', status: 'Done' },
      { name: 'Checkout and payments', due: '2026-10-17', status: 'In progress' },
      { name: 'Content load and QA', due: '2026-10-31', status: 'Not started' },
      { name: 'Launch', due: '2026-11-14', status: 'Not started' },
    ],
    messages: [
      { id: 'hm1', title: 'Catalogue import is done', author: 'tom', date: '2026-09-25', category: 'Progress', body: 'All 212 products imported with photos and variants. Spot-checked 30 against the old shop.', comments: 3 },
      { id: 'hm2', title: 'Payment account access', author: 'maya', date: '2026-10-02', category: 'Heads up', body: 'Dana, could you add Tom as a developer on the payment account? We need it before we can test live payments.', comments: 2 },
      { id: 'hm3', title: 'Design sign-off: final checkout screens', author: 'priya', date: '2026-09-04', category: 'Decision', body: 'Final checkout, basket and account screens are attached. Thanks for the quick turnaround, Dana!', comments: 5 },
      { id: 'hm4', title: 'Notes from the discovery workshop', author: 'maya', date: '2026-08-08', body: 'Summary of the workshop: goals, must-haves for launch, and what we agreed to leave for later.', comments: 1 },
      { id: 'hm5', title: 'Welcome to the project!', author: 'maya', date: '2026-08-04', body: "Hi Dana, this is where we'll share progress on the new shop. Everything we post here is visible to you.", comments: 4 },
    ],
    docs: [
      { kind: 'folder', name: 'Product photography', meta: '212 items' },
      { kind: 'folder', name: 'Design files', meta: '18 items' },
      { kind: 'sheet', name: 'Shipping rates by zone', meta: 'Tom Okafor • Oct 1 • Spreadsheet' },
      { kind: 'doc', name: 'Launch checklist', meta: 'Maya Chen • Sep 30 • Document' },
      { kind: 'file', name: 'Brand colours.pdf', meta: 'Priya Nair • Aug 12 • 1.2 MB' },
    ],
    chat: [
      { author: 'tom', time: '9:12am', body: 'Checkout passes all test cards now. Just need the live account.' },
      { author: 'dana', time: '9:40am', body: "On it, I'll add you this afternoon." },
      { author: 'priya', time: '10:05am', body: 'Updated the order confirmation email to match the new type scale.' },
      { author: 'maya', time: '10:21am', body: 'Lovely. Tom, shout once payments are live and I will update the hill.' },
    ],
    cardColumns: [
      { name: 'Design', count: 2, color: 'rgb(167 130 247)', tint: 'rgb(248 247 254)' },
      { name: 'Build', count: 5, color: 'rgb(231 147 53)', tint: 'rgb(254 247 233)' },
      { name: 'Review', count: 3, color: 'rgb(93 161 248)', tint: 'rgb(244 249 254)' },
      { name: 'QA', count: 1, color: 'rgb(222 108 181)', tint: 'rgb(252 246 251)' },
      { name: 'Live', count: 9, color: 'rgb(111 180 118)', tint: 'rgb(241 248 241)' },
    ],
  },
  {
    key: 'meridian-portal',
    client: 'Meridian Family Clinic',
    name: 'Patient intake portal',
    description:
      'Forms and the patient dashboard are built. Connecting to your records system is waiting on sandbox access from your EHR vendor, which puts the 30 October go-live at risk.',
    status: 'At risk',
    phase: 'Build',
    owner: 'maya',
    start: '2026-07-14',
    due: '2026-10-30',
    tint: 'rgb(244 251 247)',
    people: ['maya', 'tom', 'priya', 'sam'],
    starred: true,
    milestones: [
      { name: 'Requirements sign-off', due: '2026-07-25', status: 'Done' },
      { name: 'Form designs approved', due: '2026-08-22', status: 'Done' },
      { name: 'EHR integration', due: '2026-10-10', status: 'In progress' },
      { name: 'Accessibility audit', due: '2026-10-20', status: 'Not started' },
      { name: 'Staff training', due: '2026-10-27', status: 'Not started' },
      { name: 'Go-live', due: '2026-10-30', status: 'Not started' },
    ],
    messages: [
      { id: 'mm1', title: 'Go-live is at risk', author: 'maya', date: '2026-10-05', category: 'Heads up', body: "We're still waiting on EHR sandbox access. Go-live on 30 Oct is at risk if access isn't granted by 10 Oct.", comments: 4 },
      { id: 'mm2', title: 'Dashboard and forms are in staging', author: 'tom', date: '2026-09-30', category: 'Progress', body: 'Patient dashboard and all six intake forms are built and in staging. Have a click around and tell us what feels off.', comments: 6 },
      { id: 'mm3', title: 'Form designs approved', author: 'priya', date: '2026-08-26', category: 'Decision', body: 'Thanks, Sam. We have the go-ahead on all six forms, including the shorter returning-patient version.', comments: 2 },
      { id: 'mm4', title: 'Requirements, signed off', author: 'maya', date: '2026-07-24', body: 'The signed requirements document is in Docs & Files.', comments: 1 },
    ],
    docs: [
      { kind: 'folder', name: 'Form designs', meta: '6 items' },
      { kind: 'doc', name: 'Requirements (signed)', meta: 'Maya Chen • Jul 24 • Document' },
      { kind: 'doc', name: 'EHR integration notes', meta: 'Tom Okafor • Oct 2 • Document' },
      { kind: 'sheet', name: 'Accessibility checklist', meta: 'Priya Nair • Sep 29 • Spreadsheet' },
    ],
    chat: [
      { author: 'tom', time: '8:55am', body: 'No reply from the vendor again. Ticket is still "pending review".' },
      { author: 'maya', time: '9:02am', body: "I'll call Sam today so he can push from their side." },
      { author: 'sam', time: '11:30am', body: "I've emailed our account manager there and copied Maya." },
    ],
    cardColumns: [
      { name: 'Triage', count: 1, color: 'rgb(167 130 247)', tint: 'rgb(248 247 254)' },
      { name: 'Build', count: 3, color: 'rgb(231 147 53)', tint: 'rgb(254 247 233)' },
      { name: 'Blocked', count: 2, color: 'rgb(235 117 80)', tint: 'rgb(253 243 240)' },
      { name: 'Review', count: 2, color: 'rgb(93 161 248)', tint: 'rgb(244 249 254)' },
      { name: 'Done', count: 11, color: 'rgb(111 180 118)', tint: 'rgb(241 248 241)' },
    ],
  },
  {
    key: 'lumen-brand',
    client: 'Lumen Books',
    name: 'Brand refresh',
    description:
      "Round two logo concepts were shared on 25 September. We need your team's feedback before we can start the brand guidelines.",
    status: 'Blocked',
    phase: 'Design',
    owner: 'priya',
    start: '2026-08-18',
    due: '2026-10-24',
    tint: 'rgb(254 247 244)',
    people: ['maya', 'priya', 'iris'],
    starred: false,
    milestones: [
      { name: 'Brand audit', due: '2026-08-28', status: 'Done' },
      { name: 'Logo concepts, round one', due: '2026-09-11', status: 'Done' },
      { name: 'Logo concepts, round two', due: '2026-09-25', status: 'Done' },
      { name: 'Client feedback on round two', due: '2026-10-02', status: 'In progress' },
      { name: 'Brand guidelines', due: '2026-10-17', status: 'Not started' },
      { name: 'Final asset handoff', due: '2026-10-24', status: 'Not started' },
    ],
    messages: [
      { id: 'lm1', title: 'Round two logo concepts', author: 'priya', date: '2026-09-25', category: 'For review', body: 'Three directions for the board to review. Each one comes with a colour study and a spine mock-up.', comments: 7 },
      { id: 'lm2', title: 'Round one: what we heard', author: 'priya', date: '2026-09-14', body: 'The serif wordmark tested best. We are taking it forward with two new symbol ideas.', comments: 3 },
      { id: 'lm3', title: 'Brand audit findings', author: 'maya', date: '2026-08-27', category: 'Progress', body: 'We reviewed 40 touchpoints, from the website to tote bags. The full findings are in Docs & Files.', comments: 2 },
    ],
    docs: [
      { kind: 'folder', name: 'Logo concepts', meta: '24 items' },
      { kind: 'doc', name: 'Brand audit findings', meta: 'Maya Chen • Aug 27 • Document' },
      { kind: 'file', name: 'Round two presentation.pdf', meta: 'Priya Nair • Sep 25 • 8.4 MB' },
    ],
    chat: [
      { author: 'iris', time: '4:10pm', body: 'Board meets on the 9th. I will send feedback that evening.' },
      { author: 'priya', time: '4:18pm', body: 'Perfect, thanks Iris. We will hold the guidelines until then.' },
    ],
    cardColumns: [
      { name: 'Ideas', count: 6, color: 'rgb(167 130 247)', tint: 'rgb(248 247 254)' },
      { name: 'In design', count: 2, color: 'rgb(231 147 53)', tint: 'rgb(254 247 233)' },
      { name: 'With client', count: 3, color: 'rgb(93 161 248)', tint: 'rgb(244 249 254)' },
      { name: 'Approved', count: 4, color: 'rgb(111 180 118)', tint: 'rgb(241 248 241)' },
    ],
  },
  {
    key: 'atlas-site',
    client: 'Atlas Robotics',
    name: 'Investor website',
    description: 'Launched on 19 September. Analytics are live and the handoff documentation is in your shared folder.',
    status: 'Done',
    phase: 'Launch',
    owner: 'maya',
    start: '2026-06-30',
    due: '2026-09-19',
    tint: 'rgb(248 248 250)',
    people: ['maya', 'tom', 'priya', 'kofi'],
    starred: false,
    milestones: [
      { name: 'Content outline', due: '2026-07-17', status: 'Done' },
      { name: 'Design and copy approved', due: '2026-08-14', status: 'Done' },
      { name: 'Launch', due: '2026-09-19', status: 'Done' },
    ],
    messages: [
      { id: 'am1', title: "We're live!", author: 'maya', date: '2026-09-19', category: 'Announcement', body: 'Investor site launched. DNS switched at 10:00 and analytics confirmed live.', comments: 8 },
      { id: 'am2', title: 'Handoff documentation', author: 'tom', date: '2026-09-22', body: 'How to edit pages, add press releases and read the analytics dashboard.', comments: 1 },
    ],
    docs: [
      { kind: 'folder', name: 'Handoff', meta: '7 items' },
      { kind: 'doc', name: 'Editing guide', meta: 'Tom Okafor • Sep 22 • Document' },
    ],
    chat: [{ author: 'kofi', time: '10:02am', body: 'Looks fantastic. The board loved it.' }],
    cardColumns: [
      { name: 'Design', count: 0, color: 'rgb(167 130 247)', tint: 'rgb(248 247 254)' },
      { name: 'Build', count: 0, color: 'rgb(231 147 53)', tint: 'rgb(254 247 233)' },
      { name: 'Live', count: 23, color: 'rgb(111 180 118)', tint: 'rgb(241 248 241)' },
    ],
  },
  {
    key: 'atlas-docs',
    client: 'Atlas Robotics',
    name: 'Developer docs migration',
    description:
      "We're auditing the 140 existing docs pages and mapping them to the new structure. Expect the migration plan by 16 October.",
    status: 'On track',
    phase: 'Discovery',
    owner: 'tom',
    start: '2026-09-29',
    due: '2026-12-12',
    tint: 'rgb(250 247 255)',
    people: ['maya', 'tom', 'kofi'],
    starred: true,
    milestones: [
      { name: 'Docs audit', due: '2026-10-09', status: 'In progress' },
      { name: 'Migration plan', due: '2026-10-16', status: 'Not started' },
      { name: 'Converter and first 50 pages', due: '2026-11-13', status: 'Not started' },
      { name: 'Full migration and redirects', due: '2026-12-12', status: 'Not started' },
    ],
    messages: [
      { id: 'dm1', title: 'Audit: 60 of 140 pages done', author: 'tom', date: '2026-10-05', category: 'Progress', body: 'About a third are out of date and will be flagged for review.', comments: 2 },
      { id: 'dm2', title: 'Kickoff notes', author: 'maya', date: '2026-09-29', body: 'Agreed to keep existing URLs where possible.', comments: 1 },
    ],
    docs: [
      { kind: 'sheet', name: 'Docs inventory', meta: 'Tom Okafor • Oct 5 • Spreadsheet' },
      { kind: 'doc', name: 'Kickoff notes', meta: 'Maya Chen • Sep 29 • Document' },
    ],
    chat: [
      { author: 'tom', time: '2:44pm', body: 'Found three more Markdown extensions in the old docs. Adding them to the converter list.' },
      { author: 'kofi', time: '3:01pm', body: 'Those came from our old static site generator. Happy to drop the tabs one.' },
    ],
    cardColumns: [
      { name: 'Audit', count: 80, color: 'rgb(167 130 247)', tint: 'rgb(248 247 254)' },
      { name: 'Rewrite', count: 21, color: 'rgb(231 147 53)', tint: 'rgb(254 247 233)' },
      { name: 'Migrate', count: 39, color: 'rgb(93 161 248)', tint: 'rgb(244 249 254)' },
    ],
  },
];

export const LISTS: Record<string, TodoList[]> = {
  'harbor-shop': [
    list('h-catalogue', 'Product catalogue', 'Import, photography and variants for all 212 products.', 'green', [
      t('Write the import script for the old shop export', 'tom', '2026-09-04', true),
      t('Reshoot the 38 products without usable photos', 'priya', '2026-09-18', true),
      t('Map sizes and grinds to product variants', 'tom', '2026-09-18', true),
      t('Import all products and variants', 'tom', '2026-09-25', true),
      t('Spot-check 30 products against the old shop', 'maya', '2026-09-26', true),
    ]),
    list('h-checkout', 'Checkout & payments', 'Basket, checkout flow and live card payments.', 'blue', [
      t('Basket drawer with quantity editing', 'tom', '2026-09-29', true),
      t('Guest checkout flow', 'tom', '2026-10-01', true),
      t('Order confirmation email', 'priya', '2026-10-02', true),
      t('Connect the live payment account', 'tom', '2026-10-09', false, { comments: 2 }),
      t('Test refunds and partial captures', 'tom', '2026-10-14'),
      t('Wallet payment buttons', 'tom', '2026-10-16', false, { notes: true }),
    ]),
    list('h-shipping', 'Shipping & tax', 'Zones, rates and tax rules for UK and EU orders.', 'orange', [
      t('Agree shipping zones with Dana', 'maya', '2026-09-24', true),
      t('Rates for UK, EU and rest of world', 'tom', '2026-10-01', true),
      t('Tax-inclusive prices for EU customers', 'tom', '2026-10-12'),
      t('Free shipping threshold banner', 'priya', '2026-10-15'),
    ]),
    list('h-content', 'Content load & QA', 'Pages, blog posts and a full test pass before launch.', 'teal', [
      t('Move the 14 blog posts across', 'maya', '2026-10-20'),
      t('About, wholesale and café pages', 'priya', '2026-10-23'),
      t('Test on phones and tablets', 'tom', '2026-10-29'),
      t('Write the content style sheet', 'priya', '2026-10-02', true),
    ]),
    list('h-launch', 'Launch', 'Redirects, the domain switch and launch-day checks.', 'red', [
      t('Redirects from old shop URLs', 'tom', '2026-11-06'),
      t('Domain switch plan', 'tom', '2026-11-10'),
      t('Launch-day checklist', 'maya', '2026-11-12'),
    ]),
  ],
  'meridian-portal': [
    list('m-forms', 'Intake forms', 'Six intake forms, including the shorter returning-patient form.', 'green', [
      t('New patient form', 'tom', '2026-09-11', true),
      t('Returning patient form', 'tom', '2026-09-16', true),
      t('Insurance and consent forms', 'tom', '2026-09-23', true),
      t('Save and resume on long forms', 'tom', '2026-09-28', true),
      t('Error messages review with Sam', 'priya', '2026-10-09'),
    ]),
    list('m-dashboard', 'Patient dashboard', 'Where patients see upcoming visits and finished forms.', 'blue', [
      t('Upcoming visits panel', 'tom', '2026-09-18', true),
      t('Completed forms list', 'tom', '2026-09-25', true),
      t('Reminder email preferences', 'tom', '2026-09-30', true),
      t('Empty states and loading skeletons', 'priya', '2026-10-12'),
    ]),
    list('m-ehr', 'EHR integration', 'Send completed forms to the clinic records system. Waiting on sandbox access from the vendor.', 'red', [
      t('Read the vendor API docs', 'tom', '2026-09-10', true),
      t('Request sandbox API keys', 'maya', '2026-09-14', true),
      t('Map form fields to patient record fields', 'tom', '2026-09-24', true),
      t('Connect to the sandbox', 'tom', '2026-10-10', false, { comments: 4 }),
      t('Handle failed and duplicate submissions', 'tom', '2026-10-16'),
      t('End-to-end test with clinic staff', 'maya', '2026-10-21'),
    ]),
    list('m-a11y', 'Accessibility audit', 'Screen reader, keyboard and contrast checks on every form.', 'purple', [
      t('Keyboard-only pass', 'priya', '2026-10-14'),
      t('Screen reader pass', 'priya', '2026-10-16'),
      t('Fix list from the audit', 'tom', '2026-10-20'),
    ]),
    list('m-training', 'Staff training', 'Front desk walkthrough and a one-page guide.', 'orange', [
      t('Write the one-page guide', 'maya', '2026-10-22'),
      t('Front desk training session', 'maya', '2026-10-27'),
    ]),
  ],
  'lumen-brand': [
    list('l-audit', 'Brand audit', 'Review of 40 touchpoints, from the website to tote bags.', 'green', [
      t('Collect touchpoints from Iris', 'maya', '2026-08-21', true),
      t('Competitor review', 'priya', '2026-08-25', true),
      t('Audit findings deck', 'priya', '2026-08-27', true),
    ]),
    list('l-logo', 'Logo concepts', 'Two rounds of concepts. Waiting on the board, who meet 9 October.', 'blue', [
      t('Round one: five sketches', 'priya', '2026-09-11', true),
      t('Round two: three directions', 'priya', '2026-09-25', true),
      t('Spine and storefront mock-ups', 'priya', '2026-09-25', true),
      t('Board feedback on round two', 'iris', '2026-10-09', false, { comments: 3 }),
      t('Refine the chosen direction', 'priya', '2026-10-14'),
    ]),
    list('l-type', 'Colour & type', 'Palette and type pairings that work in print and on screen.', 'orange', [
      t('Shortlist of three type pairings', 'priya', '2026-09-18', true),
      t('Print tests on uncoated stock', 'priya', '2026-10-13'),
      t('Accessible colour pairs', 'priya', '2026-10-15'),
    ]),
    list('l-guidelines', 'Brand guidelines', 'A short, practical guide for the Lumen team.', 'teal', [
      t('Outline the guidelines', 'maya', '2026-10-12'),
      t('Write and lay out the guide', 'priya', '2026-10-17'),
    ]),
    list('l-handoff', 'Asset handoff', 'Final files in every format the team needs.', 'red', [
      t('Export logo files', 'priya', '2026-10-22'),
      t('Social and email templates', 'priya', '2026-10-24'),
    ]),
  ],
  'atlas-site': [
    list('a-outline', 'Content outline', 'Pages, sections and the investor story.', 'green', [
      t('Interview the founders', 'maya', '2026-07-08', true),
      t('Sitemap and page outlines', 'maya', '2026-07-16', true),
    ]),
    list('a-design', 'Design & copy', 'Visual design and final copy for every page.', 'blue', [
      t('Homepage design', 'priya', '2026-07-31', true),
      t('Inner pages', 'priya', '2026-08-07', true),
      t('Final copy approved', 'kofi', '2026-08-14', true),
    ]),
    list('a-build', 'Build', 'Front end, content management and press releases.', 'orange', [
      t('Build page templates', 'tom', '2026-08-28', true),
      t('Press release section', 'tom', '2026-09-04', true),
      t('Cross-browser testing', 'tom', '2026-09-15', true),
    ]),
    list('a-launch', 'Launch & analytics', 'Domain switch, analytics and handoff.', 'teal', [
      t('Switch the domain', 'tom', '2026-09-19', true),
      t('Confirm analytics are live', 'tom', '2026-09-19', true),
      t('Handoff documentation', 'tom', '2026-09-22', true),
    ]),
  ],
  'atlas-docs': [
    list('d-audit', 'Docs audit', 'Review all 140 pages and flag what is out of date.', 'blue', [
      t('Export the page inventory', 'tom', '2026-09-30', true),
      t('Audit pages 1–60', 'tom', '2026-10-05', true),
      t('Audit pages 61–140', 'tom', '2026-10-09'),
      t('Review flagged pages with Kofi', 'maya', '2026-10-12'),
    ]),
    list('d-ia', 'Information architecture', 'The new structure, mapped from the old one.', 'teal', [
      t('Draft the new navigation', 'maya', '2026-10-09'),
      t('Map old pages to new sections', 'tom', '2026-10-14'),
      t('Migration plan for Kofi', 'maya', '2026-10-16'),
    ]),
    list('d-converter', 'Markdown converter', 'Convert the custom Markdown dialect to standard Markdown.', 'red', [
      t('Catalogue the custom syntax', 'tom', '2026-10-06', true),
      t('Converter prototype', 'tom', '2026-10-21'),
      t('Convert the first 50 pages', 'tom', '2026-11-13'),
    ]),
    list('d-redirects', 'Redirects', 'Keep existing URLs working after the move.', 'orange', [
      t('Redirect map', 'tom', '2026-11-27'),
      t('Test every old URL', 'tom', '2026-12-10'),
    ]),
  ],
};

const snap = (project: string, n: number, at: string, author: PersonKey, positions: Record<string, number>, note?: string): Snapshot => ({
  id: `${project}-s${n}`,
  at,
  author,
  positions,
  note,
});

export const SNAPSHOTS: Record<string, Snapshot[]> = {
  'harbor-shop': [
    snap('harbor-shop', 1, '2026-09-11T16:20', 'tom', { 'h-catalogue': 58, 'h-checkout': 9, 'h-shipping': 3, 'h-content': 0, 'h-launch': 0 },
      'The catalogue import script works on a sample of 40 products. Photos are the slow part: 38 products need reshooting.'),
    snap('harbor-shop', 2, '2026-09-18T11:05', 'tom', { 'h-catalogue': 81, 'h-checkout': 24, 'h-shipping': 16, 'h-content': 0, 'h-launch': 0 }),
    snap('harbor-shop', 3, '2026-09-25T17:42', 'maya', { 'h-catalogue': 100, 'h-checkout': 37, 'h-shipping': 31, 'h-content': 4, 'h-launch': 0 },
      'Catalogue is done: all 212 products imported with photos and variants. Checkout is next.'),
    snap('harbor-shop', 4, '2026-10-02T15:10', 'tom', { 'h-catalogue': 100, 'h-checkout': 46, 'h-shipping': 54, 'h-content': 9, 'h-launch': 0 },
      "Checkout is figured out apart from live payments. We can't test the real account until Dana adds me as a developer."),
    snap('harbor-shop', 5, '2026-10-05T13:38', 'tom', { 'h-catalogue': 100, 'h-checkout': 48, 'h-shipping': 66, 'h-content': 12, 'h-launch': 0 }),
  ],
  'meridian-portal': [
    snap('meridian-portal', 1, '2026-09-14T10:15', 'maya', { 'm-forms': 58, 'm-dashboard': 41, 'm-ehr': 27, 'm-a11y': 0, 'm-training': 0 },
      'Forms and dashboard are moving well. EHR integration is uphill until we get sandbox keys from the vendor; requested today.'),
    snap('meridian-portal', 2, '2026-09-21T16:02', 'tom', { 'm-forms': 72, 'm-dashboard': 59, 'm-ehr': 30, 'm-a11y': 0, 'm-training': 0 }),
    snap('meridian-portal', 3, '2026-09-28T09:47', 'maya', { 'm-forms': 84, 'm-dashboard': 73, 'm-ehr': 30, 'm-a11y': 3, 'm-training': 0 },
      "EHR integration hasn't moved in two weeks. We've asked for sandbox API keys a second time (ticket #48213). Everything we can build without them is done."),
    snap('meridian-portal', 4, '2026-09-30T14:25', 'tom', { 'm-forms': 90, 'm-dashboard': 84, 'm-ehr': 30, 'm-a11y': 5, 'm-training': 0 },
      'Patient dashboard and all six intake forms are built and in staging.'),
    snap('meridian-portal', 5, '2026-10-05T11:30', 'maya', { 'm-forms': 92, 'm-dashboard': 86, 'm-ehr': 30, 'm-a11y': 8, 'm-training': 0 },
      "Still waiting on sandbox access. If it isn't granted by 10 Oct, the 30 Oct go-live is at risk."),
  ],
  'lumen-brand': [
    snap('lumen-brand', 1, '2026-08-28T15:00', 'priya', { 'l-audit': 100, 'l-logo': 11, 'l-type': 4, 'l-guidelines': 0, 'l-handoff': 0 },
      'Audit is done. Starting logo sketches next week.'),
    snap('lumen-brand', 2, '2026-09-11T17:30', 'priya', { 'l-audit': 100, 'l-logo': 29, 'l-type': 14, 'l-guidelines': 0, 'l-handoff': 0 },
      'Round one shared with Iris: five sketches.'),
    snap('lumen-brand', 3, '2026-09-18T12:10', 'priya', { 'l-audit': 100, 'l-logo': 37, 'l-type': 24, 'l-guidelines': 0, 'l-handoff': 0 }),
    snap('lumen-brand', 4, '2026-09-24T16:45', 'priya', { 'l-audit': 100, 'l-logo': 47, 'l-type': 31, 'l-guidelines': 3, 'l-handoff': 0 },
      "Round two is ready: three directions. We won't know which one wins until the board meets on 9 October."),
  ],
  'atlas-site': [
    snap('atlas-site', 1, '2026-07-17T14:00', 'maya', { 'a-outline': 100, 'a-design': 22, 'a-build': 0, 'a-launch': 0 }),
    snap('atlas-site', 2, '2026-08-14T11:20', 'priya', { 'a-outline': 100, 'a-design': 100, 'a-build': 35, 'a-launch': 4 },
      'Design and copy approved by Kofi.'),
    snap('atlas-site', 3, '2026-09-04T16:00', 'tom', { 'a-outline': 100, 'a-design': 100, 'a-build': 78, 'a-launch': 40 }),
    snap('atlas-site', 4, '2026-09-19T10:30', 'maya', { 'a-outline': 100, 'a-design': 100, 'a-build': 100, 'a-launch': 100 },
      'Launched! The domain switched at 10:00 and analytics are confirmed live.'),
  ],
  'atlas-docs': [
    snap('atlas-docs', 1, '2026-09-29T15:30', 'tom', { 'd-audit': 0, 'd-ia': 0, 'd-converter': 0, 'd-redirects': 0 },
      'Kickoff with Kofi today. Everything starts at the bottom of the hill.'),
    snap('atlas-docs', 2, '2026-10-02T12:00', 'tom', { 'd-audit': 21, 'd-ia': 7, 'd-converter': 5, 'd-redirects': 0 }),
    snap('atlas-docs', 3, '2026-10-06T16:12', 'tom', { 'd-audit': 38, 'd-ia': 19, 'd-converter': 11, 'd-redirects': 0 },
      'Audited 60 of 140 pages; about a third are out of date. The custom Markdown dialect has more extensions than we expected.'),
  ],
};

export const COMMENTS: HillComment[] = [
  { id: 'c1', snapshotId: 'meridian-portal-s3', author: 'sam', at: '2026-09-28T13:02', body: "Thanks for the nudge. I've emailed our account manager there too." },
  { id: 'c2', snapshotId: 'meridian-portal-s3', author: 'maya', at: '2026-09-28T13:20', body: "Great, thank you. I'll escalate on Thursday if nothing arrives." },
  { id: 'c3', snapshotId: 'harbor-shop-s4', author: 'dana', at: '2026-10-02T18:04', body: 'Sorry! Adding Tom first thing tomorrow.' },
  { id: 'c4', snapshotId: 'lumen-brand-s4', author: 'iris', at: '2026-09-25T09:15', body: 'Looking forward to sharing these with the board.' },
];
