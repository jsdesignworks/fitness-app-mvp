-- AI provider preferences (per-user) + request log audit fields
-- ============================================================================

CREATE TABLE ai_provider_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_provider TEXT CHECK (default_provider IN ('openai', 'anthropic')),
  fallback_provider TEXT CHECK (fallback_provider IN ('openai', 'anthropic')),
  allow_fallback BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE ai_provider_preferences IS 'User AI routing: default/fallback provider (OpenAI + Anthropic).';

ALTER TABLE ai_request_logs
  ADD COLUMN IF NOT EXISTS provider TEXT CHECK (provider IN ('openai', 'anthropic')),
  ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('success', 'failed')),
  ADD COLUMN IF NOT EXISTS error_message TEXT;

CREATE INDEX IF NOT EXISTS idx_ai_request_logs_user_status_created
  ON ai_request_logs (user_id, status, created_at DESC);

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE ai_provider_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own ai_provider_preferences" ON ai_provider_preferences
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_ai_provider_preferences_updated_at
  BEFORE UPDATE ON ai_provider_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
