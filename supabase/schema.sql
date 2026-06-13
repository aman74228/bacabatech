-- Bacaba database schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) to provision
-- the tables used by the app.

-- Extensions ---------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Enums --------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'transcript_status') then
    create type transcript_status as enum ('pending', 'processing', 'completed', 'failed');
  end if;
end$$;

-- Tables -------------------------------------------------------------------

-- users: a row per Clerk user, created on first sign-in.
create table if not exists public.users (
  id          uuid primary key default gen_random_uuid(),
  clerk_id    text not null unique,
  email       text not null,
  created_at  timestamptz not null default now()
);

-- transcripts: one row per transcription job.
create table if not exists public.transcripts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  platform        text,
  video_url       text not null,
  status          transcript_status not null default 'pending',
  transcript_text text,
  format          text,
  created_at      timestamptz not null default now()
);

-- usage: aggregate usage / subscription state per user.
create table if not exists public.usage (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id) on delete cascade,
  transcript_count integer not null default 0,
  is_subscribed    boolean not null default false,
  created_at       timestamptz not null default now(),
  unique (user_id)
);

-- Indexes ------------------------------------------------------------------
create index if not exists transcripts_user_id_idx on public.transcripts (user_id);
create index if not exists transcripts_status_idx on public.transcripts (status);
create index if not exists usage_user_id_idx on public.usage (user_id);

-- Row Level Security -------------------------------------------------------
-- The server uses the service role key (which bypasses RLS). RLS is enabled so
-- that the anon/public key cannot read or write rows directly.
alter table public.users enable row level security;
alter table public.transcripts enable row level security;
alter table public.usage enable row level security;
