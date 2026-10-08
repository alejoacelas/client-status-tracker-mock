# Statuspage replica: notes

A rebuild of the public status page product used by
[githubstatus.com](https://www.githubstatus.com), filled with the Fieldwork
Studio mock data. It copies the product's stock layout and behaviour, with
GitHub's colour settings.

Run it with `npm install && npm run dev` (port 5301), then open
<http://localhost:5301/>. `npm run build` produces a static site in `dist/`
that works from any path; routes use the URL hash.

| Route | View |
| --- | --- |
| `#/` | Index of client pages (not a Statuspage view; styled like a component list) |
| `#/harbor`, `#/meridian`, `#/lumen`, `#/atlas` | One status page per client |
| `#/<client>/incidents/<id>` | Incident or maintenance page |
| `#/<client>/history?page=N` | Incident history, three months per page |
| `#/<client>/uptime?component=<id>&page=N` | Uptime calendar per component |

All mock content is in [src/data/statusData.ts](src/data/statusData.ts). The
colour slots are in [src/lib/theme.ts](src/lib/theme.ts); switch `theme` to
`statuspageDefaults` to see the product's stock colours.

## Sources

Captured on 8 October 2026 with curl and headless Playwright; the captures are
in the ignored `reference/` folder.

- [githubstatus.com](https://www.githubstatus.com) and
  [its history page](https://www.githubstatus.com/history): colour values
  (from the page's inline theme block), the two-column layout.
- Stock-layout instances, used to separate the product from GitHub's custom
  CSS: [redditstatus.com](https://www.redditstatus.com),
  [discordstatus.com](https://discordstatus.com) (incident page, history,
  uptime calendar, group expansion, day tooltip, subscribe dropdown),
  [status.npmjs.org](https://status.npmjs.org) (history, "About This Site"
  block, dropdown), [status.zoom.us](https://status.zoom.us) (unresolved
  incidents, scheduled and in-progress maintenance pages).
- The shared stylesheet these pages load (`status_manifest-*.css`), read for
  sizes, spacing, breakpoints and icon glyphs. No CSS, JavaScript or images
  were copied; everything is rewritten.

## What is replicated

- Masthead with logo area and "Subscribe to Updates" button, collapsing to a
  centred "Subscribe" button below 450px.
- Subscribe dropdown with email, SMS, webhook, support and RSS tabs and a
  close button. Forms validate and show a confirmation but send nothing. The
  RSS link opens a feed generated in the browser from the page's incidents.
- Overall status banner (green, yellow, orange, red or blue), replaced by
  coloured incident boxes while incidents or maintenance are in progress, as
  on the original. Each box has a "Subscribe" link that opens the incident
  subscription modal.
- "About This Site" text block.
- Component list in the one-column layout (status as coloured text) and the
  two-column layout GitHub uses (status as icons, plus the five-state legend).
  Harbor uses two columns; the other clients use one. Two columns fall back to
  one below 700px.
- Component groups (Atlas): a collapsed group shows its worst child's status
  and combined bars; clicking expands it to the children.
- The five component states and colours: Operational, Degraded Performance,
  Partial Outage, Major Outage, Under Maintenance.
- 90-day uptime bars (60 days below 900px, 30 below 600px) with uptime
  percentage. Hover a day for the tooltip (date, major and partial outage
  time, related incidents as links); moving onto the tooltip keeps it open;
  click or tap pins it with a close button. Groups show "N components had a
  major outage". Days before a project started are grey with "No data exists
  for this day."
- "?" description bubbles with the dark tooltip.
- Scheduled maintenance list with "Scheduled for" windows and "Posted on"
  lines.
- Past incidents for today and the previous 14 days, with every update and
  timestamp, titles coloured by impact.
- Incident pages: title coloured by impact, "Incident Report for" or
  "Scheduled Maintenance Report for" subheader (or "Scheduled for" on upcoming
  maintenance), update rows with "Posted N days ago", the affected-components
  box, and a subscribe button while open.
- Incident history: Incidents/Uptime tabs, three-month pagination, three
  incidents per month with "+ Show All N Incidents" / "- Collapse Incidents".
- Uptime calendar: component selector, three months of day squares with
  monthly uptime and the same day tooltip.

## Content mapping

Each client in `seed/seed.json` gets a page. Components are 3–4 workstreams
per project, grouped by project when a client has two projects (Atlas).
Project status sets component state: On track and Done are Operational, At
risk (Meridian) is Degraded Performance, Blocked (Lumen) is Partial Outage on
logo concepts and Major Outage on brand guidelines. Client-visible updates
become incidents or "impact none" notices; updates marked not client-visible
and internal notes are left out, so Harbor's Stripe-access blocker does not
appear. Upcoming milestones are scheduled maintenance; Atlas's in-progress
docs audit is maintenance in progress. Incidents before the seed's first
update are invented to fill the 90-day history. The data is frozen at
8 October 2026, 15:00 London time.

## Differences from the original

- Font: Inter (open licence) instead of Atlassian Sans; Atlassian Sans is
  closely related, so letter shapes and widths are near but not identical.
- Logo: a text placeholder ("FS" monogram, "Fieldwork Studio", client name).
- Icons: Font Awesome 4.7 glyphs, the icon font the original loads. The
  subscribe tab icons are image sprites on the original; here they are the
  nearest Font Awesome glyphs.
- GitHub's own customisations are left out: the illustrated header, the
  "Current Status" heading, faded green bars, the "Normal" line under each
  component, and GitHub's site footer.
- The "Powered by" footer names Fieldwork Studio.
- reCAPTCHA notices are replaced by a short privacy line; the SMS country list
  is shortened to ten countries.
- Stock pages offer component-level subscriptions and a history filter by
  component; neither is built.
- Times are labelled BST or GMT for a UK agency; the original shows the page
  owner's time zone.

## Guesses (not publicly visible)

- How bar colour scales with outage length. The original blends from yellow
  to red as downtime grows; here partial outages blend yellow to orange over
  8 hours and major outages orange to red over 4 hours.
- Partial outages count at 30% weight in the uptime percentage, from
  Statuspage's documentation as remembered rather than verified.
- The 60-day breakpoint at 900px (the 30-day view below 600px is confirmed).
- Banner wording for states without an open incident ("Partially Degraded
  Service", "Partial System Outage", "Major System Outage", "Service Under
  Maintenance"); only the green "All Systems Operational" was observed.
- History rows for incidents still open ("- Ongoing") and multi-day ranges.
- The incident subscription modal's layout and the confirmation messages
  after subscribing.
- The grey used for days without data in the 90-day bars.
