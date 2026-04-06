import { getServiceRoleClient } from '@/lib/utils/db'

export interface AiChatSession {
  id: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

function mapRow(row: Record<string, unknown>): AiChatSession {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  }
}

export const ChatSessionRepository = {
  async create(userId: string): Promise<AiChatSession> {
    const supabase = getServiceRoleClient()
    const { data: row, error } = await supabase
      .from('ai_chat_sessions')
      .insert({ user_id: userId })
      .select()
      .single()
    if (error) throw error
    return mapRow(row as Record<string, unknown>)
  },

  async getByIdAndUser(sessionId: string, userId: string): Promise<AiChatSession | null> {
    const supabase = getServiceRoleClient()
    const { data: row, error } = await supabase
      .from('ai_chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()
    if (error || !row) return null
    return mapRow(row as Record<string, unknown>)
  },

  async listByUser(userId: string, limit = 10): Promise<AiChatSession[]> {
    const supabase = getServiceRoleClient()
    const { data: rows, error } = await supabase
      .from('ai_chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return (rows ?? []).map((r) => mapRow(r as Record<string, unknown>))
  },

  async touch(sessionId: string): Promise<void> {
    const supabase = getServiceRoleClient()
    const { error } = await supabase
      .from('ai_chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId)
    if (error) throw error
  },
}
