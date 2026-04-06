import { getServiceRoleClient } from '@/lib/utils/db'
import type { NutritionDay, NutritionEntry, Meal, MealType } from '@/lib/domain/nutrition.types'
import { UserMacroTargetRepository } from '@/lib/repositories/nutrition/user-macro-target.repository'

export type NutritionEntryWithFoodName = NutritionEntry & { foodName?: string; foodBrand?: string }

export type MealWithEntries = Omit<Meal, 'entries'> & { entries: NutritionEntryWithFoodName[] }

export type NutritionDayWithMeals = Omit<NutritionDay, 'meals'> & { meals: MealWithEntries[] }

const DEFAULT_MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

function mapDayRow(row: Record<string, unknown>): Omit<NutritionDay, 'meals'> {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    date: String(row.date).slice(0, 10),
    timezone: String(row.timezone ?? 'UTC'),
    notes: row.notes != null ? String(row.notes) : undefined,
    targetCaloriesKcal: row.target_calories_kcal != null ? Number(row.target_calories_kcal) : undefined,
    targetProteinG: row.target_protein_g != null ? Number(row.target_protein_g) : undefined,
    targetCarbsG: row.target_carbs_g != null ? Number(row.target_carbs_g) : undefined,
    targetFatG: row.target_fat_g != null ? Number(row.target_fat_g) : undefined,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  }
}

function mapEntryRow(row: Record<string, unknown>): NutritionEntryWithFoodName {
  const food = row.foods as Record<string, unknown> | null | undefined
  const entry: NutritionEntryWithFoodName = {
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
    source: (row.source as NutritionEntry['source']) ?? 'search',
    notes: row.notes != null ? String(row.notes) : undefined,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  }
  if (food && typeof food.name === 'string') entry.foodName = food.name
  if (food && food.brand_name != null && String(food.brand_name).trim() !== '') {
    entry.foodBrand = String(food.brand_name)
  }
  return entry
}

function mapMealRow(row: Record<string, unknown>, entries: NutritionEntryWithFoodName[]): MealWithEntries {
  return {
    id: String(row.id),
    nutritionDayId: String(row.nutrition_day_id),
    mealType: (row.meal_type as MealType) ?? 'snack',
    title: row.title != null ? String(row.title) : undefined,
    eatenAt: row.eaten_at != null ? new Date(String(row.eaten_at)) : undefined,
    sortIndex: Number(row.sort_index ?? 0),
    entries,
  }
}

