-- User-level macro defaults (applied when creating a new nutrition_day)
CREATE TABLE user_macro_targets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  calories_kcal INTEGER,
  protein_g DECIMAL(10,2),
  carbs_g DECIMAL(10,2),
  fat_g DECIMAL(10,2),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE nutrition_display_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_type TEXT NOT NULL DEFAULT 'bars' CHECK (display_type IN ('rings', 'bars', 'cards')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_macro_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_display_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own macro targets" ON user_macro_targets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own nutrition display preferences" ON nutrition_display_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER update_user_macro_targets_updated_at
  BEFORE UPDATE ON user_macro_targets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nutrition_display_preferences_updated_at
  BEFORE UPDATE ON nutrition_display_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
