-- Adds birthdate so age auto-updates over time instead of staying frozen at
-- whatever was typed in once. Also nothing else structural is needed for the
-- workout kid-selector — it reuses assigned_child_id from migration 0008.
-- Run in Supabase SQL Editor after 0001-0009 are already applied.

alter table children add column if not exists birthdate date;
alter table children alter column age drop not null;
-- age stays as a fallback for kids added before this migration; once birthdate
-- is set, the app always computes age from it instead of trusting the stored number
