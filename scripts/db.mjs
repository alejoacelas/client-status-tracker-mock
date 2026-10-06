// Connects to Supabase Postgres through the pooler. The password embedded in
// SUPABASE_POOLER_URL (as provisioned by Stripe Projects) is rejected, so the
// connection uses SUPABASE_DB_PASS instead. Supabase's certificate chain isn't
// in Node's default store, so TLS skips chain verification.
import pg from 'pg';

export async function connect() {
  const url = new URL(process.env.SUPABASE_POOLER_URL);
  const db = new pg.Client({
    host: url.hostname,
    port: Number(url.port),
    user: decodeURIComponent(url.username),
    password: process.env.SUPABASE_DB_PASS,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  });
  await db.connect();
  return db;
}
