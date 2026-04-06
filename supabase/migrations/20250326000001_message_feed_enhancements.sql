-- In-app feed: typed rows, read/dismiss, CTAs, dedupe for system sync
-- Extends message_events and user_message_preferences

ALTER TABLE message_events
  ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'system'
    CHECK (message_type IN ('system', 'workout', 'nutrition', 'calendar', 'progress', 'reminder')),
  ADD COLUMN IF NOT EXISTS tone TEXT NOT NULL DEFAULT 'info'
    CHECK (tone IN ('info', 'success', 'warning', 'error', 'system')),
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS cta_label TEXT,
  ADD COLUMN IF NOT EXISTS cta_href TEXT,
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_dismissed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dedupe_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_message_events_user_dedupe
  ON message_events (user_id, dedupe_key)
  WHERE dedupe_key IS NOT NULL;

ALTER TABLE user_message_preferences
  ADD COLUMN IF NOT EXISTS show_reminders BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_system_updates BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_progress_updates BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN message_events.dedupe_key IS 'Stable key for upserting live/system messages; NULL for legacy template-driven events';
