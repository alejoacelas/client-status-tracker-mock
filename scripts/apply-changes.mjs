// Applies a batch of project changes to both versions of the tracker:
// Supabase (through Postgres) and Airtable (through its REST API).
//
//   node --env-file=.env scripts/apply-changes.mjs changes.json [--dry-run]
//
// The file format is documented in routine/DAILY_JOB.md. Projects and
// milestones are matched by name (case-insensitive). Updates carry a
// source_ref (for example "gmail:<message id>" or "slack:<channel>/<ts>"), and an
// update whose source_ref already exists is skipped, so reruns are safe.
import { readFile } from 'node:fs/promises';
import { connect } from './db.mjs';

const STATUSES = ['Not started', 'On track', 'At risk', 'Blocked', 'Done'];
const PHASES = ['Discovery', 'Design', 'Build', 'Review', 'Launch'];
const MILESTONE_STATUSES = ['Not started', 'In progress', 'Done'];
const SOURCES = ['Manual', 'Email', 'Slack', 'Daily job'];
const PROJECT_FIELDS = ['status', 'phase', 'progress', 'client_summary', 'internal_notes'];

const AIRTABLE = {
  projects: 'tblVWblYPJw6p0Jhe',
  milestones: 'tblvcQIevEVc2kw8H',
  updates: 'tbl3hPz0vDhh9JdoG',
};
const AIRTABLE_PROJECT_FIELDS = {
  status: 'Status',
  phase: 'Phase',
  progress: 'Progress',
  client_summary: 'Client summary',
  internal_notes: 'Internal notes',
};

const [file, flag] = process.argv.slice(2);
if (!file) throw new Error('Usage: apply-changes.mjs changes.json [--dry-run]');
const dryRun = flag === '--dry-run';
const changes = JSON.parse(await readFile(file, 'utf8'));
const today = new Date().toISOString().slice(0, 10);

validate(changes);
const log = [];
await applySupabase();
await applyAirtable();
console.log(log.join('\n') || 'No changes.');

function validate({ updates = [], project_changes = [], milestone_changes = [] }) {
  const check = (ok, message) => { if (!ok) throw new Error(message); };
  for (const u of updates) {
    check(u.project && u.summary && u.source_ref, `Update needs project, summary and source_ref: ${JSON.stringify(u)}`);
    check(SOURCES.includes(u.source ?? 'Daily job'), `Unknown source "${u.source}"`);
  }
  for (const p of project_changes) {
    check(p.project, `Project change needs a project: ${JSON.stringify(p)}`);
    check(!p.status || STATUSES.includes(p.status), `Unknown status "${p.status}"`);
    check(!p.phase || PHASES.includes(p.phase), `Unknown phase "${p.phase}"`);
    check(p.progress === undefined || (Number.isInteger(p.progress) && p.progress >= 0 && p.progress <= 100), `Progress must be 0-100: ${p.progress}`);
  }
  for (const m of milestone_changes) {
    check(m.project && m.milestone, `Milestone change needs project and milestone: ${JSON.stringify(m)}`);
    check(!m.status || MILESTONE_STATUSES.includes(m.status), `Unknown milestone status "${m.status}"`);
  }
}

function completedOn(m) {
  if (m.status !== 'Done') return m.status ? null : undefined;
  return m.completed_on ?? today;
}

async function applySupabase() {
  const db = await connect();
  await db.query('begin');
  try {
    const projectId = async (name) => {
      const { rows } = await db.query('select id from projects where lower(name) = lower($1)', [name]);
      if (rows.length !== 1) throw new Error(`Supabase: no single project named "${name}"`);
      return rows[0].id;
    };

    for (const u of changes.updates ?? []) {
      const { rows } = await db.query('select 1 from updates where source_ref = $1', [u.source_ref]);
      if (rows.length) { log.push(`Supabase: skipped already-recorded update ${u.source_ref}`); continue; }
      await db.query(
        'insert into updates (project_id, date, source, summary, client_visible, source_ref) values ($1, $2, $3, $4, $5, $6)',
        [await projectId(u.project), u.date ?? today, u.source ?? 'Daily job', u.summary, Boolean(u.client_visible), u.source_ref]);
      log.push(`Supabase: added update to ${u.project}`);
    }

    for (const p of changes.project_changes ?? []) {
      const fields = PROJECT_FIELDS.filter((f) => p[f] !== undefined);
      if (!fields.length) continue;
      const sets = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
      await db.query(`update projects set ${sets} where id = $1`, [await projectId(p.project), ...fields.map((f) => p[f])]);
      log.push(`Supabase: updated ${p.project} (${fields.join(', ')})`);
    }

    for (const m of changes.milestone_changes ?? []) {
      const pid = await projectId(m.project);
      const { rows } = await db.query('select id from milestones where project_id = $1 and lower(name) = lower($2)', [pid, m.milestone]);
      if (rows.length !== 1) throw new Error(`Supabase: no single milestone "${m.milestone}" in ${m.project}`);
      const done = completedOn(m);
      await db.query(
        `update milestones set status = coalesce($2, status), due_date = coalesce($3, due_date),
           completed_on = case when $4::boolean then $5::date else completed_on end where id = $1`,
        [rows[0].id, m.status ?? null, m.due_date ?? null, done !== undefined, done ?? null]);
      log.push(`Supabase: milestone "${m.milestone}" in ${m.project} -> ${m.status ?? 'updated'}`);
    }

    await db.query(dryRun ? 'rollback' : 'commit');
  } catch (error) {
    await db.query('rollback');
    throw error;
  } finally {
    await db.end();
  }
}

