# Client status tracker mock

A mock of a project status tracker that an agency shares with its clients, built
twice to compare approaches:

1. **Airtable version:** an Airtable base plus a native Airtable interface.
2. **Supabase version:** a Supabase database, a client page per client at
   `/c/<share_token>`, and a staff console at `/admin`, deployed on Vercel.

A daily cloud routine reads project updates from Gmail and Slack and applies
them to both versions. All data is fictional (`seed/seed.json`), so the repo is public.

## Layout

- `seed/seed.json`: the shared mock data both versions are loaded from.
- `supabase/schema.sql`: tables, row-level security and the `client_portal` function.
- `scripts/`: Node scripts for applying the schema, seeding and creating the staff login.
- `web/`: the Vite + React app (client pages and staff console).
- `routine/DAILY_JOB.md`: instructions the daily cloud routine follows.
- `changes/`: change files the routine commits; `.github/workflows/apply-changes.yml`
  applies each new one to Supabase and Airtable with `scripts/apply-changes.mjs`.

## Airtable version

Base `apppVEn1Dkc0dBXfk` ("Fieldwork Studio — Client Status (mock)") in the
personal Airtable workspace. Interfaces: "Fieldwork Studio — Staff" (board,
timeline, milestones, updates) and "Meridian Family Clinic — Project status"
(a read-only client view; the other three clients don't have one yet). On the
free plan, interface pages can't be shared publicly, so the client link is a
shared base view: Projects → "Meridian — client link".

## Daily job

Claude routine `trig_0165VFWqKuR5pY4gXyb3Chic` runs daily at 07:00 UTC with the
claude.ai Gmail and Slack connectors (personal accounts; Slack workspace "AI
Uplift for EA"). It reads `[status-mock]` emails and `[status-mock]` messages in
the Slack DM with yourself, commits `changes/YYYY-MM-DD.json` and posts a
`[status-mock digest]` DM. Routines can't hold secrets, so the GitHub Action
does the writes. Test a change file without the routine using
`node --env-file=.env scripts/apply-changes.mjs <file> --dry-run`.

## Web app

Run locally with `cd web && npm install && npm run dev`. It needs
`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `web/.env.local`
(ignored); copy them from `SUPABASE_PROJECT_URL` and `SUPABASE_PUBLISHABLE_KEY`
in the root `.env`.

Deployed at https://client-status-tracker-mock.vercel.app (Vercel project
`client-status-tracker-mock`, team `alejandros-projects-a115cc74`, root
directory `web`). Pushes to `main` deploy to production; the two `VITE_`
variables are set in the Vercel project. `web/vercel.json` rewrites every path
to `index.html` so `/c/<share_token>` and `/admin` load the app.

## Credentials

`.env` is ignored and rebuilt from 1Password (personal account, vault `mac-agents`)
with `~/best/dotfiles/bin/op-agent`:

| Variables | 1Password item | Fields |
| --- | --- | --- |
| `SUPABASE_PROJECT_URL`, `SUPABASE_PROJECT_REF`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_DB_PASS`, `SUPABASE_DB_URL`, `SUPABASE_POOLER_URL`, `SUPABASE_ORG_SLUG` | Supabase — client-status-tracker-mock | `project_url`, `project_ref`, `publishable_key`, `db_password`, `db_url`, `pooler_url`, `org_slug` |
| `STAFF_TEST_EMAIL`, `STAFF_TEST_PASSWORD` | Status tracker mock — staff test login | `username`, `password` |
| `AIRTABLE_TOKEN`, `AIRTABLE_BASE_ID` | Airtable — client-status-tracker-mock daily job | `credential`, `base_id` |

The GitHub Action reads `SUPABASE_POOLER_URL`, `SUPABASE_DB_PASS` and
`AIRTABLE_TOKEN` from repository secrets; reset them from `.env` with
`gh secret set`.

`STAFF_EMAILS` (comma-separated staff allowlist used by the seed script) is not
secret: `alejoacelas@gmail.com,staff@example.com`.

Supabase was provisioned through Stripe Projects (`.projects/`, ignored). The
password inside the provisioned connection URLs is rejected; `scripts/db.mjs`
connects with `SUPABASE_DB_PASS` instead.
