create table if not exists public.lol_timeline_cache (
  match_id text primary key,
  region text not null,
  timeline_data jsonb not null,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  updated_at timestamptz not null default now()
);

alter table public.lol_timeline_cache enable row level security;
revoke all on table public.lol_timeline_cache from anon, authenticated;

create index if not exists lol_timeline_cache_expires_at_idx
  on public.lol_timeline_cache (expires_at);
