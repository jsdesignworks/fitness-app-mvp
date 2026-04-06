-- ============================================================================
-- USER PROFILE: preferred weight unit (kg/lb)
-- ============================================================================

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS weight_unit TEXT
  CHECK (weight_unit IN ('kg', 'lb'))
  DEFAULT 'kg';

