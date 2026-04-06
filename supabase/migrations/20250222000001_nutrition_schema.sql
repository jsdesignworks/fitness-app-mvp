-- ============================================================================
-- NUTRITION TRACKING SCHEMA (Phase 3 MVP)
-- ============================================================================
-- foods, food_nutrients, nutrition_days, meals, nutrition_entries

-- ============================================================================
-- FOODS (Dictionary)
-- ============================================================================

CREATE TABLE foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  food_type TEXT NOT NULL DEFAULT 'generic' CHECK (food_type IN ('generic', 'branded', 'restaurant', 'custom')),
  brand_name TEXT,
  barcode TEXT,
  external_source TEXT,
  is_verified BOOLEAN DEFAULT false,
  default_serving_amount DECIMAL(10,3),
  default_serving_unit_id UUID,
  density_g_per_ml DECIMAL(10,6),
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_foods_name ON foods USING gin(to_tsvector('english', name));
CREATE INDEX idx_foods_created_by ON foods(created_by_user_id);

-- ============================================================================
-- FOOD NUTRIENTS (per 100g or basis)
-- ============================================================================

CREATE TABLE food_nutrients (
  food_id UUID NOT NULL PRIMARY KEY REFERENCES foods(id) ON DELETE CASCADE,
  basis_amount_g DECIMAL(10,3) NOT NULL DEFAULT 100,
  calories_kcal DECIMAL(10,2) NOT NULL DEFAULT 0,
  protein_g DECIMAL(10,2) NOT NULL DEFAULT 0,
  carbs_g DECIMAL(10,2) NOT NULL DEFAULT 0,
  fat_g DECIMAL(10,2) NOT NULL DEFAULT 0,
  fiber_g DECIMAL(10,2),
  sugar_g DECIMAL(10,2),
  sodium_mg DECIMAL(10,2)
);

-- ============================================================================
-- NUTRITION DAYS (one per user per date)
-- ============================================================================

CREATE TABLE nutrition_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  notes TEXT,
  target_calories_kcal INT,
  target_protein_g DECIMAL(10,2),
  target_carbs_g DECIMAL(10,2),
  target_fat_g DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_nutrition_days_user_date ON nutrition_days(user_id, date DESC);

-- ============================================================================
-- MEALS (within a day)
-- ============================================================================

CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutrition_day_id UUID NOT NULL REFERENCES nutrition_days(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout', 'custom')),
  title TEXT,
  eaten_at TIMESTAMPTZ,
  sort_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meals_nutrition_day ON meals(nutrition_day_id);

-- ============================================================================
-- NUTRITION ENTRIES (food/recipe/quick_add per meal)
-- ============================================================================

CREATE TABLE nutrition_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('food', 'recipe', 'quick_add')),
  food_id UUID REFERENCES foods(id) ON DELETE SET NULL,
  recipe_id UUID,
  quantity_amount DECIMAL(12,4) NOT NULL DEFAULT 1,
  quantity_unit_id UUID,
  grams_consumed DECIMAL(12,4),
  calories_kcal DECIMAL(10,2),
  protein_g DECIMAL(10,2),
  carbs_g DECIMAL(10,2),
  fat_g DECIMAL(10,2),
  is_estimated BOOLEAN DEFAULT false,
  source TEXT NOT NULL DEFAULT 'search' CHECK (source IN ('search', 'barcode', 'quick_add', 'template', 'copy')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nutrition_entries_meal ON nutrition_entries(meal_id);

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_nutrients ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_entries ENABLE ROW LEVEL SECURITY;

-- Foods: all can read; only creator can write custom
CREATE POLICY "Anyone can read foods" ON foods FOR SELECT USING (true);
CREATE POLICY "Users can insert custom foods" ON foods FOR INSERT WITH CHECK (food_type = 'custom' AND auth.uid() = created_by_user_id);
CREATE POLICY "Users can update own custom foods" ON foods FOR UPDATE USING (food_type = 'custom' AND auth.uid() = created_by_user_id);

-- Food nutrients: read with foods
CREATE POLICY "Anyone can read food_nutrients" ON food_nutrients FOR SELECT USING (true);
CREATE POLICY "Service can manage food_nutrients" ON food_nutrients FOR ALL USING (true);

-- Nutrition days: own only
CREATE POLICY "Users manage own nutrition_days" ON nutrition_days FOR ALL USING (auth.uid() = user_id);

-- Meals: via nutrition_day ownership
CREATE POLICY "Users manage meals of own days" ON meals FOR ALL USING (
  EXISTS (SELECT 1 FROM nutrition_days nd WHERE nd.id = meals.nutrition_day_id AND nd.user_id = auth.uid())
);

-- Entries: via meal -> nutrition_day
CREATE POLICY "Users manage entries of own days" ON nutrition_entries FOR ALL USING (
  EXISTS (
    SELECT 1 FROM meals m
    JOIN nutrition_days nd ON nd.id = m.nutrition_day_id
    WHERE m.id = nutrition_entries.meal_id AND nd.user_id = auth.uid()
  )
);

-- ============================================================================
-- TRIGGERS (updated_at)
-- ============================================================================

CREATE TRIGGER update_foods_updated_at BEFORE UPDATE ON foods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nutrition_days_updated_at BEFORE UPDATE ON nutrition_days
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nutrition_entries_updated_at BEFORE UPDATE ON nutrition_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
