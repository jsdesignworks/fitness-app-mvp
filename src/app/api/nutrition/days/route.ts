import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { NutritionLoggingService } from '@/lib/services/nutrition/logging.service'

/**
 * GET /api/nutrition/days?date=YYYY-MM-DD — get or create day for date; returns day with meals, entries, and summary.
 * POST /api/nutrition/days — body { date }; create day if not exists; return day.
 *
 * Per-meal macro subtotals are not duplicated here: the client sums entry macros per meal (same numbers as
 * `summary` for the whole day). That client-side aggregation is the canonical representation unless a
 * future API adds an explicit `mealSubtotals` field.
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    )
  }
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: 'Bad request', message: 'Query param date (YYYY-MM-DD) is required' },
      { status: 400 }
    )
  }
  try {
    const day = await NutritionLoggingService.getOrCreateDay(authResult.userId, date)
    const summary = await NutritionLoggingService.computeDayTotals(day.id, day.date, {
      targetCaloriesKcal: day.targetCaloriesKcal,
      targetProteinG: day.targetProteinG,
      targetCarbsG: day.targetCarbsG,
      targetFatG: day.targetFatG,
    })
    return NextResponse.json({ nutritionDay: day, summary })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to get nutrition day'
    return NextResponse.json({ error: 'Server error', message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    )
  }
  const body = await request.json().catch(() => ({}))
  const date = body.date
  if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: 'Bad request', message: 'Body date (YYYY-MM-DD) is required' },
      { status: 400 }
    )
  }
  try {
    const day = await NutritionLoggingService.getOrCreateDay(authResult.userId, date)
    const summary = await NutritionLoggingService.computeDayTotals(day.id, day.date, {
      targetCaloriesKcal: day.targetCaloriesKcal,
      targetProteinG: day.targetProteinG,
      targetCarbsG: day.targetCarbsG,
      targetFatG: day.targetFatG,
    })
    return NextResponse.json({ nutritionDay: day, summary }, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create nutrition day'
    return NextResponse.json({ error: 'Server error', message }, { status: 500 })
  }
}
