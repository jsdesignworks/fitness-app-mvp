import type { NutritionDayWithMeals } from '@/lib/repositories/nutrition/nutrition-day.repository'
import type { Meal } from '@/lib/domain/nutrition.types'
import { FoodRepository } from '@/lib/repositories/nutrition/food.repository'
import { NutritionDayRepository } from '@/lib/repositories/nutrition/nutrition-day.repository'
import { MealRepository } from '@/lib/repositories/nutrition/meal.repository'
import { NutritionEntryRepository } from '@/lib/repositories/nutrition/nutrition-entry.repository'
import type { DailyNutritionSummary } from '@/lib/domain/nutrition.types'

export type AddEntryPayload = {
  foodId: string
  quantityAmount: number
  quantityUnitId?: string
}

export type UpdateEntryPayload = Partial<{
  quantityAmount: number
  quantityUnitId: string | null
  caloriesKcal: number
  proteinG: number
  carbsG: number
  fatG: number
  notes: string
}>

export const NutritionLoggingService = {
  async getOrCreateDay(userId: string, date: string): Promise<NutritionDayWithMeals> {
    return NutritionDayRepository.getOrCreate(userId, date)
  },

  async addMeal(userId: string, nutritionDayId: string, mealType: Meal['mealType']): Promise<Meal> {
    const day = await NutritionDayRepository.getById(nutritionDayId)
    if (!day || day.userId !== userId) throw new Error('Nutrition day not found or access denied')
    const meals = await MealRepository.getByNutritionDayId(nutritionDayId)
    const nextSortIndex = meals.length
    return MealRepository.add(nutritionDayId, mealType, nextSortIndex)
  },

  async addEntry(userId: string, mealId: string, payload: AddEntryPayload) {
    const meal = await MealRepository.getById(mealId)
    if (!meal) throw new Error('Meal not found')
    const day = await NutritionDayRepository.getById(meal.nutritionDayId)
    if (!day || day.userId !== userId) throw new Error('Meal not found or access denied')
    const food = await FoodRepository.getById(payload.foodId)
    if (!food) throw new Error('Food not found')
    const nutrients = await FoodRepository.getNutrients(payload.foodId)
    if (!nutrients) throw new Error('Food nutrients not found')
    const basis = nutrients.basisAmountG
    const qty = payload.quantityAmount
    const gramsConsumed = qty * basis
    const caloriesKcal = qty * nutrients.caloriesKcal
    const proteinG = qty * nutrients.proteinG
    const carbsG = qty * nutrients.carbsG
    const fatG = qty * nutrients.fatG
    return NutritionEntryRepository.add(mealId, {
      foodId: payload.foodId,
      quantityAmount: qty,
      quantityUnitId: payload.quantityUnitId,
      gramsConsumed,
      caloriesKcal,
      proteinG,
      carbsG,
      fatG,
      source: 'search',
    })
  },

  async updateEntry(userId: string, entryId: string, updates: UpdateEntryPayload) {
    const entry = await NutritionEntryRepository.getById(entryId)
    if (!entry) throw new Error('Entry not found')
    const meal = await MealRepository.getById(entry.mealId)
    if (!meal) throw new Error('Meal not found')
    const day = await NutritionDayRepository.getById(meal.nutritionDayId)
    if (!day || day.userId !== userId) throw new Error('Entry not found or access denied')
    const dbUpdates: Parameters<typeof NutritionEntryRepository.update>[1] = {}
    if (updates.quantityAmount !== undefined) dbUpdates.quantityAmount = updates.quantityAmount
    if (updates.quantityUnitId !== undefined) dbUpdates.quantityUnitId = updates.quantityUnitId
    if (updates.caloriesKcal !== undefined) dbUpdates.caloriesKcal = updates.caloriesKcal
    if (updates.proteinG !== undefined) dbUpdates.proteinG = updates.proteinG
    if (updates.carbsG !== undefined) dbUpdates.carbsG = updates.carbsG
    if (updates.fatG !== undefined) dbUpdates.fatG = updates.fatG
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes
    if (entry.foodId && updates.quantityAmount !== undefined) {
      const nutrients = await FoodRepository.getNutrients(entry.foodId)
      if (nutrients) {
        const qty = updates.quantityAmount
        dbUpdates.gramsConsumed = qty * nutrients.basisAmountG
        dbUpdates.caloriesKcal = qty * nutrients.caloriesKcal
        dbUpdates.proteinG = qty * nutrients.proteinG
        dbUpdates.carbsG = qty * nutrients.carbsG
        dbUpdates.fatG = qty * nutrients.fatG
      }
    }
    return NutritionEntryRepository.update(entryId, dbUpdates)
  },

  async deleteEntry(userId: string, entryId: string): Promise<void> {
    const entry = await NutritionEntryRepository.getById(entryId)
    if (!entry) throw new Error('Entry not found')
    const meal = await MealRepository.getById(entry.mealId)
    if (!meal) throw new Error('Meal not found')
    const day = await NutritionDayRepository.getById(meal.nutritionDayId)
    if (!day || day.userId !== userId) throw new Error('Entry not found or access denied')
    await NutritionEntryRepository.delete(entryId)
  },

  async computeDayTotals(
    nutritionDayId: string,
    date: string,
    targets?: {
      targetCaloriesKcal?: number
      targetProteinG?: number
      targetCarbsG?: number
      targetFatG?: number
    }
  ): Promise<DailyNutritionSummary> {
    const meals = await MealRepository.getByNutritionDayId(nutritionDayId)
    const mealIds = meals.map((m) => m.id)
    const entries = await NutritionEntryRepository.getByMealIds(mealIds)
    let totalCalories = 0
    let totalProtein = 0
    let totalCarbs = 0
    let totalFat = 0
    for (const e of entries) {
      totalCalories += e.caloriesKcal ?? 0
      totalProtein += e.proteinG ?? 0
      totalCarbs += e.carbsG ?? 0
      totalFat += e.fatG ?? 0
    }
    const summary: DailyNutritionSummary = {
      date,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
    }
    if (targets?.targetCaloriesKcal != null) summary.targetCalories = targets.targetCaloriesKcal
    if (targets?.targetProteinG != null) summary.targetProtein = targets.targetProteinG
    if (targets?.targetCarbsG != null) summary.targetCarbs = targets.targetCarbsG
    if (targets?.targetFatG != null) summary.targetFat = targets.targetFatG
    if (summary.targetCalories != null) summary.caloriesDelta = totalCalories - summary.targetCalories
    if (summary.targetProtein != null) summary.proteinDelta = totalProtein - summary.targetProtein
    if (summary.targetCarbs != null) summary.carbsDelta = totalCarbs - summary.targetCarbs
    if (summary.targetFat != null) summary.fatDelta = totalFat - summary.targetFat
    return summary
  },
}
