import { NextResponse } from 'next/server'
import { createClient } from '@/lib/utils/supabase-server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }
    return NextResponse.json({ user })
  } catch (e) {
    return NextResponse.json({ user: null }, { status: 401 })
  }
}
