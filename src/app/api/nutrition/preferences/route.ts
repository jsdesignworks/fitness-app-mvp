import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { NutritionDisplayPreferenceRepository } from '@/lib/repositories/nutrition/nutrition-display-preference.repository'
import { patchNutritionPreferencesSchema } from '@/lib/domain/nutrition.validation'

/**
 * GET /api/nutrition/preferences — display_type for macro viz (default bars).
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    )
  }
  try {
    const row = await NutritionDisplayPreferenceRepository.getByUserId(authResult.userId)
    return NextResponse.json({
      displayType: row?.displayType ?? 'bars',
      updatedAt: row?.updatedAt.toISOString() ?? null,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load preferences'
    return NextResponse.json({ error: 'Server error', message }, { status: 500 })
  }
}

/**
 * PATCH /api/nutrition/preferences — set display_type (rings | bars | cards).
 */
export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    )
  }
  const raw = await request.json().catch(() => ({}))
  const parsed = patchNutritionPreferencesSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation error', details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  try {
    const row = await NutritionDisplayPreferenceRepository.upsert(
      authResult.userId,
      parsed.data.displayType
    )
    return NextResponse.json({
      displayType: row.displayType,
      updatedAt: row.updatedAt.toISOString(),
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to save preferences'
    return NextResponse.json({ error: 'Server error', message }, { status: 500 })
  }
}
