import { NextRequest, NextResponse } from 'next/server'
import { WorkoutSessionService } from '@/lib/services/workout/session.service'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { AppError } from '@/lib/utils/errors'

/**
 * POST /api/workouts/sessions/[id]/complete - Mark session complete
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
  const result = await WorkoutSessionService.completeSession(authResult.userId, sessionId)
  if (!result.success) {
    const err = result.error as AppError
    const status =
      err.code === 'SESSION_NOT_FOUND' ? 404 : err.code === 'SESSION_ALREADY_COMPLETED' ? 409 : 400
    return NextResponse.json(
      { error: err.code, message: err.message },
      { status }
    )
  }
  return new NextResponse(null, { status: 204 })
}
