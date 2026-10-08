// All mock content for the replica lives in this file.
// Derived from ../../seed/seed.json (fictional agency "Fieldwork Studio"):
// clients -> initiatives, projects -> projects, milestones -> project milestones,
// seed updates -> project updates (Blocked -> Off track), internal notes -> comments.
// Extra weekly updates were written so each feed has some depth.

export type Health = 'onTrack' | 'atRisk' | 'offTrack';
export type ProjectStatus = 'backlog' | 'planned' | 'started' | 'paused' | 'completed' | 'canceled';
export type Priority = 0 | 1 | 2 | 3 | 4; // 0 none, 1 urgent, 2 high, 3 medium, 4 low

export interface User {
  id: string;
  name: string; // display name, as Linear shows it
  fullName: string;
  role: string;
  color: string; // avatar background
  email: string;
}

export interface Initiative {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  status: 'planned' | 'active' | 'completed';
  targetLabel: string;
  icon: string; // emoji-free glyph key, see icons
  color: string;
  contact: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  targetDate: string;
  completedOn?: string;
  issues: number;
  done: number;
  description?: string;
}

export interface Project {
  id: string;
  key: string;
  initiativeId: string;
  name: string;
  summary: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  leadId: string;
  memberIds: string[];
  startDate: string;
  targetDate: string;
  progress: number;
  scope: number; // issue count
  icon: string;
  color: string;
  labels: { name: string; color: string }[];
  resources: { name: string; kind: 'doc' | 'link' | 'figma' }[];
}

export interface Reaction {
  emoji: string;
  userIds: string[];
}

export interface Comment {
  id: string;
  authorId: string;
  createdAt: string;
  body: string;
  reactions?: Reaction[];
}

export interface Update {
  id: string;
  projectId?: string;
  initiativeId?: string;
  authorId: string;
  createdAt: string;
  editedAt?: string;
  health: Health;
  body: string; // small Markdown subset: paragraphs, "- " bullets, **bold**, *italic*, `code`, [text](url)
  reactions: Reaction[];
  comments: Comment[];
  progress?: { from: number; to: number; milestone?: string };
}

export interface ActivityEvent {
  id: string;
  projectId: string;
  actorId: string;
  createdAt: string;
  text: string; // rendered after the actor's name
  kind: 'status' | 'target' | 'milestone' | 'lead' | 'member' | 'created';
}

export const WORKSPACE = { name: 'Fieldwork Studio', initials: 'FS', team: 'Studio', teamKey: 'FWS' };

// The clock the replica runs on. Relative times ("3d ago") are computed against it.
export const MOCK_NOW = '2026-10-08T16:20:00';

export const users: User[] = [
  { id: 'maya', name: 'maya', fullName: 'Maya Chen', role: 'Project manager', color: '#5e6ad2', email: 'maya@fieldwork.example' },
  { id: 'tom', name: 'tom', fullName: 'Tom Okafor', role: 'Development lead', color: '#26b5ce', email: 'tom@fieldwork.example' },
  { id: 'priya', name: 'priya', fullName: 'Priya Nair', role: 'Design lead', color: '#f2994a', email: 'priya@fieldwork.example' },
];

export const CURRENT_USER_ID = 'maya';

export const initiatives: Initiative[] = [
  {
    id: 'harbor', name: 'Harbor & Pine Coffee', ownerId: 'tom', status: 'active', targetLabel: 'Q4 2026', icon: 'cup', color: '#4cb782',
    description: 'Online shop rebuild for a three-café roaster. Contact: Dana Ruiz.', contact: 'Dana Ruiz',
  },
  {
    id: 'meridian', name: 'Meridian Family Clinic', ownerId: 'maya', status: 'active', targetLabel: 'Q4 2026', icon: 'cross', color: '#eb5757',
    description: 'Patient intake portal connected to the clinic’s records system. Contact: Dr. Sam Patel.', contact: 'Dr. Sam Patel',
  },
  {
    id: 'lumen', name: 'Lumen Books', ownerId: 'priya', status: 'active', targetLabel: 'Q4 2026', icon: 'book', color: '#f2c94c',
    description: 'Brand refresh for an independent publisher. Contact: Iris Novak.', contact: 'Iris Novak',
  },
  {
    id: 'atlas', name: 'Atlas Robotics', ownerId: 'maya', status: 'active', targetLabel: 'Q4 2026', icon: 'bolt', color: '#26b5ce',
    description: 'Investor website (launched) and the developer docs migration. Contact: Kofi Mensah.', contact: 'Kofi Mensah',
  },
];

