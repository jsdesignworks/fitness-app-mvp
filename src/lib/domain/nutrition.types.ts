/**
 * Nutrition Domain Types
 * 
 * Represents the complete nutrition tracking system:
 * - Food dictionary (foods, recipes, units)
 * - Meal templates (reusable meal structures)
 * - Daily nutrition logs (consumed entries)
 */

// ============================================================================
// CORE ENUMS
// ============================================================================

export type FoodType = 
  | 'generic'      // Generic foods (e.g., "Chicken breast")
  | 'branded'      // Branded products (e.g., "Cheerios")
  | 'restaurant'   // Restaurant items
  | 'custom'       // User-created

export type UnitType = 
  | 'mass'         // g, kg, oz, lb
  | 'volume'       // ml, l, cup, tbsp
  | 'count'        // pieces, servings
  | 'serving'      // label servings

export type MealType = 
  | 'breakfast' 
  | 'lunch' 
  | 'dinner' 
  | 'snack'
  | 'pre_workout'
  | 'post_workout'
  | 'custom'

export type EntrySource = 
  | 'search'       // User searched and selected
  | 'barcode'      // Scanned barcode
  | 'quick_add'    // Manual macro entry
  | 'template'     // From meal template
  | 'copy'         // Copied from another day

// ============================================================================
// UNITS SYSTEM
// ============================================================================

export interface Unit {
  id: string
  name: string // 'gram', 'ounce', 'cup', 'serving'
  abbreviation: string // 'g', 'oz', 'c'
  unitType: UnitType
  gramsPerUnit?: number // for mass units and some count units
  mlPerUnit?: number // for volume units
  isSystem: boolean // true for built-in units
}

// ============================================================================
// FOOD DICTIONARY
// ============================================================================

export interface Food {
  id: string
  name: string
  foodType: FoodType
  brandName?: string
  barcode?: string
  externalSource?: string // 'usda', 'manual', etc.
  isVerified: boolean
  defaultServingAmount?: number
  defaultServingUnitId?: string
  densityGPerMl?: number // for volume to weight conversions
  createdByUserId?: string
  createdAt: Date
  updatedAt: Date
}

export interface FoodNutrients {
  foodId: string
  basisAmountG: number // typically 100g
  caloriesKcal: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG?: number
  sugarG?: number
  sodiumMg?: number
  // Optional micronutrients can be added
  calciumMg?: number
  ironMg?: number
  vitaminDMcg?: number
}

export interface FoodPortionOption {
  id: string
  foodId: string
  label: string // '1 serving', '1 cup', '1 slice'
  amount: number
  unitId: string
  gramsEquivalent?: number
  source: 'label' | 'user' | 'usda'
}

// ============================================================================
// RECIPE SYSTEM
// ============================================================================

export interface Recipe {
  id: string
  userId?: string // nullable if public recipes exist
  name: string
  notes?: string
  yieldAmount: number // e.g., 4
  yieldUnitId?: string // e.g., 'servings'
  totalYieldGrams?: number
  ingredients: RecipeIngredient[]
  portionOptions?: RecipePortionOption[]
  createdAt: Date
  updatedAt: Date
}

export interface RecipeIngredient {
  id: string
  recipeId: string
  foodId: string
  amount: number
  unitId: string
  gramsEquivalent?: number
  sortIndex: number
}

export interface RecipePortionOption {
  id: string
  recipeId: string
  label: string // '1 slice', '1 bowl'
  amount: number
  unitId: string
  gramsEquivalent?: number
}

// Computed at runtime, not stored
export interface RecipeTotals {
  caloriesKcal: number
  proteinG: number
  carbsG: number
  fatG: number
  perServing: {
    caloriesKcal: number
    proteinG: number
    carbsG: number
    fatG: number
  }
}

// ============================================================================
// MEAL TEMPLATES (REUSABLE)
// ============================================================================

export interface MealTemplate {
  id: string
  userId: string
  name: string
  notes?: string
  items: MealTemplateItem[]
  createdAt: Date
  updatedAt: Date
}

export interface MealTemplateItem {
  id: string
  mealTemplateId: string
  itemType: 'food' | 'recipe'
  foodId?: string
  recipeId?: string
  quantityAmount: number
  quantityUnitId: string
  sortIndex: number
}

// ============================================================================
// DAILY NUTRITION LOG
// ============================================================================

export interface NutritionDay {
  id: string
  userId: string
  date: string // YYYY-MM-DD (local date)
  timezone: string
  notes?: string
  
  // Daily targets (snapshot at time of logging)
  targetCaloriesKcal?: number
  targetProteinG?: number
  targetCarbsG?: number
  targetFatG?: number
  
  meals: Meal[]
  createdAt: Date
  updatedAt: Date
}

export interface Meal {
  id: string
  nutritionDayId: string
  mealType: MealType
  title?: string
  eatenAt?: Date
  sortIndex: number
  entries: NutritionEntry[]
}

export interface NutritionEntry {
  id: string
  mealId: string
  itemType: 'food' | 'recipe' | 'quick_add'
  
  // References
  foodId?: string
  recipeId?: string
  
  // Quantity
  quantityAmount: number
  quantityUnitId?: string
  gramsConsumed?: number
  
  // Macros (computed or manually entered for quick_add)
  caloriesKcal?: number
  proteinG?: number
  carbsG?: number
  fatG?: number
  
  isEstimated: boolean
  source: EntrySource
  notes?: string
  
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// COMPUTED METRICS (NOT STORED, DERIVED)
// ============================================================================

export interface DailyNutritionSummary {
  date: string
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  totalFiber?: number
  
  targetCalories?: number
  targetProtein?: number
  targetCarbs?: number
  targetFat?: number
  
  caloriesDelta?: number // actual - target
  proteinDelta?: number
  carbsDelta?: number
  fatDelta?: number
  
  adherencePercentage?: number
}

export interface WeeklyNutritionSummary {
  startDate: string
  endDate: string
  averageDailyCalories: number
  averageDailyProtein: number
  averageDailyCarbs: number
  averageDailyFat: number
  daysLogged: number
  adherenceDays: number // days within target range
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface LogNutritionEntryRequest {
  mealId: string
  itemType: 'food' | 'recipe' | 'quick_add'
  foodId?: string
  recipeId?: string
  quantityAmount: number
  quantityUnitId?: string
  
  // For quick_add only
  caloriesKcal?: number
  proteinG?: number
  carbsG?: number
  fatG?: number
  
  notes?: string
}

export interface CreateMealRequest {
  nutritionDayId: string
  mealType: MealType
  title?: string
  eatenAt?: Date
}

export interface SearchFoodRequest {
  query: string
  foodType?: FoodType[]
  limit?: number
}

export interface SearchFoodResponse {
  foods: Food[]
  recipes: Recipe[]
}

export interface GetNutritionDayRequest {
  userId: string
  date: string // YYYY-MM-DD
}

export interface GetNutritionDayResponse {
  nutritionDay: NutritionDay
  summary: DailyNutritionSummary
}
