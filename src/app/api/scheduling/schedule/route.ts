import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { SchedulingService } from '@/lib/services/scheduling/scheduling.service'

/**
 * GET /api/scheduling/schedule?start=YYYY-MM-DD&end=YYYY-MM-DD
 * POST /api/scheduling/schedule
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
  const startParam = searchParams.get('start')
  const endParam = searchParams.get('end')
  if (!startParam || !endParam) {
    return NextResponse.json(
      { error: 'Bad request', message: 'Query params start and end (YYYY-MM-DD) are required' },
      { status: 400 }
    )
  }
  const start = new Date(startParam + 'T00:00:00.000Z')
  const end = new Date(endParam + 'T23:59:59.999Z')
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return NextResponse.json(
      { error: 'Bad request', message: 'Invalid start or end date' },
      { status: 400 }
    )
  }
  try {
    const result = await SchedulingService.getSchedule(authResult.userId, start, end)
    return NextResponse.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to get schedule'
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
  const { workoutId, titleOverride, startAt, endAt, timezone, notes } = body
  if (!startAt || typeof startAt !== 'string') {
    return NextResponse.json(
      { error: 'Bad request', message: 'startAt (ISO string) is required' },
      { status: 400 }
    )
  }
  const start = new Date(startAt)
  if (Number.isNaN(start.getTime())) {
    return NextResponse.json(
      { error: 'Bad request', message: 'Invalid startAt' },
      { status: 400 }
    )
  }
  try {
    const scheduled = await SchedulingService.createScheduledWorkout(authResult.userId, {
      workoutId: workoutId ?? null,
      titleOverride: titleOverride ?? null,
      startAt: start,
      endAt: endAt != null ? new Date(endAt) : null,
      timezone: timezone ?? 'UTC',
      notes: notes ?? null,
    })
    return NextResponse.json(scheduled, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create scheduled workout'
    return NextResponse.json({ error: 'Server error', message }, { status: 500 })
  }
}
