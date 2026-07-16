-- Adds an admin role, restricted to you, and locks down who can publish
-- shared/coach-tagged workouts and daily games.
-- Run in Supabase SQL Editor after 0001-0005 are already applied.

alter table parents add column if not exists is_admin boolean not null default false;

-- Make yourself the admin — replace with your own UID if this isn't it
update parents set is_admin = true where id = 'fe991ca6-d138-4f84-8b45-19a4329145aa';

-- Workouts: any parent can still build workouts for their own kids (parent_lead),
-- but only an admin can mark a workout as shared or tag it to a coach persona.
drop policy if exists "parents manage own workouts" on workouts;
create policy "parents manage own workouts" on workouts
  for all using (auth.uid() = parent_id)
  with check (
    auth.uid() = parent_id
    and (
      (is_shared = false and coach_type is null)
      or exists (select 1 from parents p where p.id = auth.uid() and p.is_admin = true)
    )
  );

-- Daily games: admin-only, full stop.
drop policy if exists "parents can add games" on daily_games;
create policy "only admins can add games" on daily_games
  for insert with check (
    auth.uid() = parent_id
    and exists (select 1 from parents p where p.id = auth.uid() and p.is_admin = true)
  );
