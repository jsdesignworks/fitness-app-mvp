import { getServiceRoleClient } from '@/lib/utils/db'
import type { ScheduledWorkout, ScheduledStatus, ScheduleSource } from '@/lib/domain/scheduling.types'

function mapRow(row: Record<string, unknown>): ScheduledWorkout {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    workoutId: row.workout_id != null ? String(row.workout_id) : undefined,
    titleOverride: row.title_override != null ? String(row.title_override) : undefined,
    startAt: new Date(String(row.start_at)),
    endAt: row.end_at != null ? new Date(String(row.end_at)) : undefined,
    timezone: String(row.timezone ?? 'UTC'),
    status: (row.status as ScheduledStatus) ?? 'scheduled',
    notes: row.notes != null ? String(row.notes) : undefined,
    source: (row.source as ScheduleSource) ?? 'user_created',
    recurrenceId: row.recurrence_id != null ? String(row.recurrence_id) : undefined,
    completedSessionId: row.completed_session_id != null ? String(row.completed_session_id) : undefined,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  }
}

export type CreateScheduledWorkoutData = {
  userId: string
  workoutId?: string | null
  titleOverride?: string | null
  startAt: Date
  endAt?: Date | null
  timezone: string
  notes?: string | null
  source?: ScheduleSource
}

export type UpdateScheduledWorkoutData = Partial<{
  status: ScheduledStatus
  startAt: Date
  endAt: Date | null
  notes: string | null
  completedSessionId: string | null
}>

export const ScheduledWorkoutRepository = {
  async create(data: CreateScheduledWorkoutData): Promise<ScheduledWorkout> {
    const supabase = getServiceRoleClient()
    const { data: row, error } = await supabase
      .from('scheduled_workouts')
      .insert({
        user_id: data.userId,
        workout_id: data.workoutId ?? null,
        title_override: data.titleOverride ?? null,
        start_at: data.startAt.toISOString(),
        end_at: data.endAt?.toISOString() ?? null,
        timezone: data.timezone,
        notes: data.notes ?? null,
        source: data.source ?? 'user_created',
      })
      .select()
      .single()
    if (error) throw error
    return mapRow(row as Record<string, unknown>)
  },

  async getById(id: string): Promise<ScheduledWorkout | null> {
    const supabase = getServiceRoleClient()
    const { data: row, error } = await supabase
      .from('scheduled_workouts')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !row) return null
    return mapRow(row as Record<string, unknown>)
  },

  async listByUserInRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ScheduledWorkout[]> {
    const supabase = getServiceRoleClient()
    const start = startDate.toISOString()
    const end = endDate.toISOString()
    const { data: rows, error } = await supabase
      .from('scheduled_workouts')
      .select('*')
      .eq('user_id', userId)
      .gte('start_at', start)
      .lte('start_at', end)
      .order('start_at', { ascending: true })
    if (error) throw error
    return (rows ?? []).map((r) => mapRow(r as Record<string, unknown>))
  },

  async update(id: string, updates: UpdateScheduledWorkoutData): Promise<ScheduledWorkout> {
    const supabase = getServiceRoleClient()
    const db: Record<string, unknown> = {}
    if (updates.status !== undefined) db.status = updates.status
    if (updates.startAt !== undefined) db.start_at = updates.startAt.toISOString()
    if (updates.endAt !== undefined) db.end_at = updates.endAt?.toISOString() ?? null
    if (updates.notes !== undefined) db.notes = updates.notes
    if (updates.completedSessionId !== undefined) db.completed_session_id = updates.completedSessionId
    const { data: row, error } = await supabase
      .from('scheduled_workouts')
      .update(db)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return mapRow(row as Record<string, unknown>)
  },

  async updateStatus(
    id: string,
    status: ScheduledStatus,
    opts?: { completedSessionId?: string }
  ): Promise<void> {
    const supabase = getServiceRoleClient()
    const updates: Record<string, unknown> = { status }
    if (opts?.completedSessionId != null) updates.completed_session_id = opts.completedSessionId
    const { error } = await supabase
      .from('scheduled_workouts')
      .update(updates)
      .eq('id', id)
    if (error) throw error
  },
}
