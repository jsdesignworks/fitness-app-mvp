import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { ExerciseRepository } from '@/lib/repositories/workout/exercise.repository'

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
  const exercise = await ExerciseRepository.getById(id)
  if (!exercise) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(exercise)
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
  const exercise = await ExerciseRepository.getById(id)
  if (!exercise) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (!exercise.isCustom || exercise.createdBy !== authResult.userId) {
    return NextResponse.json({ error: 'Forbidden', message: 'Only custom exercises you created can be updated' }, { status: 403 })
  }
  const body = await request.json().catch(() => ({}))
  const { name, category, defaultTrackingMode, metadata, aliases } = body
  try {
    const updated = await ExerciseRepository.update(id, {
      ...(name !== undefined && { name }),
      ...(category !== undefined && { category }),
      ...(defaultTrackingMode !== undefined && { defaultTrackingMode }),
      ...(metadata !== undefined && { metadata }),
      ...(aliases !== undefined && { aliases }),
    })
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { error: 'Update failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
  const exercise = await ExerciseRepository.getById(id)
  if (!exercise) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (!exercise.isCustom || exercise.createdBy !== authResult.userId) {
    return NextResponse.json({ error: 'Forbidden', message: 'Only custom exercises you created can be deleted' }, { status: 403 })
  }
  try {
    await ExerciseRepository.delete(id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Delete failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
