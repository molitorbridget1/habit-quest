-- Habit Quest MVP — tonight's demo scope
-- Run this in the Supabase SQL Editor for your project (or via CLI migration)

create extension if not exists "pgcrypto";

-- Parents (one row per Supabase auth user)
create table if not exists parents (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

alter table parents enable row level security;
create policy "parents manage own row" on parents
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Children
create table if not exists children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references parents(id) on delete cascade,
  name text not null,
  age int not null check (age between 5 and 14),
  avatar_emoji text not null default '🦊',
  pin text not null,             -- plain 4-digit PIN for tonight's demo; hash before real launch
  created_at timestamptz default now()
);

alter table children enable row level security;
create policy "parents manage own children" on children
  for all using (auth.uid() = parent_id) with check (auth.uid() = parent_id);

-- Daily habit logs — one row per child per day
create table if not exists daily_logs (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  log_date date not null default current_date,
  water_cups int not null default 0,
  movement_done boolean not null default false,
  veggie_done boolean not null default false,
  sleep_done boolean not null default false,
  mood text check (mood in ('sleepy','meh','good','great')),
  unique (child_id, log_date)
);

alter table daily_logs enable row level security;
create policy "parents manage own children's logs" on daily_logs
  for all using (
    exists (select 1 from children c where c.id = daily_logs.child_id and c.parent_id = auth.uid())
  ) with check (
    exists (select 1 from children c where c.id = daily_logs.child_id and c.parent_id = auth.uid())
  );

-- XP events — drives level/streak display
create table if not exists xp_events (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  source text not null,
  amount int not null,
  created_at timestamptz default now()
);

alter table xp_events enable row level security;
create policy "parents manage own children's xp" on xp_events
  for all using (
    exists (select 1 from children c where c.id = xp_events.child_id and c.parent_id = auth.uid())
  ) with check (
    exists (select 1 from children c where c.id = xp_events.child_id and c.parent_id = auth.uid())
  );

-- Auto-create a parents row when someone signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.parents (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
