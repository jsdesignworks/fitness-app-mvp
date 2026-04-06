-- ============================================================================
-- SCHEDULING SCHEMA (Phase 4)
-- ============================================================================
-- scheduled_workouts, calendar_feed_tokens; FK from workout_sessions.scheduled_workout_id

-- ============================================================================
-- SCHEDULED WORKOUTS
-- ============================================================================

CREATE TABLE scheduled_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES workouts(id) ON DELETE SET NULL,
  title_override TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'skipped', 'moved', 'in_progress')),
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'user_created' CHECK (source IN ('user_created', 'generated_plan', 'template', 'recurring')),
  recurrence_id UUID,
  completed_session_id UUID REFERENCES workout_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scheduled_workouts_user_start ON scheduled_workouts(user_id, start_at);
CREATE INDEX idx_scheduled_workouts_user_status ON scheduled_workouts(user_id, status);

-- ============================================================================
-- CALENDAR FEED TOKENS (for ICS subscribe URL)
-- ============================================================================

CREATE TABLE calendar_feed_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_calendar_feed_tokens_token ON calendar_feed_tokens(token);
CREATE INDEX idx_calendar_feed_tokens_user ON calendar_feed_tokens(user_id);

-- ============================================================================
-- FK FROM WORKOUT_SESSIONS TO SCHEDULED_WORKOUTS
-- ============================================================================

ALTER TABLE workout_sessions
  ADD CONSTRAINT fk_workout_sessions_scheduled_workout
  FOREIGN KEY (scheduled_workout_id) REFERENCES scheduled_workouts(id) ON DELETE SET NULL;

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE scheduled_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_feed_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own scheduled_workouts" ON scheduled_workouts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own calendar_feed_tokens" ON calendar_feed_tokens
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGER (updated_at)
-- ============================================================================

CREATE TRIGGER update_scheduled_workouts_updated_at BEFORE UPDATE ON scheduled_workouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
