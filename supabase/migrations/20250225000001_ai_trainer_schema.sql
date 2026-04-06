-- ============================================================================
-- AI TRAINER SCHEMA (Phase 6)
-- ============================================================================
-- ai_chat_sessions, ai_chat_messages, ai_request_logs

-- ============================================================================
-- AI CHAT SESSIONS
-- ============================================================================

CREATE TABLE ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_chat_sessions_user_updated ON ai_chat_sessions(user_id, updated_at DESC);

-- ============================================================================
-- AI CHAT MESSAGES
-- ============================================================================

CREATE TABLE ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_chat_messages_session_created ON ai_chat_messages(session_id, created_at);

-- ============================================================================
-- AI REQUEST LOGS (rate limiting and cost/behavior tracking)
-- ============================================================================

CREATE TABLE ai_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL DEFAULT 'chat' CHECK (feature IN ('chat', 'recommendation', 'validation')),
  model TEXT,
  input_tokens INT NOT NULL DEFAULT 0,
  output_tokens INT NOT NULL DEFAULT 0,
  latency_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_request_logs_user_created ON ai_request_logs(user_id, created_at DESC);

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_request_logs ENABLE ROW LEVEL SECURITY;

-- Sessions: users CRUD own
CREATE POLICY "Users manage own ai_chat_sessions" ON ai_chat_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Messages: users read/insert via session ownership
CREATE POLICY "Users manage ai_chat_messages via session" ON ai_chat_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ai_chat_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

-- Logs: users can read own; insert is done server-side with service role
CREATE POLICY "Users read own ai_request_logs" ON ai_request_logs
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_ai_chat_sessions_updated_at BEFORE UPDATE ON ai_chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
