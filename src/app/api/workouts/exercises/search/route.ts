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
  const q = searchParams.get('q') ?? ''
  const list = await ExerciseRepository.search(q)
  return NextResponse.json(list)
}
