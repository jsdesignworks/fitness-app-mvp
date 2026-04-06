import { randomBytes } from 'crypto'
import { getServiceRoleClient } from '@/lib/utils/db'

export type FeedToken = {
  id: string
  token: string
  userId: string
  expiresAt: Date | null
  createdAt: Date
}

function mapRow(row: Record<string, unknown>): FeedToken {
  return {
    id: String(row.id),
    token: String(row.token),
    userId: String(row.user_id),
    expiresAt: row.expires_at != null ? new Date(String(row.expires_at)) : null,
    createdAt: new Date(String(row.created_at)),
  }
}

export const CalendarFeedTokenRepository = {
  async createForUser(userId: string): Promise<FeedToken> {
    const supabase = getServiceRoleClient()
    const token = randomBytes(32).toString('hex')
    const { data: row, error } = await supabase
      .from('calendar_feed_tokens')
      .insert({ user_id: userId, token })
      .select()
      .single()
    if (error) throw error
    return mapRow(row as Record<string, unknown>)
  },

  async getByToken(token: string): Promise<{ userId: string } | null> {
    const supabase = getServiceRoleClient()
    const { data: row, error } = await supabase
      .from('calendar_feed_tokens')
      .select('user_id')
      .eq('token', token)
      .single()
    if (error || !row) return null
    return { userId: String(row.user_id) }
  },

  async listByUser(userId: string): Promise<FeedToken[]> {
    const supabase = getServiceRoleClient()
    const { data: rows, error } = await supabase
      .from('calendar_feed_tokens')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (rows ?? []).map((r) => mapRow(r as Record<string, unknown>))
  },

  async revokeByToken(token: string): Promise<void> {
    const supabase = getServiceRoleClient()
    const { error } = await supabase
      .from('calendar_feed_tokens')
      .delete()
      .eq('token', token)
    if (error) throw error
  },
}
