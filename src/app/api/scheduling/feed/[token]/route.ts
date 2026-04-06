import { NextRequest, NextResponse } from 'next/server'
import { IcsExportService } from '@/lib/services/scheduling/ics-export.service'

/**
 * GET /api/scheduling/feed/[token] — public ICS feed for calendar subscription (no auth)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }
  try {
    const ics = await IcsExportService.generateIcsFeed(token, 90)
    return new NextResponse(ics, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid or expired feed token'
    return NextResponse.json({ error: message }, { status: 404 })
  }
}
