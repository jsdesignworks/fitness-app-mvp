import { getServiceRoleClient } from '@/lib/utils/db'
import type { Meal, MealType } from '@/lib/domain/nutrition.types'

function mapMealRow(row: Record<string, unknown>, entries: { id: string; mealId: string }[] = []): Meal {
  return {
    id: String(row.id),
    nutritionDayId: String(row.nutrition_day_id),
    mealType: (row.meal_type as MealType) ?? 'snack',
    title: row.title != null ? String(row.title) : undefined,
    eatenAt: row.eaten_at != null ? new Date(String(row.eaten_at)) : undefined,
    sortIndex: Number(row.sort_index ?? 0),
    entries: entries as Meal['entries'],
  }
}

export const MealRepository = {
  async getById(mealId: string): Promise<Meal | null> {
    const supabase = getServiceRoleClient()
    const { data: row, error } = await supabase.from('meals').select('*').eq('id', mealId).single()
    if (error || !row) return null
    return mapMealRow(row as Record<string, unknown>, [])
  },

  async add(nutritionDayId: string, mealType: MealType, sortIndex: number): Promise<Meal> {
    const supabase = getServiceRoleClient()
    const { data: row, error } = await supabase
      .from('meals')
      .insert({
        nutrition_day_id: nutritionDayId,
        meal_type: mealType,
        sort_index: sortIndex,
      })
      .select()
      .single()
    if (error) throw error
    return mapMealRow(row as Record<string, unknown>, [])
  },

  async getByNutritionDayId(nutritionDayId: string): Promise<Meal[]> {
    const supabase = getServiceRoleClient()
    const { data: rows, error } = await supabase
      .from('meals')
      .select('*')
      .eq('nutrition_day_id', nutritionDayId)
      .order('sort_index', { ascending: true })
    if (error) throw error
    return (rows ?? []).map((r) => mapMealRow(r as Record<string, unknown>, []))
  },
}
