-- Add dashboard layout preferences to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS dashboard_preferences JSONB DEFAULT NULL;

COMMENT ON COLUMN user_profiles.dashboard_preferences IS 'Widget order (array) and visibility (object). Shape: { widgetOrder: string[], widgetVisibility: Record<string, boolean> }';
