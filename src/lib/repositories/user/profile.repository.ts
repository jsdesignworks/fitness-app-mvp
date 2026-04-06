import { getServiceRoleClient } from '@/lib/utils/db'
import type { UserProfile, UpdateUserProfileData } from '@/lib/domain/user-profile.types'
import { getAllowedWidgetIds } from '@/lib/dashboard/constants'

function mapDashboardPrefs(raw: unknown): UserProfile['dashboardPreferences'] {
  if (raw == null || typeof raw !== 'object') return null
  const allowed = new Set(getAllowedWidgetIds())
  const o = raw as Record<string, unknown>
  const order = Array.isArray(o.widgetOrder)
    ? (o.widgetOrder as unknown[]).filter((x): x is string => typeof x === 'string' && allowed.has(x))
    : []
  const vis: Record<string, boolean> = {}
  if (o.widgetVisibility && typeof o.widgetVisibility === 'object' && !Array.isArray(o.widgetVisibility)) {
    for (const [k, v] of Object.entries(o.widgetVisibility as Record<string, unknown>)) {
      if (allowed.has(k) && typeof v === 'boolean') vis[k] = v
    }
  }
  return { widgetOrder: order, widgetVisibility: vis }
}

function mapRow(row: Record<string, unknown>): UserProfile {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    onboardingCompletedAt: row.onboarding_completed_at != null ? new Date(String(row.onboarding_completed_at)) : null,
    onboardingStep: row.onboarding_step != null ? String(row.onboarding_step) : null,
    goal: row.goal != null ? String(row.goal) : null,
    dashboardPreferences: mapDashboardPrefs(row.dashboard_preferences),
    weightUnit: row.weight_unit === 'lb' ? 'lb' : 'kg',
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  }
}

export const UserProfileRepository = {
  async getByUserId(userId: string): Promise<UserProfile | null> {
    const supabase = getServiceRoleClient()
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error
    return data ? mapRow(data as Record<string, unknown>) : null
  },

  async getOrCreate(userId: string): Promise<UserProfile> {
    const existing = await this.getByUserId(userId)
    if (existing) return existing
    const supabase = getServiceRoleClient()
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({ user_id: userId })
      .select()
      .single()
    if (error) throw error
    return mapRow(data as Record<string, unknown>)
  },

  async update(userId: string, updates: UpdateUserProfileData): Promise<UserProfile> {
    const supabase = getServiceRoleClient()
    const payload: Record<string, unknown> = {}
    if (updates.onboardingCompletedAt !== undefined) payload.onboarding_completed_at = updates.onboardingCompletedAt?.toISOString() ?? null
    if (updates.onboardingStep !== undefined) payload.onboarding_step = updates.onboardingStep ?? null
    if (updates.goal !== undefined) payload.goal = updates.goal ?? null
    if (updates.dashboardPreferences !== undefined) payload.dashboard_preferences = updates.dashboardPreferences ?? null
    if (updates.weightUnit !== undefined) {
      payload.weight_unit = updates.weightUnit ?? null
    }
    const { data, error } = await supabase
      .from('user_profiles')
      .update(payload)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    return mapRow(data as Record<string, unknown>)
  },

  async upsert(userId: string, updates: UpdateUserProfileData): Promise<UserProfile> {
    const supabase = getServiceRoleClient()
    const payload: Record<string, unknown> = {
      user_id: userId,
      onboarding_completed_at: updates.onboardingCompletedAt?.toISOString() ?? null,
      onboarding_step: updates.onboardingStep ?? null,
      goal: updates.goal ?? null,
    }
    if (updates.dashboardPreferences !== undefined) payload.dashboard_preferences = updates.dashboardPreferences ?? null
    if (updates.weightUnit !== undefined) payload.weight_unit = updates.weightUnit ?? null
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single()
    if (error) throw error
    return mapRow(data as Record<string, unknown>)
  },
}
