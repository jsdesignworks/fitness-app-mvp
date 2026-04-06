import { NextRequest, NextResponse } from 'next/server'
import { WorkoutSessionService } from '@/lib/services/workout/session.service'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { AppError } from '@/lib/utils/errors'

/**
 * POST /api/workouts/sessions/[id]/exercises - Add exercise to session
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
  const { id: sessionId } = await params
  const body = await request.json().catch(() => ({}))
  const { exerciseId, trackingMode } = body
  if (!exerciseId || typeof exerciseId !== 'string') {
    return NextResponse.json(
      { error: 'Bad request', message: 'exerciseId is required' },
      { status: 400 }
    )
  }
  const result = await WorkoutSessionService.addExerciseToSession(authResult.userId, sessionId, {
    exerciseId,
    trackingMode,
  })
  if (!result.success) {
    const err = result.error as AppError
    const status = err.code === 'SESSION_NOT_FOUND' ? 404 : err.code === 'SESSION_NOT_ACTIVE' ? 409 : 400
    return NextResponse.json(
      { error: err.code, message: err.message },
      { status }
    )
  }
  return NextResponse.json(result.data)
}
