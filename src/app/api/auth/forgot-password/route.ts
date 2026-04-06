import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/utils/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body
    if (!email) {
      return NextResponse.json(
        { error: 'Missing email' },
        { status: 400 }
      )
    }
    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`,
    })
    if (error) {
      return NextResponse.json(
        { error: error.message, message: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: 'Request failed', message: 'Something went wrong' },
      { status: 500 }
    )
  }
}
