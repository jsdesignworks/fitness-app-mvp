import { getServiceRoleClient } from '@/lib/utils/db'
import type { WorkoutSession, SessionExercise, ExerciseSet } from '@/lib/domain/workout.types'

function mapSessionRow(row: Record<string, unknown>): WorkoutSession {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    workoutId: row.workout_id != null ? String(row.workout_id) : undefined,
    scheduledWorkoutId: row.scheduled_workout_id != null ? String(row.scheduled_workout_id) : undefined,
    startedAt: new Date(String(row.started_at)),
    endedAt: row.ended_at != null ? new Date(String(row.ended_at)) : undefined,
    timezone: String(row.timezone ?? 'UTC'),
    status: String(row.status) as WorkoutSession['status'],
    completionStatus: String(row.status) as WorkoutSession['status'],
    notes: row.notes != null ? String(row.notes) : undefined,
    perceivedExertion: row.perceived_exertion != null ? Number(row.perceived_exertion) : undefined,
    bodyweight: row.bodyweight != null ? Number(row.bodyweight) : undefined,
    sessionExercises: [],
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  }
}

function mapSessionExerciseRow(row: Record<string, unknown>, exerciseName?: string): SessionExercise {
  return {
    id: String(row.id),
    sessionId: String(row.session_id),
    exerciseId: String(row.exercise_id),
    orderIndex: Number(row.order_index),
    sourceWorkoutItemId: row.source_workout_item_id != null ? String(row.source_workout_item_id) : undefined,
    trackingMode: String(row.tracking_mode) as SessionExercise['trackingMode'],
    notes: row.notes != null ? String(row.notes) : undefined,
    sets: [],
    targetRPE: row.target_rpe != null ? Number(row.target_rpe) : undefined,
    ...(exerciseName !== undefined && { exerciseName }),
  }
}

function mapSetRow(row: Record<string, unknown>): ExerciseSet {
  return {
    id: String(row.id),
    sessionExerciseId: String(row.session_exercise_id),
    setIndex: Number(row.set_index),
    setType: String(row.set_type) as ExerciseSet['setType'],
    reps: row.reps != null ? Number(row.reps) : undefined,
    weight: row.weight != null ? Number(row.weight) : undefined,
    durationSeconds: row.duration_seconds != null ? Number(row.duration_seconds) : undefined,
    distanceMeters: row.distance_meters != null ? Number(row.distance_meters) : undefined,
    rpe: row.rpe != null ? Number(row.rpe) : undefined,
    isCompleted: Boolean(row.is_completed ?? true),
    notes: row.notes != null ? String(row.notes) : undefined,
    restSecondsActual: row.rest_seconds_actual != null ? Number(row.rest_seconds_actual) : undefined,
    failureFlag: Boolean(row.failure_flag ?? false),
    assistanceWeight: row.assistance_weight != null ? Number(row.assistance_weight) : undefined,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  }
}

