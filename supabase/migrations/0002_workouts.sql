-- Adds workout builder + library feature
-- Run this in the Supabase SQL Editor (in addition to 0001_mvp_init.sql, which should already be applied)

create table if not exists workouts (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references parents(id) on delete cascade,
  title text not null,              -- fun name, e.g. "The Pitcher"
  subtitle text,                    -- e.g. "A Baseball Workout"
  sport_tag text,
  exercises jsonb not null default '[]',  -- [{ "name": "Jumping jacks", "detail": "30 sec" }, ...]
  created_at timestamptz default now()
);

alter table workouts enable row level security;
create policy "parents manage own workouts" on workouts
  for all using (auth.uid() = parent_id) with check (auth.uid() = parent_id);

create table if not exists workout_completions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  workout_id uuid not null references workouts(id) on delete cascade,
  completed_at timestamptz default now()
);

alter table workout_completions enable row level security;
create policy "parents manage own children's workout completions" on workout_completions
  for all using (
    exists (select 1 from children c where c.id = workout_completions.child_id and c.parent_id = auth.uid())
  ) with check (
    exists (select 1 from children c where c.id = workout_completions.child_id and c.parent_id = auth.uid())
  );
