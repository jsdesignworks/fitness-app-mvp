import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/utils/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Missing token or password' },
        { status: 400 }
      )
    }
    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      return NextResponse.json(
        { error: error.message, message: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: 'Reset failed', message: 'Something went wrong' },
      { status: 500 }
    )
  }
}
