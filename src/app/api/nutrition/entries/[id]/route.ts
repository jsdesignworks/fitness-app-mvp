import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { NutritionLoggingService } from '@/lib/services/nutrition/logging.service'

/**
 * PATCH /api/nutrition/entries/[id] — body { quantityAmount?, quantityUnitId?, caloriesKcal?, proteinG?, carbsG?, fatG?, notes? }; update entry.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    )
  }
  const { id } = await params
  if (!id) {
    return NextResponse.json(
      { error: 'Bad request', message: 'Entry id is required' },
      { status: 400 }
    )
  }
  const body = await request.json().catch(() => ({}))
  const updates: Parameters<typeof NutritionLoggingService.updateEntry>[2] = {}
  if (body.quantityAmount !== undefined) updates.quantityAmount = Number(body.quantityAmount)
  if (body.quantityUnitId !== undefined) updates.quantityUnitId = body.quantityUnitId ?? null
  if (body.caloriesKcal !== undefined) updates.caloriesKcal = Number(body.caloriesKcal)
  if (body.proteinG !== undefined) updates.proteinG = Number(body.proteinG)
  if (body.carbsG !== undefined) updates.carbsG = Number(body.carbsG)
  if (body.fatG !== undefined) updates.fatG = Number(body.fatG)
  if (body.notes !== undefined) updates.notes = String(body.notes)
  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: 'Bad request', message: 'No valid fields to update' },
      { status: 400 }
    )
  }
  try {
    const entry = await NutritionLoggingService.updateEntry(authResult.userId, id, updates)
    return NextResponse.json(entry)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to update entry'
    const status = message.includes('not found') || message.includes('denied') ? 404 : 500
    return NextResponse.json({ error: 'Server error', message }, { status })
  }
}

/**
 * DELETE /api/nutrition/entries/[id] — remove entry (ownership enforced).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    )
  }
  const { id } = await params
  if (!id) {
    return NextResponse.json(
      { error: 'Bad request', message: 'Entry id is required' },
      { status: 400 }
    )
  }
  try {
    await NutritionLoggingService.deleteEntry(authResult.userId, id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to delete entry'
    const status = message.includes('not found') || message.includes('denied') ? 404 : 500
    return NextResponse.json({ error: 'Server error', message }, { status })
  }
}
