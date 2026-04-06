import { getServiceRoleClient } from '@/lib/utils/db'
import type { NutritionEntry, EntrySource } from '@/lib/domain/nutrition.types'

export type AddEntryPayload = {
  foodId: string
  quantityAmount: number
  quantityUnitId?: string
  /** Precomputed from food_nutrients; if not provided, backend will compute */
  gramsConsumed?: number
  caloriesKcal: number
  proteinG: number
  carbsG: number
  fatG: number
  isEstimated?: boolean
  source?: EntrySource
  notes?: string
}

export type UpdateEntryPayload = Partial<{
  quantityAmount: number
  quantityUnitId: string | null
  gramsConsumed: number | null
  caloriesKcal: number
  proteinG: number
  carbsG: number
  fatG: number
  notes: string
}>

function mapEntryRow(row: Record<string, unknown>): NutritionEntry {
  return {
    id: String(row.id),
    mealId: String(row.meal_id),
    itemType: (row.item_type as NutritionEntry['itemType']) ?? 'food',
    foodId: row.food_id != null ? String(row.food_id) : undefined,
    recipeId: row.recipe_id != null ? String(row.recipe_id) : undefined,
    quantityAmount: Number(row.quantity_amount ?? 1),
    quantityUnitId: row.quantity_unit_id != null ? String(row.quantity_unit_id) : undefined,
    gramsConsumed: row.grams_consumed != null ? Number(row.grams_consumed) : undefined,
    caloriesKcal: row.calories_kcal != null ? Number(row.calories_kcal) : undefined,
    proteinG: row.protein_g != null ? Number(row.protein_g) : undefined,
    carbsG: row.carbs_g != null ? Number(row.carbs_g) : undefined,
    fatG: row.fat_g != null ? Number(row.fat_g) : undefined,
    isEstimated: Boolean(row.is_estimated),
    source: (row.source as EntrySource) ?? 'search',
    notes: row.notes != null ? String(row.notes) : undefined,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  }
}

export const NutritionEntryRepository = {
  async add(mealId: string, payload: AddEntryPayload): Promise<NutritionEntry> {
    const supabase = getServiceRoleClient()
    const { data: row, error } = await supabase
      .from('nutrition_entries')
      .insert({
        meal_id: mealId,
        item_type: 'food',
        food_id: payload.foodId,
        quantity_amount: payload.quantityAmount,
        quantity_unit_id: payload.quantityUnitId ?? null,
        grams_consumed: payload.gramsConsumed ?? null,
        calories_kcal: payload.caloriesKcal,
        protein_g: payload.proteinG,
        carbs_g: payload.carbsG,
        fat_g: payload.fatG,
        is_estimated: payload.isEstimated ?? false,
        source: payload.source ?? 'search',
        notes: payload.notes ?? null,
      })
      .select()
      .single()
    if (error) throw error
    return mapEntryRow(row as Record<string, unknown>)
  },

  async update(entryId: string, updates: UpdateEntryPayload): Promise<NutritionEntry> {
    const supabase = getServiceRoleClient()
    const dbUpdates: Record<string, unknown> = {}
    if (updates.quantityAmount !== undefined) dbUpdates.quantity_amount = updates.quantityAmount
    if (updates.quantityUnitId !== undefined) dbUpdates.quantity_unit_id = updates.quantityUnitId
    if (updates.gramsConsumed !== undefined) dbUpdates.grams_consumed = updates.gramsConsumed
    if (updates.caloriesKcal !== undefined) dbUpdates.calories_kcal = updates.caloriesKcal
    if (updates.proteinG !== undefined) dbUpdates.protein_g = updates.proteinG
    if (updates.carbsG !== undefined) dbUpdates.carbs_g = updates.carbsG
    if (updates.fatG !== undefined) dbUpdates.fat_g = updates.fatG
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes
    const { data: row, error } = await supabase
      .from('nutrition_entries')
      .update(dbUpdates)
      .eq('id', entryId)
      .select()
      .single()
    if (error) throw error
    return mapEntryRow(row as Record<string, unknown>)
  },

  async getByMeal(mealId: string): Promise<NutritionEntry[]> {
    const supabase = getServiceRoleClient()
    const { data: rows, error } = await supabase
      .from('nutrition_entries')
      .select('*')
      .eq('meal_id', mealId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (rows ?? []).map((r) => mapEntryRow(r as Record<string, unknown>))
  },

  async getById(entryId: string): Promise<NutritionEntry | null> {
    const supabase = getServiceRoleClient()
    const { data: row, error } = await supabase
      .from('nutrition_entries')
      .select('*')
      .eq('id', entryId)
      .single()
    if (error || !row) return null
    return mapEntryRow(row as Record<string, unknown>)
  },

  /** Get all entries for multiple meals (for computing day totals). */
  async getByMealIds(mealIds: string[]): Promise<NutritionEntry[]> {
    if (mealIds.length === 0) return []
    const supabase = getServiceRoleClient()
    const { data: rows, error } = await supabase
      .from('nutrition_entries')
      .select('*')
      .in('meal_id', mealIds)
    if (error) throw error
    return (rows ?? []).map((r) => mapEntryRow(r as Record<string, unknown>))
  },

  async delete(entryId: string): Promise<void> {
    const supabase = getServiceRoleClient()
    const { error } = await supabase.from('nutrition_entries').delete().eq('id', entryId)
    if (error) throw error
  },
}
