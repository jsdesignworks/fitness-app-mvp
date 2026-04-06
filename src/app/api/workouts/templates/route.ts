import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { WorkoutRepository } from '@/lib/repositories/workout/workout.repository'
import { TemplateService } from '@/lib/services/workout/template.service'
import { AppError } from '@/lib/utils/errors'

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    )
  }
  const list = await WorkoutRepository.listByUser(authResult.userId)
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
  const { name, notes, items } = body
  if (!name || typeof name !== 'string') {
    return NextResponse.json(
      { error: 'Bad request', message: 'name is required' },
      { status: 400 }
    )
  }
  const payload = {
    name,
    notes: notes ?? undefined,
    items: Array.isArray(items) ? items.map((it: { exerciseId?: string; orderIndex?: number; plannedStructure?: { sets?: number } }) => ({
      exerciseId: String(it.exerciseId ?? ''),
      orderIndex: Number(it.orderIndex ?? 0),
      plannedStructure: it.plannedStructure,
    })) : [],
  }
  const result = await TemplateService.createTemplate(authResult.userId, payload)
  if (!result.success) {
    const err = result.error as AppError
    return NextResponse.json(
      { error: err.code, message: err.message },
      { status: 400 }
    )
  }
  return NextResponse.json(result.data, { status: 201 })
}
