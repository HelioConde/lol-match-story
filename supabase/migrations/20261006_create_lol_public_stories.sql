create table if not exists public.lol_public_stories (
  match_id text primary key,
  riot_id text not null,
  region text not null,
  platform text not null,
  locale text not null default 'pt-BR',
  story_data jsonb not null,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lol_public_stories enable row level security;
revoke all on table public.lol_public_stories from anon, authenticated;

create index if not exists lol_public_stories_updated_at_idx
  on public.lol_public_stories (updated_at desc);
