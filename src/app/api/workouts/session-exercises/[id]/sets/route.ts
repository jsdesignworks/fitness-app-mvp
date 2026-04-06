import { NextRequest, NextResponse } from 'next/server'
import { WorkoutSessionService } from '@/lib/services/workout/session.service'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { AppError } from '@/lib/utils/errors'
import type { SetType } from '@/lib/domain/workout.types'

/**
 * POST /api/workouts/session-exercises/[id]/sets - Add set to session exercise
 * [id] = sessionExerciseId
 */
export async function POST(
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
  const { id: sessionExerciseId } = await params
  const body = await request.json().catch(() => ({}))
  const { reps, weight, rpe, setType } = body
  const result = await WorkoutSessionService.addSet(authResult.userId, sessionExerciseId, {
    reps: reps != null ? Number(reps) : undefined,
    weight: weight != null ? Number(weight) : undefined,
    rpe: rpe != null ? Number(rpe) : undefined,
    setType: setType != null ? (setType as SetType) : undefined,
  })
  if (!result.success) {
    const err = result.error as AppError
    const status = err.code === 'UNAUTHORIZED' ? 403 : 400
    return NextResponse.json(
      { error: err.code, message: err.message },
      { status }
    )
  }
  return NextResponse.json(result.data)
}
