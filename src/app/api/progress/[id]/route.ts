import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { ProgressRepository } from '@/lib/repositories/progress/progress.repository'
import { AuditService } from '@/lib/services/audit/audit.service'

/**
 * PATCH /api/progress/[id] — Update progress entry.
 * DELETE /api/progress/[id] — Delete progress entry.
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
  const body = await request.json().catch(() => ({}))
  const updates: { weightKg?: number | null; measurements?: Record<string, number>; notes?: string | null } = {}
  if (typeof body.weightKg === 'number' && Number.isFinite(body.weightKg)) updates.weightKg = body.weightKg
  if (body.weightKg === null) updates.weightKg = null
  if (body.measurements && typeof body.measurements === 'object') updates.measurements = body.measurements
  if (typeof body.notes === 'string') updates.notes = body.notes
  try {
    const entry = await ProgressRepository.update(authResult.userId, id, updates)
    return NextResponse.json({
      id: entry.id,
      date: entry.date,
      weightKg: entry.weightKg,
      measurements: entry.measurements,
      notes: entry.notes,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to update progress'
    return NextResponse.json({ error: 'Server error', message }, { status: 500 })
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
    await ProgressRepository.delete(authResult.userId, id)
    await AuditService.log({
      userId: authResult.userId,
      action: 'progress_entry_delete',
      entityType: 'progress_entry',
      entityId: id,
    })
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to delete progress'
    return NextResponse.json({ error: 'Server error', message }, { status: 500 })
  }
}