export const projects: Project[] = [
  {
    id: 'harbor-shop', key: 'FWS-P1', initiativeId: 'harbor', name: 'Online shop rebuild',
    summary: 'Replace the old shop with a faster storefront, subscriptions and wholesale ordering.',
    description:
      'The product catalogue is fully imported. We’re now building checkout and payments, on schedule for a mid-November launch.\n\n**Scope**\n\n- New storefront on the existing domain, with product pages, cart and checkout\n- Coffee subscriptions with pause and skip\n- Wholesale price lists for café accounts\n\n**Out of scope**\n\n- Point-of-sale integration (phase two)',
    status: 'started', priority: 2, leadId: 'tom', memberIds: ['tom', 'priya', 'maya'],
    startDate: '2026-08-04', targetDate: '2026-11-14', progress: 60, scope: 48, icon: 'cart', color: '#4cb782',
    labels: [{ name: 'Build', color: '#5e6ad2' }, { name: 'E-commerce', color: '#4cb782' }],
    resources: [{ name: 'Shop spec', kind: 'doc' }, { name: 'Storefront designs', kind: 'figma' }, { name: 'Launch checklist', kind: 'doc' }],
  },
  {
    id: 'meridian-portal', key: 'FWS-P2', initiativeId: 'meridian', name: 'Patient intake portal',
    summary: 'Online intake forms and a patient dashboard that write straight into the clinic’s records.',
    description:
      'Forms and the patient dashboard are built. Connecting to your records system is waiting on sandbox access from your EHR vendor, which puts the 30 October go-live at risk.\n\n**Goals**\n\n- Patients complete intake before arriving, on any device\n- Front-desk staff stop re-keying forms into the records system\n- The portal passes a WCAG 2.2 AA audit before launch',
    status: 'started', priority: 1, leadId: 'maya', memberIds: ['maya', 'tom', 'priya'],
    startDate: '2026-07-14', targetDate: '2026-10-30', progress: 70, scope: 64, icon: 'clipboard', color: '#eb5757',
    labels: [{ name: 'Build', color: '#5e6ad2' }, { name: 'Integration', color: '#f2994a' }],
    resources: [{ name: 'Requirements', kind: 'doc' }, { name: 'Form designs', kind: 'figma' }, { name: 'EHR API notes', kind: 'link' }],
  },
  {
    id: 'lumen-brand', key: 'FWS-P3', initiativeId: 'lumen', name: 'Brand refresh',
    summary: 'New logo, type and colour system, and brand guidelines for the 2027 catalogue.',
    description:
      'Round two logo concepts were shared on 25 September. We need your team’s feedback before we can start the brand guidelines.\n\n**Deliverables**\n\n- Primary and secondary logo, with spine and colophon versions\n- Colour and type system\n- Brand guidelines (PDF and web)',
    status: 'started', priority: 3, leadId: 'priya', memberIds: ['priya', 'maya'],
    startDate: '2026-08-18', targetDate: '2026-10-24', progress: 45, scope: 30, icon: 'pen', color: '#f2c94c',
    labels: [{ name: 'Design', color: '#f2c94c' }],
    resources: [{ name: 'Brand audit', kind: 'doc' }, { name: 'Logo concepts', kind: 'figma' }],
  },
  {
    id: 'atlas-site', key: 'FWS-P4', initiativeId: 'atlas', name: 'Investor website',
    summary: 'A small, fast site for the Series B: story, team, press and investor contact.',
    description:
      'Launched on 19 September. Analytics are live and the handoff documentation is in your shared folder.',
    status: 'completed', priority: 2, leadId: 'maya', memberIds: ['maya', 'priya', 'tom'],
    startDate: '2026-06-30', targetDate: '2026-09-19', progress: 100, scope: 36, icon: 'globe', color: '#26b5ce',
    labels: [{ name: 'Launch', color: '#4cb782' }],
    resources: [{ name: 'Handoff documentation', kind: 'doc' }, { name: 'Site designs', kind: 'figma' }],
  },
  {
    id: 'atlas-docs', key: 'FWS-P5', initiativeId: 'atlas', name: 'Developer docs migration',
    summary: 'Move 140 developer docs pages to the new docs platform without breaking links.',
    description:
      'We’re auditing the 140 existing docs pages and mapping them to the new structure. Expect the migration plan by 16 October.\n\n**Approach**\n\n- Audit every page and flag anything out of date\n- Build a converter for the old Markdown dialect\n- Migrate in two batches, with redirects for every old URL',
    status: 'started', priority: 3, leadId: 'tom', memberIds: ['tom', 'maya'],
    startDate: '2026-09-29', targetDate: '2026-12-12', progress: 10, scope: 52, icon: 'book', color: '#26b5ce',
    labels: [{ name: 'Discovery', color: '#bb87fc' }],
    resources: [{ name: 'Docs audit sheet', kind: 'link' }],
  },
];

