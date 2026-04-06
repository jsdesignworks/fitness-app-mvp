import { NextRequest, NextResponse } from 'next/server'
import { WorkoutSessionService } from '@/lib/services/workout/session.service'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { AppError } from '@/lib/utils/errors'

/**
 * PATCH /api/workouts/sets/[id] - Update set (reps, weight, rpe, etc.)
 */
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
  const { id: setId } = await params
  const body = await request.json().catch(() => ({}))
  const { reps, weight, rpe } = body
  const updates: { reps?: number; weight?: number; rpe?: number } = {}
  if (reps !== undefined) updates.reps = Number(reps)
  if (weight !== undefined) updates.weight = Number(weight)
  if (rpe !== undefined) updates.rpe = Number(rpe)
  const result = await WorkoutSessionService.updateSet(authResult.userId, setId, updates)
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
