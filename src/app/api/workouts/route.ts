import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    )
  }
  return NextResponse.json(
    { error: 'Not implemented', message: 'Use /api/workouts/sessions or /api/workouts/exercises endpoints.' },
    { status: 501 }
  )
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    )
  }
  return NextResponse.json(
    { error: 'Not implemented', message: 'Use /api/workouts/sessions (POST) to start a workout.' },
    { status: 501 }
  )
}
