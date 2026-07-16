-- Adds per-child workout assignment (for coaches with individual coached kids)
-- and a safe way for a coach to see basic info about kids they coach.
-- Run in Supabase SQL Editor after 0001-0007 are already applied.

alter table workouts add column if not exists assigned_child_id uuid references children(id) on delete cascade;

-- A coach's assigned workout has is_shared=false and belongs to the coach's own
-- parent_id, so the coached child's own family needs an extra SELECT path to see it.
create policy "families can view workouts assigned to their own child" on workouts
  for select using (
    exists (select 1 from children c where c.id = workouts.assigned_child_id and c.parent_id = auth.uid())
  );

-- Lets a coach see just enough about kids they coach to build programming for them,
-- without giving them general access to another family's child record via RLS.
create or replace function get_coached_children()
returns table(id uuid, name text, avatar_emoji text, age int, sport_tags text[], difficulty_filter text)
language sql
security definer
as $$
  select c.id, c.name, c.avatar_emoji, c.age, c.sport_tags, c.difficulty_filter
  from children c
  join coach_links cl on cl.child_id = c.id
  where cl.coach_parent_id = auth.uid();
$$;
