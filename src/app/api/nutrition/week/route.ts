import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { NutritionDayRepository } from '@/lib/repositories/nutrition/nutrition-day.repository'

/**
 * GET /api/nutrition/week?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Returns dates in range that have at least one nutrition entry (for week view).
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
  const start = searchParams.get('start')
  const end = searchParams.get('end')
  if (!start || !end || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return NextResponse.json(
      { error: 'Bad request', message: 'Query params start and end (YYYY-MM-DD) are required' },
      { status: 400 }
    )
  }
  try {
    const datesWithEntries = await NutritionDayRepository.getDatesWithEntries(authResult.userId, start, end)
    return NextResponse.json({ datesWithEntries })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to get week summary'
    return NextResponse.json({ error: 'Server error', message }, { status: 500 })
  }
}