export const SessionRepository = {
  async getActiveSession(userId: string): Promise<WorkoutSession | null> {
    const supabase = getServiceRoleClient()
    const { data: sessions, error: sessionError } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1)

    if (sessionError || !sessions?.length) return null
    const session = mapSessionRow(sessions[0] as Record<string, unknown>)
    const withExercises = await this.loadSessionExercisesAndSets(supabase, session)
    return withExercises
  },

  async create(data: {
    userId: string
    workoutId: string | null
    scheduledWorkoutId: string | null
    startedAt: Date
    timezone: string
    completionStatus: string
    title?: string
  }): Promise<WorkoutSession> {
    const supabase = getServiceRoleClient()
    const { data: row, error } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: data.userId,
        workout_id: data.workoutId || null,
        scheduled_workout_id: data.scheduledWorkoutId || null,
        started_at: data.startedAt.toISOString(),
        timezone: data.timezone,
        status: data.completionStatus,
        notes: data.title || null,
      })
      .select()
      .single()

    if (error) throw new Error(`SessionRepository.create: ${error.message}`)
    return mapSessionRow(row as Record<string, unknown>)
  },

  async addExercise(
    sessionId: string,
    exercise: Partial<SessionExercise> & { exerciseId: string; orderIndex: number; trackingMode: string }
  ): Promise<SessionExercise> {
    const supabase = getServiceRoleClient()
    const { data: row, error } = await supabase
      .from('session_exercises')
      .insert({
        session_id: sessionId,
        exercise_id: exercise.exerciseId,
        order_index: exercise.orderIndex,
        tracking_mode: exercise.trackingMode ?? 'strength_sets',
        source_workout_item_id: exercise.sourceWorkoutItemId || null,
        notes: exercise.notes || null,
      })
      .select()
      .single()

    if (error) throw new Error(`SessionRepository.addExercise: ${error.message}`)
    const r = row as Record<string, unknown>
    return mapSessionExerciseRow(r)
  },

  async getById(sessionId: string): Promise<WorkoutSession | null> {
    const supabase = getServiceRoleClient()
    const { data: row, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (error || !row) return null
    const session = mapSessionRow(row as Record<string, unknown>)
    return this.loadSessionExercisesAndSets(supabase, session)
  },

  async listByUser(userId: string): Promise<WorkoutSession[]> {
    const supabase = getServiceRoleClient()
    const { data: rows, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })

    if (error) return []
    const sessions = (rows || []).map((r) => mapSessionRow(r as Record<string, unknown>))
    return Promise.all(sessions.map((s) => this.loadSessionExercisesAndSets(supabase, s)))
  },

  /** Lightweight rows for calendar aggregation — no exercises/sets loaded. */
  async listSessionStartsInRange(
    userId: string,
    rangeStartInclusive: Date,
    rangeEndExclusive: Date
  ): Promise<{ id: string; startedAt: Date; status: string }[]> {
    const supabase = getServiceRoleClient()
    const { data: rows, error } = await supabase
      .from('workout_sessions')
      .select('id, started_at, status')
      .eq('user_id', userId)
      .gte('started_at', rangeStartInclusive.toISOString())
      .lt('started_at', rangeEndExclusive.toISOString())
      .order('started_at', { ascending: true })

    if (error || !rows?.length) return []
    return (rows as Record<string, unknown>[]).map((r) => ({
      id: String(r.id),
      startedAt: new Date(String(r.started_at)),
      status: String(r.status ?? ''),
    }))
  },

  async updateCompletionStatus(
    sessionId: string,
    status: string,
    opts?: { endedAt?: Date; totalVolume?: number; totalDuration?: number }
  ): Promise<void> {
    const supabase = getServiceRoleClient()
    const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
    if (opts?.endedAt) updates.ended_at = opts.endedAt.toISOString()
    const { error } = await supabase.from('workout_sessions').update(updates).eq('id', sessionId)
    if (error) throw new Error(`SessionRepository.updateCompletionStatus: ${error.message}`)
  },

  async getSessionExercise(sessionExerciseId: string): Promise<{ session: { userId: string } } | null> {
    const supabase = getServiceRoleClient()
    const { data: se, error } = await supabase
      .from('session_exercises')
      .select('id, session_id')
      .eq('id', sessionExerciseId)
      .single()
    if (error || !se) return null
    const { data: ws } = await supabase
      .from('workout_sessions')
      .select('user_id')
      .eq('id', (se as Record<string, unknown>).session_id)
      .single()
    if (!ws) return null
    return { session: { userId: String((ws as Record<string, unknown>).user_id) } }
  },

  async getMaxSetIndex(sessionExerciseId: string): Promise<number> {
    const supabase = getServiceRoleClient()
    const { data: sets, error } = await supabase
      .from('sets')
      .select('set_index')
      .eq('session_exercise_id', sessionExerciseId)
    if (error || !sets?.length) return 0
    const max = Math.max(...(sets as Record<string, unknown>[]).map((s) => Number(s.set_index)))
    return max
  },

  async addSet(
    sessionExerciseId: string,
    setData: Partial<ExerciseSet> & { setIndex: number; isCompleted: boolean }
  ): Promise<ExerciseSet> {
    const supabase = getServiceRoleClient()
    const { data: row, error } = await supabase
      .from('sets')
      .insert({
        session_exercise_id: sessionExerciseId,
        set_index: setData.setIndex,
        set_type: setData.setType ?? 'working',
        reps: setData.reps ?? null,
        weight: setData.weight ?? null,
        rpe: setData.rpe ?? null,
        duration_seconds: setData.durationSeconds ?? null,
        distance_meters: setData.distanceMeters ?? null,
        is_completed: setData.isCompleted ?? true,
        notes: setData.notes ?? null,
      })
      .select()
      .single()

    if (error) throw new Error(`SessionRepository.addSet: ${error.message}`)
    return mapSetRow(row as Record<string, unknown>)
  },

  async getSet(setId: string): Promise<(ExerciseSet & { sessionExercise: { session: { userId: string } } }) | null> {
    const supabase = getServiceRoleClient()
    const { data: setRow, error: setError } = await supabase.from('sets').select('*').eq('id', setId).single()
    if (setError || !setRow) return null
    const seId = String((setRow as Record<string, unknown>).session_exercise_id)
    const { data: seRow } = await supabase.from('session_exercises').select('session_id').eq('id', seId).single()
    if (!seRow) return null
    const sessionId = String((seRow as Record<string, unknown>).session_id)
    const { data: wsRow } = await supabase.from('workout_sessions').select('user_id').eq('id', sessionId).single()
    if (!wsRow) return null
    const set = mapSetRow(setRow as Record<string, unknown>)
    return {
      ...set,
      sessionExercise: { session: { userId: String((wsRow as Record<string, unknown>).user_id) } },
    }
  },

  async updateSet(setId: string, updates: Partial<ExerciseSet>): Promise<ExerciseSet> {
    const supabase = getServiceRoleClient()
    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (updates.reps !== undefined) dbUpdates.reps = updates.reps
    if (updates.weight !== undefined) dbUpdates.weight = updates.weight
    if (updates.rpe !== undefined) dbUpdates.rpe = updates.rpe
    if (updates.durationSeconds !== undefined) dbUpdates.duration_seconds = updates.durationSeconds
    if (updates.distanceMeters !== undefined) dbUpdates.distance_meters = updates.distanceMeters
    if (updates.isCompleted !== undefined) dbUpdates.is_completed = updates.isCompleted
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes
    if (updates.setType !== undefined) dbUpdates.set_type = updates.setType

    const { data: row, error } = await supabase.from('sets').update(dbUpdates).eq('id', setId).select().single()
    if (error) throw new Error(`SessionRepository.updateSet: ${error.message}`)
    return mapSetRow(row as Record<string, unknown>)
  },

  async loadSessionExercisesAndSets(
    supabase: ReturnType<typeof getServiceRoleClient>,
    session: WorkoutSession
  ): Promise<WorkoutSession> {
    const { data: exRows, error: exError } = await supabase
      .from('session_exercises')
      .select('*, exercises(name)')
      .eq('session_id', session.id)
      .order('order_index', { ascending: true })

    if (exError || !exRows?.length) {
      return { ...session, sessionExercises: [] }
    }

    const sessionExercises: SessionExercise[] = []
    for (const ex of exRows as Record<string, unknown>[]) {
      const exercise = ex.exercises as Record<string, unknown> | null
      const name = exercise?.name != null ? String(exercise.name) : undefined
      const se = mapSessionExerciseRow(ex, name)
      const { data: setRows } = await supabase
        .from('sets')
        .select('*')
        .eq('session_exercise_id', se.id)
        .order('set_index', { ascending: true })
      se.sets = (setRows || []).map((s) => mapSetRow(s as Record<string, unknown>))
      sessionExercises.push(se)
    }
    return { ...session, sessionExercises }
  },
}
