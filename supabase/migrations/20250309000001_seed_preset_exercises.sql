-- Seed canonical exercises for preset workouts (idempotent by name)
INSERT INTO exercises (name, category, default_tracking_mode, primary_muscles, equipment_type, metadata, is_custom)
SELECT v.name, v.category::text, v.default_tracking_mode::text, v.primary_muscles::text[], v.equipment_type::text[], COALESCE(v.metadata, '{}'::jsonb), false
FROM (VALUES
  ('Barbell Squat', 'strength', 'strength_sets', ARRAY['quads']::text[], ARRAY['barbell']::text[], '{"difficulty":"beginner"}'::jsonb),
  ('Barbell Bench Press', 'strength', 'strength_sets', ARRAY['chest']::text[], ARRAY['barbell']::text[], '{"difficulty":"beginner"}'::jsonb),
  ('Barbell Row', 'strength', 'strength_sets', ARRAY['back']::text[], ARRAY['barbell']::text[], '{"difficulty":"beginner"}'::jsonb),
  ('Overhead Press', 'strength', 'strength_sets', ARRAY['shoulders']::text[], ARRAY['barbell']::text[], '{"difficulty":"intermediate"}'::jsonb),
  ('Romanian Deadlift', 'strength', 'strength_sets', ARRAY['hamstrings']::text[], ARRAY['barbell']::text[], '{"difficulty":"intermediate"}'::jsonb),
  ('Dumbbell Bench Press', 'strength', 'strength_sets', ARRAY['chest']::text[], ARRAY['dumbbell']::text[], '{"difficulty":"beginner"}'::jsonb),
  ('Dumbbell Row', 'strength', 'strength_sets', ARRAY['back']::text[], ARRAY['dumbbell']::text[], '{"difficulty":"beginner"}'::jsonb),
  ('Lat Pulldown', 'strength', 'strength_sets', ARRAY['back']::text[], ARRAY['cable']::text[], '{"difficulty":"beginner"}'::jsonb),
  ('Leg Press', 'strength', 'strength_sets', ARRAY['quads']::text[], ARRAY['machine']::text[], '{"difficulty":"beginner"}'::jsonb),
  ('Leg Curl', 'strength', 'strength_sets', ARRAY['hamstrings']::text[], ARRAY['machine']::text[], '{"difficulty":"beginner"}'::jsonb),
  ('Leg Extension', 'strength', 'strength_sets', ARRAY['quads']::text[], ARRAY['machine']::text[], '{"difficulty":"beginner"}'::jsonb),
  ('Push-up', 'strength', 'bodyweight_reps', ARRAY['chest']::text[], ARRAY['bodyweight']::text[], '{"difficulty":"beginner"}'::jsonb),
  ('Pull-up', 'strength', 'bodyweight_reps', ARRAY['back']::text[], ARRAY['bodyweight']::text[], '{"difficulty":"intermediate"}'::jsonb),
  ('Plank', 'strength', 'timed_hold', ARRAY['abs']::text[], ARRAY['bodyweight']::text[], '{"difficulty":"beginner"}'::jsonb),
  ('Walking Lunge', 'strength', 'strength_sets', ARRAY['quads']::text[], ARRAY['dumbbell']::text[], '{"difficulty":"beginner"}'::jsonb),
  ('Hip Thrust', 'strength', 'strength_sets', ARRAY['glutes']::text[], ARRAY['barbell']::text[], '{"difficulty":"intermediate"}'::jsonb),
  ('Cable Fly', 'strength', 'strength_sets', ARRAY['chest']::text[], ARRAY['cable']::text[], '{"difficulty":"beginner"}'::jsonb),
  ('Tricep Pushdown', 'strength', 'strength_sets', ARRAY['triceps']::text[], ARRAY['cable']::text[], '{"difficulty":"beginner"}'::jsonb),
  ('Bicep Curl', 'strength', 'strength_sets', ARRAY['biceps']::text[], ARRAY['dumbbell']::text[], '{"difficulty":"beginner"}'::jsonb),
  ('Lateral Raise', 'strength', 'strength_sets', ARRAY['shoulders']::text[], ARRAY['dumbbell']::text[], '{"difficulty":"beginner"}'::jsonb)
) AS v(name, category, default_tracking_mode, primary_muscles, equipment_type, metadata)
WHERE NOT EXISTS (SELECT 1 FROM exercises e WHERE lower(trim(e.name)) = lower(trim(v.name)));
