import { getServiceRoleClient } from '@/lib/utils/db'
import type { Exercise, ExerciseCategory, TrackingMode } from '@/lib/domain/workout.types'

function mapRow(row: Record<string, unknown>): Exercise {
  const baseMeta =
    row.metadata != null && typeof row.metadata === 'object' ? { ...(row.metadata as object) } : {}
  const primaryFromCol = Array.isArray(row.primary_muscles) ? (row.primary_muscles as string[]) : undefined
  const secondaryFromCol = Array.isArray(row.secondary_muscles) ? (row.secondary_muscles as string[]) : undefined
  const equipFromCol = Array.isArray(row.equipment_type) ? (row.equipment_type as string[]) : undefined
  const mergedMeta = { ...baseMeta } as NonNullable<Exercise['metadata']>
  if (primaryFromCol?.length) mergedMeta.primaryMuscles = primaryFromCol as NonNullable<Exercise['metadata']>['primaryMuscles']
  if (secondaryFromCol?.length) mergedMeta.secondaryMuscles = secondaryFromCol as NonNullable<Exercise['metadata']>['secondaryMuscles']
  if (equipFromCol?.length) mergedMeta.equipment = equipFromCol as NonNullable<Exercise['metadata']>['equipment']
  const hasMeta = Object.keys(mergedMeta).length > 0
  return {
    id: String(row.id),
    name: String(row.name),
    category: String(row.category) as ExerciseCategory,
    defaultTrackingMode: String(row.default_tracking_mode) as TrackingMode,
    metadata: hasMeta ? mergedMeta : undefined,
    aliases: Array.isArray(row.aliases) ? (row.aliases as string[]) : undefined,
    isCustom: Boolean(row.is_custom),
    createdBy: row.created_by != null ? String(row.created_by) : undefined,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  }
}

export const ExerciseRepository = {
  async getById(id: string): Promise<Exercise | null> {
    const supabase = getServiceRoleClient()
    const { data, error } = await supabase.from('exercises').select('*').eq('id', id).single()
    if (error || !data) return null
    return mapRow(data as Record<string, unknown>)
  },

  async list(opts?: {
    category?: string
    search?: string
    muscle?: string
    equipment?: string
  }): Promise<Exercise[]> {
    const supabase = getServiceRoleClient()
    let query = supabase.from('exercises').select('*').order('name', { ascending: true })
    if (opts?.category) query = query.eq('category', opts.category)
    if (opts?.search?.trim()) {
      query = query.ilike('name', `%${opts.search.trim()}%`)
    }
    if (opts?.muscle?.trim()) {
      query = query.contains('primary_muscles', [opts.muscle.trim()])
    }
    if (opts?.equipment?.trim()) {
      query = query.contains('equipment_type', [opts.equipment.trim()])
    }
    const { data, error } = await query
    if (error) return []
    return (data || []).map((r) => mapRow(r as Record<string, unknown>))
  },

  async search(queryStr: string): Promise<Exercise[]> {
    const supabase = getServiceRoleClient()
    const q = queryStr.trim()
    if (!q) return this.list({})
    let query = supabase.from('exercises').select('*').order('name', { ascending: true })
    query = query.ilike('name', `%${q}%`)
    const { data, error } = await query
    if (error) return []
    return (data || []).map((r) => mapRow(r as Record<string, unknown>))
  },

  /** Case-insensitive exact name match — for preset resolution */
  async findFirstByExactName(name: string): Promise<Exercise | null> {
    const supabase = getServiceRoleClient()
    const n = name.trim()
    if (!n) return null
    const { data, error } = await supabase.from('exercises').select('*').ilike('name', n)
    if (error || !data?.length) return null
    const exact = (data as Record<string, unknown>[]).find(
      (r) => String(r.name).toLowerCase() === n.toLowerCase()
    )
    return exact ? mapRow(exact) : null
  },

  async create(data: Partial<Exercise> & { name: string; category: string; defaultTrackingMode: string }): Promise<Exercise> {
    const supabase = getServiceRoleClient()
    const insert: Record<string, unknown> = {
      name: data.name,
      category: data.category,
      default_tracking_mode: data.defaultTrackingMode,
      is_custom: data.isCustom ?? true,
      created_by: data.createdBy ?? null,
      metadata: data.metadata ?? {},
      aliases: data.aliases ?? null,
    }
    const { data: row, error } = await supabase.from('exercises').insert(insert).select().single()
    if (error) throw new Error(`ExerciseRepository.create: ${error.message}`)
    return mapRow(row as Record<string, unknown>)
  },

  async update(id: string, data: Partial<Exercise>): Promise<Exercise> {
    const supabase = getServiceRoleClient()
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (data.name !== undefined) updates.name = data.name
    if (data.category !== undefined) updates.category = data.category
    if (data.defaultTrackingMode !== undefined) updates.default_tracking_mode = data.defaultTrackingMode
    if (data.metadata !== undefined) updates.metadata = data.metadata
    if (data.aliases !== undefined) updates.aliases = data.aliases
    const { data: row, error } = await supabase.from('exercises').update(updates).eq('id', id).select().single()
    if (error) throw new Error(`ExerciseRepository.update: ${error.message}`)
    return mapRow(row as Record<string, unknown>)
  },

  async delete(id: string): Promise<void> {
    const supabase = getServiceRoleClient()
    const { error } = await supabase.from('exercises').delete().eq('id', id)
    if (error) throw new Error(`ExerciseRepository.delete: ${error.message}`)
  },
}
