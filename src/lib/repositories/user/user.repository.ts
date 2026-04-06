import { UserMessagePreferencesRepository } from '@/lib/repositories/messaging/preferences.repository'

export const UserRepository = {
  async getMessagePreferences(userId: string): Promise<{
    enabled: boolean
    quietHoursStart?: string | null
    quietHoursEnd?: string | null
    messageFrequency: string
    toneStyle: string
    preferredChannels: string[]
  }> {
    const prefs = await UserMessagePreferencesRepository.getByUserId(userId)
    if (!prefs) {
      return {
        enabled: true,
        messageFrequency: 'normal',
        toneStyle: 'calm',
        preferredChannels: ['in_app'],
      }
    }
    return {
      enabled: prefs.enabled !== false,
      quietHoursStart: prefs.quietHoursStart ?? null,
      quietHoursEnd: prefs.quietHoursEnd ?? null,
      messageFrequency: prefs.messageFrequency,
      toneStyle: prefs.toneStyle,
      preferredChannels: prefs.preferredChannels,
    }
  },

  async getUsersWithStreaksAtRisk(): Promise<Array<{ id: string; currentStreak: number }>> {
    return []
  },

  async getById(_userId: string): Promise<{ firstName?: string; username?: string } | null> {
    return { firstName: 'User' }
  },
}
