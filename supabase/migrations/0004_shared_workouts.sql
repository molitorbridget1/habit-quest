-- Adds the ability to mark a workout as shared across all parent accounts
-- Run in Supabase SQL Editor (after 0001, 0002, 0003 have already been applied)

alter table workouts add column if not exists is_shared boolean not null default false;

-- Existing policy already restricts insert/update/delete to the owning parent.
-- This adds an additional SELECT-only policy so anyone can see workouts marked shared,
-- without loosening who can create/edit/delete them.
create policy "anyone can view shared workouts" on workouts
  for select using (is_shared = true);
