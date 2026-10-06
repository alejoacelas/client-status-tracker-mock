# Client status tracker mock

A mock of a project status tracker that a small agency ("Fieldwork Studio",
fictional) shares with its clients, built two ways to compare them:

1. **Airtable:** a base with a staff interface (board, timeline, milestones,
   updates) and a read-only client view.
2. **Custom:** a Supabase database with a client page per client and a staff
   console, hosted on Vercel at https://client-status-tracker-mock.vercel.app.
   Example client page: [Meridian Family Clinic](https://client-status-tracker-mock.vercel.app/c/VHw8sw4Rlx83).

A daily Claude routine reads project updates from Gmail and Slack and applies
them to both versions through a GitHub Action.

See [AGENTS.md](AGENTS.md) for layout, credentials and how each part runs.
