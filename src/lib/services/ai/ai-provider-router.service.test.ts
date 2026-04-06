import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/repositories/ai/ai-provider-preferences.repository', () => ({
  AiProviderPreferencesRepository: {
    getByUserId: vi.fn(),
  },
}))

vi.mock('@/lib/providers/ai', () => {
  const openAiChatMock = vi.fn()
  const anthropicChatMock = vi.fn()
  return {
    createOpenAIProvider: () => ({
      chat: openAiChatMock,
      getModelId: () => 'gpt-4o-mini',
    }),
    createAnthropicProvider: () => ({
      chat: anthropicChatMock,
      getModelId: () => 'claude-sonnet',
    }),
    getOpenAIModelFromEnv: () => 'gpt-4o-mini',
    getAnthropicModelFromEnv: () => 'claude-sonnet',
    __testMocks: { openAiChatMock, anthropicChatMock },
  }
})

import { AITrainerServiceError, AI_ERROR_CODE } from '@/lib/services/ai/ai-errors'
import { resolveRoutingPlan, AiProviderRouter } from '@/lib/services/ai/ai-provider-router.service'
import type { AIMessage, ChatResponse } from '@/lib/domain/ai.types'
import { AiProviderPreferencesRepository } from '@/lib/repositories/ai/ai-provider-preferences.repository'
import * as Providers from '@/lib/providers/ai'

const userId = 'user-1'
const userMessage: AIMessage = { role: 'user', content: 'Hello' }

function makeChatResponse(content: string): ChatResponse {
  return {
    message: { role: 'assistant', content },
    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
    finishReason: 'stop',
  }
}

const originalEnv = { ...process.env }

describe('AiProviderRouter - selection & fallback', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('uses prefs default provider + prefs fallback provider when both usable', async () => {
    process.env.OPENAI_API_KEY = 'openai-key'
    process.env.ANTHROPIC_API_KEY = 'anthropic-key'

    vi.mocked(AiProviderPreferencesRepository.getByUserId).mockResolvedValue({
      userId,
      defaultProvider: 'openai',
      fallbackProvider: 'anthropic',
      allowFallback: true,
      updatedAt: new Date(),
    })

    const plan = await resolveRoutingPlan(userId)
    expect(plan.primary).toBe('openai')
    expect(plan.fallback).toBe('anthropic')
  })

  it('does not allow fallback when fallback equals default provider', async () => {
    process.env.OPENAI_API_KEY = 'openai-key'
    process.env.ANTHROPIC_API_KEY = 'anthropic-key'

    vi.mocked(AiProviderPreferencesRepository.getByUserId).mockResolvedValue({
      userId,
      defaultProvider: 'openai',
      fallbackProvider: 'openai',
      allowFallback: true,
      updatedAt: new Date(),
    })

    const plan = await resolveRoutingPlan(userId)
    expect(plan.primary).toBe('openai')
    expect(plan.fallback).toBeNull()
  })

  it('uses env default provider when prefs are missing', async () => {
    process.env.OPENAI_API_KEY = 'openai-key'
    process.env.ANTHROPIC_API_KEY = 'anthropic-key'
    process.env.AI_DEFAULT_PROVIDER = 'anthropic'

    vi.mocked(AiProviderPreferencesRepository.getByUserId).mockResolvedValue(null)

    const plan = await resolveRoutingPlan(userId)
    expect(plan.primary).toBe('anthropic')
    expect(plan.fallback).toBeNull()
  })

  it('falls back to first configured usable provider when env default is missing/invalid', async () => {
    process.env.OPENAI_API_KEY = 'openai-key'
    process.env.ANTHROPIC_API_KEY = 'anthropic-key'
    delete process.env.AI_DEFAULT_PROVIDER

    vi.mocked(AiProviderPreferencesRepository.getByUserId).mockResolvedValue(null)

    const plan = await resolveRoutingPlan(userId)
    expect(plan.primary).toBe('openai') // router order: openai then anthropic
    expect(plan.fallback).toBeNull()
  })

  it('routes to the only usable provider when one API key is missing', async () => {
    process.env.OPENAI_API_KEY = ''
    process.env.ANTHROPIC_API_KEY = 'anthropic-key'
    delete process.env.AI_DEFAULT_PROVIDER

    vi.mocked(AiProviderPreferencesRepository.getByUserId).mockResolvedValue(null)

    const plan = await resolveRoutingPlan(userId)
    expect(plan.primary).toBe('anthropic')
    expect(plan.fallback).toBeNull()
  })

  it('retries with fallback provider when primary chat fails', async () => {
    process.env.OPENAI_API_KEY = 'openai-key'
    process.env.ANTHROPIC_API_KEY = 'anthropic-key'

    vi.mocked(AiProviderPreferencesRepository.getByUserId).mockResolvedValue({
      userId,
      defaultProvider: 'openai',
      fallbackProvider: 'anthropic',
      allowFallback: true,
      updatedAt: new Date(),
    })

    const { openAiChatMock, anthropicChatMock } = (Providers as any).__testMocks as {
      openAiChatMock: ReturnType<typeof vi.fn>
      anthropicChatMock: ReturnType<typeof vi.fn>
    }
    openAiChatMock.mockRejectedValue(new Error('primary failed'))
    anthropicChatMock.mockResolvedValue(makeChatResponse('fallback ok'))

    const result = await AiProviderRouter.chat(userId, [userMessage], { maxTokens: 10 })
    expect(result.providerUsed).toBe('anthropic')
    expect(result.attemptedFallback).toBe(true)
    expect(result.response.message.content).toBe('fallback ok')
  })

  it('throws normalized PROVIDER_RESPONSE_FAILED when no fallback exists', async () => {
    process.env.OPENAI_API_KEY = 'openai-key'
    process.env.ANTHROPIC_API_KEY = 'anthropic-key'

    vi.mocked(AiProviderPreferencesRepository.getByUserId).mockResolvedValue({
      userId,
      defaultProvider: 'openai',
      fallbackProvider: 'anthropic',
      allowFallback: false,
      updatedAt: new Date(),
    })

    const { openAiChatMock } = (Providers as any).__testMocks as {
      openAiChatMock: ReturnType<typeof vi.fn>
    }
    openAiChatMock.mockRejectedValue(new Error('primary failed'))

    await expect(AiProviderRouter.chat(userId, [userMessage], { maxTokens: 10 })).rejects.toMatchObject({
      code: AI_ERROR_CODE.PROVIDER_RESPONSE_FAILED,
    })
    try {
      await AiProviderRouter.chat(userId, [userMessage], { maxTokens: 10 })
      throw new Error('Expected chat to throw')
    } catch (e) {
      expect(e).toBeInstanceOf(AITrainerServiceError)
      if (e instanceof AITrainerServiceError) {
        expect(e.code).toBe(AI_ERROR_CODE.PROVIDER_RESPONSE_FAILED)
      }
    }
  })
})

