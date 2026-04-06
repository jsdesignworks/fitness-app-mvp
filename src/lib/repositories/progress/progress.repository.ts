import { getServiceRoleClient } from '@/lib/utils/db'
import type { ProgressEntry, CreateProgressEntryData, UpdateProgressEntryData } from '@/lib/domain/progress.types'

function mapRow(row: Record<string, unknown>): ProgressEntry {
  const measurements = row.measurements as Record<string, number> | null | undefined
  return {
    id: String(row.id),
    userId: String(row.user_id),
    date: String(row.date).slice(0, 10),
    weightKg: row.weight_kg != null ? Number(row.weight_kg) : null,
    measurements: measurements && typeof measurements === 'object' ? measurements : {},
    notes: row.notes != null ? String(row.notes) : null,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  }
}

export const ProgressRepository = {
  async listByUserAndRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<ProgressEntry[]> {
    const supabase = getServiceRoleClient()
    const { data, error } = await supabase
      .from('progress_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
    if (error) throw error
    return (data ?? []).map((r) => mapRow(r as Record<string, unknown>))
  },

  async getByUserAndDate(userId: string, date: string): Promise<ProgressEntry | null> {
    const supabase = getServiceRoleClient()
    const { data, error } = await supabase
      .from('progress_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle()
    if (error) throw error
    return data ? mapRow(data as Record<string, unknown>) : null
  },

  async create(userId: string, data: CreateProgressEntryData): Promise<ProgressEntry> {
    const supabase = getServiceRoleClient()
    const { data: row, error } = await supabase
      .from('progress_entries')
      .upsert(
        {
          user_id: userId,
          date: data.date,
          weight_kg: data.weightKg ?? null,
          measurements: data.measurements ?? {},
          notes: data.notes ?? null,
        },
        { onConflict: 'user_id,date' }
      )
      .select()
      .single()
    if (error) throw error
    return mapRow(row as Record<string, unknown>)
  },

  async update(userId: string, id: string, updates: UpdateProgressEntryData): Promise<ProgressEntry> {
    const supabase = getServiceRoleClient()
    const payload: Record<string, unknown> = {}
    if (updates.weightKg !== undefined) payload.weight_kg = updates.weightKg
    if (updates.measurements !== undefined) payload.measurements = updates.measurements
    if (updates.notes !== undefined) payload.notes = updates.notes
    const { data, error } = await supabase
      .from('progress_entries')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    return mapRow(data as Record<string, unknown>)
  },

  async delete(userId: string, id: string): Promise<void> {
    const supabase = getServiceRoleClient()
    const { error } = await supabase
      .from('progress_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw error
  },
}
