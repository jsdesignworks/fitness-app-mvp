import { getServiceRoleClient } from '@/lib/utils/db'
import type { UserMessagePreferences, ToneStyle, MessageFrequency, MessageChannel } from '@/lib/domain/messaging.types'

function mapPreferencesRow(row: Record<string, unknown>): UserMessagePreferences {
  const channels = row.preferred_channels
  return {
    userId: String(row.user_id),
    enabled: row.enabled !== undefined ? Boolean(row.enabled) : true,
    toneStyle: (row.tone_style as ToneStyle) ?? 'calm',
    messageFrequency: (row.message_frequency as MessageFrequency) ?? 'normal',
    quietHoursStart: row.quiet_hours_start != null ? String(row.quiet_hours_start) : undefined,
    quietHoursEnd: row.quiet_hours_end != null ? String(row.quiet_hours_end) : undefined,
    preferredChannels: (Array.isArray(channels) ? channels : ['in_app']) as MessageChannel[],
    profanityAllowed: Boolean(row.profanity_allowed),
    showReminders: row.show_reminders !== undefined ? Boolean(row.show_reminders) : true,
    showSystemUpdates: row.show_system_updates !== undefined ? Boolean(row.show_system_updates) : true,
    showProgressUpdates: row.show_progress_updates !== undefined ? Boolean(row.show_progress_updates) : true,
    updatedAt: new Date(String(row.updated_at)),
  }
}

export type PreferencesUpsert = Partial<{
  enabled: boolean
  toneStyle: ToneStyle
  messageFrequency: MessageFrequency
  quietHoursStart: string
  quietHoursEnd: string
  preferredChannels: string[]
  profanityAllowed: boolean
  showReminders: boolean
  showSystemUpdates: boolean
  showProgressUpdates: boolean
}>

export const UserMessagePreferencesRepository = {
  async getByUserId(userId: string): Promise<UserMessagePreferences | null> {
    const supabase = getServiceRoleClient()
    const { data: row, error } = await supabase
      .from('user_message_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (error || !row) return null
    return mapPreferencesRow(row as Record<string, unknown>)
  },

  async upsert(userId: string, updates: PreferencesUpsert): Promise<UserMessagePreferences> {
    const supabase = getServiceRoleClient()
    const row: Record<string, unknown> = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    }
    if (updates.enabled !== undefined) row.enabled = updates.enabled
    if (updates.toneStyle !== undefined) row.tone_style = updates.toneStyle
    if (updates.messageFrequency !== undefined) row.message_frequency = updates.messageFrequency
    if (updates.quietHoursStart !== undefined) row.quiet_hours_start = updates.quietHoursStart
    if (updates.quietHoursEnd !== undefined) row.quiet_hours_end = updates.quietHoursEnd
    if (updates.preferredChannels !== undefined) row.preferred_channels = updates.preferredChannels
    if (updates.profanityAllowed !== undefined) row.profanity_allowed = updates.profanityAllowed
    if (updates.showReminders !== undefined) row.show_reminders = updates.showReminders
    if (updates.showSystemUpdates !== undefined) row.show_system_updates = updates.showSystemUpdates
    if (updates.showProgressUpdates !== undefined) row.show_progress_updates = updates.showProgressUpdates

    const { data: inserted, error } = await supabase
      .from('user_message_preferences')
      .upsert(row, { onConflict: 'user_id' })
      .select()
      .single()
    if (error) throw error
    return mapPreferencesRow(inserted as Record<string, unknown>)
  },
}
