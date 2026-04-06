-- Seed a few generic foods so food search returns results for MVP testing.
INSERT INTO foods (id, name, food_type, is_verified, created_at, updated_at) VALUES
  ('a0000001-0001-4000-8000-000000000001', 'Chicken breast', 'generic', true, NOW(), NOW()),
  ('a0000001-0001-4000-8000-000000000002', 'White rice', 'generic', true, NOW(), NOW()),
  ('a0000001-0001-4000-8000-000000000003', 'Broccoli', 'generic', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

INSERT INTO food_nutrients (food_id, basis_amount_g, calories_kcal, protein_g, carbs_g, fat_g) VALUES
  ('a0000001-0001-4000-8000-000000000001', 100, 165, 31, 0, 3.6),
  ('a0000001-0001-4000-8000-000000000002', 100, 130, 2.7, 28, 0.3),
  ('a0000001-0001-4000-8000-000000000003', 100, 34, 2.8, 7, 0.4)
ON CONFLICT (food_id) DO NOTHING;
