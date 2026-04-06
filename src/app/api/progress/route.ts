import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { ProgressRepository } from '@/lib/repositories/progress/progress.repository'

/**
 * GET /api/progress?start=YYYY-MM-DD&end=YYYY-MM-DD — List entries in range.
 * POST /api/progress — Create or upsert entry (body: date, weightKg?, measurements?, notes?).
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
  const start = searchParams.get('start')
  const end = searchParams.get('end')
  if (!start || !end || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return NextResponse.json(
      { error: 'Bad request', message: 'Query params start and end (YYYY-MM-DD) are required' },
      { status: 400 }
    )
  }
  try {
    const entries = await ProgressRepository.listByUserAndRange(authResult.userId, start, end)
    return NextResponse.json(
      entries.map((e) => ({
        id: e.id,
        date: e.date,
        weightKg: e.weightKg,
        measurements: e.measurements,
        notes: e.notes,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      }))
    )
  } catch (e) {
    const raw = e instanceof Error ? e.message : 'Failed to list progress'
    const migrationRelated = isLikelyMissingDb(raw)
    const message = migrationRelated
      ? `${raw} Apply migrations if needed (see docs/MIGRATIONS_REQUIRED.md): supabase db push or supabase migration up.`
      : raw
    return NextResponse.json({ error: 'Server error', message }, { status: migrationRelated ? 503 : 500 })
  }
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
  const date =
    typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
      ? body.date
      : new Date().toISOString().slice(0, 10)
  const weightKg =
    typeof body.weightKg === 'number' && Number.isFinite(body.weightKg) ? body.weightKg : null
  const measurements =
    body.measurements && typeof body.measurements === 'object' ? body.measurements : {}
  const notes = typeof body.notes === 'string' ? body.notes : null
  try {
    const entry = await ProgressRepository.create(authResult.userId, {
      date,
      weightKg: weightKg ?? undefined,
      measurements: Object.keys(measurements).length ? measurements : undefined,
      notes,
    })
    return NextResponse.json(
      {
        id: entry.id,
        date: entry.date,
        weightKg: entry.weightKg,
        measurements: entry.measurements,
        notes: entry.notes,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (e) {
    const raw = e instanceof Error ? e.message : 'Failed to save progress'
    const migrationRelated = isLikelyMissingDb(raw)
    const message = migrationRelated
      ? `${raw} Apply migrations if needed (see docs/MIGRATIONS_REQUIRED.md): supabase db push or supabase migration up.`
      : raw
    return NextResponse.json({ error: 'Server error', message }, { status: migrationRelated ? 503 : 500 })
  }
}

function isLikelyMissingDb(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes('does not exist') ||
    lower.includes('42703') ||
    (lower.includes('column') && lower.includes('does not exist')) ||
    lower.includes('relation') ||
    lower.includes('table') && lower.includes('does not exist')
  )
}
