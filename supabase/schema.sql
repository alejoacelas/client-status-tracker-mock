-- Schema for the Supabase version of the tracker.
-- Staff edit everything after signing in; clients read their own projects
-- through client_portal(token), which returns only client-visible fields.

create extension if not exists pgcrypto;

create table if not exists staff (
  email text primary key,
  name text not null
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  contact_email text,
  share_token text not null unique default translate(encode(gen_random_bytes(9), 'base64'), '+/', '-_'),
  created_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  name text not null,
  status text not null default 'Not started'
    check (status in ('Not started', 'On track', 'At risk', 'Blocked', 'Done')),
  phase text not null default 'Discovery'
    check (phase in ('Discovery', 'Design', 'Build', 'Review', 'Launch')),
  owner text,
  start_date date,
  due_date date,
  progress int not null default 0 check (progress between 0 and 100),
  client_summary text,
  internal_notes text,
  updated_at timestamptz not null default now()
);

create table if not exists milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  due_date date,
  status text not null default 'Not started'
    check (status in ('Not started', 'In progress', 'Done')),
  completed_on date,
  position int not null default 0
);

create table if not exists updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  date date not null default current_date,
  source text not null default 'Manual'
    check (source in ('Manual', 'Email', 'Slack', 'Daily job')),
  summary text not null,
  client_visible boolean not null default false,
  source_ref text,
  created_at timestamptz not null default now()
);

create index if not exists projects_client_id on projects(client_id);
create index if not exists milestones_project_id on milestones(project_id);
create index if not exists updates_project_id on updates(project_id);

create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists projects_touch on projects;
create trigger projects_touch before update on projects
  for each row execute function touch_updated_at();

-- Staff access: any signed-in user whose email is in the staff table.
create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff where email = auth.jwt() ->> 'email');
$$;

alter table staff enable row level security;
alter table clients enable row level security;
alter table projects enable row level security;
alter table milestones enable row level security;
alter table updates enable row level security;

drop policy if exists staff_read on staff;
create policy staff_read on staff for select to authenticated using (is_staff());

do $$
declare t text;
begin
  foreach t in array array['clients', 'projects', 'milestones', 'updates'] loop
    execute format('drop policy if exists staff_all on %I', t);
    execute format(
      'create policy staff_all on %I for all to authenticated using (is_staff()) with check (is_staff())', t);
  end loop;
end $$;

-- Client access: one call returns everything a client may see, or null for an
-- unknown token. Internal notes and internal updates never leave the database.
create or replace function client_portal(p_token text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'client', c.name,
    'contact_name', c.contact_name,
    'projects', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', p.name,
        'status', p.status,
        'phase', p.phase,
        'owner', p.owner,
        'start_date', p.start_date,
        'due_date', p.due_date,
        'progress', p.progress,
        'summary', p.client_summary,
        'updated_at', p.updated_at,
        'milestones', coalesce((
          select jsonb_agg(jsonb_build_object(
            'name', m.name, 'due_date', m.due_date,
            'status', m.status, 'completed_on', m.completed_on)
            order by m.position, m.due_date)
          from milestones m where m.project_id = p.id), '[]'::jsonb),
        'updates', coalesce((
          select jsonb_agg(jsonb_build_object('date', u.date, 'summary', u.summary)
            order by u.date desc, u.created_at desc)
          from updates u where u.project_id = p.id and u.client_visible), '[]'::jsonb)
      ) order by (p.status = 'Done'), p.due_date)
      from projects p where p.client_id = c.id), '[]'::jsonb)
  )
  from clients c where c.share_token = p_token;
$$;

revoke all on function client_portal(text) from public;
grant execute on function client_portal(text) to anon, authenticated;
