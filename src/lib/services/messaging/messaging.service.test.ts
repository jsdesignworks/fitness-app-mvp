import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MessagingService } from './messaging.service'

vi.mock('@/lib/repositories/user/user.repository', () => ({
  UserRepository: {
    getMessagePreferences: vi.fn().mockResolvedValue({
      enabled: true,
      messageFrequency: 'normal',
      toneStyle: 'calm',
      preferredChannels: ['in_app'],
    }),
    getById: vi.fn().mockResolvedValue({ firstName: 'Test' }),
  },
}))

vi.mock('@/lib/repositories/messaging/template.repository', () => ({
  MessageTemplateRepository: { getByTriggerAndTone: vi.fn().mockResolvedValue([]) },
}))

vi.mock('@/lib/repositories/messaging/event.repository', () => ({
  MessageEventRepository: {
    create: vi.fn().mockResolvedValue({
      id: 'ev-1',
      userId: 'user-1',
      triggerKey: 'workout_complete',
      channel: 'in_app',
      deliveryStatus: 'sent',
    }),
  },
}))

vi.mock('@/lib/services/messaging/template.service', () => ({
  TemplateService: {
    selectTemplate: vi.fn().mockResolvedValue(null),
    renderTemplate: vi.fn().mockResolvedValue('Great workout!'),
  },
}))

vi.mock('@/lib/services/messaging/cooldown.service', () => ({
  CooldownService: {
    canTrigger: vi.fn().mockResolvedValue({ allowed: true }),
    recordTrigger: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('@/lib/utils/logger', () => ({ logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn() } }))

describe('MessagingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns ok(null) when user has messaging disabled', async () => {
    const { UserRepository } = await import('@/lib/repositories/user/user.repository')
    vi.mocked(UserRepository.getMessagePreferences).mockResolvedValueOnce({
      enabled: false,
      messageFrequency: 'normal',
      toneStyle: 'calm',
      preferredChannels: ['in_app'],
    })
    const result = await MessagingService.triggerEvent('workout_complete', {
      userId: 'user-1',
      sessionId: 'sess-1',
      timestamp: new Date(),
    })
    expect(result.success).toBe(true)
    expect((result as { data: unknown }).data).toBeNull()
  })

  it('returns err when userId is missing in context', async () => {
    const result = await MessagingService.triggerEvent('workout_complete', {
      userId: '',
      timestamp: new Date(),
    } as never)
    expect(result.success).toBe(false)
    expect((result as unknown as { error: { code: string } }).error.code).toBe('INVALID_CONTEXT')
  })
})
