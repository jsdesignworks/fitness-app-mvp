import { getServiceRoleClient } from '@/lib/utils/db'
import type { MessageEvent, MessageTriggerKey, DeliveryStatus } from '@/lib/domain/messaging.types'
import type { MessageChannel } from '@/lib/domain/messaging.types'

function mapEventRow(row: Record<string, unknown>): MessageEvent {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    triggerKey: row.trigger_key as MessageTriggerKey,
    templateId: String(row.template_id ?? ''),
    renderedBody: row.rendered_body != null ? String(row.rendered_body) : undefined,
    createdAt: new Date(String(row.created_at)),
    deliveredAt: row.delivered_at != null ? new Date(String(row.delivered_at)) : undefined,
    channel: (row.channel as MessageChannel) ?? 'in_app',
    deliveryStatus: (row.delivery_status as DeliveryStatus) ?? 'queued',
    reasonSkipped: row.reason_skipped != null ? String(row.reason_skipped) : undefined,
    metadata: row.metadata != null ? (row.metadata as MessageEvent['metadata']) : undefined,
    messageType: row.message_type != null ? String(row.message_type) : undefined,
    tone: row.tone != null ? String(row.tone) : undefined,
    title: row.title != null ? String(row.title) : null,
    ctaLabel: row.cta_label != null ? String(row.cta_label) : null,
    ctaHref: row.cta_href != null ? String(row.cta_href) : null,
    isRead: row.is_read != null ? Boolean(row.is_read) : false,
    isDismissed: row.is_dismissed != null ? Boolean(row.is_dismissed) : false,
    dedupeKey: row.dedupe_key != null ? String(row.dedupe_key) : null,
  }
}