export const milestones: Milestone[] = [
  { id: 'm1', projectId: 'harbor-shop', name: 'Discovery workshop', targetDate: '2026-08-08', completedOn: '2026-08-08', issues: 4, done: 4 },
  { id: 'm2', projectId: 'harbor-shop', name: 'Design sign-off', targetDate: '2026-09-05', completedOn: '2026-09-04', issues: 9, done: 9 },
  { id: 'm3', projectId: 'harbor-shop', name: 'Product catalogue import', targetDate: '2026-09-26', completedOn: '2026-09-25', issues: 11, done: 11 },
  { id: 'm4', projectId: 'harbor-shop', name: 'Checkout and payments', targetDate: '2026-10-17', issues: 12, done: 5 },
  { id: 'm5', projectId: 'harbor-shop', name: 'Content load and QA', targetDate: '2026-10-31', issues: 8, done: 0 },
  { id: 'm6', projectId: 'harbor-shop', name: 'Launch', targetDate: '2026-11-14', issues: 4, done: 0 },

  { id: 'm7', projectId: 'meridian-portal', name: 'Requirements sign-off', targetDate: '2026-07-25', completedOn: '2026-07-24', issues: 6, done: 6 },
  { id: 'm8', projectId: 'meridian-portal', name: 'Form designs approved', targetDate: '2026-08-22', completedOn: '2026-08-26', issues: 10, done: 10 },
  { id: 'm9', projectId: 'meridian-portal', name: 'EHR integration', targetDate: '2026-10-10', issues: 16, done: 9 },
  { id: 'm10', projectId: 'meridian-portal', name: 'Accessibility audit', targetDate: '2026-10-20', issues: 8, done: 0 },
  { id: 'm11', projectId: 'meridian-portal', name: 'Staff training', targetDate: '2026-10-27', issues: 4, done: 0 },
  { id: 'm12', projectId: 'meridian-portal', name: 'Go-live', targetDate: '2026-10-30', issues: 3, done: 0 },

  { id: 'm13', projectId: 'lumen-brand', name: 'Brand audit', targetDate: '2026-08-28', completedOn: '2026-08-27', issues: 5, done: 5 },
  { id: 'm14', projectId: 'lumen-brand', name: 'Logo concepts, round one', targetDate: '2026-09-11', completedOn: '2026-09-11', issues: 4, done: 4 },
  { id: 'm15', projectId: 'lumen-brand', name: 'Logo concepts, round two', targetDate: '2026-09-25', completedOn: '2026-09-25', issues: 4, done: 4 },
  { id: 'm16', projectId: 'lumen-brand', name: 'Client feedback on round two', targetDate: '2026-10-02', issues: 2, done: 0 },
  { id: 'm17', projectId: 'lumen-brand', name: 'Brand guidelines', targetDate: '2026-10-17', issues: 9, done: 0 },
  { id: 'm18', projectId: 'lumen-brand', name: 'Final asset handoff', targetDate: '2026-10-24', issues: 6, done: 0 },

  { id: 'm19', projectId: 'atlas-site', name: 'Content outline', targetDate: '2026-07-17', completedOn: '2026-07-16', issues: 7, done: 7 },
  { id: 'm20', projectId: 'atlas-site', name: 'Design and copy approved', targetDate: '2026-08-14', completedOn: '2026-08-14', issues: 14, done: 14 },
  { id: 'm21', projectId: 'atlas-site', name: 'Launch', targetDate: '2026-09-19', completedOn: '2026-09-19', issues: 15, done: 15 },

  { id: 'm22', projectId: 'atlas-docs', name: 'Docs audit', targetDate: '2026-10-09', issues: 10, done: 5 },
  { id: 'm23', projectId: 'atlas-docs', name: 'Migration plan', targetDate: '2026-10-16', issues: 5, done: 0 },
  { id: 'm24', projectId: 'atlas-docs', name: 'Converter and first 50 pages', targetDate: '2026-11-13', issues: 18, done: 0 },
  { id: 'm25', projectId: 'atlas-docs', name: 'Full migration and redirects', targetDate: '2026-12-12', issues: 19, done: 0 },
];

