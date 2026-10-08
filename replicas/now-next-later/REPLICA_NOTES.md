# Now / Next / Later roadmap replica

An internal, unbranded copy of ProdPad's Now / Next / Later roadmap, filled with
the Fieldwork Studio mock data. It is a design reference only; restyle anything
taken from it before commercial use.

Run it with `npm install && npm run dev` (port 5304), then open
<http://localhost:5304/>. `npm run build` produces a static site that works from
any folder. With the dev server running, `node scripts/check.mjs` runs an
interaction smoke test and `node scripts/shoot.mjs <route> <file> [width]` takes
a screenshot.

## Where things are

| Route | What it shows |
| --- | --- |
| `#/portfolio/roadmap` | Staff roadmap for all clients (default) |
| `#/portfolio/roadmap?stage=completed` / `?stage=candidates` | Completed and Candidates sections |
| `#/product/<project>/roadmap` | One project's roadmap, e.g. `harbor-shop` |
| `…?i=<initiative>` | Initiative canvas opened over the roadmap |
| `#/portfolio/published` | Published roadmaps: one read-only link per client |
| `#/p/<share_token>` | What the client sees, e.g. `#/p/VHw8sw4Rlx83` for Meridian |
| `#/portfolio/overview` | Product Portfolio tab: clients and their projects |

The staff view and the client view are linked through the "Published roadmaps"
tab and the `⋯` menu on a project ("View published roadmap"). ProdPad has no
in-app toggle between the two; a published roadmap is a separate URL, so the
replica works the same way.

## Content mapping

All mock content is in [`src/data/roadmap.json`](src/data/roadmap.json), built
from `seed/seed.json`.

- **Cards (initiatives)** are the seed's 25 milestones. A project's in-progress
  milestone is in **Now**, its next one in **Next**, the rest in **Later**, and
  done milestones are in **Completed** with their completion date.
- **Product lines** are the four clients; **products** are the five projects.
- **Objectives** are client goals (one or two per client) plus two studio-wide
  goals, "Deliver on agreed dates" and "Clients run it without us".
- **Tags** are the phase (Discovery, Design, Build, QA, Launch, Handoff) and
  flags (Waiting on client, ⚠️ Dependency, At risk).
- **Linked ideas** are the tasks inside each milestone; their workflow stage
  drives the progress donut on the card.
- **Linked feedback / comments** are the seed's updates. Updates the client
  can't see, and each project's internal note, appear only in the staff canvas.
- **Dependencies** ("Blocked by") link milestones in order, plus two external
  blockers (the EHR vendor's sandbox, Lumen's board review).
- Three **candidates** (subscription boxes, appointment booking, investor update
  template) were invented so that section isn't empty.
- **Visibility**: milestones are Public, candidates Internal. Toggling "Make
  public" in the canvas adds or removes the card from the client's page.

## What's replicated

- Three-column board with column headings, counts ("4 initiatives, 13 ideas"),
  column descriptions, dashed dividers, and double-click editing of headings
  and descriptions.
- Initiative cards: objective labels with coloured underline bars (portfolio
  objectives get the three-circle icon), title, description, "Blocked by" line,
  target-date chip (overdue in red), tag pills, progress donut, linked-ideas and
  feedback count, Public/Internal.
- Drag and drop between and within columns, with a drop placeholder and edge
  auto-scroll. Mouse drags start after a 5px move; touch drags start with a
  300ms long press so phones can still scroll. While dragging, the Completed
  and Candidates segments become drop targets; dropping on Completed asks for a
  completion date and outcome. Dragging is disabled in "Group by objective", as
  in the original.
- Completed / Roadmap / Candidates switch. Completed groups cards into "last 3
  months", "3 - 6 months ago" and "more than 6 months ago".
- Group by objective: one row per objective with the pill-on-a-line title,
  ranked by how many of its initiatives are in Now.
- Filters panel: title search, objectives, owners, product line, product,
  roadmap column, tag and visibility, with counts, Reset and stubbed Save.
- Display options: the Collapsed / Expanded / Detailed saved views plus
  per-field toggles (Detailed adds the linked-ideas list on cards).
- Initiative canvas (modal): breadcrumb, editable title, Roadmap position
  picker, description and target outcomes (click to edit), release outcomes,
  linked ideas with editable workflow stage, user stories, comments (with a
  client-visible flag), objectives and attributes editing (tags, owners, make
  public, target date), dependencies, impact/effort scoring, previous/next
  navigation, full-screen, delete.
