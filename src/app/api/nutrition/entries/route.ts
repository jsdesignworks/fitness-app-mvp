import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { NutritionLoggingService } from '@/lib/services/nutrition/logging.service'

/**
 * POST /api/nutrition/entries — body { mealId, foodId, quantityAmount, quantityUnitId? }; add entry; return 201 + entry.
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    )
  }
  const body = await request.json().catch(() => ({}))
  const { mealId, foodId, quantityAmount } = body
  if (!mealId || typeof mealId !== 'string') {
    return NextResponse.json(
      { error: 'Bad request', message: 'mealId is required' },
      { status: 400 }
    )
  }
  if (!foodId || typeof foodId !== 'string') {
    return NextResponse.json(
      { error: 'Bad request', message: 'foodId is required' },
      { status: 400 }
    )
  }
  const qty = quantityAmount != null ? Number(quantityAmount) : 1
  if (Number.isNaN(qty) || qty <= 0) {
    return NextResponse.json(
      { error: 'Bad request', message: 'quantityAmount must be a positive number' },
      { status: 400 }
    )
  }
  try {
    const entry = await NutritionLoggingService.addEntry(authResult.userId, mealId, {
      foodId,
      quantityAmount: qty,
      quantityUnitId: typeof body.quantityUnitId === 'string' ? body.quantityUnitId : undefined,
    })
    return NextResponse.json(entry, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to add entry'
    const status = message.includes('not found') || message.includes('denied') ? 404 : 500
    return NextResponse.json({ error: 'Server error', message }, { status })
  }
}
