// Creates (or resets) a confirmed email/password login for STAFF_TEST_EMAIL
// directly in Supabase Auth, so no confirmation email is sent, and adds it to staff.
import { connect } from './db.mjs';

const email = process.env.STAFF_TEST_EMAIL;
const password = process.env.STAFF_TEST_PASSWORD;
const db = await connect();
await db.query('begin');
const existing = await db.query('select id from auth.users where email = $1', [email]);
if (existing.rows.length) {
  await db.query("update auth.users set encrypted_password = extensions.crypt($2, extensions.gen_salt('bf')) where email = $1", [email, password]);
} else {
  const { rows } = await db.query(
    `insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
       confirmation_token, email_change, email_change_token_new, recovery_token)
     values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', $1,
       extensions.crypt($2, extensions.gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')
     returning id`, [email, password]);
  const id = rows[0].id;
  await db.query(
    `insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
     values (gen_random_uuid(), $1::uuid, $2::text, jsonb_build_object('sub', $2::text, 'email', $3::text, 'email_verified', true), 'email', now(), now(), now())`,
    [id, String(id), email]);
}
await db.query('insert into staff (email, name) values ($1, $2) on conflict do nothing', [email, 'Test staff']);
await db.query('commit');
await db.end();
console.log(`Staff login ready for ${email}.`);
