# Client status tracker

Scoping and design references for Varun's client-facing project status tracker.
[README.md](README.md) states the ask, what we tested and the recommendation.

## Layout

- `seed/seed.json`: fictional mock data (agency "Fieldwork Studio", four clients).
  Use it for any prototype or replica.
- `replicas/<name>/`: one standalone Vite app per design reference. Each has a
  `REPLICA_NOTES.md` naming its source pages and known differences. Captures of
  the original pages go in `replicas/<name>/reference/`, which is ignored so
  third-party screenshots and HTML stay out of this public repository.

## Replicas

Replicas copy the original's layout, colour palette, typography and behaviour as
closely as possible, but replace logos and brand names with "Fieldwork Studio".
They are internal references; restyle anything taken from them before Varun uses
it commercially. Run one with `cd replicas/<name> && npm install && npm run dev`.

## Gallery site

https://status-tracker-designs.vercel.app shows every replica behind one
wrapper (`gallery/index.html`): a top bar with the design name, its
inspiration and arrows, plus a first-visit help popup. The site sends
`noindex`. Vercel project `status-tracker-designs` (team
`alejandros-projects-a115cc74`) is connected to this repository: every push to
`main` runs `scripts/build-site.sh` per [vercel.json](vercel.json) and deploys
`site/`. Run the same script locally to check a build. To add a
design, add its folder under `replicas/` and an entry to the `designs` list in
`gallery/index.html`, and to `DESIGNS` in `api/comments.js`.

The gallery opens on Now / Next / Later. A one-word path names the viewer for
comments: `https://status-tracker-designs.vercel.app/varun#hill-chart` posts as
"Varun" (`vercel.json` rewrites such paths to the gallery). Check the deployed
site with `node scripts/check-gallery.mjs [base-url] [screenshot-dir]`, which
needs `npx playwright install chromium` once.

Comments: the "Comments" panel in the gallery posts to `api/comments.js`, which
stores one private JSON blob per comment in the Vercel Blob store
`status-tracker-comments`. Read them all with
`vercel blob list --prefix comments/` from the repo root. The store's
`BLOB_READ_WRITE_TOKEN` is set in the Vercel project's environment; a copy is in
1Password (personal account, vault `mac-agents`, item
"Vercel Blob — status-tracker-comments", field `credential`), and
`vercel env pull .env.local` restores it locally.

## Claude artifact

The same gallery is also a private Claude artifact,
https://claude.ai/artifact/Cu4Yfn9stgT87cg6FfPWpQ, shared from its Share menu.
Its wrapper is `gallery/claude.html`: the "Comment" button opens Claude's
comment box anchored to the design on screen, and comments are read with the
`ArtifactComments` tool. To update it, run `scripts/build-site.sh`, copy each
`site/<name>/` folder plus `gallery/claude.html` (as `index.html`) into one
folder, and republish to that URL with every file under the replica folders
except the `.eot`, `.ttf` and `.svg` font fallbacks, which the artifact host
rejects or doesn't need.

