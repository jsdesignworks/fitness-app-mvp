import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/utils/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing email or password' },
        { status: 400 }
      )
    }
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      return NextResponse.json(
        { error: error.message, message: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json({ user: data.user })
  } catch (e) {
    return NextResponse.json(
      { error: 'Sign up failed', message: 'Something went wrong' },
      { status: 500 }
    )
  }
}
