import { getServiceRoleClient } from '@/lib/utils/db'
import type { MessageRole } from '@/lib/domain/ai.types'

export interface AiChatMessage {
  id: string
  sessionId: string
  role: MessageRole
  content: string
  createdAt: Date
}

function mapRow(row: Record<string, unknown>): AiChatMessage {
  return {
    id: String(row.id),
    sessionId: String(row.session_id),
    role: String(row.role) as MessageRole,
    content: String(row.content),
    createdAt: new Date(String(row.created_at)),
  }
}

export const ChatMessageRepository = {
  async insert(sessionId: string, role: MessageRole, content: string): Promise<AiChatMessage> {
    const supabase = getServiceRoleClient()
    const { data: row, error } = await supabase
      .from('ai_chat_messages')
      .insert({
        session_id: sessionId,
        role,
        content,
      })
      .select()
      .single()
    if (error) throw error
    return mapRow(row as Record<string, unknown>)
  },

  /** Most recent `limit` messages, returned oldest-first (for chat display + model context). */
  async listBySession(sessionId: string, limit = 50): Promise<AiChatMessage[]> {
    const supabase = getServiceRoleClient()
    const { data: rows, error } = await supabase
      .from('ai_chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    const mapped = (rows ?? []).map((r) => mapRow(r as Record<string, unknown>))
    mapped.reverse()
    return mapped
  },
}