export const MessageEventRepository = {
  async create(data: {
    userId: string
    triggerKey: string
    templateId: string
    renderedBody: string
    channel: string
    deliveryStatus: DeliveryStatus
  }): Promise<MessageEvent> {
    const supabase = getServiceRoleClient()
    const { data: row, error } = await supabase
      .from('message_events')
      .insert({
        user_id: data.userId,
        trigger_key: data.triggerKey,
        template_id: data.templateId,
        rendered_body: data.renderedBody,
        channel: data.channel,
        delivery_status: data.deliveryStatus,
      })
      .select()
      .single()
    if (error) throw error
    return mapEventRow(row as Record<string, unknown>)
  },

  async updateStatus(eventId: string, status: DeliveryStatus, deliveredAt?: Date): Promise<void> {
    const supabase = getServiceRoleClient()
    const updates: Record<string, unknown> = { delivery_status: status }
    if (status === 'sent' && deliveredAt !== undefined) updates.delivered_at = deliveredAt.toISOString()
    const { error } = await supabase.from('message_events').update(updates).eq('id', eventId)
    if (error) throw error
  },

  async listByUser(
    userId: string,
    opts: { limit?: number; before?: Date; includeDismissed?: boolean } = {}
  ): Promise<MessageEvent[]> {
    const supabase = getServiceRoleClient()
    const limit = opts.limit ?? 20
    let query = supabase
      .from('message_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (!opts.includeDismissed) {
      query = query.eq('is_dismissed', false)
    }
    if (opts.before) {
      query = query.lt('created_at', opts.before.toISOString())
    }
    const { data: rows, error } = await query
    if (error) throw error
    return (rows ?? []).map((r) => mapEventRow(r as Record<string, unknown>))
  },

  async getLastForCooldown(userId: string, triggerKey: string): Promise<MessageEvent | null> {
    const supabase = getServiceRoleClient()
    const { data: row, error } = await supabase
      .from('message_events')
      .select('*')
      .eq('user_id', userId)
      .eq('trigger_key', triggerKey)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (error || !row) return null
    return mapEventRow(row as Record<string, unknown>)
  },

  async countRecentByUser(userId: string, since: Date): Promise<number> {
    const supabase = getServiceRoleClient()
    const { count, error } = await supabase
      .from('message_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', since.toISOString())
    if (error) throw error
    return count ?? 0
  },

  async countUnread(userId: string): Promise<number> {
    const supabase = getServiceRoleClient()
    const { count, error } = await supabase
      .from('message_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .eq('is_dismissed', false)
    if (error) throw error
    return count ?? 0
  },

  async getByIdForUser(userId: string, eventId: string): Promise<MessageEvent | null> {
    const supabase = getServiceRoleClient()
    const { data: row, error } = await supabase
      .from('message_events')
      .select('*')
      .eq('user_id', userId)
      .eq('id', eventId)
      .single()
    if (error || !row) return null
    return mapEventRow(row as Record<string, unknown>)
  },

  async getByDedupeKey(userId: string, dedupeKey: string): Promise<MessageEvent | null> {
    const supabase = getServiceRoleClient()
    const { data: row, error } = await supabase
      .from('message_events')
      .select('*')
      .eq('user_id', userId)
      .eq('dedupe_key', dedupeKey)
      .maybeSingle()
    if (error || !row) return null
    return mapEventRow(row as Record<string, unknown>)
  },

  async deleteByDedupeKey(userId: string, dedupeKey: string): Promise<void> {
    const supabase = getServiceRoleClient()
    const { error } = await supabase
      .from('message_events')
      .delete()
      .eq('user_id', userId)
      .eq('dedupe_key', dedupeKey)
    if (error) throw error
  },

  async upsertFeedMessage(data: {
    userId: string
    dedupeKey: string
    triggerKey: string
    messageType: string
    tone: string
    title?: string | null
    renderedBody: string
    ctaLabel?: string | null
    ctaHref?: string | null
  }): Promise<MessageEvent> {
    const supabase = getServiceRoleClient()
    const existing = await this.getByDedupeKey(data.userId, data.dedupeKey)
    const now = new Date().toISOString()
    if (existing) {
      const { data: row, error } = await supabase
        .from('message_events')
        .update({
          trigger_key: data.triggerKey,
          message_type: data.messageType,
          tone: data.tone,
          title: data.title ?? null,
          rendered_body: data.renderedBody,
          cta_label: data.ctaLabel ?? null,
          cta_href: data.ctaHref ?? null,
          delivered_at: now,
          delivery_status: 'sent',
        })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw error
      return mapEventRow(row as Record<string, unknown>)
    }
    const { data: row, error } = await supabase
      .from('message_events')
      .insert({
        user_id: data.userId,
        dedupe_key: data.dedupeKey,
        trigger_key: data.triggerKey,
        template_id: null,
        message_type: data.messageType,
        tone: data.tone,
        title: data.title ?? null,
        rendered_body: data.renderedBody,
        cta_label: data.ctaLabel ?? null,
        cta_href: data.ctaHref ?? null,
        channel: 'in_app',
        delivery_status: 'sent',
        delivered_at: now,
        is_read: false,
        is_dismissed: false,
      })
      .select()
      .single()
    if (error) throw error
    return mapEventRow(row as Record<string, unknown>)
  },

  async patchInteraction(
    userId: string,
    eventId: string,
    updates: { isRead?: boolean; isDismissed?: boolean }
  ): Promise<MessageEvent | null> {
    const supabase = getServiceRoleClient()
    const row: Record<string, unknown> = {}
    if (updates.isRead !== undefined) row.is_read = updates.isRead
    if (updates.isDismissed !== undefined) row.is_dismissed = updates.isDismissed
    if (Object.keys(row).length === 0) {
      return this.getByIdForUser(userId, eventId)
    }
    const { data: updated, error } = await supabase
      .from('message_events')
      .update(row)
      .eq('user_id', userId)
      .eq('id', eventId)
      .select()
      .single()
    if (error || !updated) return null
    return mapEventRow(updated as Record<string, unknown>)
  },
}
