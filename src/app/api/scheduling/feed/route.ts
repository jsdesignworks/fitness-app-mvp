import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { CalendarFeedTokenRepository } from '@/lib/repositories/scheduling/calendar-feed-token.repository'

/**
 * POST /api/scheduling/feed — create feed token; return feedUrl and token
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    )
  }
  try {
    const feedToken = await CalendarFeedTokenRepository.createForUser(authResult.userId)
    const origin = request.nextUrl.origin
    const feedUrl = `${origin}/api/scheduling/feed/${feedToken.token}`
    return NextResponse.json({ feedUrl, token: feedToken.token }, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create feed'
    return NextResponse.json({ error: 'Server error', message }, { status: 500 })
  }
}
