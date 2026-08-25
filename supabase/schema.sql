-- ============================================================
-- Study Hub — Supabase schema
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- profiles (one row per auth user, created automatically)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Automatically create a profile row whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- subjects
-- ------------------------------------------------------------
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#2F5FD1',
  created_at timestamptz not null default now()
);

alter table public.subjects enable row level security;

create policy "Users manage their own subjects"
  on public.subjects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists subjects_user_id_idx on public.subjects(user_id);

-- ------------------------------------------------------------
-- topics (used by the progress tracker, belongs to a subject)
-- ------------------------------------------------------------
create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  name text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.topics enable row level security;

create policy "Users manage their own topics"
  on public.topics for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists topics_user_id_idx on public.topics(user_id);
create index if not exists topics_subject_id_idx on public.topics(subject_id);

-- ------------------------------------------------------------
-- notes
-- ------------------------------------------------------------
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notes enable row level security;

create policy "Users manage their own notes"
  on public.notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists notes_user_id_idx on public.notes(user_id);
create index if not exists notes_subject_id_idx on public.notes(subject_id);
-- Full text search over title + content
create index if not exists notes_search_idx on public.notes
  using gin (to_tsvector('english', title || ' ' || content));

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at
  before update on public.notes
  for each row execute procedure public.set_updated_at();

-- ------------------------------------------------------------
-- schedule_sessions
-- ------------------------------------------------------------
create table if not exists public.schedule_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  topic text not null,
  day_of_week text not null check (day_of_week in
    ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  constraint end_after_start check (end_time > start_time)
);

alter table public.schedule_sessions enable row level security;

create policy "Users manage their own schedule"
  on public.schedule_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists schedule_user_id_idx on public.schedule_sessions(user_id);

-- ------------------------------------------------------------
-- resources (links and/or uploaded files)
-- ------------------------------------------------------------
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  url text,
  file_path text,
  note text,
  created_at timestamptz not null default now(),
  constraint has_url_or_file check (url is not null or file_path is not null)
);

alter table public.resources enable row level security;

create policy "Users manage their own resources"
  on public.resources for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists resources_user_id_idx on public.resources(user_id);

-- ------------------------------------------------------------
-- Storage bucket for uploaded PDFs / files
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('resources', 'resources', false)
on conflict (id) do nothing;

-- Files must be uploaded under a path prefixed with the user's own id,
-- e.g. resources/<user_id>/<filename>. These policies enforce that.
create policy "Users can read their own files"
  on storage.objects for select
  using (bucket_id = 'resources' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can upload their own files"
  on storage.objects for insert
  with check (bucket_id = 'resources' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own files"
  on storage.objects for update
  using (bucket_id = 'resources' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own files"
  on storage.objects for delete
  using (bucket_id = 'resources' and (storage.foldername(name))[1] = auth.uid()::text);
