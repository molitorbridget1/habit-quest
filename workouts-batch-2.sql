-- 10 Beginner + 10 Advanced workouts
-- Paste this whole block into the Supabase SQL Editor and run it

insert into workouts (parent_id, title, subtitle, sport_tag, difficulty, exercises) values

-- ===== BEGINNER (10) =====
('fe991ca6-d138-4f84-8b45-19a4329145aa', 'The Warm-Up Wizard', 'A Full-Body Starter Workout', 'General', 'beginner',
  '[{"name":"Arm circles","detail":"20 sec"},{"name":"Marching in place","detail":"30 sec"},{"name":"Toe touches","detail":"8 reps"},{"name":"Big stretch reach","detail":"15 sec"}]'::jsonb),

('fe991ca6-d138-4f84-8b45-19a4329145aa', 'The Bunny Hop', 'A Beginner Jumping Workout', 'General', 'beginner',
  '[{"name":"Two-foot hops","detail":"10 reps"},{"name":"Step touches","detail":"20 sec"},{"name":"Slow squats","detail":"8 reps"},{"name":"Wiggle shake-out","detail":"15 sec"}]'::jsonb),

('fe991ca6-d138-4f84-8b45-19a4329145aa', 'The Little Slugger', 'A Beginner Baseball Workout', 'Baseball', 'beginner',
  '[{"name":"Practice swings (no bat)","detail":"8 reps"},{"name":"Side shuffles","detail":"20 sec"},{"name":"Toss and catch (imaginary)","detail":"10 reps"},{"name":"Easy jog in place","detail":"20 sec"}]'::jsonb),

('fe991ca6-d138-4f84-8b45-19a4329145aa', 'The Dribbler', 'A Beginner Basketball Workout', 'Basketball', 'beginner',
  '[{"name":"Pretend dribbling","detail":"20 sec"},{"name":"Knee lifts","detail":"8 each leg"},{"name":"Small jump shots","detail":"6 reps"},{"name":"Side steps","detail":"20 sec"}]'::jsonb),

('fe991ca6-d138-4f84-8b45-19a4329145aa', 'The First Kick', 'A Beginner Soccer Workout', 'Soccer', 'beginner',
  '[{"name":"Toe taps (slow)","detail":"20 sec"},{"name":"Easy side shuffles","detail":"20 sec"},{"name":"Standing knee raises","detail":"8 each leg"},{"name":"Light jogging","detail":"20 sec"}]'::jsonb),

('fe991ca6-d138-4f84-8b45-19a4329145aa', 'The Cartwheel Starter', 'A Beginner Gymnastics Workout', 'Gymnastics', 'beginner',
  '[{"name":"Balance hold (one leg)","detail":"10 sec each"},{"name":"Gentle forward bends","detail":"6 reps"},{"name":"Arm swings","detail":"15 sec"},{"name":"Slow cat-cow stretch","detail":"6 reps"}]'::jsonb),

('fe991ca6-d138-4f84-8b45-19a4329145aa', 'The Backyard Sprinter', 'A Beginner Football Workout', 'Football', 'beginner',
  '[{"name":"Fast feet (slow pace)","detail":"15 sec"},{"name":"Easy push-ups (knees down ok)","detail":"6 reps"},{"name":"Standing long reach","detail":"5 reps"},{"name":"Walk-jog mix","detail":"20 sec"}]'::jsonb),

('fe991ca6-d138-4f84-8b45-19a4329145aa', 'The Puddle Jumper', 'A Beginner Cardio Workout', 'General', 'beginner',
  '[{"name":"Jumping jacks (slow)","detail":"20 sec"},{"name":"Side-to-side hops","detail":"8 reps"},{"name":"Freeze and balance","detail":"10 sec"},{"name":"Deep breaths & stretch","detail":"15 sec"}]'::jsonb),

('fe991ca6-d138-4f84-8b45-19a4329145aa', 'The Stretchy Snake', 'A Beginner Flexibility Workout', 'General', 'beginner',
  '[{"name":"Reach for the sky","detail":"10 sec"},{"name":"Side bends","detail":"6 each side"},{"name":"Seated toe reach","detail":"15 sec"},{"name":"Gentle twist","detail":"6 each side"}]'::jsonb),

('fe991ca6-d138-4f84-8b45-19a4329145aa', 'The Balance Beam Buddy', 'A Beginner Balance Workout', 'Gymnastics', 'beginner',
  '[{"name":"Walk a straight line","detail":"20 sec"},{"name":"One-leg stand","detail":"10 sec each"},{"name":"Tiptoe walk","detail":"15 sec"},{"name":"Slow squats","detail":"6 reps"}]'::jsonb),

