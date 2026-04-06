import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { HabitService } from '@/lib/services/habits/habit.service'

/**
 * GET /api/habits/[id] — Get one habit (optional, for consistency).
 * PATCH /api/habits/[id] — Update habit.
 * DELETE /api/habits/[id] — Delete habit.
 */
export async function GET(
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
  try {
    const habits = await HabitService.listHabits(authResult.userId)
    const habit = habits.find((h) => h.id === id)
    if (!habit) {
      return NextResponse.json({ error: 'Not found', message: 'Habit not found' }, { status: 404 })
    }
    return NextResponse.json({
      id: habit.id,
      name: habit.name,
      type: habit.type,
      createdAt: habit.createdAt.toISOString(),
      updatedAt: habit.updatedAt.toISOString(),
    })
  } catch (e) {
    const raw = e instanceof Error ? e.message : 'Failed to get habit'
    const migrationRelated = isLikelyMissingDb(raw)
    const message = migrationRelated
      ? `${raw} Apply migrations if needed (see docs/MIGRATIONS_REQUIRED.md): supabase db push or supabase migration up.`
      : raw
    return NextResponse.json({ error: 'Server error', message }, { status: migrationRelated ? 503 : 500 })
  }
}

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
  const body = await request.json().catch(() => ({}))
  const updates: { name?: string; type?: 'good' | 'bad' } = {}
  if (typeof body.name === 'string') updates.name = body.name.trim()
  if (body.type === 'good' || body.type === 'bad') updates.type = body.type
  try {
    const habit = await HabitService.updateHabit(authResult.userId, id, updates)
    return NextResponse.json({
      id: habit.id,
      name: habit.name,
      type: habit.type,
      createdAt: habit.createdAt.toISOString(),
      updatedAt: habit.updatedAt.toISOString(),
    })
  } catch (e) {
    if (e instanceof Error && e.message === 'Habit not found') {
      return NextResponse.json({ error: 'Not found', message: 'Habit not found' }, { status: 404 })
    }
    const raw = e instanceof Error ? e.message : 'Failed to update habit'
    const migrationRelated = isLikelyMissingDb(raw)
    const message = migrationRelated
      ? `${raw} Apply migrations if needed (see docs/MIGRATIONS_REQUIRED.md): supabase db push or supabase migration up.`
      : raw
    return NextResponse.json({ error: 'Server error', message }, { status: migrationRelated ? 503 : 500 })
  }
}

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
  try {
    await HabitService.deleteHabit(authResult.userId, id)
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    if (e instanceof Error && e.message === 'Habit not found') {
      return NextResponse.json({ error: 'Not found', message: 'Habit not found' }, { status: 404 })
    }
    const raw = e instanceof Error ? e.message : 'Failed to delete habit'
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
