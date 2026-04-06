import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { WorkoutRepository } from '@/lib/repositories/workout/workout.repository'
import { TemplateService } from '@/lib/services/workout/template.service'
import { AppError } from '@/lib/utils/errors'

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
  const template = await WorkoutRepository.getById(id)
  if (!template) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (template.userId !== authResult.userId) {
    return NextResponse.json({ error: 'Forbidden', message: 'Template not found' }, { status: 403 })
  }
  return NextResponse.json(template)
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
  const body = await request.json().catch(() => ({}))
  const { name, notes, items } = body
  const payload = {
    ...(name !== undefined && { name: String(name) }),
    ...(notes !== undefined && { notes: notes != null ? String(notes) : undefined }),
    ...(items !== undefined && {
      items: Array.isArray(items)
        ? items.map((it: { exerciseId?: string; orderIndex?: number; plannedStructure?: { sets?: number } }) => ({
            exerciseId: String(it.exerciseId ?? ''),
            orderIndex: Number(it.orderIndex ?? 0),
            plannedStructure: it.plannedStructure,
          }))
        : undefined,
    }),
  }
  const result = await TemplateService.updateTemplate(authResult.userId, id, payload)
  if (!result.success) {
    const err = result.error as AppError
    const status = err.code === 'TEMPLATE_NOT_FOUND' ? 404 : 400
    return NextResponse.json(
      { error: err.code, message: err.message },
      { status }
    )
  }
  return NextResponse.json(result.data)
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
  const result = await TemplateService.deleteTemplate(authResult.userId, id)
  if (!result.success) {
    const err = result.error as AppError
    const status = err.code === 'TEMPLATE_NOT_FOUND' ? 404 : 400
    return NextResponse.json(
      { error: err.code, message: err.message },
      { status }
    )
  }
  return new NextResponse(null, { status: 204 })
}
