import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { SessionRepository } from '@/lib/repositories/workout/session.repository'

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    )
  }
  const session = await SessionRepository.getActiveSession(authResult.userId)
  return NextResponse.json(session ?? null)
}
