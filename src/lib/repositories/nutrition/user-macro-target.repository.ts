import { getServiceRoleClient } from '@/lib/utils/db'

export type UserMacroTargetRow = {
  userId: string
  caloriesKcal: number | null
  proteinG: number | null
  carbsG: number | null
  fatG: number | null
  updatedAt: Date
}

function mapRow(row: Record<string, unknown>): UserMacroTargetRow {
  return {
    userId: String(row.user_id),
    caloriesKcal: row.calories_kcal != null ? Number(row.calories_kcal) : null,
    proteinG: row.protein_g != null ? Number(row.protein_g) : null,
    carbsG: row.carbs_g != null ? Number(row.carbs_g) : null,
    fatG: row.fat_g != null ? Number(row.fat_g) : null,
    updatedAt: new Date(String(row.updated_at)),
  }
}

export const UserMacroTargetRepository = {
  async getByUserId(userId: string): Promise<UserMacroTargetRow | null> {
    const supabase = getServiceRoleClient()
    const { data: row, error } = await supabase
      .from('user_macro_targets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error
    if (!row) return null
    return mapRow(row as Record<string, unknown>)
  },

  async upsert(
    userId: string,
    payload: {
      caloriesKcal?: number | null
      proteinG?: number | null
      carbsG?: number | null
      fatG?: number | null
    }
  ): Promise<UserMacroTargetRow> {
    const supabase = getServiceRoleClient()
    const { data: row, error } = await supabase
      .from('user_macro_targets')
      .upsert(
        {
          user_id: userId,
          calories_kcal: payload.caloriesKcal ?? null,
          protein_g: payload.proteinG ?? null,
          carbs_g: payload.carbsG ?? null,
          fat_g: payload.fatG ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single()
    if (error) throw error
    return mapRow(row as Record<string, unknown>)
  },
}
