import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import {
  AITrainerService,
  isAITrainerServiceError,
} from '@/lib/services/ai-trainer.service'
import { ChatSessionRepository } from '@/lib/repositories/ai/chat-session.repository'
import { ChatMessageRepository } from '@/lib/repositories/ai/chat-message.repository'
import { AI_ERROR_CODE } from '@/lib/services/ai/ai-errors'

/**
 * POST /api/ai/chat
 * Body: { message: string, sessionId?: string }
 * Returns: { sessionId, response: { role, content }, usage, safetyCheck }
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    )
  }
  let body: { message?: string; sessionId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Bad request', message: 'Invalid JSON body' },
      { status: 400 }
    )
  }
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (!message) {
    return NextResponse.json(
      { error: 'Bad request', message: 'message is required' },
      { status: 400 }
    )
  }
  const sessionId =
    typeof body.sessionId === 'string' && body.sessionId
      ? body.sessionId
      : null

  try {
    const result = await AITrainerService.respondToChat(
      authResult.userId,
      sessionId,
      message
    )
    return NextResponse.json({
      sessionId: result.sessionId,
      response: result.response,
      usage: result.usage,
      safetyCheck: result.safetyCheck,
    })
  } catch (e) {
    if (isAITrainerServiceError(e)) {
      return NextResponse.json(
        {
          error:
            e.code === AI_ERROR_CODE.RATE_LIMITED ? 'Too Many Requests' : 'AI error',
          message: e.message,
          errorCode: e.code,
        },
        { status: e.httpStatus }
      )
    }
    const msg = e instanceof Error ? e.message : 'Failed to get AI response'
    return NextResponse.json(
      {
        error: 'Server error',
        message: msg,
        errorCode: AI_ERROR_CODE.PROVIDER_RESPONSE_FAILED,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/ai/chat?sessionId=xxx
 * If sessionId: return { sessionId, messages, contextPreview } for that session (ownership checked).
 * If no sessionId: return { sessions, contextPreview } (last 10 sessions with id and updatedAt).
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    )
  }
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')

  try {
    const contextPreview = await AITrainerService.getContextPreview(authResult.userId)

    if (sessionId) {
      const session = await ChatSessionRepository.getByIdAndUser(
        sessionId,
        authResult.userId
      )
      if (!session) {
        return NextResponse.json(
          { error: 'Not found', message: 'Session not found', contextPreview },
          { status: 404 }
        )
      }
      const messages = await ChatMessageRepository.listBySession(sessionId)
      return NextResponse.json({
        sessionId: session.id,
        messages: messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
        })),
        contextPreview,
      })
    }

    const sessions = await ChatSessionRepository.listByUser(
      authResult.userId,
      10
    )
    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        updatedAt: s.updatedAt.toISOString(),
      })),
      contextPreview,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to load chat'
    return NextResponse.json({ error: 'Server error', message: msg }, { status: 500 })
  }
}
