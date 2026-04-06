-- ============================================================================
-- HABITS archive (soft-delete)
-- ============================================================================

ALTER TABLE habits
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_habits_user_archived_at
  ON habits (user_id, archived_at);

