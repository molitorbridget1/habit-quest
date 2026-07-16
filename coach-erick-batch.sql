-- Coach Erick starter batch — boyish humor, straight to the point
-- Paste into Supabase SQL Editor and run

insert into workouts (parent_id, title, subtitle, sport_tag, difficulty, coach_type, is_shared, exercises) values

('fe991ca6-d138-4f84-8b45-19a4329145aa', 'No Excuses', 'Baseball Strength Circuit', 'Baseball', 'intermediate', 'erick', true,
  '[{"name":"Push-ups","detail":"12 reps"},{"name":"Lateral bounds","detail":"10 reps"},{"name":"Sprint starts","detail":"5 reps"},{"name":"Plank hold","detail":"30 sec"}]'::jsonb),

('fe991ca6-d138-4f84-8b45-19a4329145aa', 'Beast Mode: Baseball', 'Power & Speed for the Diamond', 'Baseball', 'advanced', 'erick', true,
  '[{"name":"Explosive swings (no bat)","detail":"15 reps"},{"name":"Broad jumps","detail":"8 reps"},{"name":"Sprint sets","detail":"4 rounds"},{"name":"Push-ups","detail":"15 reps"}]'::jsonb),

('fe991ca6-d138-4f84-8b45-19a4329145aa', 'Gridiron Grind', 'Football Toughness Workout', 'Football', 'intermediate', 'erick', true,
  '[{"name":"Fast feet drill","detail":"30 sec"},{"name":"Push-ups","detail":"12 reps"},{"name":"Bear crawl","detail":"20 sec"},{"name":"Sprint + backpedal","detail":"3 rounds"}]'::jsonb),

('fe991ca6-d138-4f84-8b45-19a4329145aa', 'Bring the Pain', 'Football Power Workout', 'Football', 'advanced', 'erick', true,
  '[{"name":"Explosive push-ups","detail":"12 reps"},{"name":"Broad jumps","detail":"8 reps"},{"name":"Fast feet drill","detail":"40 sec"},{"name":"Sprint sets","detail":"4 rounds"}]'::jsonb),

('fe991ca6-d138-4f84-8b45-19a4329145aa', 'Gains O''Clock', 'Weight Training Basics', null, 'beginner', 'erick', true,
  '[{"name":"Push-ups","detail":"8 reps"},{"name":"Squats","detail":"10 reps"},{"name":"Plank hold","detail":"20 sec"},{"name":"Lunges","detail":"8 each leg"}]'::jsonb),

('fe991ca6-d138-4f84-8b45-19a4329145aa', 'Get Swole(ish)', 'Weight Training Level Up', null, 'intermediate', 'erick', true,
  '[{"name":"Push-ups","detail":"15 reps"},{"name":"Jump squats","detail":"12 reps"},{"name":"Plank hold","detail":"35 sec"},{"name":"Lunges","detail":"12 each leg"}]'::jsonb),

('fe991ca6-d138-4f84-8b45-19a4329145aa', 'Absolute Unit', 'Advanced Weight Training', null, 'advanced', 'erick', true,
  '[{"name":"Push-ups","detail":"20 reps"},{"name":"Jump squats","detail":"15 reps"},{"name":"Plank hold","detail":"45 sec"},{"name":"Superman holds","detail":"20 sec x3"}]'::jsonb);