- Add an initiative dialog.
- Published roadmap (client view): the embed widget's look, including Arial,
  the `#F4F4F4` panel, the older objective palette, target-date chips and
  "Powered By" footer. It shows an "Upcoming" roadmap and a "Recently Launched"
  completed section, the way ProdPad's own public roadmap page stacks two
  widgets. Only public initiatives appear; internal notes, internal comments and
  candidates never do.
- Product header with breadcrumb, "Switch product", Follow toggle, tabs and
  Product Managers; Portfolio header with its own tab set.
- Changes persist in `localStorage`; `⋯ → Reset demo data` restores the seed.
- At 390px the side nav becomes a drawer, the toolbar stacks, columns stack in
  Now → Next → Later order, the filters panel goes full screen and the canvas
  becomes a full-screen single column.

## Sources

- [Blog: "I invented the Now-Next-Later roadmap"](https://www.prodpad.com/blog/invented-now-next-later-roadmap/)
  and its example image (`roadmap-initiatives.jpg`): card anatomy, toolbar, the
  Completed / Roadmap / Candidates switch.
- Help centre screenshots and text:
  [Roadmap Views](https://help.prodpad.com/article/552-roadmap-views),
  [Roadmap Saved Filters](https://help.prodpad.com/article/551-roadmap-filters),
  [Group by Objectives](https://help.prodpad.com/article/1210-group-by-objectives),
  [Completed Initiatives](https://help.prodpad.com/article/535-completed-initiatives),
  [Candidate Initiatives](https://help.prodpad.com/article/533-candidate-initiatives),
  [Target dates](https://help.prodpad.com/article/1294-adding-a-target-date-to-your-initiatives),
  [Dependencies](https://help.prodpad.com/article/1333-indicating-dependencies-between-initiatives),
  [Side peek](https://help.prodpad.com/article/1271-using-the-side-peek-view),
  [Published Roadmaps](https://help.prodpad.com/article/555-roadmap-publishing-app),
  and the [2026 release notes](https://help.prodpad.com/category/73-release-notes).
- ProdPad's own public roadmap, [Our Roadmap](https://www.prodpad.com/about-us/our-roadmap/),
  rendered headlessly at 1440px and 390px. Its widget stylesheet gave the
  published view's exact colours, sizes and breakpoints.
- The app's public stylesheet (linked from <https://app.prodpad.com/login>,
  version 8.190, October 2026) gave the in-app tokens: Figtree body and
  Quicksand headings, the slate/neutral palette, the ten objective colours, the
  side-nav menu item spec, card padding and radii, and roadmap column rules.

Captures are in the git-ignored `reference/` folder.

## Remaining differences and guesses

1. **Heading font.** Every public screenshot (2022 to April 2026) shows a serif
   heading font, but the live stylesheet now sets Quicksand for headings and
   Figtree for body text. The replica follows the stylesheet. To match the
   screenshots instead, set `--font-family-title` to Libre Baskerville and the
   body to Nunito Sans in `src/styles/app.css`.
2. **Side nav.** The live stylesheet describes a white nav with account
   switcher at the top and profile at the bottom; screenshots show an older
   grey nav. The replica follows the stylesheet; icons are open-source
   approximations of ProdPad's own icon font.
3. **Toolbar controls after August 2026.** The release notes mention "new
   dropdown controls for stage and group by on Roadmaps", which no public
   screenshot shows yet. The replica keeps the documented segmented switch and
   toggle.
4. **Portfolio roadmap layout.** ProdPad shows a portfolio as product
   swimlanes or as one "unified" set of columns. The replica uses the unified
   columns and labels each card with its project name (a "Product names"
   display option). Where exactly ProdPad prints product names on cards is a
   guess.
5. **Progress donut.** ProdPad's card footer has a chart icon slot; the donut of
   released ideas is our interpretation of it.
6. **Mobile.** No public material shows the ProdPad app at phone width. The
   390px layout of the app is a guess; the published page's 390px layout
   follows the real widget's breakpoints.
7. **Not built.** Dashboard, Ideas, Feedback, Personas, Reports, Canvas, OKRs,
   Chart, Documentation, Files, AI features, saving filters, editing published
   roadmaps, PDF export and password protection show a "not part of this
   replica" message. Drag-and-drop between Completed and Candidates cards is
   only via the stage switch, not within those grids.
8. **Branding.** The logo and product name are replaced by "Fieldwork Studio"
   with a plain "FS" mark, including the published page's "Powered By" line.
