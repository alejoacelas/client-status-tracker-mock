# Linear project updates replica

An internal, unbranded replica of Linear's project page and project updates
(written status updates with On track / At risk / Off track health), filled with
the Fieldwork Studio mock data. It is a design reference only; restyle anything
taken from it before commercial use.

Run it with `npm install && npm run dev` (http://localhost:5303). `npm run build`
produces a static build in `dist/` that works from any folder (hash routing).

## Sources

Nobody on the project has a Linear account, so everything comes from public pages,
captured in the ignored `reference/` folder:

- Docs text and screenshots:
  [Initiative and project updates](https://linear.app/docs/initiative-and-project-updates),
  [Projects](https://linear.app/docs/projects),
  [Project milestones](https://linear.app/docs/project-milestones),
  [Project graph](https://linear.app/docs/project-graph),
  [Initiatives](https://linear.app/docs/initiatives),
  [Project status](https://linear.app/docs/project-status).
  The screenshots there show the update card, the composer's health menu, the
  initiative-list update popover, the health filter, milestones and the progress graph.
- [linear.app](https://linear.app): the home page renders the current app shell
  (sidebar, inset main panel, comment cards) as live HTML. Sizes, weights, radii
  and colours were read from its computed styles with headless Playwright
  (`tools/styles.mjs`, `tools/dump.mjs`).
- [linear.app/plan](https://linear.app/plan): high-resolution renders of the
  project overview, the initiatives list with health, and the Pulse updates feed.
- The site's public CSS (`static.linear.app/web/_next/static/css/*.css`): colour,
  type, radius and shadow tokens for both themes (Inter Variable at weights 400 /
  510 / 590, `cv01` and `ss03` features, 13px UI text, 15px body text).
- Light-theme app shell: tutorial screenshots on
  [guideflow.com](https://www.guideflow.com/tutorial/how-to-create-project-updates-on-linear).

Icons are redrawn by hand; no images, SVG paths or code were copied.

## What is replicated

1. **App shell.** Sidebar with workspace menu, search and compose buttons, Pulse /
   Inbox / My issues, collapsible Workspace, Favorites, Your teams and Clients
   sections; inset main panel with a 44px top bar, breadcrumbs and pill tabs.
2. **Project overview.** Icon, title, summary, and property rows (status,
   priority, lead, members, start → target date, team; initiative; labels;
   resources). Status, priority, lead, members and both dates open working
   pickers, and each change is logged to the Updates tab.
3. **Latest update card.** Collapsible, with See all and a pencil that opens the
   composer in place.
4. **Composer.** Health picker (On track / At risk / Off track), rich-text editor
   (⌘B, ⌘I, a selection toolbar, `- ` for bullets), the "progress since last
   update" block with Hide details (shown when progress moved more than 2%, as
   documented), Cancel, Post update, ⌘↵ to post and Esc to cancel.
5. **Updates tab.** Updates interleaved with property changes and milestone
   completions, newest first. Each update has a health badge, author, relative
   time (exact time on hover), rich-text body, emoji reactions, a comment thread
   with replies, and a ··· menu (copy link, copy as Markdown, edit and delete your
   own updates). Copied links open the update highlighted.
6. **Details pane** (⌘I or the panel button): properties, milestones with
   "% of N" progress diamonds, and the progress graph (scope, started and completed
   lines, weekly completed bars, red target-date line with hatching past it,
   milestone markers, hover values).
7. **Initiatives list.** One initiative per client, with each client's projects as
   tree children: target, health with age, project counts, active-project health
   dots, activity. Clicking a health cell opens the latest-update popover with
   Write update and ↑/↓ navigation between rows. Active / Planned / All tabs.
8. **Initiative page.** Overview with its own latest update and a projects table;
   Projects tab; Updates tab with a "Show project updates" option, as in the docs.
9. **Projects list** with a health filter (as in the docs screenshot) and
   grouping by initiative, status or none. **Pulse** feed (For me / Popular /
   Recent) of every update across projects and initiatives, grouped by day.
10. **Command menu** (⌘K / Ctrl+K): write update, copy latest update as Markdown,
    copy link, favorite, toggle details, navigation, open any project or
    initiative, switch theme, reset demo data. `G` then `U` / `I` / `P` jump to
    Pulse, Initiatives and Projects; ⌘⇧L switches theme.
11. **Themes.** Dark (default) and light, remembered per browser.
12. **390px.** Sidebar becomes a drawer, property rows stack, lists keep name and
    health, the details pane and update popover become full-width sheets.

New updates, edits, comments, reactions, property changes and favourites persist
in localStorage. "Reset demo data" in the workspace menu or ⌘K restores the seed.

## Content mapping

All mock data is in `src/data/mock.ts`, derived from `seed/seed.json`: four
clients become initiatives, five projects keep their dates, leads and progress,
the 25 milestones become project milestones (with invented issue counts so they
can show "% of N"), and the ten seed updates become project updates. Blocked
maps to Off track. Internal notes and internal-only seed updates appear as
comments marked "Internal:". Around twenty more weekly updates, four initiative
updates, comments, reactions and property-change events were written for depth.
The app's clock is fixed at 8 October 2026, 16:20, so relative times stay stable.

## Remaining differences and guesses

- **The real app was never seen directly.** Layout and tokens come from the
  marketing renders and docs screenshots, which mix the 2024 and 2025 designs.
  Where they disagreed, this follows the newer marketing renders (pill tabs,
  inset panel).
- **Guessed, not publicly visible:** the exact Updates-tab layout for property
  changes, the comment-thread styling under updates, the light theme of every
  page except the sidebar shell, the 390px layout (Linear's phone experience is a
  native app), the notification/reminder menu contents, `G` shortcuts other than
  those documented, and the emoji set in the reaction picker.
- **Health colours** are close matches sampled from screenshots, not tokens:
  On track `#4cb782`, At risk `#f2c94c`, Off track `#eb5757` (dark theme).
- **Icons** are redrawn approximations; status, priority and health glyphs follow
  the originals' shapes but are not identical.
- **Not built:** issues, cycles, inbox, documents, file uploads, Slack sync, real
  update reminders and staleness, @mentions, and drag-to-reorder milestones.
  Resources and milestones are read-only.
- The progress graph series are generated from each project's start date, scope
  and current progress, so its curve shapes are illustrative.
