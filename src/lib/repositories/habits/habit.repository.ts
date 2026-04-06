import { getServiceRoleClient } from '@/lib/utils/db'
import type { Habit, HabitLog, HabitType, HabitLogKind } from '@/lib/domain/habit.types'

function mapHabitRow(row: Record<string, unknown>): Habit {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    name: String(row.name),
    type: row.type as HabitType,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  }
}

function mapLogRow(row: Record<string, unknown>): HabitLog {
  return {
    id: String(row.id),
    habitId: String(row.habit_id),
    userId: String(row.user_id),
    loggedAt: String(row.logged_at).slice(0, 10),
    kind: row.kind as HabitLogKind,
    createdAt: new Date(String(row.created_at)),
  }
}

export const HabitRepository = {
  async listByUser(userId: string): Promise<Habit[]> {
    const supabase = getServiceRoleClient()
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .is('archived_at', null)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []).map((r) => mapHabitRow(r as Record<string, unknown>))
  },

  async getById(id: string): Promise<Habit | null> {
    const supabase = getServiceRoleClient()
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data ? mapHabitRow(data as Record<string, unknown>) : null
  },

  async create(userId: string, data: { name: string; type: HabitType }): Promise<Habit> {
    const supabase = getServiceRoleClient()
    const { data: row, error } = await supabase
      .from('habits')
      .insert({ user_id: userId, name: data.name, type: data.type })
      .select()
      .single()
    if (error) throw error
    return mapHabitRow(row as Record<string, unknown>)
  },

  async update(userId: string, id: string, data: { name?: string; type?: HabitType }): Promise<Habit> {
    const supabase = getServiceRoleClient()
    const existing = await this.getById(id)
    if (!existing || existing.userId !== userId) throw new Error('Habit not found')
    const payload: Record<string, unknown> = {}
    if (data.name !== undefined) payload.name = data.name
    if (data.type !== undefined) payload.type = data.type
    const { data: row, error } = await supabase
      .from('habits')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return mapHabitRow(row as Record<string, unknown>)
  },

  async delete(userId: string, id: string): Promise<void> {
    const existing = await this.getById(id)
    if (!existing || existing.userId !== userId) throw new Error('Habit not found')
    const supabase = getServiceRoleClient()
    const { error } = await supabase
      .from('habits')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  },
}

export const HabitLogRepository = {
  async listByUserAndRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<HabitLog[]> {
    const supabase = getServiceRoleClient()
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', startDate)
      .lte('logged_at', endDate)
      .order('logged_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((r) => mapLogRow(r as Record<string, unknown>))
  },

  async create(userId: string, data: { habitId: string; loggedAt: string; kind: HabitLogKind }): Promise<HabitLog> {
    const supabase = getServiceRoleClient()
    const { data: row, error } = await supabase
      .from('habit_logs')
      .insert({
        habit_id: data.habitId,
        user_id: userId,
        logged_at: data.loggedAt,
        kind: data.kind,
      })
      .select()
      .single()
    if (error) throw error
    return mapLogRow(row as Record<string, unknown>)
  },
}
