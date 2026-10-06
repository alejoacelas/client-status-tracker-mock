// Replaces all tracker data in Supabase with seed/seed.json.
// Staff emails come from STAFF_EMAILS (comma-separated) so they stay out of the repo.
import { readFile } from 'node:fs/promises';
import { connect } from './db.mjs';

const seed = JSON.parse(await readFile(new URL('../seed/seed.json', import.meta.url), 'utf8'));
const db = await connect();
await db.query('begin');
await db.query('truncate updates, milestones, projects, clients cascade');

const clientIds = {};
for (const c of seed.clients) {
  const { rows } = await db.query(
    'insert into clients (name, contact_name, contact_email, share_token) values ($1, $2, $3, $4) returning id',
    [c.name, c.contact_name, c.contact_email, c.share_token]);
  clientIds[c.key] = rows[0].id;
}

const projectIds = {};
for (const p of seed.projects) {
  const { rows } = await db.query(
    `insert into projects (client_id, name, status, phase, owner, start_date, due_date, progress, client_summary, internal_notes)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) returning id`,
    [clientIds[p.client], p.name, p.status, p.phase, p.owner, p.start_date, p.due_date, p.progress, p.client_summary, p.internal_notes]);
  projectIds[p.key] = rows[0].id;
}

for (const [i, m] of seed.milestones.entries()) {
  await db.query(
    'insert into milestones (project_id, name, due_date, status, completed_on, position) values ($1, $2, $3, $4, $5, $6)',
    [projectIds[m.project], m.name, m.due_date, m.status, m.completed_on ?? null, i]);
}

for (const u of seed.updates) {
  await db.query(
    'insert into updates (project_id, date, source, summary, client_visible) values ($1, $2, $3, $4, $5)',
    [projectIds[u.project], u.date, u.source, u.summary, u.client_visible]);
}

for (const email of (process.env.STAFF_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean)) {
  await db.query('insert into staff (email, name) values ($1, $2) on conflict do nothing', [email, email.split('@')[0]]);
}

await db.query('commit');
await db.end();
console.log(`Seeded ${seed.clients.length} clients, ${seed.projects.length} projects, ${seed.milestones.length} milestones, ${seed.updates.length} updates.`);
