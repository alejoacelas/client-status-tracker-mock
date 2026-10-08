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
`noindex`. Rebuild and redeploy with:

```sh
./scripts/build-site.sh && cp -R .vercel site/ && (cd site && vercel deploy --prod --yes)
```

The repo root must be linked to Vercel project `status-tracker-designs` (team
`alejandros-projects-a115cc74`); run
`vercel link --yes --project status-tracker-designs --scope alejandros-projects-a115cc74`
if `.vercel/` is missing, then delete the `.env.local` it creates. To add a
design, add its folder under `replicas/` and an entry to the `designs` list in
`gallery/index.html`.
