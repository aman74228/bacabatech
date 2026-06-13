-- Phase 2: transcription engine
-- Adds result columns to `transcripts` and a helper to bump usage counts.
-- Run after supabase/schema.sql (or apply via `supabase db push`).

alter table public.transcripts
  add column if not exists language         text,
  add column if not exists duration_seconds numeric,
  add column if not exists segments         jsonb,
  add column if not exists error            text;

-- Atomically increment a user's transcript_count (used after a successful job).
create or replace function public.increment_transcript_count(p_user_id uuid)
returns void
language sql
as $$
  insert into public.usage (user_id, transcript_count)
  values (p_user_id, 1)
  on conflict (user_id)
  do update set transcript_count = public.usage.transcript_count + 1;
$$;