async function airtable(path, { method = 'GET', body } = {}) {
  const res = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${path}`, {
    method,
    headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
    body: body && JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Airtable ${method} ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function listAll(table) {
  const records = [];
  let offset;
  do {
    const page = await airtable(`${table}${offset ? `?offset=${offset}` : ''}`);
    records.push(...page.records);
    offset = page.offset;
  } while (offset);
  return records;
}

async function applyAirtable() {
  const [projects, milestones, updates] = await Promise.all(
    [AIRTABLE.projects, AIRTABLE.milestones, AIRTABLE.updates].map(listAll));
  const projectId = (name) => {
    const found = projects.filter((r) => r.fields.Name?.toLowerCase() === name.toLowerCase());
    if (found.length !== 1) throw new Error(`Airtable: no single project named "${name}"`);
    return found[0].id;
  };
  const write = async (table, method, records) => {
    if (!dryRun && records.length) await airtable(table, { method, body: { records, typecast: true } });
  };

  const seen = new Set(updates.map((r) => r.fields['Source ref']).filter(Boolean));
  const newUpdates = [];
  for (const u of changes.updates ?? []) {
    if (seen.has(u.source_ref)) { log.push(`Airtable: skipped already-recorded update ${u.source_ref}`); continue; }
    newUpdates.push({ fields: {
      Summary: u.summary, Date: u.date ?? today, Source: u.source ?? 'Daily job',
      'Client visible': Boolean(u.client_visible), 'Source ref': u.source_ref, Project: [projectId(u.project)],
    } });
    log.push(`Airtable: added update to ${u.project}`);
  }
  for (let i = 0; i < newUpdates.length; i += 10) await write(AIRTABLE.updates, 'POST', newUpdates.slice(i, i + 10));

  const projectPatches = [];
  for (const p of changes.project_changes ?? []) {
    const fields = {};
    for (const [key, name] of Object.entries(AIRTABLE_PROJECT_FIELDS)) {
      if (p[key] !== undefined) fields[name] = key === 'progress' ? p[key] / 100 : p[key];
    }
    if (!Object.keys(fields).length) continue;
    projectPatches.push({ id: projectId(p.project), fields });
    log.push(`Airtable: updated ${p.project} (${Object.keys(fields).join(', ')})`);
  }
  for (let i = 0; i < projectPatches.length; i += 10) await write(AIRTABLE.projects, 'PATCH', projectPatches.slice(i, i + 10));

  const milestonePatches = [];
  for (const m of changes.milestone_changes ?? []) {
    const pid = projectId(m.project);
    const found = milestones.filter((r) => r.fields.Name?.toLowerCase() === m.milestone.toLowerCase() && r.fields.Project?.includes(pid));
    if (found.length !== 1) throw new Error(`Airtable: no single milestone "${m.milestone}" in ${m.project}`);
    const fields = {};
    if (m.status) fields.Status = m.status;
    if (m.due_date) fields['Due date'] = m.due_date;
    const done = completedOn(m);
    if (done !== undefined) fields['Completed on'] = done;
    milestonePatches.push({ id: found[0].id, fields });
    log.push(`Airtable: milestone "${m.milestone}" in ${m.project} -> ${m.status ?? 'updated'}`);
  }
  for (let i = 0; i < milestonePatches.length; i += 10) await write(AIRTABLE.milestones, 'PATCH', milestonePatches.slice(i, i + 10));

  if (dryRun) log.push('Dry run: nothing was written.');
}
