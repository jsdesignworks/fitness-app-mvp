import { getServiceRoleClient } from '@/lib/utils/db'

export type NutritionDisplayType = 'rings' | 'bars' | 'cards'

export type NutritionDisplayPreferenceRow = {
  userId: string
  displayType: NutritionDisplayType
  updatedAt: Date
}

function mapRow(row: Record<string, unknown>): NutritionDisplayPreferenceRow {
  const dt = String(row.display_type)
  const displayType: NutritionDisplayType =
    dt === 'rings' || dt === 'cards' ? dt : 'bars'
  return {
    userId: String(row.user_id),
    displayType,
    updatedAt: new Date(String(row.updated_at)),
  }
}

export const NutritionDisplayPreferenceRepository = {
  async getByUserId(userId: string): Promise<NutritionDisplayPreferenceRow | null> {
    const supabase = getServiceRoleClient()
    const { data: row, error } = await supabase
      .from('nutrition_display_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error
    if (!row) return null
    return mapRow(row as Record<string, unknown>)
  },

  async upsert(userId: string, displayType: NutritionDisplayType): Promise<NutritionDisplayPreferenceRow> {
    const supabase = getServiceRoleClient()
    const { data: row, error } = await supabase
      .from('nutrition_display_preferences')
      .upsert(
        {
          user_id: userId,
          display_type: displayType,
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
