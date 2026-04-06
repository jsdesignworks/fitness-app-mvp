import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { MessageEventRepository } from '@/lib/repositories/messaging/event.repository'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * PATCH /api/messages/[id]
 * Body: { isRead?: boolean, isDismissed?: boolean }
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    )
  }
  const { id } = await context.params
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Bad request', message: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const updates: { isRead?: boolean; isDismissed?: boolean } = {}
  if (typeof body.isRead === 'boolean') updates.isRead = body.isRead
  if (typeof body.isDismissed === 'boolean') updates.isDismissed = body.isDismissed

  if (updates.isRead === undefined && updates.isDismissed === undefined) {
    return NextResponse.json(
      { error: 'Bad request', message: 'Provide isRead and/or isDismissed' },
      { status: 400 }
    )
  }

  try {
    const updated = await MessageEventRepository.patchInteraction(authResult.userId, id, updates)
    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({
      id: updated.id,
      isRead: updated.isRead ?? false,
      isDismissed: updated.isDismissed ?? false,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to update message'
    return NextResponse.json({ error: 'Server error', message }, { status: 500 })
  }
}
