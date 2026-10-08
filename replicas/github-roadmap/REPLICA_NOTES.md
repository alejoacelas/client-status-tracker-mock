# GitHub Projects roadmap replica

An internal, unbranded replica of the roadmap layout of a GitHub Project, filled
with the Fieldwork Studio mock data. It copies layout, Primer colours and
behaviour; the logo and product name are replaced with a plain "F" mark and
"fieldwork-studio". Restyle before any commercial use.

Run it with `npm install && npm run dev` (port 5302), or `npm run build` for a
static build that works from any path (hash routes such as `#/views/1`).

## Sources

- GitHub Docs: [Customizing the roadmap layout](https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/customizing-the-roadmap-layout),
  [Changing the layout of a view](https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/changing-the-layout-of-a-view)
  (its roadmap, table and board screenshots),
  [Filtering projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/filtering-projects),
  [Managing your views](https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/managing-your-views)
  and the date, iteration and single-select field pages.
- The public [GitHub Public Roadmap project](https://github.com/orgs/github/projects/4247),
  captured logged out with headless Playwright at 1440px and 390px. Logged-out
  visitors can switch a view's layout to Roadmap without saving, which exposed
  the live roadmap: header, toolbar and its menus, zoom levels, today marker,
  grouping, the item side panel and the mobile settings sheet. Computed styles
  and the page's stylesheets were read for sizes and colour tokens (row 40px,
  group header 44px, pill 28px with 5px radius, number column 60px, title
  column 420px, 48/16/4px per day at month/quarter/year zoom, marker colours).
- [`@primer/primitives`](https://github.com/primer/primitives) (MIT) supplies
  every colour, size and type token, including the dark theme;
  [`@primer/octicons-react`](https://github.com/primer/octicons) (MIT) supplies
  the icons. Components and CSS are rebuilt, not copied.

Captures live in the ignored `reference/` folder.

## What's replicated

- Project title bar, view tabs (with the unsaved-changes dot, rename, duplicate,
  delete and "New view"), and the filter bar with qualifier highlighting,
  field and value suggestions, item count, Discard/Save and the View menu
  (layout switch, group, markers, sort, dates, zoom, slice, truncate titles,
  show date fields).
- Roadmap: month and day header, Month/Quarter/Year zoom, Today and
  previous/next range buttons, today line and nub, week or month dividers,
  markers for milestones, sprint iterations and item start/target dates, group
  headers with collapse and a date-range pill, off-screen arrows that scroll to
  the item, a resizable table pane, and "Add item" drafts.
- Item bars: drag to move, drag either end to change start or target date (day
  snapping, date tooltip while dragging), click to open the side panel. Items
  without dates show the dotted ghost and "+" button to add dates. Drag a row
  by its number to reorder it or move it to another group, which changes that
  field.
- Side panel: title (editable), state, repository, body, sub-issues with
  progress, comments (with source and "Internal" labels), a comment box, and a
  project card whose Status, Client, Phase, dates, Progress and Sprint are
  editable with Primer-style menus and a calendar.
- Table view (inline single-select editing, column menus for sort, group and
  hide) and board view (drag cards between status columns).
- Mobile (390px): toolbar collapses to a settings sheet, the table pane narrows
  to number and issue number, group headers span the screen, the View button
  wraps under the filter, and the side panel goes full screen.
- Dark theme follows the system setting. Edits persist in localStorage; "Reset
  demo data" in the project's ⋯ menu clears them.

## Content mapping

All mock data is in `src/data/project.json`, derived from `seed/seed.json`.

- Each seed project is an issue in `fieldwork-studio/client-delivery`; each
  seed milestone is a sub-issue with only a target date, so it shows as a
  one-day pill. The Roadmap view filters to `no:parent-issue`; the Milestones
  view shows sub-issues grouped by parent.
- Fields: Status (On track, At risk, Blocked, Done, plus Not started for
  milestones), Client, Phase, Assignees (the seed's owner; GitHub's built-in
  field can't be renamed "Owner"), Start date, Target date, Progress (number),
  Milestone, Sprint, Sub-issues progress and Parent issue.
- Milestone markers use each project's current milestone, as the original only
  marks the milestone assigned to each visible item.
- Invented to fill the original's structure: issue numbers, the repository
  name, two-week sprints, the project status update, and a fixed "today" of
  8 October 2026 so dates in the seed stay meaningful.

## Remaining differences

- The logged-in global header was not captured (public pages show the
  marketing header). Its layout follows GitHub's current app header from
  memory, without the product logo or search suggestions.
- Text renders in the system font stack. The live page lists Mona Sans first,
  but in the captures it wasn't loaded, and measured text widths matched the
  system font exactly.
- No keyboard cell navigation, copy/paste, multi-select, undo toast, field
  sums beyond counts, swimlanes, or "Insights" charts.
- Drafts can't be converted to issues; buttons for workflows, archive and
  settings close their menu without doing anything.
- The roadmap shows a fixed range (400 days back, 460 forward) instead of
  loading more as you scroll.

## Guesses (not publicly visible)

- Logged-in header, editing affordances that need write access (Save,
  inline title edit, column and group menus), and the board's drag behaviour,
  which come from the docs screenshots and memory rather than a capture.
- Side panel layout for an editable issue: captured read-only from the public
  project and filled in for editing.
- How group pills, marker labels and sprint labels behave when crowded, and
  where the drag tooltip sits.
- The slice panel's appearance (the docs describe it; it wasn't captured).
