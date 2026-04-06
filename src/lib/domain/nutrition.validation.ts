import { z } from 'zod'

const optionalPositiveInt = z.coerce.number().int().positive().nullable().optional()
const optionalPositiveNumber = z.coerce.number().positive().nullable().optional()

/** PATCH /api/nutrition/macro-targets */
export const patchMacroTargetsSchema = z.object({
  caloriesKcal: optionalPositiveInt,
  proteinG: optionalPositiveNumber,
  carbsG: optionalPositiveNumber,
  fatG: optionalPositiveNumber,
})

export type PatchMacroTargetsInput = z.infer<typeof patchMacroTargetsSchema>

const displayTypeSchema = z.enum(['rings', 'bars', 'cards'])

/** PATCH /api/nutrition/preferences */
export const patchNutritionPreferencesSchema = z.object({
  displayType: displayTypeSchema,
})

export type PatchNutritionPreferencesInput = z.infer<typeof patchNutritionPreferencesSchema>

/** Quantity in add/edit modal (per basis amount multiplier) */
export const nutritionQuantitySchema = z.coerce
  .number()
  .positive('Enter a quantity greater than zero')
  .max(9999, 'Quantity is too large')
