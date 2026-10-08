# Delivery tracker replica

An unbranded replica of the Domino's Pizza Tracker, filled with the Fieldwork
Studio seed projects. One tracker per project; the five order stages become the
five project phases.

Run it with `npm install && npm run dev` and open <http://localhost:5306/>.
`npm run build` produces a static site in `dist/` that works from any path.

## Version replicated

The **2019–2023 US web tracker with GPS**: a white card titled
"Domino's Tracker®", a pill-shaped bar of five skewed segments with a red block
that slides to the active stage, a named-person status line, and a map panel
underneath. It is the best-documented version because the Wayback Machine holds
the tracker's own HTML and CSS (the "gps" theme that dominos.com loaded in an
iframe), the English message strings, and the site CSS. Phone screenshots from
2019–2023 confirm what it looked like with real orders.

Two other versions were considered:

- The 2008–2014 glossy "Pizza Tracker" (orange glow, numbered segments) and the
  2014–2018 flat blue version are well documented only through screenshots.
- The March 2026 redesign (stages Placed, Make, Deliver, "mmm!") has a press
  release and a few photos but no capturable page.

## Sources

Primary material (archived page code, read as data, never executed):

1. Tracker page, 12 Oct 2022:
   <https://web.archive.org/web/20221012005444/https://www.dominos.com/en/pages/tracker/>
2. GPS tracker theme HTML and CSS, the source of the bar geometry, colours and
   animation timing:
   <https://web.archive.org/web/2022/https://www.dominos.com/assets/build/js/site/tracker/themes/gps/build/index.html>
   and `…/gps/build/css/gps.css`.
3. Site CSS (`screen.css`, `order.css`, `order.desktop.css` under
   `cache.dominos.com/olo/6_95_3/assets/build/css/`), the source of the map
   overlay, driver status card, page background, header heights and fonts.