const r = (emoji: string, ...userIds: string[]): Reaction => ({ emoji, userIds });

export const updates: Update[] = [
  // ---- Online shop rebuild (Harbor & Pine) ----
  {
    id: 'u-hs-1', projectId: 'harbor-shop', authorId: 'tom', createdAt: '2026-08-07T15:10:00', health: 'onTrack',
    body: 'Kicked off with Dana on Tuesday. The discovery workshop is booked for Friday 8 August at the Pine Street café.\n\nThis week we inventoried the old shop: 212 products, 38 with variants, and a subscriptions plugin we’ll replace rather than migrate.',
    reactions: [r('👍', 'maya')], comments: [],
  },
  {
    id: 'u-hs-2', projectId: 'harbor-shop', authorId: 'tom', createdAt: '2026-08-21T16:00:00', health: 'onTrack',
    body: 'Discovery is done and wireframes for the product page, cart and subscription flow are with Dana.\n\n- Agreed to keep the current URLs for the top 40 products\n- Wholesale stays a separate price list, not a separate shop',
    reactions: [], comments: [],
    progress: { from: 4, to: 12, milestone: 'Discovery workshop' },
  },
  {
    id: 'u-hs-3', projectId: 'harbor-shop', authorId: 'priya', createdAt: '2026-09-04T17:30:00', health: 'onTrack',
    body: 'Design signed off on 4 September, a day early. Dana asked for a warmer product photo treatment, which we folded into the final files.\n\nNext up is the catalogue import.',
    reactions: [r('🎉', 'tom', 'maya')], comments: [],
    progress: { from: 12, to: 27, milestone: 'Design sign-off' },
  },
  {
    id: 'u-hs-4', projectId: 'harbor-shop', authorId: 'tom', createdAt: '2026-09-18T15:45:00', health: 'onTrack',
    body: 'Catalogue import is about two thirds through: 140 of 212 products are in, with photos. Variant mapping took longer than expected for the gift boxes, but we’re still on track for the 26 September milestone.',
    reactions: [], comments: [],
  },
  {
    id: 'u-hs-5', projectId: 'harbor-shop', authorId: 'tom', createdAt: '2026-09-25T16:20:00', health: 'onTrack',
    body: 'All 212 products imported with photos and variants. We spot-checked 30 against the old shop and found no pricing differences.\n\nStarting checkout and payments next week.',
    reactions: [r('🚀', 'maya', 'priya'), r('🙌', 'maya')],
    comments: [
      { id: 'c-hs-5-1', authorId: 'maya', createdAt: '2026-09-25T17:02:00', body: 'Great work. I’ll let Dana know the import is done so she can start writing product copy.' },
    ],
    progress: { from: 27, to: 48, milestone: 'Product catalogue import' },
  },
  {
    id: 'u-hs-6', projectId: 'harbor-shop', authorId: 'tom', createdAt: '2026-10-02T15:00:00', health: 'atRisk',
    body: 'Checkout is built in test mode, but we can’t test live payments until Dana adds me as a developer on the payments account. It’s in her name, so only she can do it.\n\nIf access lands by Tuesday we keep the 17 October milestone.',
    reactions: [r('👀', 'maya')],
    comments: [
      { id: 'c-hs-6-1', authorId: 'maya', createdAt: '2026-10-02T15:40:00', body: 'Sent Dana the step-by-step guide this afternoon. She said she’ll do it Monday morning.' },
      { id: 'c-hs-6-2', authorId: 'tom', createdAt: '2026-10-02T15:52:00', body: 'Thanks. I’ll keep working on the subscription pause and skip flow meanwhile.' },
    ],
  },
  {
    id: 'u-hs-7', projectId: 'harbor-shop', authorId: 'tom', createdAt: '2026-10-07T16:05:00', health: 'onTrack',
    body: 'Back on track. Dana added me to the payments account on Monday and the first live test order went through end to end.\n\n- Card and wallet payments work in production mode\n- Subscription pause and skip are done\n- Wholesale price lists are next, then content load and QA from 20 October\n\nStill on schedule for the 14 November launch.',
    reactions: [r('🔥', 'maya', 'priya'), r('🙌', 'priya')],
    comments: [
      { id: 'c-hs-7-1', authorId: 'priya', createdAt: '2026-10-07T17:15:00', body: 'Nice. I’ll have the wholesale price list screens ready for you by Friday.' },
    ],
    progress: { from: 48, to: 60, milestone: 'Checkout and payments' },
  },

  // ---- Patient intake portal (Meridian) ----
  {
    id: 'u-mp-1', projectId: 'meridian-portal', authorId: 'maya', createdAt: '2026-07-17T14:00:00', health: 'onTrack',
    body: 'Kickoff with Dr. Patel and the front-desk team. We mapped the six paper intake forms and agreed the portal must write into the records system directly, not via PDF.',
    reactions: [], comments: [],
  },
  {
    id: 'u-mp-2', projectId: 'meridian-portal', authorId: 'maya', createdAt: '2026-07-24T16:30:00', health: 'onTrack',
    body: 'Requirements signed off a day early. The integration needs sandbox access from the clinic’s EHR vendor, so we’ve asked Sam to start that request now rather than in September.',
    reactions: [r('👍', 'tom')], comments: [],
    progress: { from: 0, to: 9, milestone: 'Requirements sign-off' },
  },
  {
    id: 'u-mp-3', projectId: 'meridian-portal', authorId: 'priya', createdAt: '2026-08-21T15:20:00', health: 'atRisk',
    body: 'Form designs are ready, but the clinic’s privacy officer is away until 25 August and must approve the consent wording. Approval will slip past the 22 August milestone by a few days.',
    reactions: [], comments: [],
  },
  {
    id: 'u-mp-4', projectId: 'meridian-portal', authorId: 'maya', createdAt: '2026-08-28T16:00:00', health: 'onTrack',
    body: 'Form designs approved on 26 August. The four-day slip is absorbed by the build buffer, so go-live stays on 30 October.',
    reactions: [r('🙌', 'priya')], comments: [],
    progress: { from: 9, to: 25, milestone: 'Form designs approved' },
  },
  {
    id: 'u-mp-5', projectId: 'meridian-portal', authorId: 'tom', createdAt: '2026-09-11T15:30:00', health: 'onTrack',
    body: 'Build is moving quickly. The patient dashboard and four of the six forms are in staging. Still no sandbox keys from the EHR vendor; Sam chased them on Wednesday.',
    reactions: [], comments: [],
  },
  {
    id: 'u-mp-6', projectId: 'meridian-portal', authorId: 'maya', createdAt: '2026-09-30T16:10:00', health: 'onTrack',
    body: 'The patient dashboard and all six intake forms are built and in staging. Front-desk staff tested them on Monday and asked only for larger tap targets on the insurance form.\n\nThe EHR integration is the remaining risk: we still don’t have sandbox access.',
    reactions: [r('👍', 'tom', 'priya')],
    comments: [
      { id: 'c-mp-6-1', authorId: 'maya', createdAt: '2026-09-30T16:30:00', body: 'Internal: asked the vendor’s support for sandbox API keys a second time on 28 Sep (ticket #48213).' },
    ],
    progress: { from: 25, to: 62 },
  },
  {
    id: 'u-mp-7', projectId: 'meridian-portal', authorId: 'maya', createdAt: '2026-10-05T15:45:00', health: 'atRisk',
    body: 'Still waiting on EHR sandbox access. **Go-live on 30 October is at risk if access isn’t granted by 10 October.**\n\n- Everything that doesn’t need the records system is done and tested\n- We’ve built the integration against the vendor’s published API docs, so the remaining work is about four days once keys arrive\n- If access lands after 10 October, we’d propose launching forms with PDF export first and switching on the integration later',
    reactions: [r('👀', 'tom', 'priya'), r('✋', 'tom')],
    comments: [
      { id: 'c-mp-7-1', authorId: 'tom', createdAt: '2026-10-05T16:20:00', body: 'The PDF fallback is about a day of work. I can start it Thursday if we still have nothing.' },
      { id: 'c-mp-7-2', authorId: 'maya', createdAt: '2026-10-06T09:05:00', body: 'Internal: escalating to Sam if nothing arrives by Thursday 8 Oct.', reactions: [r('👍', 'tom')] },
    ],
    progress: { from: 62, to: 70, milestone: 'EHR integration' },
  },

  // ---- Brand refresh (Lumen Books) ----
  {
    id: 'u-lb-1', projectId: 'lumen-brand', authorId: 'priya', createdAt: '2026-08-20T15:00:00', health: 'onTrack',
    body: 'Kicked off with Iris. We’re auditing every place the current logo appears, from spines to the shop window, before sketching anything.',
    reactions: [], comments: [],
  },
  {
    id: 'u-lb-2', projectId: 'lumen-brand', authorId: 'priya', createdAt: '2026-08-28T16:40:00', health: 'onTrack',
    body: 'Brand audit complete: 46 touchpoints, and the logo fails at spine width on 30% of current titles. That becomes the main brief for round one.',
    reactions: [r('💡', 'maya')], comments: [],
    progress: { from: 0, to: 17, milestone: 'Brand audit' },
  },
  {
    id: 'u-lb-3', projectId: 'lumen-brand', authorId: 'priya', createdAt: '2026-09-11T17:00:00', health: 'onTrack',
    body: 'Round one concepts shared: five directions, each shown on a spine, a tote and the website header. Iris and the editorial team will reply by 16 September.',
    reactions: [], comments: [],
    progress: { from: 17, to: 30, milestone: 'Logo concepts, round one' },
  },
  {
    id: 'u-lb-4', projectId: 'lumen-brand', authorId: 'priya', createdAt: '2026-09-25T16:00:00', health: 'onTrack',
    body: 'Shared round two logo concepts (three directions) with Iris for board review.\n\n- **Colophon**: a refined version of the current lamp mark\n- **Open book**: a monogram that works at spine width\n- **Lumen serif**: a custom wordmark with no symbol',
    reactions: [r('😍', 'maya'), r('🔥', 'tom')], comments: [],
    progress: { from: 30, to: 45, milestone: 'Logo concepts, round two' },
  },
  {
    id: 'u-lb-5', projectId: 'lumen-brand', authorId: 'priya', createdAt: '2026-10-01T15:30:00', health: 'atRisk',
    body: 'Iris replied that the board reviews the logos on 9 October, so we won’t have feedback before then. Brand guidelines can’t start until a direction is chosen.',
    reactions: [], comments: [
      { id: 'c-lb-5-1', authorId: 'maya', createdAt: '2026-10-01T16:00:00', body: 'Internal: due date will slip a week if feedback lands after 9 Oct. Let’s flag it in the client update.' },
    ],
  },
  {
    id: 'u-lb-6', projectId: 'lumen-brand', authorId: 'priya', createdAt: '2026-10-06T16:30:00', health: 'offTrack',
    body: 'Blocked on client feedback. Round two concepts were shared on 25 September and the board meets on 9 October.\n\nGuidelines take about two weeks once a direction is picked, so the 24 October handoff will likely move to 31 October. We’ll confirm the new date after the board meeting.',
    reactions: [r('👀', 'maya')],
    comments: [
      { id: 'c-lb-6-1', authorId: 'maya', createdAt: '2026-10-06T17:10:00', body: 'I’ll call Iris on Friday after the board meets so we can start Monday.' },
    ],
  },

  // ---- Investor website (Atlas) ----
  {
    id: 'u-as-1', projectId: 'atlas-site', authorId: 'maya', createdAt: '2026-07-03T15:00:00', health: 'onTrack',
    body: 'Kickoff with Kofi. The site needs to be live before the Series B announcement on 22 September, so 19 September is a hard date.',
    reactions: [], comments: [],
  },
  {
    id: 'u-as-2', projectId: 'atlas-site', authorId: 'maya', createdAt: '2026-07-17T16:00:00', health: 'onTrack',
    body: 'Content outline approved a day early. Five pages: story, product, team, press and investor contact.',
    reactions: [r('👍', 'priya')], comments: [],
    progress: { from: 0, to: 19, milestone: 'Content outline' },
  },
  {
    id: 'u-as-3', projectId: 'atlas-site', authorId: 'priya', createdAt: '2026-08-14T17:00:00', health: 'onTrack',
    body: 'Design and copy approved. Kofi’s team supplied the robot footage, which we’re using as the home page header.',
    reactions: [r('🎉', 'maya', 'tom')], comments: [],
    progress: { from: 19, to: 58, milestone: 'Design and copy approved' },
  },
  {
    id: 'u-as-4', projectId: 'atlas-site', authorId: 'tom', createdAt: '2026-09-04T15:30:00', health: 'onTrack',
    body: 'Build complete and in review. Lighthouse scores are 98+ on every page. DNS switch is scheduled for 10:00 on 19 September.',
    reactions: [], comments: [],
    progress: { from: 58, to: 86 },
  },
  {
    id: 'u-as-5', projectId: 'atlas-site', authorId: 'maya', createdAt: '2026-09-19T11:30:00', health: 'onTrack',
    body: 'Investor site launched. DNS switched at 10:00 and analytics are confirmed live.',
    reactions: [r('🚀', 'tom', 'priya'), r('🎉', 'tom')], comments: [
      { id: 'c-as-5-1', authorId: 'tom', createdAt: '2026-09-19T11:45:00', body: 'Redirects from the old holding page are working too.' },
    ],
    progress: { from: 86, to: 100, milestone: 'Launch' },
  },
  {
    id: 'u-as-6', projectId: 'atlas-site', authorId: 'maya', createdAt: '2026-09-22T10:00:00', health: 'onTrack',
    body: 'Launched on 19 September. Analytics are live and the handoff documentation is in the shared folder. Marking the project complete.',
    reactions: [], comments: [
      { id: 'c-as-6-1', authorId: 'maya', createdAt: '2026-09-22T10:05:00', body: 'Internal: invoice for the final 30% sent 22 Sep.' },
    ],
  },

  // ---- Developer docs migration (Atlas) ----
  {
    id: 'u-ad-1', projectId: 'atlas-docs', authorId: 'tom', createdAt: '2026-09-30T15:00:00', health: 'onTrack',
    body: 'Kickoff call with Kofi. We agreed to keep existing URLs where possible and to redirect the rest, so no links in the wild break.',
    reactions: [r('👍', 'maya')], comments: [],
  },
  {
    id: 'u-ad-2', projectId: 'atlas-docs', authorId: 'tom', createdAt: '2026-10-06T16:00:00', health: 'onTrack',
    body: 'Audited 60 of 140 pages. About a third are out of date and will be flagged for review by Kofi’s engineers.\n\nExpect the migration plan by **16 October**.',
    reactions: [r('👀', 'maya')],
    comments: [
      { id: 'c-ad-2-1', authorId: 'tom', createdAt: '2026-10-06T16:10:00', body: 'Internal: the old docs use a custom Markdown dialect, so I’m budgeting extra time for the converter.' },
    ],
    progress: { from: 0, to: 10, milestone: 'Docs audit' },
  },

  // ---- Initiative updates (one rollup per client) ----
  {
    id: 'u-i-harbor', initiativeId: 'harbor', authorId: 'tom', createdAt: '2026-10-07T17:00:00', health: 'onTrack',
    body: 'Payments access arrived on Monday and checkout is working in production mode. The shop is on schedule for the 14 November launch.',
    reactions: [], comments: [],
  },
  {
    id: 'u-i-meridian', initiativeId: 'meridian', authorId: 'maya', createdAt: '2026-10-05T16:30:00', health: 'atRisk',
    body: 'Everything except the records-system connection is done. Go-live on 30 October depends on the EHR vendor granting sandbox access by 10 October.',
    reactions: [], comments: [],
  },
  {
    id: 'u-i-lumen', initiativeId: 'lumen', authorId: 'priya', createdAt: '2026-10-06T17:00:00', health: 'offTrack',
    body: 'Waiting on the board’s logo decision on 9 October. Final handoff will likely move from 24 to 31 October.',
    reactions: [], comments: [],
  },
  {
    id: 'u-i-atlas', initiativeId: 'atlas', authorId: 'maya', createdAt: '2026-10-06T17:20:00', health: 'onTrack',
    body: 'Investor site launched on 19 September. The docs migration started on 29 September and the plan is due 16 October.',
    reactions: [], comments: [],
  },
];

