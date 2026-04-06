import { NextRequest, NextResponse } from 'next/server'
import { WorkoutSessionService } from '@/lib/services/workout/session.service'
import { SessionRepository } from '@/lib/repositories/workout/session.repository'
import { WorkoutRepository } from '@/lib/repositories/workout/workout.repository'
import { StatsService } from '@/lib/services/workout/stats.service'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { AppError } from '@/lib/utils/errors'
import type { WorkoutSession } from '@/lib/domain/workout.types'

/**
 * GET /api/workouts/sessions - List user sessions
 * POST /api/workouts/sessions - Start a new session
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    )
  }
  const list = await SessionRepository.listByUser(authResult.userId)
  const workoutIds = [...new Set(list.map((s) => s.workoutId).filter(Boolean) as string[])]
  const workoutNames = await WorkoutRepository.getNamesByIds(workoutIds)

  const enriched = await Promise.all(
    list.map(async (session: WorkoutSession) => {
      const stats = await StatsService.calculateSessionStats(session)
      const workoutName = session.workoutId ? workoutNames[session.workoutId] : undefined
      const displayTitle =
        (session.notes && session.notes.trim()) || workoutName || 'Workout'
      return {
        ...session,
        displayTitle,
        workoutName: workoutName ?? null,
        statsSummary: {
          totalVolume: stats.totalVolume,
          durationMinutes: stats.durationMinutes,
          exerciseCount: stats.exerciseCount,
          totalSets: stats.totalSets,
        },
      }
    })
  )
  return NextResponse.json(enriched)
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
  const { workoutId, scheduledWorkoutId, title, presetSlug, duplicateFromSessionId } = body
  const result = await WorkoutSessionService.startSession(authResult.userId, {
    workoutId: typeof workoutId === 'string' ? workoutId : undefined,
    scheduledWorkoutId: typeof scheduledWorkoutId === 'string' ? scheduledWorkoutId : undefined,
    title: typeof title === 'string' ? title : undefined,
    presetSlug: typeof presetSlug === 'string' ? presetSlug : undefined,
    duplicateFromSessionId:
      typeof duplicateFromSessionId === 'string' ? duplicateFromSessionId : undefined,
  })
  if (!result.success) {
    const err = result.error as AppError
    const status = err.code === 'ACTIVE_SESSION_EXISTS' ? 409 : 400
    return NextResponse.json(
      { error: err.code, message: err.message },
      { status }
    )
  }
  return NextResponse.json(result.data)
}
