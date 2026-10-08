# Hill chart replica notes

An unbranded replica of Basecamp's Hill Charts inside a Basecamp-style project,
filled with the Fieldwork Studio mock data. It follows the current (Basecamp 5)
look where public material shows it, and the 2018 launch material where it
doesn't.

Run it with `npm install && npm run dev` (port 5305), then open
<http://localhost:5305/#/p/harbor-shop/todos>. `npm run build` makes a static
build that works from any folder. With the dev server running, `npm run check`
drives every interaction in headless Chromium, including touch dragging.

## Sources

1. [basecamp.com/hill-charts](https://basecamp.com/hill-charts): the concept,
   the update flow and four GIFs (`hill-chart-hero.gif`,
   `dragging-hill-items.gif`, `hill-history-compact.gif`,
   `enabling-hill-charts.gif`). These show dragging, the Cancel / "Drag each
   dot…" / "Save this update" bar, faded labels at the ends of the hill, the
   "Hill Chart Progress" history page and the list options menu.
2. The interactive project mock on the [basecamp.com](https://basecamp.com/)
   homepage. Its stylesheet (`/assets/css/project.css`) lists the app palette
   (ink, subtle, title red, hill and dot colours, card outline) and the sizes of
   the project page, the To-dos screen and the hill chart on a 1088px screen. Its
   SVG gave the hill's geometry, which the replica fits with a normal curve
   (sigma 0.168 of the width, within 3px of the original).
3. Product screenshots on [basecamp.com/features](https://basecamp.com/features):
   `hill-charts.webp`, `project-page.webp`, `to-dos.webp`,
   `universal-menu.webp`, `home-screen.webp`, `message-board.webp`.
4. [New in Basecamp: Better Hill Charts](https://updates.37signals.com/post/new-in-basecamp-better-hill-charts-and-more)
   (October 2023): stepping arrows ("6/6"), "Updated on Sep 6 · See history",
   the "It's been a while since the last update" reminder, stacked dots at the
   end of the hill and the "Track this list on the Hill Chart" checkbox.
5. [Shape Up, chapter 13 "Show Progress"](https://basecamp.com/shapeup/3.4-chapter-13):
   scopes as to-do lists, what uphill and downhill mean, and stuck dots.

Captures of all of these are in the ignored `reference/` folder.

## What's replicated

- **Project page**: account switcher (a text mark replaces the logo), people bar,
  client name, project name with star, and six tool cards (Message Board, Docs &
  Files, To-dos, Chat, Schedule, Card Table). The To-dos card shows a live hill
  thumbnail and list pies.
- **To-dos screen**: "New list", "View as", a working "Filter…", the hill chart
  panel, and each to-do list with a completion pie, description, to-dos with
  assignee and due-date pills, "N completed" toggle and "Add a to-do" form.
  To-dos can be checked off and added.
- **Hill chart**: dots per tracked list, labels to the right uphill and to the
  left downhill, faded labels at either end and while dragging, stacked dots
  where they would overlap, the dashed midline and the two phase labels.
- **Update flow**: Update → drag dots (mouse, touch or arrow keys) → Save this
  update → optional note. Saving adds a snapshot; Cancel discards the draft.
- **History**: arrows step through snapshots, with dots gliding along the curve
  between them. "See history" opens Hill Chart Progress: snapshots grouped by
  day, each with author, time, chart, note and a "Discuss" thread you can add
  comments to.
- **Tracking**: each list's ••• menu tracks or untracks it; new lists can be
  tracked from the "New list" form. Newly tracked lists start at the bottom
  left, as in Basecamp.
- **Stale reminder** when an active project's chart is 14 or more days old
  (Brand refresh shows it).
- **Basecamp-style home** and jump menu for moving between the five projects;
  simple Message Board, Schedule, Docs, Chat and Card Table pages.
- Changes persist in `localStorage`; "Reset demo data" on the home page restores
  the seed.

All mock content is in [src/data.ts](src/data.ts). Each seed project has 4–5
scopes derived from its milestones (for example "EHR integration" stuck uphill
at 30% for three weeks while the clinic waits on vendor sandbox access) and 3–5
snapshots between July and October 2026.

## Guesses (not publicly visible)

- Where the Cancel / Save controls sit in Basecamp 5's update mode. The 2018
  GIFs put them in a bar above the chart; the replica puts them in the panel's
  footer, where Basecamp 5 shows the Update button.
- The note prompt after saving and the "Read the note" link under the author.
  Basecamp says each update shows "whether a note was included" but no
  screenshot shows how.
- Label collision rules beyond what the screenshots show (labels switch sides
  or move up with a bent connector).
- The 14-day threshold for the stale reminder.
- The history page's Basecamp 5 styling; it follows the 2018 GIF with the
  current palette (blue buttons instead of green).
- Phone layout. No public material shows the hill chart at 390px; the replica
  shortens the chart, keeps 13px labels and wraps the footer onto two rows.

## Remaining differences

- Font: Inter replaces the proprietary original. Inter runs slightly wider, so
  long labels take a little more room.
- Avatars are initials, not photos; the account mark is a plain "FS" circle.
- Tools other than To-dos are static pages, the jump menu's Activity, Calendar,
  Reports and Everything tiles go home, and "View as", "Edit" and "Copy…" do
  nothing.
- No dark mode, boosts, notifications or loose to-dos (the "Add a to-do" above
  the first list).
