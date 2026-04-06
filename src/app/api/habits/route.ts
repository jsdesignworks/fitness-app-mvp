import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { HabitService } from '@/lib/services/habits/habit.service'

/**
 * GET /api/habits — List current user's habits.
 * POST /api/habits — Create a habit.
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
    const habits = await HabitService.listHabits(authResult.userId)
    return NextResponse.json(
      habits.map((h) => ({
        id: h.id,
        name: h.name,
        type: h.type,
        createdAt: h.createdAt.toISOString(),
        updatedAt: h.updatedAt.toISOString(),
      }))
    )
  } catch (e) {
    const raw = e instanceof Error ? e.message : 'Failed to list habits'
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
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const type = body.type === 'good' || body.type === 'bad' ? body.type : 'good'
  if (!name) {
    return NextResponse.json(
      { error: 'Bad request', message: 'name is required' },
      { status: 400 }
    )
  }
  try {
    const habit = await HabitService.createHabit(authResult.userId, { name, type })
    return NextResponse.json(
      {
        id: habit.id,
        name: habit.name,
        type: habit.type,
        createdAt: habit.createdAt.toISOString(),
        updatedAt: habit.updatedAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (e) {
    const raw = e instanceof Error ? e.message : 'Failed to create habit'
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
    lower.includes('table') && lower.includes('does not exist')
  )
}
