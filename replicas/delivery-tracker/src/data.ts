// All mock data for the replica lives in this file.
// Clients, projects, milestones and updates come from ../../seed/seed.json
// (fictional agency "Fieldwork Studio"). Phase start dates, phase leads and the
// per-phase status lines are additions so every tracker stage has a named
// person and a date, the way the original names who began each step and when.

export const TODAY = '2026-10-08';

export const agency = {
  name: 'Fieldwork Studio',
  trackerName: 'Fieldwork Tracker',
  address: ['Fieldwork Studio', '18 Example Street, Unit 4', 'Portland, OR 97201'],
  phone: '(503) 555-0142',
  email: 'hello@fieldwork.example',
  hours: 'Mon–Fri 9am–6pm',
};

export const staff = {
  'Maya Chen': {
    role: 'Project manager',
    initials: 'MC',
    color: '#4f7c3a',
    about: "When I'm not running projects for Fieldwork, I'm out on my bike looking for the best coffee in town.",
    languages: 'Mandarin',
  },
  'Tom Okafor': {
    role: 'Development lead',
    initials: 'TO',
    color: '#8a4b2a',
    about: "When I'm not shipping launches for Fieldwork, I'm coaching under-12s football.",
    languages: 'Yoruba',
  },
  'Priya Nair': {
    role: 'Design lead',
    initials: 'PN',
    color: '#6b3f8a',
    about: "When I'm not drawing logos for Fieldwork, I'm printing posters on an old letterpress.",
    languages: 'Malayalam and Hindi',
  },
} as const;

export type StaffName = keyof typeof staff;

export const PHASES = ['Discovery', 'Design', 'Build', 'Review', 'Launch'] as const;
export type PhaseName = (typeof PHASES)[number];

export type Client = {
  key: string;
  name: string;
  contactName: string;
  contactEmail: string;
};

export const clients: Client[] = [
  { key: 'harbor', name: 'Harbor & Pine Coffee', contactName: 'Dana Ruiz', contactEmail: 'dana@harborpine.example' },
  { key: 'meridian', name: 'Meridian Family Clinic', contactName: 'Dr. Sam Patel', contactEmail: 'sam.patel@meridianclinic.example' },
  { key: 'lumen', name: 'Lumen Books', contactName: 'Iris Novak', contactEmail: 'iris@lumenbooks.example' },
  { key: 'atlas', name: 'Atlas Robotics', contactName: 'Kofi Mensah', contactEmail: 'kofi@atlasrobotics.example' },
];

export type Milestone = {
  name: string;
  due: string;
  status: 'Done' | 'In progress' | 'Not started';
  completedOn?: string;
};

export type Update = { date: string; summary: string };

export type Phase = {
  name: PhaseName;
  lead: StaffName;
  start: string;
  /** Second, smaller status line shown while this phase is the current one. */
  detail: string;
};

export type Project = {
  key: string;
  client: string;
  name: string;
  status: 'On track' | 'At risk' | 'Blocked' | 'Done';
  owner: StaffName;
  startDate: string;
  dueDate: string;
  progress: number;
  clientSummary: string;
  /**
   * Tracker step the project is at today:
   * 0 = brief received, 1–5 = Discovery…Launch in progress, 6 = launched.
   */
  step: number;
  /** Text after "Current estimated launch date". */
  estimate: string;
  /** What "launch" delivers, used in the final-stage messages. */
  deliverable: string;
  briefReceived: string;
  phases: Phase[];
  milestones: Milestone[];
  updates: Update[];
};

