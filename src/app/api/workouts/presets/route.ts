import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { WORKOUT_PRESETS } from '@/lib/workout/preset-catalog'

/**
 * GET /api/workouts/presets — Built-in workout presets (no DB required for catalog metadata)
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    )
  }
  return NextResponse.json(
    WORKOUT_PRESETS.map((p) => ({
      slug: p.slug,
      title: p.title,
      description: p.description,
      exerciseCount: p.items.length,
    }))
  )
}
