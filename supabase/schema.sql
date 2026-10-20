-- GILGAMESH review room: run once in Supabase → SQL Editor → New query → Run.
-- Owner = h0586936991@gmail.com. Everyone else signs up with email + password and stays "pending"
-- until the owner approves them (or their email is on allowed_emails) → "collaborator".
-- Collaborators see everything, comment and draw; only the owner edits the cut and sends notes to Claude.

-- ---------- people ----------
create table if not exists public.allowed_emails (
  email text primary key,
  added_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'pending' check (role in ('owner', 'collaborator', 'pending')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id, lower(new.email), split_part(new.email, '@', 1),
    case
      when lower(new.email) = 'h0586936991@gmail.com' then 'owner'
      when exists (select 1 from public.allowed_emails a where a.email = lower(new.email)) then 'collaborator'
      else 'pending'
    end)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'none')
$$;
create or replace function public.is_member() returns boolean
language sql stable as $$ select public.my_role() in ('owner', 'collaborator') $$;
create or replace function public.is_owner() returns boolean
language sql stable as $$ select public.my_role() = 'owner' $$;

-- ---------- productions and cut versions (built for more films later) ----------
create table if not exists public.projects (
  id text primary key,
  title text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.versions (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects (id) on delete cascade,
  label text not null,
  sha256 text not null,
  model jsonb not null,           -- the review-room model: segments, tracks, items, sources, variants, fileMap
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  unique (project_id, label)
);

-- ---------- feedback ----------
create table if not exists public.notes (           -- frame notes: drawing + text on one frame
  id uuid primary key,
  version_id uuid not null references public.versions (id) on delete cascade,
  author_id uuid not null references auth.users (id),
  author_email text not null,
  revision int not null default 1,
  frame_index int not null,
  scope text not null default 'frame',
  intent text not null default 'note',
  text text not null default '',
  drawings jsonb not null default '[]',
  layout jsonb,
  anchor jsonb not null,          -- time, shot, source file and time of the frame
  base_frame text,                -- storage path of the clean frame
  annotated_frame text,           -- storage path of the frame with the drawing
  archived boolean not null default false,
  submission_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists notes_version on public.notes (version_id);

create table if not exists public.lane_states (     -- range notes on the timeline, item decisions, general note
  version_id uuid primary key references public.versions (id) on delete cascade,
  revision int not null default 0,
  state jsonb not null default '{}',
  updated_by uuid references auth.users (id),
  updated_at timestamptz not null default now()
);

create table if not exists public.edit_states (     -- cuts, removes, framing, guides, shot swaps (owner only)
  version_id uuid primary key references public.versions (id) on delete cascade,
  revision int not null default 0,
  state jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.submissions (     -- what the owner sent to Claude
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.versions (id) on delete cascade,
  submitted_by uuid not null references auth.users (id),
  digest text not null,
  payload jsonb not null,
  summary text not null default '',
  status text not null default 'new' check (status in ('new', 'claimed', 'done')),
  created_at timestamptz not null default now(),
  claimed_at timestamptz
);

-- ---------- row level security ----------
alter table public.allowed_emails enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.versions enable row level security;
alter table public.notes enable row level security;
alter table public.lane_states enable row level security;
alter table public.edit_states enable row level security;
alter table public.submissions enable row level security;

drop policy if exists "owner manages allowed" on public.allowed_emails;
create policy "owner manages allowed" on public.allowed_emails for all using (public.is_owner()) with check (public.is_owner());

drop policy if exists "see own profile, members see all" on public.profiles;
create policy "see own profile, members see all" on public.profiles for select using (id = auth.uid() or public.is_member());
drop policy if exists "owner sets roles" on public.profiles;
create policy "owner sets roles" on public.profiles for update using (public.is_owner()) with check (public.is_owner());
drop policy if exists "rename yourself" on public.profiles;

drop policy if exists "members read projects" on public.projects;
create policy "members read projects" on public.projects for select using (public.is_member());
drop policy if exists "members read versions" on public.versions;
create policy "members read versions" on public.versions for select using (public.is_member());

drop policy if exists "members read notes" on public.notes;
create policy "members read notes" on public.notes for select using (public.is_member());
drop policy if exists "members add notes" on public.notes;
create policy "members add notes" on public.notes for insert with check (public.is_member() and author_id = auth.uid());
drop policy if exists "authors and owner update notes" on public.notes;
create policy "authors and owner update notes" on public.notes for update using (public.is_member() and (author_id = auth.uid() or public.is_owner()));

drop policy if exists "members read lanes" on public.lane_states;
create policy "members read lanes" on public.lane_states for select using (public.is_member());
drop policy if exists "members write lanes" on public.lane_states;
create policy "members write lanes" on public.lane_states for insert with check (public.is_member());
drop policy if exists "members update lanes" on public.lane_states;
create policy "members update lanes" on public.lane_states for update using (public.is_member());

drop policy if exists "members read edits" on public.edit_states;
create policy "members read edits" on public.edit_states for select using (public.is_member());
-- the partner's cuts / take-outs are proposals; the room keeps each item's author and only the owner sends to Claude
drop policy if exists "members write edits" on public.edit_states;
create policy "members write edits" on public.edit_states for insert with check (public.is_member());
drop policy if exists "members update edits" on public.edit_states;
create policy "members update edits" on public.edit_states for update using (public.is_member());

drop policy if exists "members read submissions" on public.submissions;
create policy "members read submissions" on public.submissions for select using (public.is_member());
drop policy if exists "owner submits" on public.submissions;
create policy "owner submits" on public.submissions for insert with check (public.is_owner() and submitted_by = auth.uid());

-- ---------- realtime: everyone sees new notes and changes live ----------
do $$ begin
  begin alter publication supabase_realtime add table public.notes; exception when others then null; end;
  begin alter publication supabase_realtime add table public.lane_states; exception when others then null; end;
  begin alter publication supabase_realtime add table public.edit_states; exception when others then null; end;
  begin alter publication supabase_realtime add table public.versions; exception when others then null; end;
end $$;

-- ---------- storage: one private bucket for films, animations, waves and note frames ----------
insert into storage.buckets (id, name, public) values ('review', 'review', false)
  on conflict (id) do nothing;

drop policy if exists "members read review files" on storage.objects;
create policy "members read review files" on storage.objects for select
  using (bucket_id = 'review' and public.is_member());
drop policy if exists "members upload note frames" on storage.objects;
create policy "members upload note frames" on storage.objects for insert
  with check (bucket_id = 'review' and public.is_member() and (storage.foldername(name))[1] = 'notes');
drop policy if exists "members replace note frames" on storage.objects;
create policy "members replace note frames" on storage.objects for update
  using (bucket_id = 'review' and public.is_member() and (storage.foldername(name))[1] = 'notes');

insert into public.projects (id, title) values ('gilgamesh-trailer', 'GILGAMESH – טריילר') on conflict (id) do nothing;