export const activity: ActivityEvent[] = [
  { id: 'a1', projectId: 'harbor-shop', actorId: 'tom', createdAt: '2026-08-04T09:10:00', kind: 'status', text: 'changed status from Planned to In Progress' },
  { id: 'a2', projectId: 'harbor-shop', actorId: 'maya', createdAt: '2026-08-04T09:30:00', kind: 'member', text: 'added priya to members' },
  { id: 'a3', projectId: 'meridian-portal', actorId: 'maya', createdAt: '2026-07-14T10:00:00', kind: 'status', text: 'changed status from Planned to In Progress' },
  { id: 'a4', projectId: 'meridian-portal', actorId: 'maya', createdAt: '2026-08-26T11:00:00', kind: 'target', text: 'moved milestone Form designs approved from Aug 22 to Aug 26' },
  { id: 'a5', projectId: 'lumen-brand', actorId: 'priya', createdAt: '2026-08-18T09:00:00', kind: 'status', text: 'changed status from Planned to In Progress' },
  { id: 'a6', projectId: 'lumen-brand', actorId: 'priya', createdAt: '2026-08-19T12:00:00', kind: 'target', text: 'set target date to Oct 24' },
  { id: 'a7', projectId: 'atlas-site', actorId: 'maya', createdAt: '2026-06-30T09:00:00', kind: 'status', text: 'changed status from Planned to In Progress' },
  { id: 'a8', projectId: 'atlas-site', actorId: 'maya', createdAt: '2026-09-22T10:02:00', kind: 'status', text: 'changed status from In Progress to Completed' },
  { id: 'a9', projectId: 'atlas-docs', actorId: 'tom', createdAt: '2026-09-29T09:00:00', kind: 'status', text: 'changed status from Planned to In Progress' },
  { id: 'a10', projectId: 'atlas-docs', actorId: 'maya', createdAt: '2026-09-29T09:20:00', kind: 'lead', text: 'set lead to tom' },
];
