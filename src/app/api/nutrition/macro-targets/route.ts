import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { UserMacroTargetRepository } from '@/lib/repositories/nutrition/user-macro-target.repository'
import { patchMacroTargetsSchema } from '@/lib/domain/nutrition.validation'

/**
 * GET /api/nutrition/macro-targets — current user's saved defaults (or null fields if unset).
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
    const row = await UserMacroTargetRepository.getByUserId(authResult.userId)
    if (!row) {
      return NextResponse.json({
        caloriesKcal: null,
        proteinG: null,
        carbsG: null,
        fatG: null,
      })
    }
    return NextResponse.json({
      caloriesKcal: row.caloriesKcal,
      proteinG: row.proteinG,
      carbsG: row.carbsG,
      fatG: row.fatG,
      updatedAt: row.updatedAt.toISOString(),
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load macro targets'
    return NextResponse.json({ error: 'Server error', message }, { status: 500 })
  }
}

/**
 * PATCH /api/nutrition/macro-targets — upsert user defaults (partial allowed).
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
  const parsed = patchMacroTargetsSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation error', details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const body = parsed.data
  if (Object.keys(body).length === 0) {
    return NextResponse.json(
      { error: 'Bad request', message: 'No valid fields to update' },
      { status: 400 }
    )
  }
  try {
    const existing = await UserMacroTargetRepository.getByUserId(authResult.userId)
    const row = await UserMacroTargetRepository.upsert(authResult.userId, {
      caloriesKcal: body.caloriesKcal !== undefined ? body.caloriesKcal : existing?.caloriesKcal ?? null,
      proteinG: body.proteinG !== undefined ? body.proteinG : existing?.proteinG ?? null,
      carbsG: body.carbsG !== undefined ? body.carbsG : existing?.carbsG ?? null,
      fatG: body.fatG !== undefined ? body.fatG : existing?.fatG ?? null,
    })
    return NextResponse.json({
      caloriesKcal: row.caloriesKcal,
      proteinG: row.proteinG,
      carbsG: row.carbsG,
      fatG: row.fatG,
      updatedAt: row.updatedAt.toISOString(),
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to save macro targets'
    return NextResponse.json({ error: 'Server error', message }, { status: 500 })
  }
}
