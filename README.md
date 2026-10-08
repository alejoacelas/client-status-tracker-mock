# Client status tracker

Varun wants to use Claude Code to build a project status tracker they can share
with their clients. This repository holds what we learned scoping it and a set of
design references to choose a layout from.

## What the tracker depends on

1. **A place for the status data**, which every part reads and writes: staff
   edits, client pages and any automated updates.
2. **Hosting** for the client-facing pages.
3. **Per-client privacy**, so each client sees only their own projects and never
   internal notes.
4. **An update workflow**: a Claude subscription for whoever runs Claude Code,
   Git and a GitHub account, and a `CLAUDE.md` describing the data.

## What we tested

In October 2026 we built the same mock tracker (fictional agency, four clients;
data in [seed/seed.json](seed/seed.json)) two ways, then deleted both builds.

1. **Airtable.** Staff tools are the strongest part: board, timeline,
   per-person views, forms, comments, record history and no-code automations.
   Client sharing is the weak part:
   - On the free plan, the only public option is a read-only link to a filtered
     table view.
   - Public interface pages need the Team plan (about $20 per editor per month
     billed annually, $24 monthly).
   - Client logins need the paid Portals add-on.
   - Interfaces, pages and automations can be created through Airtable's
     connector; views inside the base can only be made in the UI.
2. **Supabase (Postgres) with a custom site.** This gives branded client pages
   with no login, one secret link per client. The database enforces privacy:
   anonymous visitors can't read any table, and a client link can only call a
   function that returns that client's visible fields. The staff console needs
   code for every new field or view. Costs for real use:
   - Supabase Pro, $25 a month, for backups and so the project never pauses.
   - Hosting that allows commercial use: Vercel Pro at $20 per member per month,
     or Cloudflare Pages for free. Vercel's free Hobby plan is non-commercial.

We also ran daily updates from Gmail and Slack. A Claude routine read the
messages through the claude.ai connectors and committed a change file. A GitHub
Action, which held the database keys, then applied it to both versions. The
indirection is needed because routines can't hold secrets.

## Recommendation

Build the Supabase version. It's the one that can guarantee each client sees
only their own data, show a page that looks like Varun's business, and grow into
client logins or approvals.

Two cases point elsewhere:

- **Varun's staff want to keep editing in a spreadsheet.** Keep Postgres for the
  client pages and sync from Airtable, as 80,000 Hours' Minerva does with its job
  board. The sync is the part most likely to break.
- **Nobody will maintain code, and a link anyone can open is private enough.**
  Use Airtable Team alone.

The first question to ask Varun is how their staff update project status today.

## Design references

[replicas/](replicas/) holds internal replicas, browsable together at
https://status-tracker-designs.vercel.app, of well-known status-page
patterns, so a design can be described as "layout X, grouped by Y, plus block
Z". They copy layout, colours and behaviour but carry no logos. They are
references only and must be restyled before any commercial use.
