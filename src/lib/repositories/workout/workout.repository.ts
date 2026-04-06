import { getServiceRoleClient } from '@/lib/utils/db'
import type {
  WorkoutTemplate,
  WorkoutTemplateItem,
} from '@/lib/domain/workout.types'

/** Item with exercise info for copyTemplateToSession and optional name for UI */
export type WorkoutTemplateItemWithExercise = WorkoutTemplateItem & {
  exercise?: { id: string; defaultTrackingMode: string }
  exerciseName?: string
}

export type WorkoutTemplateWithItems = Omit<WorkoutTemplate, 'items'> & {
  items: WorkoutTemplateItemWithExercise[]
}

function mapWorkoutRow(row: Record<string, unknown>): Omit<WorkoutTemplate, 'items'> {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    name: String(row.name),
    notes: row.notes != null ? String(row.notes) : undefined,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  }
}

function mapItemRow(
  row: Record<string, unknown>,
  exercise?: { id: string; default_tracking_mode: string; name?: string }
): WorkoutTemplateItemWithExercise {
  const item: WorkoutTemplateItemWithExercise = {
    id: String(row.id),
    workoutId: String(row.workout_id),
    orderIndex: Number(row.order_index),
    exerciseId: String(row.exercise_id),
    groupingKey: row.grouping_key != null ? String(row.grouping_key) : undefined,
  }
  if (row.planned_structure != null && typeof row.planned_structure === 'object') {
    const ps = row.planned_structure as Record<string, unknown>
    item.plannedStructure = {
      sets: ps.sets != null ? Number(ps.sets) : undefined,
      restSeconds: ps.rest_seconds != null ? Number(ps.rest_seconds) : undefined,
      repsRange: Array.isArray(ps.reps_range) && ps.reps_range.length >= 2
        ? [Number(ps.reps_range[0]), Number(ps.reps_range[1])]
        : undefined,
      targetWeight: ps.target_weight != null ? Number(ps.target_weight) : undefined,
      targetDuration: ps.target_duration != null ? Number(ps.target_duration) : undefined,
      targetDistance: ps.target_distance != null ? Number(ps.target_distance) : undefined,
    }
  }
  if (exercise) {
    item.exercise = {
      id: exercise.id,
      defaultTrackingMode: exercise.default_tracking_mode,
    }
    if (exercise.name) item.exerciseName = exercise.name
  }
  return item
}

export const WorkoutRepository = {
  async getById(workoutId: string): Promise<WorkoutTemplateWithItems | null> {
    const supabase = getServiceRoleClient()
    const { data: workoutRow, error: workoutError } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', workoutId)
      .single()
    if (workoutError || !workoutRow) return null
    const template = mapWorkoutRow(workoutRow as Record<string, unknown>)
    const { data: itemRows, error: itemsError } = await supabase
      .from('workout_items')
      .select('*, exercises(id, default_tracking_mode, name)')
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true })
    if (itemsError) return { ...template, items: [] }
    const items: WorkoutTemplateItemWithExercise[] = (itemRows || []).map((r) => {
      const row = r as Record<string, unknown>
      const ex = row.exercises as Record<string, unknown> | null
      const exercise = ex
        ? {
            id: String(ex.id),
            default_tracking_mode: String(ex.default_tracking_mode),
            name: ex.name != null ? String(ex.name) : undefined,
          }
        : undefined
      return mapItemRow(row, exercise)
    })
    return { ...template, items }
  },

  async listByUser(userId: string): Promise<Omit<WorkoutTemplate, 'items'>[]> {
    const supabase = getServiceRoleClient()
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    if (error) return []
    return (data || []).map((r) => mapWorkoutRow(r as Record<string, unknown>))
  },

  async create(data: {
    userId: string
    name: string
    notes?: string
    items: { exerciseId: string; orderIndex: number; plannedStructure?: WorkoutTemplateItem['plannedStructure'] }[]
  }): Promise<WorkoutTemplateWithItems> {
    const supabase = getServiceRoleClient()
    const { data: workoutRow, error: workoutError } = await supabase
      .from('workouts')
      .insert({
        user_id: data.userId,
        name: data.name,
        notes: data.notes ?? null,
      })
      .select()
      .single()
    if (workoutError) throw new Error(`WorkoutRepository.create: ${workoutError.message}`)
    const workoutId = String((workoutRow as Record<string, unknown>).id)
    for (let i = 0; i < data.items.length; i++) {
      const it = data.items[i]
      const planned = it.plannedStructure ?? {}
      const { error: itemError } = await supabase.from('workout_items').insert({
        workout_id: workoutId,
        exercise_id: it.exerciseId,
        order_index: it.orderIndex,
        planned_structure: {
          sets: planned.sets ?? null,
          rest_seconds: planned.restSeconds ?? null,
          reps_range: planned.repsRange ?? null,
          target_weight: planned.targetWeight ?? null,
          target_duration: planned.targetDuration ?? null,
          target_distance: planned.targetDistance ?? null,
        },
      })
      if (itemError) throw new Error(`WorkoutRepository.create items: ${itemError.message}`)
    }
    const created = await this.getById(workoutId)
    if (!created) throw new Error('WorkoutRepository.create: failed to load created workout')
    return created
  },

  async update(
    id: string,
    data: {
      name?: string
      notes?: string
      items?: { exerciseId: string; orderIndex: number; plannedStructure?: WorkoutTemplateItem['plannedStructure'] }[]
    }
  ): Promise<WorkoutTemplateWithItems> {
    const supabase = getServiceRoleClient()
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (data.name !== undefined) updates.name = data.name
    if (data.notes !== undefined) updates.notes = data.notes
    const { error: updateError } = await supabase.from('workouts').update(updates).eq('id', id)
    if (updateError) throw new Error(`WorkoutRepository.update: ${updateError.message}`)
    if (data.items !== undefined) {
      const { error: delError } = await supabase.from('workout_items').delete().eq('workout_id', id)
      if (delError) throw new Error(`WorkoutRepository.update delete items: ${delError.message}`)
      for (let i = 0; i < data.items.length; i++) {
        const it = data.items[i]
        const planned = it.plannedStructure ?? {}
        const { error: insError } = await supabase.from('workout_items').insert({
          workout_id: id,
          exercise_id: it.exerciseId,
          order_index: it.orderIndex,
          planned_structure: {
            sets: planned.sets ?? null,
            rest_seconds: planned.restSeconds ?? null,
            reps_range: planned.repsRange ?? null,
            target_weight: planned.targetWeight ?? null,
            target_duration: planned.targetDuration ?? null,
            target_distance: planned.targetDistance ?? null,
          },
        })
        if (insError) throw new Error(`WorkoutRepository.update insert items: ${insError.message}`)
      }
    }
    const updated = await this.getById(id)
    if (!updated) throw new Error('WorkoutRepository.update: failed to load updated workout')
    return updated
  },

  async delete(id: string): Promise<void> {
    const supabase = getServiceRoleClient()
    const { error } = await supabase.from('workouts').delete().eq('id', id)
    if (error) throw new Error(`WorkoutRepository.delete: ${error.message}`)
  },

  /** Batch lookup names for session list display */
  async getNamesByIds(ids: string[]): Promise<Record<string, string>> {
    if (ids.length === 0) return {}
    const supabase = getServiceRoleClient()
    const { data, error } = await supabase.from('workouts').select('id, name').in('id', ids)
    if (error || !data) return {}
    const out: Record<string, string> = {}
    for (const row of data) {
      const r = row as Record<string, unknown>
      out[String(r.id)] = String(r.name)
    }
    return out
  },
}
