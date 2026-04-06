import { NextRequest } from 'next/server'
import { createClient } from '@/lib/utils/supabase-server'

type AuthResult =
  | { success: true; userId: string }
  | { success: false; error: string }

/**
 * Requires a valid Supabase session (cookies + getUser).
 * Returns userId for use in RLS and service layer ownership checks.
 */
export async function requireAuth(_request: NextRequest): Promise<AuthResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      return { success: false, error: error.message }
    }
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }
    return { success: true, userId: user.id }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Authentication failed' }
  }
}
