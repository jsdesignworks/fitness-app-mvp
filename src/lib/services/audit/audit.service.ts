import { getServiceRoleClient } from '@/lib/utils/db'

export type AuditAction =
  | 'session_complete'
  | 'session_abandon'
  | 'schedule_create'
  | 'schedule_update'
  | 'schedule_delete'
  | 'nutrition_entry_delete'
  | 'habit_log'
  | 'progress_entry_delete'

export type AuditPayload = {
  userId: string
  action: AuditAction
  entityType: string
  entityId?: string | null
  oldValue?: Record<string, unknown> | null
  newValue?: Record<string, unknown> | null
  ipOrOrigin?: string | null
}

/**
 * Append-only audit log for critical mutations. Uses service role so RLS does not block insert.
 */
export const AuditService = {
  async log(payload: AuditPayload): Promise<void> {
    try {
      const supabase = getServiceRoleClient()
      await supabase.from('audit_log').insert({
        user_id: payload.userId,
        action: payload.action,
        entity_type: payload.entityType,
        entity_id: payload.entityId ?? null,
        old_value: payload.oldValue ?? null,
        new_value: payload.newValue ?? null,
        ip_or_origin: payload.ipOrOrigin ?? null,
      })
    } catch (e) {
      // Do not throw; audit failure must not break the main flow
      console.error('AuditService.log failed', e)
    }
  },
}
