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

## Resources from the deleted October 2026 builds

These still exist until deleted:

- Supabase project `nnkugftlytvjsgdixvuo` (provisioned through Stripe Projects;
  local state in the ignored `.projects/`).
- Vercel project `client-status-tracker-mock` (team `alejandros-projects-a115cc74`).
- Airtable base `apppVEn1Dkc0dBXfk` in the personal workspace, with a shared view
  link, and a personal access token named "client-status-tracker-mock daily job".
- GitHub Actions secrets `SUPABASE_POOLER_URL`, `SUPABASE_DB_PASS`, `AIRTABLE_TOKEN`.
- Claude routine `trig_0165VFWqKuR5pY4gXyb3Chic`, disabled.
- 1Password items in `mac-agents`: "Supabase — client-status-tracker-mock",
  "Status tracker mock — staff test login" and
  "Airtable — client-status-tracker-mock daily job". The ignored `.env` holds the
  same values.
