-- Adds a second game type — "sort" (Wordle/Connections-style: tap all items
-- matching a prompt, e.g. "Select all the PROTEIN foods") alongside the
-- existing "quiz" (multiple choice) type. Also adds age tiering so younger
-- and older kids can get different daily content.
-- Run in Supabase SQL Editor after 0001-0010 are already applied.

alter table daily_games add column if not exists game_type text check (game_type in ('quiz','sort')) default 'quiz';
alter table daily_games add column if not exists items jsonb;
-- items format for 'sort' type: [{ "label": "Chicken", "emoji": "🍗", "match": true }, ...]
-- 'match': true means it belongs to the prompt's category, false = distractor

alter table daily_games add column if not exists age_tier text check (age_tier in ('younger','older'));
-- null = shown to both tiers; 'younger' = ages 5-10 only; 'older' = ages 11-18 only

-- A few starter sort-type games so the feature isn't empty on day one
insert into daily_games (category, game_type, age_tier, question, items, explanation) values
('nutrition', 'sort', 'younger', 'Tap all the PROTEIN foods',
  '[{"label":"Chicken","emoji":"🍗","match":true},{"label":"Egg","emoji":"🥚","match":true},{"label":"Candy","emoji":"🍬","match":false},{"label":"Cheese","emoji":"🧀","match":true},{"label":"Soda","emoji":"🥤","match":false},{"label":"Steak","emoji":"🥩","match":true}]'::jsonb,
  'Protein helps repair and build your muscles — chicken, eggs, cheese, and steak are all great sources!'),

('nutrition', 'sort', 'younger', 'Tap all the foods that give QUICK energy',
  '[{"label":"Candy","emoji":"🍬","match":true},{"label":"Oatmeal","emoji":"🥣","match":false},{"label":"Soda","emoji":"🥤","match":true},{"label":"Chicken","emoji":"🍗","match":false},{"label":"Fruit Snacks","emoji":"🍭","match":true},{"label":"Brown Rice","emoji":"🍚","match":false}]'::jsonb,
  'Sugary foods give a fast burst of energy that fades quickly — great for a quick boost, not for lasting through a whole game.'),

('nutrition', 'sort', 'older', 'Tap all the sources of TRANS FAT',
  '[{"label":"Fried Fast Food","emoji":"🍟","match":true},{"label":"Avocado","emoji":"🥑","match":false},{"label":"Packaged Pastries","emoji":"🥐","match":true},{"label":"Salmon","emoji":"🐟","match":false},{"label":"Margarine (old-style)","emoji":"🧈","match":true},{"label":"Olive Oil","emoji":"🫒","match":false}]'::jsonb,
  'Trans fats are mostly found in fried and heavily processed foods — they''re linked to heart health issues, unlike the healthy fats in avocado, salmon, and olive oil.'),

('nutrition', 'sort', 'older', 'Tap all the COMPLEX carbs',
  '[{"label":"Brown Rice","emoji":"🍚","match":true},{"label":"White Bread","emoji":"🍞","match":false},{"label":"Sweet Potato","emoji":"🍠","match":true},{"label":"Candy","emoji":"🍬","match":false},{"label":"Oats","emoji":"🥣","match":true},{"label":"Soda","emoji":"🥤","match":false}]'::jsonb,
  'Complex carbs digest slowly, giving you steady energy instead of a quick spike and crash.');
