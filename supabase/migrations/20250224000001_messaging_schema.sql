-- ============================================================================
-- MESSAGING SCHEMA (Phase 5)
-- ============================================================================
-- message_templates, message_events, user_message_preferences

-- ============================================================================
-- MESSAGE TEMPLATES
-- ============================================================================

CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_key TEXT NOT NULL,
  trigger_key TEXT NOT NULL,
  tone_style TEXT NOT NULL CHECK (tone_style IN ('coach', 'calm', 'hype', 'minimal')),
  variant_weight INT NOT NULL DEFAULT 5 CHECK (variant_weight >= 1 AND variant_weight <= 10),
  template_text TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_message_templates_trigger_tone ON message_templates(trigger_key, tone_style);

-- ============================================================================
-- MESSAGE EVENTS
-- ============================================================================

CREATE TABLE message_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_key TEXT NOT NULL,
  template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,
  rendered_body TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'push', 'email')),
  delivery_status TEXT NOT NULL DEFAULT 'queued' CHECK (delivery_status IN ('queued', 'sent', 'skipped', 'failed')),
  reason_skipped TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  metadata JSONB
);

CREATE INDEX idx_message_events_user_created ON message_events(user_id, created_at DESC);
CREATE INDEX idx_message_events_user_trigger ON message_events(user_id, trigger_key);

-- ============================================================================
-- USER MESSAGE PREFERENCES
-- ============================================================================

CREATE TABLE user_message_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  tone_style TEXT NOT NULL DEFAULT 'calm' CHECK (tone_style IN ('coach', 'calm', 'hype', 'minimal')),
  message_frequency TEXT NOT NULL DEFAULT 'normal' CHECK (message_frequency IN ('low', 'normal', 'high')),
  quiet_hours_start TEXT,
  quiet_hours_end TEXT,
  preferred_channels TEXT[] NOT NULL DEFAULT ARRAY['in_app'],
  profanity_allowed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_message_preferences ENABLE ROW LEVEL SECURITY;

-- Templates: read-only for authenticated users
CREATE POLICY "Authenticated can read message_templates" ON message_templates
  FOR SELECT TO authenticated USING (true);

-- Events: users see only their own
CREATE POLICY "Users manage own message_events" ON message_events
  FOR ALL USING (auth.uid() = user_id);

-- Preferences: users manage own
CREATE POLICY "Users manage own user_message_preferences" ON user_message_preferences
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON message_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_message_preferences_updated_at BEFORE UPDATE ON user_message_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED: workout_complete templates (one per tone)
-- ============================================================================

INSERT INTO message_templates (message_key, trigger_key, tone_style, variant_weight, template_text, locale) VALUES
  ('workout_complete_coach', 'workout_complete', 'coach', 5, 'Nice work, {firstName}. That session counts. Keep the momentum going.', 'en'),
  ('workout_complete_calm', 'workout_complete', 'calm', 5, 'You showed up, {firstName}. Rest well.', 'en'),
  ('workout_complete_hype', 'workout_complete', 'hype', 5, 'Crushed it, {firstName}! That was a solid session.', 'en'),
  ('workout_complete_minimal', 'workout_complete', 'minimal', 5, 'Workout logged. Good.', 'en');
