import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { HabitService } from '@/lib/services/habits/habit.service'

/**
 * GET /api/habits/logs?start=YYYY-MM-DD&end=YYYY-MM-DD — List logs in range.
 * POST /api/habits/logs — Log or resist a habit (body: habitId, loggedAt, kind).
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
    const logs = await HabitService.listLogs(authResult.userId, start, end)
    return NextResponse.json(
      logs.map((l) => ({
        id: l.id,
        habitId: l.habitId,
        loggedAt: l.loggedAt,
        kind: l.kind,
        createdAt: l.createdAt.toISOString(),
      }))
    )
  } catch (e) {
    const raw = e instanceof Error ? e.message : 'Failed to list habit logs'
    const migrationRelated = isLikelyMissingDb(raw)
    const message = migrationRelated
      ? `${raw} Apply migrations if needed (see docs/MIGRATIONS_REQUIRED.md): supabase db push or supabase migration up.`
      : raw
    return NextResponse.json({ error: 'Server error', message }, { status: migrationRelated ? 503 : 500 })
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
  const habitId = typeof body.habitId === 'string' ? body.habitId : ''
  const loggedAt =
    typeof body.loggedAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.loggedAt)
      ? body.loggedAt
      : new Date().toISOString().slice(0, 10)
  const kind = body.kind === 'resisted' ? 'resisted' : 'logged'
  if (!habitId) {
    return NextResponse.json(
      { error: 'Bad request', message: 'habitId is required' },
      { status: 400 }
    )
  }
  try {
    const log = await HabitService.logHabit(authResult.userId, { habitId, loggedAt, kind })
    return NextResponse.json(
      {
        id: log.id,
        habitId: log.habitId,
        loggedAt: log.loggedAt,
        kind: log.kind,
        createdAt: log.createdAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (e) {
    if (e instanceof Error && e.message === 'Habit not found') {
      return NextResponse.json({ error: 'Not found', message: 'Habit not found' }, { status: 404 })
    }
    const raw = e instanceof Error ? e.message : 'Failed to log habit'
    const migrationRelated = isLikelyMissingDb(raw)
    const message = migrationRelated
      ? `${raw} Apply migrations if needed (see docs/MIGRATIONS_REQUIRED.md): supabase db push or supabase migration up.`
      : raw
    return NextResponse.json({ error: 'Server error', message }, { status: migrationRelated ? 503 : 500 })
  }
}

function isLikelyMissingDb(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes('does not exist') ||
    lower.includes('42703') ||
    (lower.includes('column') && lower.includes('does not exist')) ||
    lower.includes('relation') ||
    (lower.includes('table') && lower.includes('does not exist'))
  )
}
