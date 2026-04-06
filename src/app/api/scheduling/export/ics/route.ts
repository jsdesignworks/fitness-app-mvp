import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { IcsExportService } from '@/lib/services/scheduling/ics-export.service'

/**
 * GET /api/scheduling/export/ics?start=YYYY-MM-DD&end=YYYY-MM-DD
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
  const startParam = searchParams.get('start')
  const endParam = searchParams.get('end')
  if (!startParam || !endParam) {
    return NextResponse.json(
      { error: 'Bad request', message: 'Query params start and end (YYYY-MM-DD) are required' },
      { status: 400 }
    )
  }
  const start = new Date(startParam + 'T00:00:00.000Z')
  const end = new Date(endParam + 'T23:59:59.999Z')
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return NextResponse.json(
      { error: 'Bad request', message: 'Invalid start or end date' },
      { status: 400 }
    )
  }
  try {
    const ics = await IcsExportService.generateIcs(authResult.userId, start, end)
    return new NextResponse(ics, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="workouts.ics"',
      },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to generate ICS'
    return NextResponse.json({ error: 'Server error', message }, { status: 500 })
  }
}
