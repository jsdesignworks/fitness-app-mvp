import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { ExerciseRepository } from '@/lib/repositories/workout/exercise.repository'

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    )
  }
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') ?? undefined
  const search = searchParams.get('search') ?? undefined
  const muscle = searchParams.get('muscle') ?? undefined
  const equipment = searchParams.get('equipment') ?? undefined
  const list = await ExerciseRepository.list({ category, search, muscle, equipment })
  return NextResponse.json(list)
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    )
  }
  const body = await request.json().catch(() => ({}))
  const { name, category, defaultTrackingMode, metadata, aliases } = body
  if (!name || typeof name !== 'string' || !category || !defaultTrackingMode) {
    return NextResponse.json(
      { error: 'Bad request', message: 'name, category, and defaultTrackingMode are required' },
      { status: 400 }
    )
  }
  try {
    const exercise = await ExerciseRepository.create({
      name,
      category,
      defaultTrackingMode,
      metadata,
      aliases,
      isCustom: true,
      createdBy: authResult.userId,
    })
    return NextResponse.json(exercise, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Create failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
