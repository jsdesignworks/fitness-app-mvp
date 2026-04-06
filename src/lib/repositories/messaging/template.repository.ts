import { getServiceRoleClient } from '@/lib/utils/db'
import type { MessageTemplate } from '@/lib/domain/messaging.types'
import type { ToneStyle } from '@/lib/domain/messaging.types'

function mapTemplateRow(row: Record<string, unknown>): MessageTemplate {
  return {
    id: String(row.id),
    messageKey: String(row.message_key),
    toneStyle: (row.tone_style as ToneStyle) ?? 'calm',
    variantWeight: Number(row.variant_weight ?? 5),
    templateText: String(row.template_text),
    locale: String(row.locale ?? 'en'),
    metadata: row.metadata != null ? (row.metadata as MessageTemplate['metadata']) : undefined,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  }
}

export const MessageTemplateRepository = {
  async getByTriggerAndTone(
    triggerKey: string,
    toneStyle: string
  ): Promise<MessageTemplate[]> {
    const supabase = getServiceRoleClient()
    const { data: rows, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('trigger_key', triggerKey)
      .eq('tone_style', toneStyle)
    if (error) throw error
    return (rows ?? []).map((r) => mapTemplateRow(r as Record<string, unknown>))
  },

  async getById(id: string): Promise<MessageTemplate | null> {
    const supabase = getServiceRoleClient()
    const { data: row, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !row) return null
    return mapTemplateRow(row as Record<string, unknown>)
  },
}
