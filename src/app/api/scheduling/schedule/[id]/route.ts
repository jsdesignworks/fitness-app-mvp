import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { SchedulingService } from '@/lib/services/scheduling/scheduling.service'
import type { ScheduledStatus } from '@/lib/domain/scheduling.types'

/**
 * PATCH /api/scheduling/schedule/[id]
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
  const { id } = await params
  if (!id) {
    return NextResponse.json(
      { error: 'Bad request', message: 'Schedule id is required' },
      { status: 400 }
    )
  }
  const body = await request.json().catch(() => ({}))
  const { startAt, endAt, status, notes } = body
  try {
    if (status === 'skipped') {
      const updated = await SchedulingService.markSkipped(authResult.userId, id)
      return NextResponse.json(updated)
    }
    const updates: { notes?: string | null; startAt?: Date; endAt?: Date | null; status?: ScheduledStatus } = {}
    if (notes !== undefined) updates.notes = notes ?? null
    if (startAt != null) {
      const d = new Date(startAt)
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json(
          { error: 'Bad request', message: 'Invalid startAt' },
          { status: 400 }
        )
      }
      updates.startAt = d
    }
    if (endAt != null) {
      const d = new Date(endAt)
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json(
          { error: 'Bad request', message: 'Invalid endAt' },
          { status: 400 }
        )
      }
      updates.endAt = d
    }
    if (status !== undefined && ['scheduled', 'completed', 'skipped', 'moved', 'in_progress'].includes(status)) {
      updates.status = status as ScheduledStatus
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Bad request', message: 'Provide status, startAt, endAt, or notes to update' },
        { status: 400 }
      )
    }
    const updated = await SchedulingService.update(authResult.userId, id, updates)
    return NextResponse.json(updated)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to update'
    const status = message.includes('not found') || message.includes('denied') ? 404 : 500
    return NextResponse.json({ error: 'Server error', message }, { status })
  }
}
