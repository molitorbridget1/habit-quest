-- Adds an optional demo video link to workouts
-- Run in Supabase SQL Editor after 0001-0006 are already applied

alter table workouts add column if not exists video_url text;
