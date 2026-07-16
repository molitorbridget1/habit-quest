-- Round of revisions: protein habit, age groups + saved difficulty filter,
-- coach management model, and daily learning games.
-- Run in Supabase SQL Editor after 0001-0004 are already applied.

-- ===== Habit changes (items 3, 6, 7 are UI-only except this column) =====
alter table daily_logs add column if not exists protein_selected text[] default '{}';
-- movement_done and sleep_done columns are left in place (unused now) rather than
-- dropped, so nothing breaks if old rows reference them.

-- ===== Age groups + saved difficulty filter (item 1) =====
alter table children drop constraint if exists children_age_check;
alter table children add constraint children_age_check check (age between 5 and 18);
alter table children add column if not exists difficulty_filter text
  check (difficulty_filter in ('beginner','intermediate','advanced'));
-- null = no filter, show all difficulties

alter table workouts add column if not exists age_groups text[] default '{}';
-- empty array = applies to all ages; otherwise one or more of '5-7','8-10','11-13','14-18'

-- ===== Coach management model (item 2) =====
alter table children add column if not exists coaching_mode text
  check (coaching_mode in ('parent_lead','coach_bee','coach_erick','invite_coach'))
  default 'parent_lead';
alter table children add column if not exists invite_code text unique;

alter table workouts add column if not exists coach_type text check (coach_type in ('bee','erick'));

create table if not exists coach_links (
  id uuid primary key default gen_random_uuid(),
  coach_parent_id uuid not null references parents(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,
  created_at timestamptz default now(),
  unique (coach_parent_id, child_id)
);

alter table coach_links enable row level security;
create policy "parents see coach links involving their own kids or where they are the coach" on coach_links
  for select using (
    coach_parent_id = auth.uid()
    or exists (select 1 from children c where c.id = coach_links.child_id and c.parent_id = auth.uid())
  );
-- No direct insert policy on purpose — links are only created through the
-- redeem_coach_code() function below, so a coach can never guess a child_id
-- and self-link without a real invite code.

-- Lets a coach safely redeem an invite code without ever being able to browse
-- other families' children directly (children RLS still blocks that).
create or replace function redeem_coach_code(code text)
returns boolean
language plpgsql
security definer
as $$
declare
  matched_child_id uuid;
begin
  select id into matched_child_id from children where invite_code = code;
  if matched_child_id is null then
    return false;
  end if;
  insert into coach_links (coach_parent_id, child_id)
  values (auth.uid(), matched_child_id)
  on conflict (coach_parent_id, child_id) do nothing;
  return true;
end;
$$;

-- ===== Daily learning games (item 5) =====
create table if not exists daily_games (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references parents(id) on delete set null,
  category text check (category in ('nutrition','fitness')) default 'nutrition',
  question text not null,
  choices jsonb not null,  -- [{ "text": "...", "correct": true/false }, ...]
  explanation text,
  created_at timestamptz default now()
);

alter table daily_games enable row level security;
create policy "anyone signed in can view games" on daily_games
  for select using (auth.uid() is not null);
create policy "parents can add games" on daily_games
  for insert with check (auth.uid() = parent_id);

create table if not exists game_completions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  game_id uuid not null references daily_games(id) on delete cascade,
  completed_date date not null default current_date,
  was_correct boolean not null,
  unique (child_id, completed_date)
);

alter table game_completions enable row level security;
create policy "parents manage own children's game completions" on game_completions
  for all using (
    exists (select 1 from children c where c.id = game_completions.child_id and c.parent_id = auth.uid())
  ) with check (
    exists (select 1 from children c where c.id = game_completions.child_id and c.parent_id = auth.uid())
  );

-- A few starter games so the feature isn't empty on day one
insert into daily_games (category, question, choices, explanation) values
('nutrition', 'Which food gives you long-lasting energy for a whole game?',
  '[{"text":"Candy bar","correct":false},{"text":"Whole grain toast","correct":true},{"text":"Soda","correct":false}]'::jsonb,
  'Whole grains release energy slowly, so you stay fueled longer instead of crashing.'),
('nutrition', 'True or False: Protein helps your muscles grow and repair.',
  '[{"text":"True","correct":true},{"text":"False","correct":false}]'::jsonb,
  'True! Protein is like building blocks for your muscles after a workout.'),
('fitness', 'What should you do BEFORE a workout to get your body ready?',
  '[{"text":"Warm up and stretch","correct":true},{"text":"Sit still","correct":false},{"text":"Skip breakfast","correct":false}]'::jsonb,
  'Warming up gets blood flowing to your muscles so you move better and stay safer.'),
('nutrition', 'Which drink is best for staying hydrated during a game?',
  '[{"text":"Water","correct":true},{"text":"Soda","correct":false},{"text":"Fruit punch","correct":false}]'::jsonb,
  'Water is what your body uses best to stay cool and keep your muscles working well.'),
('fitness', 'Why do athletes rest between hard workouts?',
  '[{"text":"Muscles get stronger during rest, not just during exercise","correct":true},{"text":"Resting is only for lazy people","correct":false}]'::jsonb,
  'Your muscles actually repair and grow stronger while you rest, not just while you train.');
