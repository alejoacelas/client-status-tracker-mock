// Applies supabase/schema.sql to the database in SUPABASE_POOLER_URL.
import { readFile } from 'node:fs/promises';
import { connect } from './db.mjs';

const sql = await readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
const db = await connect();
await db.query(sql);
await db.end();
console.log('Schema applied.');