export const NutritionDayRepository = {
  async getById(id: string): Promise<{ id: string; userId: string; date: string } | null> {
    const supabase = getServiceRoleClient()
    const { data: row, error } = await supabase
      .from('nutrition_days')
      .select('id, user_id, date')
      .eq('id', id)
      .single()
    if (error || !row) return null
    return {
      id: String(row.id),
      userId: String(row.user_id),
      date: String(row.date).slice(0, 10),
    }
  },

  async getByUserAndDate(userId: string, date: string): Promise<NutritionDayWithMeals | null> {
    const supabase = getServiceRoleClient()
    const { data: dayRow, error: dayError } = await supabase
      .from('nutrition_days')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single()
    if (dayError || !dayRow) return null
    const day = mapDayRow(dayRow as Record<string, unknown>)
    const { data: mealRows, error: mealsError } = await supabase
      .from('meals')
      .select('*')
      .eq('nutrition_day_id', day.id)
      .order('sort_index', { ascending: true })
    if (mealsError) return { ...day, meals: [] }
    const meals: MealWithEntries[] = []
    for (const m of mealRows ?? []) {
      const mealRow = m as Record<string, unknown>
      const mealId = String(mealRow.id)
      const { data: entryRows, error: entriesError } = await supabase
        .from('nutrition_entries')
        .select('*, foods(name, brand_name)')
        .eq('meal_id', mealId)
      const entries: NutritionEntryWithFoodName[] = entriesError
        ? []
        : (entryRows ?? []).map((r) => mapEntryRow(r as Record<string, unknown>))
      meals.push(mapMealRow(mealRow, entries))
    }
    return { ...day, meals }
  },

  async create(userId: string, date: string, timezone = 'UTC'): Promise<NutritionDayWithMeals> {
    const supabase = getServiceRoleClient()
    const userTargets = await UserMacroTargetRepository.getByUserId(userId)
    const insertPayload: Record<string, unknown> = { user_id: userId, date, timezone }
    if (userTargets) {
      if (userTargets.caloriesKcal != null) insertPayload.target_calories_kcal = userTargets.caloriesKcal
      if (userTargets.proteinG != null) insertPayload.target_protein_g = userTargets.proteinG
      if (userTargets.carbsG != null) insertPayload.target_carbs_g = userTargets.carbsG
      if (userTargets.fatG != null) insertPayload.target_fat_g = userTargets.fatG
    }
    const { data: dayRow, error: dayError } = await supabase
      .from('nutrition_days')
      .insert(insertPayload)
      .select()
      .single()
    if (dayError) throw dayError
    const day = mapDayRow(dayRow as Record<string, unknown>)
    const meals: MealWithEntries[] = []
    for (let i = 0; i < DEFAULT_MEAL_TYPES.length; i++) {
      const { data: mealRow, error: mealError } = await supabase
        .from('meals')
        .insert({
          nutrition_day_id: day.id,
          meal_type: DEFAULT_MEAL_TYPES[i],
          sort_index: i,
        })
        .select()
        .single()
      if (mealError) throw mealError
      meals.push(mapMealRow(mealRow as Record<string, unknown>, []))
    }
    return { ...day, meals }
  },

  async getOrCreate(userId: string, date: string): Promise<NutritionDayWithMeals> {
    const existing = await this.getByUserAndDate(userId, date)
    if (existing) return existing
    return this.create(userId, date)
  },

  /** Returns dates (YYYY-MM-DD) in range that have at least one nutrition entry. */
  async getDatesWithEntries(userId: string, startDate: string, endDate: string): Promise<string[]> {
    const supabase = getServiceRoleClient()
    const { data: dayRows, error: dayError } = await supabase
      .from('nutrition_days')
      .select('id, date')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
    if (dayError || !dayRows?.length) return []
    const dayIds = (dayRows as { id: string }[]).map((r) => r.id)
    const { data: mealRows } = await supabase
      .from('meals')
      .select('id, nutrition_day_id')
      .in('nutrition_day_id', dayIds)
    if (!mealRows?.length) return []
    const mealIds = (mealRows as { id: string }[]).map((r) => r.id)
    const { data: entryRows } = await supabase
      .from('nutrition_entries')
      .select('meal_id')
      .in('meal_id', mealIds)
      .limit(1)
    const mealIdsWithEntries = new Set((entryRows as { meal_id: string }[]).map((r) => r.meal_id))
    const dayIdsWithEntries = new Set(
      (mealRows as { id: string; nutrition_day_id: string }[])
        .filter((m) => mealIdsWithEntries.has(m.id))
        .map((m) => m.nutrition_day_id)
    )
    const dateMap = new Map((dayRows as { id: string; date: string }[]).map((r) => [r.id, r.date.slice(0, 10)]))
    return Array.from(dayIdsWithEntries)
      .map((id) => dateMap.get(id))
      .filter(Boolean) as string[]
  },

  /** Sum logged calories per calendar day (YYYY-MM-DD) for the user in range. */
  async sumCaloriesByDateInRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<Map<string, number>> {
    const supabase = getServiceRoleClient()
    const { data, error } = await supabase
      .from('nutrition_days')
      .select(
        `
        date,
        meals (
          nutrition_entries (
            calories_kcal
          )
        )
      `
      )
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)

    const out = new Map<string, number>()
    if (error || !data?.length) return out

    type Row = {
      date: string
      meals?: {
        nutrition_entries?: { calories_kcal?: number | string | null }[] | null
      }[] | null
    }
    for (const row of data as Row[]) {
      const date = String(row.date).slice(0, 10)
      let sum = 0
      for (const meal of row.meals ?? []) {
        for (const e of meal.nutrition_entries ?? []) {
          sum += Number(e.calories_kcal ?? 0)
        }
      }
      out.set(date, sum)
    }
    return out
  },
}
