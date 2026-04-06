import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { ChatSessionRepository } from '@/lib/repositories/ai/chat-session.repository'
import { AITrainerService } from '@/lib/services/ai-trainer.service'

/**
 * GET /api/ai/conversations
 * Lists recent chat sessions for the authenticated user.
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50)
    const sessions = await ChatSessionRepository.listByUser(authResult.userId, limit)
    const contextPreview = await AITrainerService.getContextPreview(authResult.userId)
    return NextResponse.json({
      conversations: sessions.map((s) => ({
        id: s.id,
        updatedAt: s.updatedAt.toISOString(),
        createdAt: s.createdAt.toISOString(),
      })),
      contextPreview,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to load conversations'
    return NextResponse.json({ error: 'Server error', message: msg }, { status: 500 })
  }
}
