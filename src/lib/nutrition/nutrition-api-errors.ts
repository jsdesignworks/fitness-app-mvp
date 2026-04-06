/**
 * Classifies API error messages from the Nutrition routes when the Supabase schema
 * is not migrated or tables are missing. Used by the Nutrition page to show a
 * neutral "module preparing" state instead of a destructive error for expected gaps.
 *
 * Not for hiding real application bugs — only common Postgres / PostgREST signatures.
 */
export function isLikelyNutritionInfrastructureError(message: string | undefined | null): boolean {
  if (!message || typeof message !== 'string') return false
  const m = message.toLowerCase()

  if (m.includes('42p01')) return true
  if (m.includes('undefined_table')) return true
  if (m.includes('could not find the table')) return true
  if (m.includes('relation') && m.includes('does not exist')) return true

  // Supabase / PostgREST hints
  if (m.includes('schema cache')) return true
  if (m.includes('pgrst') && m.includes('relation')) return true

  // Tables introduced or required by Nutrition wiring
  const tableHints = [
    'nutrition_days',
    'meals',
    'nutrition_entries',
    'foods',
    'food_nutrients',
    'user_macro_targets',
    'nutrition_display_preferences',
  ]
  for (const t of tableHints) {
    if (m.includes(t) && (m.includes('does not exist') || m.includes('not found'))) return true
  }

  return false
}
