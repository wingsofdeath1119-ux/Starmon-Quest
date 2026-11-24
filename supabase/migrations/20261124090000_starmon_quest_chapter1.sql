-- Starmon Quest persistence foundation (Chapter 1).
-- These tables are intentionally namespaced and do not modify the existing Starmon game.

create table if not exists public.sq_player_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Trainer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sq_player_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  gold bigint not null default 0 check (gold >= 0),
  gems bigint not null default 0 check (gems >= 0),
  reset_tokens integer not null default 0 check (reset_tokens >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.sq_player_starmons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  species_id text not null,
  nickname text,
  level smallint not null default 1 check (level between 1 and 100),
  current_exp bigint not null default 0 check (current_exp >= 0),
  hp integer not null check (hp > 0),
  pp integer not null check (pp >= 0),
  def integer not null check (def >= 0),
  mp integer not null check (mp >= 0),
  md integer not null check (md >= 0),
  speed integer not null check (speed >= 0),
  current_hp integer not null check (current_hp >= 0),
  party_slot smallint check (party_slot between 1 and 6),
  box_position integer check (box_position is null or box_position >= 0),
  obtained_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id)
);

create unique index if not exists sq_player_starmons_party_slot_uidx
  on public.sq_player_starmons (user_id, party_slot)
  where party_slot is not null;
create index if not exists sq_player_starmons_user_idx
  on public.sq_player_starmons (user_id);

create table if not exists public.sq_player_inventory (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null,
  quantity integer not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create table if not exists public.sq_story_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  chapter smallint not null default 1 check (chapter >= 1),
  quest_id text not null default 'q1_starville',
  round_number smallint not null default 1 check (round_number >= 1),
  completed_rounds jsonb not null default '[]'::jsonb check (jsonb_typeof(completed_rounds) = 'array'),
  updated_at timestamptz not null default now()
);

create table if not exists public.sq_battle_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chapter smallint not null default 1 check (chapter >= 1),
  quest_id text not null,
  round_number smallint not null check (round_number >= 1),
  encounter_type text not null check (encounter_type in ('wild', 'trainer', 'boss')),
  outcome text not null check (outcome in ('won', 'lost', 'fled')),
  rewards jsonb not null default '{}'::jsonb check (jsonb_typeof(rewards) = 'object'),
  created_at timestamptz not null default now()
);
create index if not exists sq_battle_history_user_created_idx
  on public.sq_battle_history (user_id, created_at desc);

alter table public.sq_player_profiles enable row level security;
alter table public.sq_player_wallets enable row level security;
alter table public.sq_player_starmons enable row level security;
alter table public.sq_player_inventory enable row level security;
alter table public.sq_story_progress enable row level security;
alter table public.sq_battle_history enable row level security;

create policy "sq_profiles_owner_all" on public.sq_player_profiles
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sq_wallets_owner_read" on public.sq_player_wallets
  for select to authenticated using (auth.uid() = user_id);
create policy "sq_starmons_owner_all" on public.sq_player_starmons
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sq_inventory_owner_all" on public.sq_player_inventory
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sq_progress_owner_all" on public.sq_story_progress
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sq_battle_history_owner_read" on public.sq_battle_history
  for select to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.sq_player_profiles to authenticated;
grant select on public.sq_player_wallets to authenticated;
grant select, insert, update, delete on public.sq_player_starmons to authenticated;
grant select, insert, update, delete on public.sq_player_inventory to authenticated;
grant select, insert, update, delete on public.sq_story_progress to authenticated;
grant select on public.sq_battle_history to authenticated;

