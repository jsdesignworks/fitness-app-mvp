import { getServiceRoleClient } from '@/lib/utils/db'

export type AiRoutingProvider = 'openai' | 'anthropic'

export interface AiProviderPreferencesRow {
  userId: string
  defaultProvider: AiRoutingProvider | null
  fallbackProvider: AiRoutingProvider | null
  allowFallback: boolean
  updatedAt: Date
}

function mapRow(row: Record<string, unknown>): AiProviderPreferencesRow {
  return {
    userId: String(row.user_id),
    defaultProvider:
      row.default_provider === 'openai' || row.default_provider === 'anthropic'
        ? row.default_provider
        : null,
    fallbackProvider:
      row.fallback_provider === 'openai' || row.fallback_provider === 'anthropic'
        ? row.fallback_provider
        : null,
    allowFallback: Boolean(row.allow_fallback),
    updatedAt: new Date(String(row.updated_at)),
  }
}

export const AiProviderPreferencesRepository = {
  async getByUserId(userId: string): Promise<AiProviderPreferencesRow | null> {
    const supabase = getServiceRoleClient()
    const { data: row, error } = await supabase
      .from('ai_provider_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error
    if (!row) return null
    return mapRow(row as Record<string, unknown>)
  },

  async upsert(data: {
    userId: string
    defaultProvider: AiRoutingProvider | null
    fallbackProvider: AiRoutingProvider | null
    allowFallback: boolean
  }): Promise<AiProviderPreferencesRow> {
    const supabase = getServiceRoleClient()
    const { data: row, error } = await supabase
      .from('ai_provider_preferences')
      .upsert(
        {
          user_id: data.userId,
          default_provider: data.defaultProvider,
          fallback_provider: data.fallbackProvider,
          allow_fallback: data.allowFallback,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single()
    if (error) throw error
    return mapRow(row as Record<string, unknown>)
  },
}
