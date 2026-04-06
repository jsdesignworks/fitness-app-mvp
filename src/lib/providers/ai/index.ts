/**
 * AI provider adapters (OpenAI + Anthropic).
 *
 * Provider implementations live in:
 * - `openai.provider.ts`
 * - `anthropic.provider.ts`
 *
 * Keep this module as a thin barrel so imports stay provider-agnostic.
 */

import {
  getOpenAIModelFromEnv,
  OpenAIChatProvider,
  createOpenAIProvider,
} from './openai.provider'

import {
  getAnthropicModelFromEnv,
  AnthropicChatProvider,
  createAnthropicProvider,
} from './anthropic.provider'

export type AiRoutingProviderId = 'openai' | 'anthropic'

export {
  getOpenAIModelFromEnv,
  OpenAIChatProvider,
  createOpenAIProvider,
  getAnthropicModelFromEnv,
  AnthropicChatProvider,
  createAnthropicProvider,
}
