import { getServiceRoleClient } from '@/lib/utils/db'

export type AiFeature = 'chat' | 'recommendation' | 'validation'
export type AiRequestLogProvider = 'openai' | 'anthropic'
export type AiRequestLogStatus = 'success' | 'failed'

export const AiRequestLogRepository = {
  async insert(data: {
    userId: string
    feature: AiFeature
    model?: string
    inputTokens: number
    outputTokens: number
    latencyMs?: number
    provider?: AiRequestLogProvider | null
    status?: AiRequestLogStatus
    errorMessage?: string | null
  }): Promise<void> {
    const supabase = getServiceRoleClient()
    const { error } = await supabase.from('ai_request_logs').insert({
      user_id: data.userId,
      feature: data.feature,
      model: data.model ?? null,
      input_tokens: data.inputTokens,
      output_tokens: data.outputTokens,
      latency_ms: data.latencyMs ?? null,
      provider: data.provider ?? null,
      status: data.status ?? 'success',
      error_message: data.errorMessage ?? null,
    })
    if (error) throw error
  },

  async countByUserAndFeatureSince(
    userId: string,
    feature: AiFeature,
    since: Date
  ): Promise<number> {
    const supabase = getServiceRoleClient()
    const { count, error } = await supabase
      .from('ai_request_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('feature', feature)
      .gte('created_at', since.toISOString())
    if (error) throw error
    return count ?? 0
  },
}
