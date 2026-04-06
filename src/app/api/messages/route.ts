import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { MessageEventRepository } from '@/lib/repositories/messaging/event.repository'
import { UserMessagePreferencesRepository } from '@/lib/repositories/messaging/preferences.repository'
import { syncInAppFeedForUser } from '@/lib/services/messaging/message-feed-sync.service'
import type { MessageEvent } from '@/lib/domain/messaging.types'

function serializeMessage(event: MessageEvent) {
  return {
    id: event.id,
    userId: event.userId,
    triggerKey: event.triggerKey,
    templateId: event.templateId || null,
    renderedBody: event.renderedBody ?? '',
    title: event.title ?? null,
    messageType: event.messageType ?? 'system',
    tone: event.tone ?? 'info',
    ctaLabel: event.ctaLabel ?? null,
    ctaHref: event.ctaHref ?? null,
    isRead: event.isRead ?? false,
    isDismissed: event.isDismissed ?? false,
    createdAt: event.createdAt.toISOString(),
    deliveredAt: event.deliveredAt?.toISOString() ?? null,
    channel: event.channel,
    deliveryStatus: event.deliveryStatus,
  }
}

/**
 * GET /api/messages?limit=20&before=ISO date
 * Syncs deduped system rows from real product data, then returns non-dismissed messages.
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
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 100)
  const beforeParam = searchParams.get('before')
  const before = beforeParam ? new Date(beforeParam) : undefined
  if (beforeParam && isNaN(before!.getTime())) {
    return NextResponse.json(
      { error: 'Bad request', message: 'before must be a valid ISO date' },
      { status: 400 }
    )
  }

  try {
    const prefs = await UserMessagePreferencesRepository.getByUserId(authResult.userId)
    const feedEnabled = prefs?.enabled !== false

    if (!feedEnabled) {
      return NextResponse.json({
        messages: [],
        unreadCount: 0,
        feedEnabled: false,
      })
    }

    await syncInAppFeedForUser(authResult.userId)

    const events = await MessageEventRepository.listByUser(authResult.userId, { limit, before })
    const unreadCount = await MessageEventRepository.countUnread(authResult.userId)

    const serialized = events.map(serializeMessage)
    return NextResponse.json({
      messages: serialized,
      /** @deprecated Prefer `messages`; kept for older clients. */
      events: serialized,
      unreadCount,
      feedEnabled: true,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to fetch messages'
    return NextResponse.json({ error: 'Server error', message }, { status: 500 })
  }
}
