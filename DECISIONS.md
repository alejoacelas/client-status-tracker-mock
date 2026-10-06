# Decisions

## Core decisions

### Keeping client data separate
- [Clients read their data only through `client_portal(token)`](#client-portal-function)

### Automation
- [The daily routine commits change files; a GitHub Action applies them](#change-files-and-the-action)
- [Change files are applied once, when added](#apply-once)

### Airtable sharing
- [The Airtable client link is a shared base view](#airtable-client-link)

## Details

### Client portal function
Row-level security blocks anonymous reads of every table. Client pages call the
security-definer function `client_portal(token)` in
[supabase/schema.sql](supabase/schema.sql), which returns only client-visible
fields and updates. Adding a field to the client page means adding it to that
function; never grant `anon` select on the tables.

### Change files and the Action
Claude routines use claude.ai connectors but can't be given secrets, so the
routine never writes to Supabase or Airtable. It commits
`changes/YYYY-MM-DD.json`, and [the Action](.github/workflows/apply-changes.yml)
applies it with repository secrets. The git history doubles as an audit log of
automated edits.

### Apply once
The Action applies only change files added in the triggering push. Re-applying
old files would overwrite later manual edits to status or progress. Updates are
also de-duplicated by `source_ref`.

### Airtable client link
On Airtable's free plan, public interface pages need the Team plan and external
viewers need the Portals add-on. The free option is a public read-only link to a
filtered base view with internal fields hidden.

## Decision log
