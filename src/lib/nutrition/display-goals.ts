/**
 * UI-only nutrition targets for progress rings / bars (DPS-2).
 * Replace with user goals from API when available — do not use for business logic.
 */
export const DISPLAY_NUTRITION_GOALS = {
  calories: 2000,
  proteinG: 150,
  carbsG: 250,
  fatG: 65,
} as const

/** Percent toward goal, 0–100+ (caller may clamp for rings). */
export function displayMacroPercent(current: number, goal: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(goal) || goal <= 0) return 0
  return (current / goal) * 100
}
