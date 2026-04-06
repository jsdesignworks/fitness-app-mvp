import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { ChatSessionRepository } from '@/lib/repositories/ai/chat-session.repository'
import { ChatMessageRepository } from '@/lib/repositories/ai/chat-message.repository'
import { AITrainerService } from '@/lib/services/ai-trainer.service'

type RouteParams = { params: Promise<{ id: string }> }

/**
 * GET /api/ai/conversations/[id]
 * Returns messages for a session (ownership checked).
 */
export async function GET(request: NextRequest, context: RouteParams) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    )
  }

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'Bad request', message: 'Missing id' }, { status: 400 })
  }

  try {
    const session = await ChatSessionRepository.getByIdAndUser(id, authResult.userId)
    if (!session) {
      return NextResponse.json(
        { error: 'Not found', message: 'Conversation not found' },
        { status: 404 }
      )
    }
    const messages = await ChatMessageRepository.listBySession(session.id, 200)
    const contextPreview = await AITrainerService.getContextPreview(authResult.userId)
    return NextResponse.json({
      sessionId: session.id,
      updatedAt: session.updatedAt.toISOString(),
      createdAt: session.createdAt.toISOString(),
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
      contextPreview,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to load conversation'
    return NextResponse.json({ error: 'Server error', message: msg }, { status: 500 })
  }
}
