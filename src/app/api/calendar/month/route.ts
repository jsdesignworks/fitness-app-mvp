import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { getCalendarMonth } from '@/lib/services/calendar/calendar-month.service'

/**
 * GET /api/calendar/month?year=YYYY&month=MM
 * `month` is 1–12. Returns per-day workout counts, nutrition flags, and calorie totals for aggregation on the calendar.
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
  const yearStr = searchParams.get('year')
  const monthStr = searchParams.get('month')
  const year = yearStr != null ? Number.parseInt(yearStr, 10) : NaN
  const month = monthStr != null ? Number.parseInt(monthStr, 10) : NaN

  if (!Number.isFinite(year) || year < 1970 || year > 2100) {
    return NextResponse.json(
      { error: 'Bad request', message: 'Query param year (integer) is required' },
      { status: 400 }
    )
  }
  if (!Number.isFinite(month) || month < 1 || month > 12) {
    return NextResponse.json(
      { error: 'Bad request', message: 'Query param month (1–12) is required' },
      { status: 400 }
    )
  }

  try {
    const payload = await getCalendarMonth(authResult.userId, year, month)
    return NextResponse.json(payload)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load calendar month'
    return NextResponse.json({ error: 'Server error', message }, { status: 500 })
  }
}
