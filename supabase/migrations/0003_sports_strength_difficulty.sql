-- Adds: kid sports + strength level, workout difficulty, weight/notes on completion
-- Run in Supabase SQL Editor (after 0001 and 0002 have already been applied)

alter table children add column if not exists sport_tags text[] default '{}';
alter table children add column if not exists strength_level text
  check (strength_level in ('beginner','intermediate','advanced')) default 'beginner';

alter table workouts add column if not exists difficulty text
  check (difficulty in ('beginner','intermediate','advanced')) default 'intermediate';

alter table workout_completions add column if not exists weight_used text;
alter table workout_completions add column if not exists notes text;
