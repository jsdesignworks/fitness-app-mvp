-- ============================================================================
-- WORKOUT TRACKING SCHEMA
-- ============================================================================
-- This migration creates all tables for the workout tracking system
-- Based on the data model design document

-- Enable UUID extension
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- EXERCISES (Dictionary)
-- ============================================================================

CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('strength', 'cardio', 'mobility', 'flexibility', 'plyometric', 'balance')),
  default_tracking_mode TEXT NOT NULL CHECK (default_tracking_mode IN ('strength_sets', 'cardio_time_distance', 'bodyweight_reps', 'timed_hold', 'intervals')),
  
  -- Metadata (JSON for flexibility)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Search and filtering
  aliases TEXT[],
  primary_muscles TEXT[],
  secondary_muscles TEXT[],
  equipment_type TEXT[],
  
  -- User-created vs system exercises
  is_custom BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exercises_category ON exercises(category);
CREATE INDEX idx_exercises_name ON exercises USING gin(to_tsvector('english', name));
CREATE INDEX idx_exercises_is_custom ON exercises(is_custom);
CREATE INDEX idx_exercises_created_by ON exercises(created_by);

-- ============================================================================
-- WORKOUT TEMPLATES (Planned Structures)
-- ============================================================================

CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workouts_user_id ON workouts(user_id);

CREATE TABLE workout_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  order_index INT NOT NULL,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  
  -- Planned structure (JSON for flexibility)
  planned_structure JSONB DEFAULT '{}'::jsonb,
  rest_seconds_default INT,
  grouping_key TEXT, -- for supersets, circuits
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workout_items_workout_id ON workout_items(workout_id);
CREATE INDEX idx_workout_items_exercise_id ON workout_items(exercise_id);
CREATE INDEX idx_workout_items_order ON workout_items(workout_id, order_index);

-- ============================================================================
-- WORKOUT SESSIONS (Executed Instances)
-- ============================================================================

CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES workouts(id) ON DELETE SET NULL,
  scheduled_workout_id UUID, -- Will reference scheduling table (created later)
  
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('planned', 'in_progress', 'completed', 'partial', 'abandoned')),
  
  notes TEXT,
  perceived_exertion INT CHECK (perceived_exertion BETWEEN 1 AND 10),
  bodyweight DECIMAL(5,1), -- kg or lbs
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_started_at ON workout_sessions(user_id, started_at DESC);
CREATE INDEX idx_workout_sessions_status ON workout_sessions(user_id, status);

-- ============================================================================
-- SESSION EXERCISES
-- ============================================================================

CREATE TABLE session_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  order_index INT NOT NULL,
  
  source_workout_item_id UUID REFERENCES workout_items(id) ON DELETE SET NULL,
  tracking_mode TEXT NOT NULL,
  notes TEXT,
  
  -- Optional targets
  target_reps_range INT[2],
  target_rpe INT CHECK (target_rpe BETWEEN 1 AND 10),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_session_exercises_session_id ON session_exercises(session_id);
CREATE INDEX idx_session_exercises_exercise_id ON session_exercises(exercise_id);
CREATE INDEX idx_session_exercises_order ON session_exercises(session_id, order_index);

-- ============================================================================
-- SETS (Atomic Tracking Unit)
-- ============================================================================

CREATE TABLE sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_exercise_id UUID NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE,
  set_index INT NOT NULL,
  set_type TEXT NOT NULL DEFAULT 'working' CHECK (set_type IN ('warmup', 'working', 'drop', 'failure', 'rest_pause', 'backoff')),
  
  -- Nullable fields for different tracking modes
  reps INT,
  weight DECIMAL(6,2),
  duration_seconds INT,
  distance_meters DECIMAL(8,2),
  rpe INT CHECK (rpe BETWEEN 1 AND 10),
  
  is_completed BOOLEAN DEFAULT true,
  notes TEXT,
  
  -- Advanced tracking
  tempo TEXT,
  rest_seconds_actual INT,
  failure_flag BOOLEAN DEFAULT false,
  assistance_weight DECIMAL(6,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sets_session_exercise_id ON sets(session_exercise_id);
CREATE INDEX idx_sets_order ON sets(session_exercise_id, set_index);

-- ============================================================================
-- COMPUTED METRICS (Could be materialized view for performance)
-- ============================================================================

-- Function to calculate total volume for a session
CREATE OR REPLACE FUNCTION calculate_session_volume(session_id_param UUID)
RETURNS DECIMAL AS $$
  SELECT COALESCE(SUM(
    CASE 
      WHEN s.reps IS NOT NULL AND s.weight IS NOT NULL 
      THEN s.reps * s.weight
      ELSE 0
    END
  ), 0)
  FROM sets s
  JOIN session_exercises se ON s.session_exercise_id = se.id
  WHERE se.session_id = session_id_param
    AND s.is_completed = true;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;

-- Exercises: Users can read all, but only modify their own custom exercises
CREATE POLICY "Users can view all exercises"
  ON exercises FOR SELECT
  USING (true);

CREATE POLICY "Users can create custom exercises"
  ON exercises FOR INSERT
  WITH CHECK (is_custom = true AND auth.uid() = created_by);

CREATE POLICY "Users can update their own custom exercises"
  ON exercises FOR UPDATE
  USING (is_custom = true AND auth.uid() = created_by);

-- Workouts: Users can only access their own
CREATE POLICY "Users can manage their own workouts"
  ON workouts FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own workout items"
  ON workout_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workouts w 
      WHERE w.id = workout_items.workout_id 
      AND w.user_id = auth.uid()
    )
  );

-- Sessions: Users can only access their own
CREATE POLICY "Users can manage their own sessions"
  ON workout_sessions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own session exercises"
  ON session_exercises FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workout_sessions ws 
      WHERE ws.id = session_exercises.session_id 
      AND ws.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own sets"
  ON sets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM session_exercises se
      JOIN workout_sessions ws ON se.session_id = ws.id
      WHERE se.id = sets.session_exercise_id 
      AND ws.user_id = auth.uid()
    )
  );

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workouts_updated_at BEFORE UPDATE ON workouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_sessions_updated_at BEFORE UPDATE ON workout_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sets_updated_at BEFORE UPDATE ON sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
