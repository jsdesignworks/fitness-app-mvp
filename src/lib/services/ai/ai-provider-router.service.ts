/**
 * Multi-provider AI routing with availability checks and optional fallback.
 */

import type { AIMessage, ChatOptions, ChatResponse } from '@/lib/domain/ai.types'
import {
  AiProviderPreferencesRepository,
  type AiRoutingProvider,
} from '@/lib/repositories/ai/ai-provider-preferences.repository'
import {
  createAnthropicProvider,
  createOpenAIProvider,
  getAnthropicModelFromEnv,
  getOpenAIModelFromEnv,
  type AnthropicChatProvider,
  type OpenAIChatProvider,
} from '@/lib/providers/ai'
import { AI_ERROR_CODE, AITrainerServiceError } from '@/lib/services/ai/ai-errors'

export type ProviderAvailability = {
  openai: { usable: boolean; missing: string[] }
  anthropic: { usable: boolean; missing: string[] }
}

export type RoutedChatResult = {
  response: ChatResponse
  providerUsed: AiRoutingProvider
  modelUsed: string
  attemptedFallback: boolean
}

type ProviderInstance = OpenAIChatProvider | AnthropicChatProvider

function envDefaultProvider(): AiRoutingProvider | null {
  const raw = process.env.AI_DEFAULT_PROVIDER?.trim().toLowerCase()
  if (raw === 'openai' || raw === 'anthropic') return raw
  return null
}

export function getProviderAvailability(): ProviderAvailability {
  const openaiKey = process.env.OPENAI_API_KEY?.trim()
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim()
  const openaiMissing: string[] = []
  const anthropicMissing: string[] = []
  if (!openaiKey) openaiMissing.push('OPENAI_API_KEY')
  if (!anthropicKey) anthropicMissing.push('ANTHROPIC_API_KEY')
  // Model env vars are optional (defaults exist); only require API keys.
  return {
    openai: { usable: openaiMissing.length === 0, missing: openaiMissing },
    anthropic: { usable: anthropicMissing.length === 0, missing: anthropicMissing },
  }
}

function getProviderInstance(id: AiRoutingProvider): ProviderInstance {
  const avail = getProviderAvailability()
  if (id === 'openai') {
    if (!avail.openai.usable) {
      throw new AITrainerServiceError(
        AI_ERROR_CODE.INVALID_PROVIDER_CONFIGURATION,
        'OpenAI is not configured for this app.',
        503
      )
    }
    return createOpenAIProvider({
      apiKey: process.env.OPENAI_API_KEY!.trim(),
      model: getOpenAIModelFromEnv(),
    })
  }
  if (!avail.anthropic.usable) {
    throw new AITrainerServiceError(
      AI_ERROR_CODE.INVALID_PROVIDER_CONFIGURATION,
      'Anthropic is not configured for this app.',
      503
    )
  }
  return createAnthropicProvider({
    apiKey: process.env.ANTHROPIC_API_KEY!.trim(),
    model: getAnthropicModelFromEnv(),
  })
}

function listUsableProviders(): AiRoutingProvider[] {
  const a = getProviderAvailability()
  const out: AiRoutingProvider[] = []
  if (a.openai.usable) out.push('openai')
  if (a.anthropic.usable) out.push('anthropic')
  return out
}

/**
 * Resolve primary + optional fallback from DB prefs + env + availability.
 * Enforces default !== fallback when both are set in prefs.
 */
export async function resolveRoutingPlan(userId: string): Promise<{
  primary: AiRoutingProvider
  fallback: AiRoutingProvider | null
}> {
  const prefs = await AiProviderPreferencesRepository.getByUserId(userId)
  const usable = listUsableProviders()

  if (usable.length === 0) {
    throw new AITrainerServiceError(
      AI_ERROR_CODE.INVALID_PROVIDER_CONFIGURATION,
      'AI is not configured. Add API keys for at least one provider.',
      503
    )
  }

  let primary: AiRoutingProvider | null = null

  const prefDefault = prefs?.defaultProvider ?? null
  if (prefDefault && usable.includes(prefDefault)) {
    primary = prefDefault
  } else {
    const envP = envDefaultProvider()
    if (envP && usable.includes(envP)) {
      primary = envP
    } else {
      // Deterministic fallback: first configured available provider
      // (defined by `listUsableProviders()` order).
      primary = usable[0]
    }
  }

  let fallback: AiRoutingProvider | null = null
  if (prefs?.allowFallback && prefs.fallbackProvider) {
    const invalidSame =
      prefs.defaultProvider != null && prefs.fallbackProvider === prefs.defaultProvider
    if (
      !invalidSame &&
      usable.includes(prefs.fallbackProvider) &&
      prefs.fallbackProvider !== primary
    ) {
      fallback = prefs.fallbackProvider
    }
  }

  return { primary, fallback }
}

async function tryChat(
  providerId: AiRoutingProvider,
  messages: AIMessage[],
  options?: ChatOptions
): Promise<{ response: ChatResponse; modelUsed: string }> {
  const client = getProviderInstance(providerId)
  const response = await client.chat(messages, options)
  const modelUsed =
    'getModelId' in client && typeof client.getModelId === 'function'
      ? client.getModelId()
      : providerId === 'openai'
        ? getOpenAIModelFromEnv()
        : getAnthropicModelFromEnv()
  return { response, modelUsed }
}

export const AiProviderRouter = {
  getProviderAvailability,

  /**
   * Run chat with primary provider; optionally retry on failure with fallback.
   */
  async chat(
    userId: string,
    messages: AIMessage[],
    options?: ChatOptions
  ): Promise<RoutedChatResult> {
    const { primary, fallback } = await resolveRoutingPlan(userId)
    let attemptedFallback = false

    try {
      const { response, modelUsed } = await tryChat(primary, messages, options)
      return { response, providerUsed: primary, modelUsed, attemptedFallback: false }
    } catch (primaryErr) {
      if (!fallback) {
        throw normalizeProviderFailure(primaryErr)
      }
      attemptedFallback = true
      try {
        const { response, modelUsed } = await tryChat(fallback, messages, options)
        return { response, providerUsed: fallback, modelUsed, attemptedFallback }
      } catch (fallbackErr) {
        throw normalizeProviderFailure(fallbackErr)
      }
    }
  },
}

function normalizeProviderFailure(err: unknown): Error {
  if (err instanceof AITrainerServiceError) return err
  const msg = err instanceof Error ? err.message : String(err)
  const safe = msg.length > 240 ? `${msg.slice(0, 240)}…` : msg
  return new AITrainerServiceError(
    AI_ERROR_CODE.PROVIDER_RESPONSE_FAILED,
    `The AI provider failed to respond. ${safe}`,
    502
  )
}
