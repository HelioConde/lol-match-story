create table if not exists public.lol_story_feedback (
  id bigint generated always as identity primary key,
  match_id text not null,
  helpful boolean not null,
  reason text null check (reason is null or reason in ('clear','too_generic','wrong_context','missing_event')),
  context text null,
  locale text not null default 'pt-BR',
  created_at timestamptz not null default now()
);

alter table public.lol_story_feedback enable row level security;
revoke all on table public.lol_story_feedback from anon, authenticated;
grant select, insert on table public.lol_story_feedback to service_role;

create index if not exists lol_story_feedback_match_created_idx
  on public.lol_story_feedback (match_id, created_at desc);
