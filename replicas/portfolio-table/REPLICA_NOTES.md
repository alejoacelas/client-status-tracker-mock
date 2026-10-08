# Portfolio table replica

An internal, unbranded replica of Asana Portfolios: the portfolio list of
projects with status, progress and fields, plus project and portfolio status
updates. It is filled with the Fieldwork Studio seed data and must be restyled
before any commercial use.

Run it with `npm install && npm run dev`, then open <http://localhost:5307/>.
`npm run build` writes a static site to `dist/` that works from any path.
Edits are saved in the browser's localStorage; "Reset demo data" in the list's
`···` menu (or the account menu top right) restores the seed.

## Sources

No Asana account with Portfolios was available, so everything comes from
public pages. Captures are in the ignored `reference/` folder.

- [Portfolios feature page](https://asana.com/features/goals-reporting/portfolios):
  four product renders (list with groups, status, dashboard, add-work search).
- [Portfolio views](https://help.asana.com/s/article/portfolio-views): the
  list-view screenshot with the column menu (sort, move, column width, edit,
  hide, remove), and GIFs of multi-sort and filter popovers, the Customize
  pane and inline goal editing.
- [Portfolios overview](https://help.asana.com/s/article/portfolios-overview):
  the full app shell (dark top bar and sidebar), the Add work menu and
  add-by-name search, the row context menu, the Details pane with the latest
  status card, nested portfolios and the Portfolios index page.
- [Portfolio progress and reporting](https://help.asana.com/s/article/portfolio-progress-and-reporting):
  the Progress tab, the Dashboard tab, the portfolio status composer with
  the Highlights panel, and the Add field modal.
- [Project progress and status updates](https://help.asana.com/s/article/project-progress-and-status-updates)
  and [Share project updates](https://help.asana.com/s/article/share-project-updates):
  the project status composer (header bar, Status/Owner/Dates fields, "Show
  or hide fields", Summary and Next steps sections, Build your update panel),
  the Set status menu and the six statuses.
- [Asana Forum: status not reflected in portfolio](https://forum.asana.com/t/status-update-not-reflected-in-portfolio/847784):
  updates older than about three months show as "No recent updates".

Colours were sampled pixel by pixel from the help-centre screenshots
(`tools/px.sh`), for example text `#1e1f21`, borders `#edeae9`, chrome
`#2e2e30`, primary blue `#4573d2`, on-track green `#5da283`. The app's own CSS
is behind a login, so it was not used. The screenshots render in the macOS
system font, so the replica uses the system font stack. Sizes were measured by
rendering the replica at the screenshots' scale (80% zoom, 2x pixels) and
comparing them side by side.

## What's replicated

- **App shell:** dark top bar (menu, Create menu, search with results, help,
  account pill with a plain "FS" text mark) and sidebar (Home, My tasks,
  Inbox, Insights, Starred with expandable nested portfolios, Projects,
  Teams, Invite/Help). The sidebar becomes an overlay below 768px.
- **Portfolio header:** folder icon with colour picker, breadcrumb, inline
  rename, actions menu, star, status chip with the Set status menu, member
  avatars, Share dialog, Customize, and the List, Timeline, Dashboard,
  Progress, Workload and Messages tabs.
- **List view:** nested portfolios ("All clients" opens with each client
  expanded); status chip with update date or "No recent updates"; task or
  milestone progress; date range with overdue in red; priority, phase, client
  contact and internal-notes fields; owner. Columns sort, resize by dragging,
  move, change width, hide and are removed from the column menu. The `+`
  column adds Single-select, Date, People, Text or Number fields, or picks
  from the field library. Toolbar: split Add work button (create project or
  portfolio, add existing by name), multi-filter with quick filters, multi-sort
  with drag reordering, Group by, Progress type and an options menu. Rows
  reorder by drag when no sort or grouping is set, open a context menu (open,
  copy link, rename, remove, archive, delete) and a Details pane with the
  latest status. Every editable cell edits in place.
- **Customize pane:** field toggles, Add field, progress type.
- **Timeline:** left list with status chips, bars from start to due date with
  "Owned by" labels, milestone diamonds, today line, zoom (days to quarters),
  drag to move or resize, filter and sort shared with the list.
- **Dashboard:** four number cards and charts (projects by status, incomplete
  milestones by project, upcoming milestones by owner, projects by owner,
  priority, phase); add, remove, reorder and widen charts.
- **Progress tab:** headline, status counts that open a filtered list, latest
  status card, previous updates, About this portfolio with editable
  description, nested portfolios with their statuses.
- **Status update composer** (project or portfolio): header bar with
  breadcrumb, Friday reminder toggle, Public/Private, recipients and Post;
  status-coloured rule; title; required status; selectable fields; Summary,
  What we've accomplished, What's next and Key metrics sections that can be
  removed, re-added and dragged; Build your update panel with Previous update
  and Highlights. Highlights are dragged or clicked into a section and render
  as live snapshots "as of" the update date.
- **Status update detail:** full-page read-only update with like, copy link,
  edit and delete, older/newer navigation and comments.
- **Project overview** (reached from a project name): description, roles,
  milestones that toggle complete, fields, portfolios, and the "What's the
  status?" column with the update feed.

## Content mapping

All mock data is in `src/data/mock.ts`, copied from `seed/seed.json`:
"All clients" holds one portfolio per client; each seed project is a row with
its owner, dates, task progress, phase and milestones. Priority values are
added (the seed has none). Seed updates become project status updates with
their source and visibility (client-invisible updates are Private); statuses
map Blocked to Off track and Done to Complete. The five portfolio-level
updates dated 6 Oct are written from the same seed facts. "Today" is fixed at
8 October 2026 so dates read the same as the seed.

## Guesses and differences

These parts were not publicly visible, so they are reconstructions:

1. The standalone status update page and its comments. Public material shows
   the composer and status cards only; the detail page reuses the composer's
   header layout.
2. The section names "What we've accomplished", "What's next" and "Key
   metrics", and the Key metrics highlight, follow this brief. The original's
   composer screenshots show Summary and Next steps by default, and its help
   text mentions a "What we've accomplished" section.
3. The project overview is simplified from two small screenshots. Its other
   tabs, Workload, Messages, Home, My tasks, Inbox, Reporting and Goals show a
   placeholder.
4. Dashboard number cards count milestones, because the seed has no tasks.
5. The original has no phone layout. The 390px layout (overlay sidebar,
   scrolling table with a sticky name column, bottom-sheet highlights panel)
   is an adaptation.
6. Icons are redrawn approximations, not the original set.

Known gaps: no Draft with AI, Drafts tab, goals column, multi-select,
formula or rollup fields, keyboard navigation between cells, timeline
dependencies, or dashboard chart filters.

## Tools

- `tools/capture.mjs`: renders a public page headlessly and saves a
  screenshot, its text and image URLs.
- `tools/px.sh`: prints a pixel's colour from a capture.
- `tools/shot.mjs`: screenshots the running replica (`DPR=1.6` matches the
  help-centre captures).
- `tools/interactions.mjs`: clicks through 28 interactions against the dev
  server and reports failures.
