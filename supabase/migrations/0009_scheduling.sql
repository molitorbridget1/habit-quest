-- Adds day-of-week scheduling for coach-assigned workouts (Trainerize/Everfit-style
-- programming). Exercise-level sets/rest don't need a migration since exercises
-- is already flexible jsonb — the app just starts writing extra fields into it.
-- Run in Supabase SQL Editor after 0001-0008 are already applied.

alter table workouts add column if not exists scheduled_days text[] default '{}';
-- values like 'Mon','Tue','Wed','Thu','Fri','Sat','Sun' — only meaningful for
-- workouts assigned to a specific child via assigned_child_id