export const projects: Project[] = [
  {
    key: 'harbor-shop',
    client: 'harbor',
    name: 'Online shop rebuild',
    status: 'On track',
    owner: 'Tom Okafor',
    startDate: '2026-08-04',
    dueDate: '2026-11-14',
    progress: 60,
    clientSummary:
      "The product catalogue is fully imported. We're now building checkout and payments, on schedule for a mid-November launch.",
    step: 3,
    estimate: '14 Nov',
    deliverable: 'new shop',
    briefReceived: '2026-07-28',
    phases: [
      { name: 'Discovery', lead: 'Maya Chen', start: '2026-08-04', detail: 'Discovery workshop with Dana on 8 Aug.' },
      { name: 'Design', lead: 'Priya Nair', start: '2026-08-10', detail: 'Shop designs signed off on 4 Sep.' },
      { name: 'Build', lead: 'Tom Okafor', start: '2026-09-07', detail: 'All 212 products imported. Checkout and payments due 17 Oct.' },
      { name: 'Review', lead: 'Maya Chen', start: '2026-10-19', detail: 'Content load and QA due 31 Oct.' },
      { name: 'Launch', lead: 'Tom Okafor', start: '2026-11-02', detail: 'Launch planned for 14 Nov.' },
    ],
    milestones: [
      { name: 'Discovery workshop', due: '2026-08-08', status: 'Done', completedOn: '2026-08-08' },
      { name: 'Design sign-off', due: '2026-09-05', status: 'Done', completedOn: '2026-09-04' },
      { name: 'Product catalogue import', due: '2026-09-26', status: 'Done', completedOn: '2026-09-25' },
      { name: 'Checkout and payments', due: '2026-10-17', status: 'In progress' },
      { name: 'Content load and QA', due: '2026-10-31', status: 'Not started' },
      { name: 'Launch', due: '2026-11-14', status: 'Not started' },
    ],
    updates: [
      { date: '2026-09-25', summary: 'All 212 products imported with photos and variants. Spot-checked 30 against the old shop.' },
    ],
  },
  {
    key: 'meridian-portal',
    client: 'meridian',
    name: 'Patient intake portal',
    status: 'At risk',
    owner: 'Maya Chen',
    startDate: '2026-07-14',
    dueDate: '2026-10-30',
    progress: 70,
    clientSummary:
      'Forms and the patient dashboard are built. Connecting to your records system is waiting on sandbox access from your EHR vendor, which puts the 30 October go-live at risk.',
    step: 3,
    estimate: '30 Oct (at risk)',
    deliverable: 'patient portal',
    briefReceived: '2026-07-08',
    phases: [
      { name: 'Discovery', lead: 'Maya Chen', start: '2026-07-14', detail: 'Requirements signed off on 24 Jul.' },
      { name: 'Design', lead: 'Priya Nair', start: '2026-07-27', detail: 'Form designs approved on 26 Aug.' },
      { name: 'Build', lead: 'Tom Okafor', start: '2026-08-27', detail: 'Still waiting on EHR sandbox access. Go-live is at risk if access isn’t granted by 10 Oct.' },
      { name: 'Review', lead: 'Maya Chen', start: '2026-10-12', detail: 'Accessibility audit due 20 Oct, staff training 27 Oct.' },
      { name: 'Launch', lead: 'Maya Chen', start: '2026-10-28', detail: 'Go-live planned for 30 Oct.' },
    ],
    milestones: [
      { name: 'Requirements sign-off', due: '2026-07-25', status: 'Done', completedOn: '2026-07-24' },
      { name: 'Form designs approved', due: '2026-08-22', status: 'Done', completedOn: '2026-08-26' },
      { name: 'EHR integration', due: '2026-10-10', status: 'In progress' },
      { name: 'Accessibility audit', due: '2026-10-20', status: 'Not started' },
      { name: 'Staff training', due: '2026-10-27', status: 'Not started' },
      { name: 'Go-live', due: '2026-10-30', status: 'Not started' },
    ],
    updates: [
      { date: '2026-10-05', summary: "Still waiting on EHR sandbox access. Go-live on 30 Oct is at risk if access isn't granted by 10 Oct." },
      { date: '2026-09-30', summary: 'Patient dashboard and all six intake forms are built and in staging.' },
    ],
  },
  {
    key: 'lumen-brand',
    client: 'lumen',
    name: 'Brand refresh',
    status: 'Blocked',
    owner: 'Priya Nair',
    startDate: '2026-08-18',
    dueDate: '2026-10-24',
    progress: 45,
    clientSummary:
      "Round two logo concepts were shared on 25 September. We need your team's feedback before we can start the brand guidelines.",
    step: 2,
    estimate: '24 Oct (waiting on your feedback)',
    deliverable: 'new brand',
    briefReceived: '2026-08-12',
    phases: [
      { name: 'Discovery', lead: 'Maya Chen', start: '2026-08-18', detail: 'Brand audit finished on 27 Aug.' },
      { name: 'Design', lead: 'Priya Nair', start: '2026-08-31', detail: "Round two concepts shared 25 Sep. We need your team's feedback to continue." },
      { name: 'Build', lead: 'Priya Nair', start: '2026-10-12', detail: 'Brand guidelines due 17 Oct.' },
      { name: 'Review', lead: 'Maya Chen', start: '2026-10-19', detail: 'Final review of guidelines and assets.' },
      { name: 'Launch', lead: 'Priya Nair', start: '2026-10-22', detail: 'Final asset handoff planned for 24 Oct.' },
    ],
    milestones: [
      { name: 'Brand audit', due: '2026-08-28', status: 'Done', completedOn: '2026-08-27' },
      { name: 'Logo concepts, round one', due: '2026-09-11', status: 'Done', completedOn: '2026-09-11' },
      { name: 'Logo concepts, round two', due: '2026-09-25', status: 'Done', completedOn: '2026-09-25' },
      { name: 'Client feedback on round two', due: '2026-10-02', status: 'In progress' },
      { name: 'Brand guidelines', due: '2026-10-17', status: 'Not started' },
      { name: 'Final asset handoff', due: '2026-10-24', status: 'Not started' },
    ],
    updates: [
      { date: '2026-09-25', summary: 'Shared round two logo concepts (three directions) with Iris for board review.' },
    ],
  },
  {
    key: 'atlas-site',
    client: 'atlas',
    name: 'Investor website',
    status: 'Done',
    owner: 'Maya Chen',
    startDate: '2026-06-30',
    dueDate: '2026-09-19',
    progress: 100,
    clientSummary: 'Launched on 19 September. Analytics are live and the handoff documentation is in your shared folder.',
    step: 6,
    estimate: '19 Sep',
    deliverable: 'new investor site',
    briefReceived: '2026-06-24',
    phases: [
      { name: 'Discovery', lead: 'Maya Chen', start: '2026-06-30', detail: 'Content outline delivered 16 Jul.' },
      { name: 'Design', lead: 'Priya Nair', start: '2026-07-20', detail: 'Design and copy approved 14 Aug.' },
      { name: 'Build', lead: 'Tom Okafor', start: '2026-08-17', detail: 'Pages built and loaded with approved copy.' },
      { name: 'Review', lead: 'Maya Chen', start: '2026-09-07', detail: 'Final review and analytics check.' },
      { name: 'Launch', lead: 'Maya Chen', start: '2026-09-15', detail: 'DNS switched at 10:00 on 19 Sep.' },
    ],
    milestones: [
      { name: 'Content outline', due: '2026-07-17', status: 'Done', completedOn: '2026-07-16' },
      { name: 'Design and copy approved', due: '2026-08-14', status: 'Done', completedOn: '2026-08-14' },
      { name: 'Launch', due: '2026-09-19', status: 'Done', completedOn: '2026-09-19' },
    ],
    updates: [
      { date: '2026-09-19', summary: 'Investor site launched. DNS switched at 10:00 and analytics confirmed live.' },
    ],
  },
  {
    key: 'atlas-docs',
    client: 'atlas',
    name: 'Developer docs migration',
    status: 'On track',
    owner: 'Tom Okafor',
    startDate: '2026-09-29',
    dueDate: '2026-12-12',
    progress: 10,
    clientSummary:
      "We're auditing the 140 existing docs pages and mapping them to the new structure. Expect the migration plan by 16 October.",
    step: 1,
    estimate: '12 Dec',
    deliverable: 'migrated docs',
    briefReceived: '2026-09-22',
    phases: [
      { name: 'Discovery', lead: 'Tom Okafor', start: '2026-09-29', detail: 'Audited 60 of 140 pages. Migration plan due 16 Oct.' },
      { name: 'Design', lead: 'Priya Nair', start: '2026-10-19', detail: 'New docs structure and page templates.' },
      { name: 'Build', lead: 'Tom Okafor', start: '2026-10-26', detail: 'Converter and first 50 pages due 13 Nov.' },
      { name: 'Review', lead: 'Maya Chen', start: '2026-11-23', detail: 'Review of migrated pages and redirects.' },
      { name: 'Launch', lead: 'Tom Okafor', start: '2026-12-07', detail: 'Full migration and redirects due 12 Dec.' },
    ],
    milestones: [
      { name: 'Docs audit', due: '2026-10-09', status: 'In progress' },
      { name: 'Migration plan', due: '2026-10-16', status: 'Not started' },
      { name: 'Converter and first 50 pages', due: '2026-11-13', status: 'Not started' },
      { name: 'Full migration and redirects', due: '2026-12-12', status: 'Not started' },
    ],
    updates: [
      { date: '2026-10-05', summary: 'Audited 60 of 140 pages. About a third are out of date and will be flagged for review.' },
      { date: '2026-09-29', summary: 'Kickoff call with Kofi. Agreed to keep existing URLs where possible.' },
    ],
  },
];

export const clientFor = (p: Project) => clients.find((c) => c.key === p.client)!;
