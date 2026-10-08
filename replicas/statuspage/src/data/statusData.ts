// All mock content for the replica lives in this file.
//
// Source: ../../../seed/seed.json (fictional agency "Fieldwork Studio").
// Mapping used:
//   - one status page per client; components are the workstreams of each
//     project (grouped by project when a client has more than one project)
//   - project status -> component state: On track -> operational,
//     At risk -> degraded_performance, Blocked -> partial_outage or
//     major_outage, Done -> operational
//   - client-visible updates and client-facing blockers -> incidents
//     (updates marked client_visible: false and internal notes are left out)
//   - upcoming milestones -> scheduled maintenance; the milestone in progress
//     on Atlas's docs project is shown as maintenance in progress
//   - incidents before the seed's first update are invented to give each page
//     a plausible 90-day history
//
// Times are London wall-clock times written as 'YYYY-MM-DDTHH:MM'. The page
// labels them BST or GMT by date.

export type ComponentStatus =
  | 'operational'
  | 'degraded_performance'
  | 'partial_outage'
  | 'major_outage'
  | 'under_maintenance'

export type Impact = 'none' | 'minor' | 'major' | 'critical' | 'maintenance'

export type UpdateStatus =
  | 'investigating'
  | 'identified'
  | 'monitoring'
  | 'update'
  | 'resolved'
  | 'scheduled'
  | 'in_progress'
  | 'verifying'
  | 'completed'

export interface StatusComponent {
  id: string
  name: string
  description?: string
  /** Name of the component group (project) this workstream belongs to. */
  group?: string
  status: ComponentStatus
  /** First day with uptime data (the project's start date). */
  since: string
}

export interface ComponentGroup {
  name: string
  description?: string
}

export interface IncidentUpdate {
  status: UpdateStatus
  at: string
  body: string
}

export interface Incident {
  id: string
  name: string
  impact: Impact
  /** Effect on each affected component while the incident was open. */
  components: Record<string, ComponentStatus>
  updates: IncidentUpdate[]
  /** Only for maintenance: the announced window. */
  scheduledFor?: string
  scheduledUntil?: string
}

export interface ClientPage {
  key: string
  name: string
  contact: string
  /** Shown in the "About This Site" text block. */
  about: string
  /** Statuspage's component layout setting. Two columns is what githubstatus.com uses. */
  layout?: 'one-column' | 'two-columns'
  groups: ComponentGroup[]
  components: StatusComponent[]
  incidents: Incident[]
}

export const agency = {
  name: 'Fieldwork Studio',
  shortMark: 'FS',
  supportEmail: 'hello@fieldwork.example',
}

/** The moment the mock data describes. Everything is rendered relative to it. */
export const NOW = '2026-10-08T15:00'

