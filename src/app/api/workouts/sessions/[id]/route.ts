import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { SessionRepository } from '@/lib/repositories/workout/session.repository'

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
  const session = await SessionRepository.getById(id)
  if (!session) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (session.userId !== authResult.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return NextResponse.json(session)
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
  const session = await SessionRepository.getById(id)
  if (!session) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (session.userId !== authResult.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await request.json().catch(() => ({}))
  if (body.status) {
    await SessionRepository.updateCompletionStatus(id, body.status, {
      endedAt: body.endedAt ? new Date(body.endedAt) : undefined,
    })
  }
  const updated = await SessionRepository.getById(id)
  return NextResponse.json(updated)
}