4. English tracker strings, `…/market/US/_en/config/dpz.lang.tracker.js`, for
   message wording ("$ManagerName$ began preparing your order at $StartTime$",
   "Follow your order from the store to your door…", "Meet Your Delivery
   Driver").

Screenshots used for comparison:

- Desktop bar with estimate line: <https://www.rankred.com/wp-content/uploads/tracker.jpg>
- App tracker with estimate box: <https://lh7-us.googleusercontent.com/p7VVKDGcpI1mX-VKK3q2EhrwKZ42GCzAaKt3aJ3dVUGEYP7jlwxOeqgfoK_DJIr1VsL_QJpYsMoQpt1RgeNPrr4B1ZnzleKMucPJqhNhUrGDuxedJPpv593U8r6N6j-5OvaytoT2EmlKjuvzpS09XK0>
- Mobile web with map overlay: <https://res.cloudinary.com/madimages/image/fetch/q_auto,f_auto,fl_immutable_cache/https://s3.amazonaws.com/mobileappdaily/mad/uploads/post_mad_img_1735645308.webp>
- Phone with map overlay and "Get updates" card: <https://i.redd.it/01mlm6bsf3ja1.jpg>
- Mobile with "Current estimated pickup time": <https://i.redd.it/vgzk8iua8d5c1.jpg>
- Quality Check stage on mobile: <https://pbs.twimg.com/media/FlyAEmSXgAAV1sL.jpg>
- Desktop header and lookup card: <https://images.ctfassets.net/erglja63hoxc/ZKnLBjWey7XlWfp0FW8Ef/f424309818e1d8390297780cab2e2107/Dominos_Track_Laptop_Mockup.png>
- GPS press images (driver name, photo, ETA bubble):
  <https://mma.prnewswire.com/media/1041320/Dominos_GPS_Driver.jpg>,
  <https://www.presse-citron.net/app/uploads/2019/07/Dominos-Pizza-GPS.jpg>
- Older versions, for context: <https://cdn.iphoneincanada.ca/wp-content/uploads/2014/05/dominos-tracker.jpg>,
  <https://pixel.nymag.com/imgs/daily/grub/2017/11/29/29-dominos-pizza-tracker.nocrop.w710.h2147483647.jpg>
- 2026 redesign announcement: <https://ir.dominos.com/node/24451>

Captures live in the ignored `reference/` folder. `reference/shots/ref-bar-*`
renders the archived tracker markup with its own CSS at every stage (no
scripts), which is the closest pixel reference available.

## What's replicated

- **Stage bar.** Same segment widths, skew, colours (`#006491` done,
  `#3aade4` upcoming, `#e31837` active, `#00587c` base) and the separate,
  taller red block. Changing stage fades the red block's label out, slides the
  block for 1 s, then fades the new label in; upcoming segments recolour over
  0.75 s and their labels fade in after a 1 s delay. The handheld layout
  (≤640 px) uses the original's narrower proportions.
- **All seven states**: brief received (bar idle, no red block), the five
  phases, and complete (red block leaves to the right, the bar turns red and
  "COMPLETE" fades in).
- **Status lines.** "Tom Okafor began Build on 7 Sep" in the bold line, the
  phase detail in the smaller line below, and "Current estimated launch date"
  under the title.
- **GPS map panel.** Before Launch: the blue 60 % overlay with the "Follow your
  order…" text and the car, dotted line and pin. During Launch: the status
  card ("Left the studio" / "In your neighborhood"), the launch lead's name and
  ETA, an expandable profile, a moving driver pin, a route, and the red ETA
  bubble at the client. Fullscreen and zoom buttons work. The map is a drawn SVG.
- **Page around it.** Blue header (76 px desktop with nav, sign-in block and
  badge; 51 px handheld with menu and centred mark), the card overlapping the
  map, the "Get updates" opt-in, a project-details card (order details), a
  studio card (store details), a star rating, a footer, and the tracker lookup
  page at `#/` (idle bar, "Track your project" form, recent projects).
- **Demo control** (dark bar at the bottom, not part of the original): project
  switcher, Back, Next, Play (steps every 3.5 s and loops), and Today. The
  stage is kept in the URL, for example `#/track/harbor-shop?step=5`.

## Content mapping

| Original | Replica |
| --- | --- |
| Ordered, Prep, Bake, Quality Check, Delivery | Discovery, Design, Build, Review, Launch |
| "Jesse began preparing your order at 6:27" | "Tom Okafor began Build on 7 Sep" |
| "Current estimated Delivery time 13 - 19 mins" | "Current estimated launch date 14 Nov" |
| Driver, ETA in minutes, store and house markers | Launch lead, ETA in days, studio and client markers |
| Order details, store, rate your order | Milestones, studio contact, rate the project |
| Phone-number lookup and recent orders | Email lookup and recent projects |

All mock data is in `src/data.ts`. Clients, projects, milestones, statuses and
client-visible updates come from `seed/seed.json`; phase start dates, phase
leads, brief dates and the per-phase detail lines were added so every stage has
a person and a date. "Today" is 8 October 2026.

## Remaining differences

- **Typeface.** The original uses the proprietary One Dot Condensed. The replica
  uses Barlow Condensed Bold, which matches its width and weight closely; letter
  shapes differ slightly (rounder S and R, smaller registered mark). Body text is
  Arial, as on the original.
- **Branding.** No logos: a tilted "FS" tile and "Fieldwork Studio" replace the
  logo, the store marker and the patent number ("Patent pending" instead).
- **Map.** A static, drawn street map instead of the Bing/HERE map tiles.
- **Long labels.** "Discovery" is longer than "Ordered", so on handheld the
  active label at stage 1 is set smaller and the second label is nudged right.
- The bar's estimate line and the title sit in normal document flow instead of
  the original's absolute positions, so vertical spacing differs by a few
  pixels.

## Guesses

- The desktop layout below the map (two columns: updates and project details;
  studio and rating) is invented; no full desktop screenshot of the GPS-era
  page with an active order was found.
- The launch-lead block inside the map status card combines the web status card
  with the press images' "Your delivery driver is: WILLIAM" layout.
- Footer contents, the handheld menu drawer and nav labels are placeholders.
- How at-risk and blocked projects show: the original has no such states, so
  the risk goes into the estimate line ("30 Oct (at risk)").
