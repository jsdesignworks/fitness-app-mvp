import { getServiceRoleClient } from '@/lib/utils/db'
import type { Food, FoodNutrients } from '@/lib/domain/nutrition.types'

function mapFoodRow(row: Record<string, unknown>): Food {
  return {
    id: String(row.id),
    name: String(row.name),
    foodType: (row.food_type as Food['foodType']) ?? 'generic',
    brandName: row.brand_name != null ? String(row.brand_name) : undefined,
    barcode: row.barcode != null ? String(row.barcode) : undefined,
    externalSource: row.external_source != null ? String(row.external_source) : undefined,
    isVerified: Boolean(row.is_verified),
    defaultServingAmount: row.default_serving_amount != null ? Number(row.default_serving_amount) : undefined,
    defaultServingUnitId: row.default_serving_unit_id != null ? String(row.default_serving_unit_id) : undefined,
    densityGPerMl: row.density_g_per_ml != null ? Number(row.density_g_per_ml) : undefined,
    createdByUserId: row.created_by_user_id != null ? String(row.created_by_user_id) : undefined,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  }
}

function mapNutrientsRow(row: Record<string, unknown>): FoodNutrients {
  return {
    foodId: String(row.food_id),
    basisAmountG: Number(row.basis_amount_g ?? 100),
    caloriesKcal: Number(row.calories_kcal ?? 0),
    proteinG: Number(row.protein_g ?? 0),
    carbsG: Number(row.carbs_g ?? 0),
    fatG: Number(row.fat_g ?? 0),
    fiberG: row.fiber_g != null ? Number(row.fiber_g) : undefined,
    sugarG: row.sugar_g != null ? Number(row.sugar_g) : undefined,
    sodiumMg: row.sodium_mg != null ? Number(row.sodium_mg) : undefined,
  }
}

export type FoodListOpts = {
  limit?: number
  offset?: number
}

export const FoodRepository = {
  async list(opts: FoodListOpts = {}): Promise<Food[]> {
    const supabase = getServiceRoleClient()
    let query = supabase.from('foods').select('*').order('name', { ascending: true })
    if (opts.limit != null) query = query.limit(opts.limit)
    if (opts.offset != null) query = query.range(opts.offset, opts.offset + (opts.limit ?? 10) - 1)
    const { data: rows, error } = await query
    if (error) throw error
    return (rows ?? []).map((r) => mapFoodRow(r as Record<string, unknown>))
  },

  async search(query: string): Promise<Food[]> {
    const supabase = getServiceRoleClient()
    const { data: rows, error } = await supabase
      .from('foods')
      .select('*')
      .ilike('name', `%${query.replace(/%/g, '\\%')}%`)
      .order('name', { ascending: true })
      .limit(50)
    if (error) throw error
    return (rows ?? []).map((r) => mapFoodRow(r as Record<string, unknown>))
  },

  async getById(id: string): Promise<Food | null> {
    const supabase = getServiceRoleClient()
    const { data: row, error } = await supabase.from('foods').select('*').eq('id', id).single()
    if (error || !row) return null
    return mapFoodRow(row as Record<string, unknown>)
  },

  async getNutrients(foodId: string): Promise<FoodNutrients | null> {
    const supabase = getServiceRoleClient()
    const { data: row, error } = await supabase
      .from('food_nutrients')
      .select('*')
      .eq('food_id', foodId)
      .single()
    if (error || !row) return null
    return mapNutrientsRow(row as Record<string, unknown>)
  },
}