-- ===== ADVANCED (10) =====
('fe991ca6-d138-4f84-8b45-19a4329145aa', 'The Iron Slugger', 'An Advanced Baseball Workout', 'Baseball', 'advanced',
  '[{"name":"Explosive swings (no bat)","detail":"15 reps"},{"name":"Lateral bounds","detail":"12 reps"},{"name":"Sprint starts","detail":"5 reps"},{"name":"Push-ups","detail":"15 reps"},{"name":"Core plank hold","detail":"40 sec"}]'::jsonb),

('fe991ca6-d138-4f84-8b45-19a4329145aa', 'The Full Court Press', 'An Advanced Basketball Workout', 'Basketball', 'advanced',
  '[{"name":"Defensive slides","detail":"40 sec"},{"name":"Jump shots (max height)","detail":"15 reps"},{"name":"Suicide sprints (imaginary lines)","detail":"3 rounds"},{"name":"Burpees","detail":"10 reps"},{"name":"Wall sit","detail":"30 sec"}]'::jsonb),

('fe991ca6-d138-4f84-8b45-19a4329145aa', 'The Midfield Machine', 'An Advanced Soccer Workout', 'Soccer', 'advanced',
  '[{"name":"Fast cone weave (imaginary)","detail":"40 sec"},{"name":"Explosive lunges","detail":"12 each leg"},{"name":"Sprint + backpedal","detail":"5 rounds"},{"name":"Quick feet ladder drill","detail":"30 sec"},{"name":"Plank hold","detail":"40 sec"}]'::jsonb),

('fe991ca6-d138-4f84-8b45-19a4329145aa', 'The Gridiron Grinder', 'An Advanced Football Workout', 'Football', 'advanced',
  '[{"name":"Explosive push-ups","detail":"12 reps"},{"name":"Broad jumps","detail":"8 reps"},{"name":"Fast feet drill","detail":"40 sec"},{"name":"Bear crawl","detail":"30 sec"},{"name":"Sprint sets","detail":"4 rounds"}]'::jsonb),

('fe991ca6-d138-4f84-8b45-19a4329145aa', 'The Vault Master', 'An Advanced Gymnastics Workout', 'Gymnastics', 'advanced',
  '[{"name":"Handstand hold (against wall)","detail":"15 sec"},{"name":"Jump squats","detail":"15 reps"},{"name":"Bridge hold","detail":"20 sec"},{"name":"Plank to pike","detail":"10 reps"},{"name":"Single-leg balance","detail":"20 sec each"}]'::jsonb),

('fe991ca6-d138-4f84-8b45-19a4329145aa', 'The Speed Demon', 'An Advanced Speed & Agility Workout', 'General', 'advanced',
  '[{"name":"Max-effort sprints in place","detail":"30 sec"},{"name":"Skater hops","detail":"40 sec"},{"name":"Quick feet","detail":"30 sec"},{"name":"Long jumps","detail":"8 reps"},{"name":"Rest & shake out","detail":"20 sec"}]'::jsonb),

('fe991ca6-d138-4f84-8b45-19a4329145aa', 'The Powerhouse', 'An Advanced Strength Workout', 'General', 'advanced',
  '[{"name":"Push-ups","detail":"15 reps"},{"name":"Jump squats","detail":"15 reps"},{"name":"Plank hold","detail":"45 sec"},{"name":"Lunges","detail":"12 each leg"},{"name":"Superman holds","detail":"20 sec x3"}]'::jsonb),

('fe991ca6-d138-4f84-8b45-19a4329145aa', 'The Endurance Engine', 'An Advanced Cardio Workout', 'General', 'advanced',
  '[{"name":"High knees","detail":"45 sec"},{"name":"Jumping jacks","detail":"45 sec"},{"name":"Mountain climbers","detail":"30 sec"},{"name":"Jog in place","detail":"60 sec"},{"name":"Cool-down stretch","detail":"20 sec"}]'::jsonb),

('fe991ca6-d138-4f84-8b45-19a4329145aa', 'The Agility Ace', 'An Advanced Footwork Workout', 'General', 'advanced',
  '[{"name":"Ladder drill (imaginary)","detail":"40 sec"},{"name":"Lateral shuffles","detail":"40 sec"},{"name":"Quick direction changes","detail":"30 sec"},{"name":"Single-leg hops","detail":"10 each leg"}]'::jsonb),

('fe991ca6-d138-4f84-8b45-19a4329145aa', 'The Deep End Dolphin', 'An Advanced Swim-Ready Workout', 'General', 'advanced',
  '[{"name":"Flutter kicks (lying down)","detail":"45 sec"},{"name":"Arm circles (fast)","detail":"30 sec"},{"name":"Plank hold","detail":"40 sec"},{"name":"Superman holds","detail":"20 sec x3"},{"name":"Streamline stretch","detail":"15 sec"}]'::jsonb);
