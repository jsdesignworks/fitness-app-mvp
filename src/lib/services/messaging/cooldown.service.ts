import { MessageEventRepository } from '@/lib/repositories/messaging/event.repository'
import type { TriggerKey } from '@/lib/domain/messaging.types'

const COOLDOWN_MINUTES: Record<string, number> = {
  low: 120,
  normal: 60,
  high: 30,
}

export const CooldownService = {
  async canTrigger(
    userId: string,
    triggerKey: TriggerKey,
    messageFrequency: string
  ): Promise<{ allowed: boolean; nextAllowedAt?: Date }> {
    const last = await MessageEventRepository.getLastForCooldown(userId, triggerKey)
    if (!last) return { allowed: true }

    const minutes = COOLDOWN_MINUTES[messageFrequency] ?? 60
    const nextAllowedAt = new Date(last.createdAt.getTime() + minutes * 60 * 1000)
    const now = new Date()
    if (now < nextAllowedAt) {
      return { allowed: false, nextAllowedAt }
    }
    return { allowed: true }
  },

  async recordTrigger(_userId: string, _triggerKey: TriggerKey): Promise<void> {
    // No-op: event creation in MessagingService is the record
  },
}