export const clients: ClientPage[] = [
  // ---------------------------------------------------------------------------
  {
    key: 'harbor',
    name: 'Harbor & Pine Coffee',
    contact: 'Dana Ruiz',
    layout: 'two-columns',
    about:
      'Live progress on the Online shop rebuild for Harbor & Pine Coffee. Each line below is one workstream; incidents are anything that could move the 14 November launch.',
    groups: [],
    components: [
      {
        id: 'harbor-design',
        name: 'Design',
        description: 'Page designs and the visual system for the new shop. Signed off 4 September.',
        status: 'operational',
        since: '2026-08-04',
      },
      {
        id: 'harbor-catalogue',
        name: 'Product catalogue',
        description: 'All 212 products with photos, variants and stock levels.',
        status: 'operational',
        since: '2026-08-04',
      },
      {
        id: 'harbor-checkout',
        name: 'Checkout and payments',
        description: 'Basket, checkout flow, shipping rates and card payments.',
        status: 'operational',
        since: '2026-08-04',
      },
      {
        id: 'harbor-content',
        name: 'Content and QA',
        description: 'Final page copy, testing on phones and desktop browsers, and launch checks.',
        status: 'operational',
        since: '2026-08-04',
      },
    ],
    incidents: [
      {
        id: 'h7kq2m1x9d0a',
        name: 'Discovery workshop complete',
        impact: 'none',
        components: { 'harbor-design': 'operational' },
        updates: [
          {
            status: 'resolved',
            at: '2026-08-08T17:20',
            body: 'We ran the discovery workshop with your team today. Notes, the agreed sitemap and the priority list are in the shared folder.',
          },
        ],
      },
      {
        id: 'h2c8v4n6b1zs',
        name: 'Design review moved by two days',
        impact: 'minor',
        components: { 'harbor-design': 'degraded_performance' },
        updates: [
          {
            status: 'investigating',
            at: '2026-08-19T10:05',
            body: "The homepage and product page designs need another pass after Monday's review. We're reworking the product gallery and will share revised designs on Thursday.",
          },
          {
            status: 'resolved',
            at: '2026-08-21T16:30',
            body: 'Revised homepage and product page designs were shared this afternoon. The design sign-off date of 5 September is unchanged.',
          },
        ],
      },
      {
        id: 'h9p3r5t7y2ul',
        name: 'Designs signed off',
        impact: 'none',
        components: { 'harbor-design': 'operational' },
        updates: [
          {
            status: 'resolved',
            at: '2026-09-04T15:10',
            body: 'Dana signed off the final designs a day early. Building the shop starts on Monday.',
          },
        ],
      },
      {
        id: 'h4f6g8j0k2qw',
        name: 'Staging shop unavailable',
        impact: 'critical',
        components: { 'harbor-catalogue': 'major_outage', 'harbor-checkout': 'major_outage' },
        updates: [
          {
            status: 'investigating',
            at: '2026-09-11T14:20',
            body: "The staging shop is returning errors, so product pages can't be reviewed right now. We're looking into it.",
          },
          {
            status: 'identified',
            at: '2026-09-11T14:55',
            body: "A failed database migration from this morning's import run is the cause. We're restoring last night's backup.",
          },
          {
            status: 'monitoring',
            at: '2026-09-11T16:30',
            body: "The staging shop is back up with last night's data. We're re-running today's import and watching for errors.",
          },
          {
            status: 'resolved',
            at: '2026-09-11T17:05',
            body: "Today's import completed and staging is fully available again. No product data was lost.",
          },
        ],
      },
      {
        id: 'h1s3d5f7g9hj',
        name: 'Product photos missing on some variants',
        impact: 'major',
        components: { 'harbor-catalogue': 'partial_outage' },
        updates: [
          {
            status: 'investigating',
            at: '2026-09-17T11:40',
            body: "About 40 product variants show a placeholder instead of a photo on staging. We're checking the image export from your old shop.",
          },
          {
            status: 'identified',
            at: '2026-09-17T15:15',
            body: "The old shop's export skipped photos attached to variants rather than products. We're writing a script to copy them across directly.",
          },
          {
            status: 'resolved',
            at: '2026-09-18T10:30',
            body: 'Every variant now has its photo. We checked each of the 40 affected products by hand.',
          },
        ],
      },
      {
        id: 'h6z8x0c2v4bn',
        name: 'Product catalogue import complete',
        impact: 'none',
        components: { 'harbor-catalogue': 'operational' },
        updates: [
          {
            status: 'resolved',
            at: '2026-09-25T17:45',
            body: 'All 212 products imported with photos and variants. Spot-checked 30 against the old shop.',
          },
        ],
      },
      {
        id: 'h3m5n7b9v1cx',
        name: 'Shipping rates wrong for Highlands and Islands postcodes',
        impact: 'minor',
        components: { 'harbor-checkout': 'degraded_performance' },
        updates: [
          {
            status: 'investigating',
            at: '2026-10-06T09:40',
            body: 'Test orders to some Scottish postcodes are being charged the standard mainland rate. Only the staging shop is affected.',
          },
          {
            status: 'identified',
            at: '2026-10-06T13:00',
            body: "Postcode zones for remote areas were missing from the rate table we imported. We're adding them.",
          },
          {
            status: 'resolved',
            at: '2026-10-07T11:20',
            body: "Shipping rates for every UK postcode zone now match your courier's price list.",
          },
        ],
      },
      {
        id: 'h8w0e2r4t6ya',
        name: 'Checkout and payments walkthrough',
        impact: 'maintenance',
        components: { 'harbor-checkout': 'under_maintenance' },
        scheduledFor: '2026-10-17T10:00',
        scheduledUntil: '2026-10-17T12:00',
        updates: [
          {
            status: 'scheduled',
            at: '2026-10-01T09:30',
            body: "Checkout and payments milestone. We'll walk you through the finished checkout on staging, including card payments in test mode. The staging shop will be read-only for the two hours of the session.",
          },
        ],
      },
      {
        id: 'h5u7i9o1p3as',
        name: 'Content load and QA',
        impact: 'maintenance',
        components: { 'harbor-content': 'under_maintenance' },
        scheduledFor: '2026-10-26T09:00',
        scheduledUntil: '2026-10-31T17:30',
        updates: [
          {
            status: 'scheduled',
            at: '2026-10-01T09:35',
            body: "We'll load the final page copy and test the shop on phones, tablets and desktop browsers. Staging may be unavailable for a few minutes at a time while content is imported.",
          },
        ],
      },
      {
        id: 'h0l2k4j6h8gf',
        name: 'Shop launch and domain switch',
        impact: 'maintenance',
        components: {
          'harbor-catalogue': 'under_maintenance',
          'harbor-checkout': 'under_maintenance',
          'harbor-content': 'under_maintenance',
        },
        scheduledFor: '2026-11-14T07:00',
        scheduledUntil: '2026-11-14T10:00',
        updates: [
          {
            status: 'scheduled',
            at: '2026-10-01T09:40',
            body: 'Launch. We will point harborpine.example at the new shop. Your current shop will show a holding page for about 30 minutes during the switch; orders placed before 07:00 are unaffected.',
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    key: 'meridian',
    name: 'Meridian Family Clinic',
    contact: 'Dr. Sam Patel',
    about:
      'Live progress on the Patient intake portal for Meridian Family Clinic. Go-live is planned for 30 October.',
    groups: [],
    components: [
      {
        id: 'meridian-forms',
        name: 'Intake forms',
        description: 'The six online forms patients fill in before their first appointment.',
        status: 'operational',
        since: '2026-07-14',
      },
      {
        id: 'meridian-dashboard',
        name: 'Patient dashboard',
        description: 'Where patients see their submitted forms and upcoming appointments.',
        status: 'operational',
        since: '2026-07-14',
      },
      {
        id: 'meridian-ehr',
        name: 'EHR integration',
        description: 'Sending completed forms into your electronic health records system.',
        status: 'degraded_performance',
        since: '2026-07-14',
      },
      {
        id: 'meridian-launch',
        name: 'Accessibility and staff training',
        description: 'Independent accessibility audit, reception staff training and go-live.',
        status: 'operational',
        since: '2026-07-14',
      },
    ],
    incidents: [
      {
        id: 'm1a2s3d4f5g6',
        name: 'Requirements signed off',
        impact: 'none',
        components: { 'meridian-forms': 'operational' },
        updates: [
          {
            status: 'resolved',
            at: '2026-07-24T16:00',
            body: 'Requirements were signed off a day ahead of schedule. Form design starts next week.',
          },
        ],
      },
      {
        id: 'm7h8j9k0l1q2',
        name: 'Prototype link not loading',
        impact: 'critical',
        components: { 'meridian-forms': 'major_outage', 'meridian-dashboard': 'major_outage' },
        updates: [
          {
            status: 'investigating',
            at: '2026-08-05T10:15',
            body: "The clickable prototype link we sent yesterday shows an error page. We're looking into it.",
          },
          {
            status: 'identified',
            at: '2026-08-05T10:50',
            body: "The prototype's sharing link expired overnight. We're publishing a new one that won't expire.",
          },
          {
            status: 'resolved',
            at: '2026-08-05T11:40',
            body: 'A new prototype link has been emailed to Dr. Patel. The old link no longer works.',
          },
        ],
      },
      {
        id: 'm3w4e5r6t7y8',
        name: 'Form design approval delayed',
        impact: 'minor',
        components: { 'meridian-forms': 'degraded_performance' },
        updates: [
          {
            status: 'investigating',
            at: '2026-08-22T09:30',
            body: 'Approval of the form designs is taking longer than planned while your clinical team reviews the consent wording.',
          },
          {
            status: 'update',
            at: '2026-08-24T14:10',
            body: "We've received your comments on the consent form and are updating the wording.",
          },
          {
            status: 'resolved',
            at: '2026-08-26T12:00',
            body: 'All form designs are approved. The build starts today, four days later than planned; the go-live date is unchanged.',
          },
        ],
      },
      {
        id: 'm9u0i1o2p3z4',
        name: 'Staging portal unavailable',
        impact: 'critical',
        components: { 'meridian-dashboard': 'major_outage', 'meridian-forms': 'partial_outage' },
        updates: [
          {
            status: 'investigating',
            at: '2026-09-09T14:00',
            body: "The staging portal isn't loading. We're investigating.",
          },
          {
            status: 'identified',
            at: '2026-09-09T14:35',
            body: "The staging server's security certificate expired. We're renewing it and turning on automatic renewal.",
          },
          {
            status: 'resolved',
            at: '2026-09-09T15:30',
            body: 'The staging portal is available again. Certificates now renew automatically.',
          },
        ],
      },
      {
        id: 'm5x6c7v8b9n0',
        name: 'Forms not saving on older iPhones',
        impact: 'major',
        components: { 'meridian-forms': 'partial_outage' },
        updates: [
          {
            status: 'investigating',
            at: '2026-09-16T10:20',
            body: "Your front desk reported that forms filled in on an iPhone 8 don't save. We're reproducing the problem on staging.",
          },
          {
            status: 'identified',
            at: '2026-09-16T12:45',
            body: "The date-of-birth picker fails on iOS 15 and earlier, which stops the form from submitting. We're replacing it with a plain date field.",
          },
          {
            status: 'monitoring',
            at: '2026-09-16T17:30',
            body: 'A fix is on staging. We are testing it on the older devices in our test lab.',
          },
          {
            status: 'resolved',
            at: '2026-09-17T09:15',
            body: 'Forms now save on every device we test, back to iOS 14.',
          },
        ],
      },
      {
        id: 'm2q3w4e5r6t7',
        name: 'Patient dashboard and intake forms ready on staging',
        impact: 'none',
        components: { 'meridian-dashboard': 'operational', 'meridian-forms': 'operational' },
        updates: [
          {
            status: 'resolved',
            at: '2026-09-30T16:40',
            body: 'Patient dashboard and all six intake forms are built and in staging.',
          },
        ],
      },
      {
        id: 'm8y9u0i1o2p3',
        name: 'EHR integration waiting on sandbox access',
        impact: 'minor',
        components: { 'meridian-ehr': 'degraded_performance' },
        updates: [
          {
            status: 'investigating',
            at: '2026-10-01T09:20',
            body: "We can't start connecting the portal to your records system until your EHR vendor gives us sandbox access. We've asked the vendor and are following up daily.",
          },
          {
            status: 'identified',
            at: '2026-10-05T15:30',
            body: "Still waiting on EHR sandbox access. Go-live on 30 Oct is at risk if access isn't granted by 10 Oct.",
          },
          {
            status: 'update',
            at: '2026-10-07T11:00',
            body: "No sandbox access yet. To save time we've built the integration against the vendor's published API documentation and will test it as soon as access arrives. If you have a contact at the vendor, raising it with them would help.",
          },
        ],
      },
      {
        id: 'm4a5s6d7f8g9',
        name: 'EHR integration testing',
        impact: 'maintenance',
        components: { 'meridian-ehr': 'under_maintenance' },
        scheduledFor: '2026-10-09T09:00',
        scheduledUntil: '2026-10-10T17:00',
        updates: [
          {
            status: 'scheduled',
            at: '2026-09-28T10:00',
            body: 'EHR integration milestone. We will send test submissions from staging into your EHR sandbox and check that every field arrives correctly. This depends on the sandbox access described in the open incident.',
          },
        ],
      },
      {
        id: 'm0h1j2k3l4z5',
        name: 'Accessibility audit',
        impact: 'maintenance',
        components: { 'meridian-forms': 'under_maintenance', 'meridian-dashboard': 'under_maintenance' },
        scheduledFor: '2026-10-19T09:00',
        scheduledUntil: '2026-10-20T17:30',
        updates: [
          {
            status: 'scheduled',
            at: '2026-09-30T17:00',
            body: 'An independent tester will check every form and the dashboard against WCAG 2.2 AA. The staging portal stays available but may be slow during automated scans.',
          },
        ],
      },
      {
        id: 'm6x7c8v9b0n1',
        name: 'Reception staff training',
        impact: 'maintenance',
        components: { 'meridian-launch': 'under_maintenance' },
        scheduledFor: '2026-10-27T13:00',
        scheduledUntil: '2026-10-27T15:00',
        updates: [
          {
            status: 'scheduled',
            at: '2026-09-30T17:05',
            body: 'Two one-hour sessions at the clinic showing reception staff how to review submitted forms and help patients who get stuck.',
          },
        ],
      },
      {
        id: 'm2m3n4b5v6c7',
        name: 'Portal go-live',
        impact: 'maintenance',
        components: {
          'meridian-forms': 'under_maintenance',
          'meridian-dashboard': 'under_maintenance',
          'meridian-ehr': 'under_maintenance',
        },
        scheduledFor: '2026-10-30T07:00',
        scheduledUntil: '2026-10-30T08:30',
        updates: [
          {
            status: 'scheduled',
            at: '2026-09-30T17:10',
            body: 'The portal opens to patients. Booking confirmation emails will include the link to the intake forms from 08:30.',
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    key: 'lumen',
    name: 'Lumen Books',
    contact: 'Iris Novak',
    about:
      'Live progress on the Brand refresh for Lumen Books. Work on the brand guidelines is paused until we have your feedback on the round two logo concepts.',
    groups: [],
    components: [
      {
        id: 'lumen-audit',
        name: 'Brand audit',
        description: 'Review of your current brand, competitors and where the brand is used today.',
        status: 'operational',
        since: '2026-08-18',
      },
      {
        id: 'lumen-logo',
        name: 'Logo concepts',
        description: 'Two rounds of logo concepts; round two is waiting on your feedback.',
        status: 'partial_outage',
        since: '2026-08-18',
      },
      {
        id: 'lumen-guidelines',
        name: 'Brand guidelines',
        description: 'Colour, type, logo use and examples. Cannot start until a logo direction is chosen.',
        status: 'major_outage',
        since: '2026-08-18',
      },
      {
        id: 'lumen-assets',
        name: 'Final asset handoff',
        description: 'Logo files, templates and social assets. Due 24 October.',
        status: 'degraded_performance',
        since: '2026-08-18',
      },
    ],
    incidents: [
      {
        id: 'l1k2j3h4g5f6',
        name: 'Brand audit delivered',
        impact: 'none',
        components: { 'lumen-audit': 'operational' },
        updates: [
          {
            status: 'resolved',
            at: '2026-08-27T16:15',
            body: 'The brand audit is in your shared folder, a day ahead of schedule.',
          },
        ],
      },
      {
        id: 'l7d8s9a0p1o2',
        name: 'Moodboard folder not accessible to your team',
        impact: 'major',
        components: { 'lumen-audit': 'partial_outage' },
        updates: [
          {
            status: 'investigating',
            at: '2026-09-03T09:45',
            body: 'Some of your team see "access denied" when opening the moodboard folder.',
          },
          {
            status: 'resolved',
            at: '2026-09-03T11:30',
            body: 'Sharing is fixed; all eight people on your list can open the folder.',
          },
        ],
      },
      {
        id: 'l3i4u5y6t7r8',
        name: 'Round one logo concepts shared',
        impact: 'none',
        components: { 'lumen-logo': 'operational' },
        updates: [
          {
            status: 'resolved',
            at: '2026-09-11T15:00',
            body: 'Six round one concepts are in the shared folder, with a short note on the thinking behind each.',
          },
        ],
      },
      {
        id: 'l9e0w1q2m3n4',
        name: 'Concept presentation link not loading',
        impact: 'critical',
        components: { 'lumen-logo': 'major_outage' },
        updates: [
          {
            status: 'investigating',
            at: '2026-09-18T14:05',
            body: "The link to the round one presentation is showing a blank page. We're looking into it.",
          },
          {
            status: 'resolved',
            at: '2026-09-18T14:50',
            body: 'The presentation is available again at the same link. A large embedded video was failing to load; we replaced it with a still image.',
          },
        ],
      },
      {
        id: 'l5b6v7c8x9z0',
        name: 'Round two logo concepts shared',
        impact: 'none',
        components: { 'lumen-logo': 'operational' },
        updates: [
          {
            status: 'resolved',
            at: '2026-09-25T17:00',
            body: 'Shared round two logo concepts (three directions) with Iris for board review.',
          },
        ],
      },
      {
        id: 'l2p3o4i5u6y7',
        name: 'Brand guidelines on hold: waiting for logo feedback',
        impact: 'major',
        components: {
          'lumen-logo': 'partial_outage',
          'lumen-guidelines': 'major_outage',
          'lumen-assets': 'degraded_performance',
        },
        updates: [
          {
            status: 'investigating',
            at: '2026-10-02T17:30',
            body: "We haven't yet received your team's feedback on the round two logo concepts, which was due today. Work on the brand guidelines can't start until a direction is chosen.",
          },
          {
            status: 'identified',
            at: '2026-10-05T10:00',
            body: "Round two logo concepts were shared on 25 September. We need your team's feedback before we can start the brand guidelines. We'll confirm the guidelines and handoff dates once a direction is chosen.",
          },
          {
            status: 'update',
            at: '2026-10-08T09:30',
            body: "Still waiting on feedback. We've set up the guidelines template so we can move quickly once you choose a direction.",
          },
        ],
      },
      {
        id: 'l8t9r0e1w2q3',
        name: 'Brand guidelines draft',
        impact: 'maintenance',
        components: { 'lumen-guidelines': 'under_maintenance' },
        scheduledFor: '2026-10-12T09:00',
        scheduledUntil: '2026-10-17T17:30',
        updates: [
          {
            status: 'scheduled',
            at: '2026-09-25T17:10',
            body: 'We will draft the brand guidelines for your review on 17 October. This date depends on receiving your logo feedback.',
          },
        ],
      },
      {
        id: 'l4a5z6x7s8w9',
        name: 'Final asset handoff',
        impact: 'maintenance',
        components: { 'lumen-assets': 'under_maintenance' },
        scheduledFor: '2026-10-23T10:00',
        scheduledUntil: '2026-10-24T13:00',
        updates: [
          {
            status: 'scheduled',
            at: '2026-09-25T17:15',
            body: 'Logo files, document templates and social media assets delivered to your shared folder, with a 30-minute walkthrough call.',
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    key: 'atlas',
    name: 'Atlas Robotics',
    contact: 'Kofi Mensah',
    about:
      'Live progress on Fieldwork Studio projects for Atlas Robotics: the Investor website (launched 19 September) and the Developer docs migration.',
    groups: [
      {
        name: 'Investor website',
        description: 'Launched 19 September. Fieldwork Studio provides support until 19 December.',
      },
      {
        name: 'Developer docs migration',
        description: 'Moving 140 docs pages to the new docs site by 12 December.',
      },
    ],
    components: [
      {
        id: 'atlas-site-web',
        name: 'Website',
        group: 'Investor website',
        description: 'The public investor website.',
        status: 'operational',
        since: '2026-06-30',
      },
      {
        id: 'atlas-site-analytics',
        name: 'Analytics',
        group: 'Investor website',
        description: 'Visitor analytics and the monthly traffic report.',
        status: 'operational',
        since: '2026-06-30',
      },
      {
        id: 'atlas-site-handoff',
        name: 'Handoff and support',
        group: 'Investor website',
        description: 'Documentation in your shared folder and post-launch fixes.',
        status: 'operational',
        since: '2026-06-30',
      },
      {
        id: 'atlas-docs-audit',
        name: 'Docs audit',
        group: 'Developer docs migration',
        description: 'Reviewing all 140 existing pages and mapping them to the new structure.',
        status: 'under_maintenance',
        since: '2026-09-29',
      },
      {
        id: 'atlas-docs-plan',
        name: 'Migration plan',
        group: 'Developer docs migration',
        status: 'operational',
        since: '2026-09-29',
      },
      {
        id: 'atlas-docs-migration',
        name: 'Converter and migration',
        group: 'Developer docs migration',
        description: 'Converting pages to the new format and setting up redirects from old URLs.',
        status: 'operational',
        since: '2026-09-29',
      },
    ],
    incidents: [
      {
        id: 'a1s2d3f4g5h6',
        name: 'Content outline approved',
        impact: 'none',
        components: { 'atlas-site-web': 'operational' },
        updates: [
          {
            status: 'resolved',
            at: '2026-07-16T14:30',
            body: 'Kofi approved the content outline. Copywriting starts tomorrow.',
          },
        ],
      },
      {
        id: 'a7j8k9l0q1w2',
        name: 'Preview site down',
        impact: 'critical',
        components: { 'atlas-site-web': 'major_outage' },
        updates: [
          {
            status: 'investigating',
            at: '2026-08-06T13:10',
            body: "The password-protected preview site isn't loading. We're investigating.",
          },
          {
            status: 'identified',
            at: '2026-08-06T13:40',
            body: "Our hosting provider is having an outage in its London region. We're moving the preview to another region.",
          },
          {
            status: 'resolved',
            at: '2026-08-06T14:25',
            body: 'The preview site is back at the same address and password.',
          },
        ],
      },
      {
        id: 'a3e4r5t6y7u8',
        name: 'Design and copy approved',
        impact: 'none',
        components: { 'atlas-site-web': 'operational' },
        updates: [
          {
            status: 'resolved',
            at: '2026-08-14T17:00',
            body: 'Final designs and copy are approved. We are building the site for a 19 September launch.',
          },
        ],
      },
      {
        id: 'a9i0o1p2a3s4',
        name: 'Contact form emails delayed',
        impact: 'major',
        components: { 'atlas-site-web': 'partial_outage' },
        updates: [
          {
            status: 'investigating',
            at: '2026-09-02T08:30',
            body: "Messages sent through the preview site's investor contact form are arriving hours late.",
          },
          {
            status: 'identified',
            at: '2026-09-02T10:15',
            body: "The email service was holding messages for spam checks because your domain's sender records weren't set up yet. We've sent your IT team the two records to add.",
          },
          {
            status: 'resolved',
            at: '2026-09-02T12:10',
            body: 'Your IT team added the records and contact form messages now arrive within a minute.',
          },
        ],
      },
      {
        id: 'a5d6f7g8h9j0',
        name: 'Investor website launch',
        impact: 'maintenance',
        components: { 'atlas-site-web': 'under_maintenance', 'atlas-site-analytics': 'under_maintenance' },
        scheduledFor: '2026-09-19T09:30',
        scheduledUntil: '2026-09-19T10:30',
        updates: [
          {
            status: 'scheduled',
            at: '2026-09-12T11:00',
            body: 'We will switch atlasrobotics.example to the new investor website. The old site may show for some visitors for up to an hour while DNS updates.',
          },
          {
            status: 'in_progress',
            at: '2026-09-19T09:30',
            body: 'Launch is under way.',
          },
          {
            status: 'completed',
            at: '2026-09-19T10:40',
            body: 'Investor site launched. DNS switched at 10:00 and analytics confirmed live.',
          },
        ],
      },
      {
        id: 'a1z2x3c4v5b6',
        name: 'Analytics missing visits from some browsers',
        impact: 'major',
        components: { 'atlas-site-analytics': 'partial_outage' },
        updates: [
          {
            status: 'investigating',
            at: '2026-09-22T10:00',
            body: "Weekend traffic in analytics looks about 40% lower than your server logs. We're investigating.",
          },
          {
            status: 'identified',
            at: '2026-09-22T14:30',
            body: 'The cookie banner was blocking analytics for visitors who closed it without choosing. We are changing it to wait for a choice.',
          },
          {
            status: 'monitoring',
            at: '2026-09-22T18:00',
            body: 'The fix is live. We are comparing analytics with server logs overnight.',
          },
          {
            status: 'resolved',
            at: '2026-09-23T11:00',
            body: 'Analytics and server logs now agree within 3%. Visits from the weekend cannot be recovered.',
          },
        ],
      },
      {
        id: 'a7n8m9q0w1e2',
        name: 'Developer docs migration kickoff',
        impact: 'none',
        components: { 'atlas-docs-plan': 'operational' },
        updates: [
          {
            status: 'resolved',
            at: '2026-09-29T15:30',
            body: 'Kickoff call with Kofi. Agreed to keep existing URLs where possible.',
          },
        ],
      },
      {
        id: 'a3r4t5y6u7i8',
        name: 'Docs audit',
        impact: 'maintenance',
        components: { 'atlas-docs-audit': 'under_maintenance' },
        scheduledFor: '2026-09-30T09:00',
        scheduledUntil: '2026-10-09T17:30',
        updates: [
          {
            status: 'scheduled',
            at: '2026-09-29T16:00',
            body: 'We will review all 140 pages of your current developer docs and map each one to the new structure. Your existing docs stay online throughout.',
          },
          {
            status: 'in_progress',
            at: '2026-09-30T09:00',
            body: 'The audit has started.',
          },
          {
            status: 'in_progress',
            at: '2026-10-05T14:00',
            body: 'Audited 60 of 140 pages. About a third are out of date and will be flagged for review.',
          },
          {
            status: 'in_progress',
            at: '2026-10-08T11:00',
            body: 'Audited 112 of 140 pages. On track to finish tomorrow.',
          },
        ],
      },
      {
        id: 'a9o0p1a2s3d4',
        name: 'Migration plan review',
        impact: 'maintenance',
        components: { 'atlas-docs-plan': 'under_maintenance' },
        scheduledFor: '2026-10-16T10:00',
        scheduledUntil: '2026-10-16T11:00',
        updates: [
          {
            status: 'scheduled',
            at: '2026-09-29T16:05',
            body: 'We will present the migration plan: the new page structure, which pages are merged or retired, and the redirect list.',
          },
        ],
      },
      {
        id: 'a5f6g7h8j9k0',
        name: 'Converter and first 50 pages',
        impact: 'maintenance',
        components: { 'atlas-docs-migration': 'under_maintenance' },
        scheduledFor: '2026-11-09T09:00',
        scheduledUntil: '2026-11-13T17:30',
        updates: [
          {
            status: 'scheduled',
            at: '2026-09-29T16:10',
            body: 'The first 50 pages move to the new docs site for your review. The old docs stay live until the full migration.',
          },
        ],
      },
      {
        id: 'a1l2k3j4h5g6',
        name: 'Full migration and redirects',
        impact: 'maintenance',
        components: { 'atlas-docs-migration': 'under_maintenance' },
        scheduledFor: '2026-12-12T08:00',
        scheduledUntil: '2026-12-12T12:00',
        updates: [
          {
            status: 'scheduled',
            at: '2026-09-29T16:15',
            body: 'The remaining pages move to the new docs site and redirects from old URLs go live. Some pages may briefly show their old version.',
          },
        ],
      },
    ],
  },
]
