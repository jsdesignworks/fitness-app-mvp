import {
  AIProviderInterface,
  AIMessage,
  ChatOptions,
  ChatResponse,
  GenerateOptions,
} from '@/lib/domain/ai.types'

export function getOpenAIModelFromEnv(): string {
  return process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini'
}

export class OpenAIChatProvider implements AIProviderInterface {
  private readonly apiKey: string
  private readonly model: string
  private readonly baseUrl = 'https://api.openai.com/v1'

  constructor(config: { apiKey: string; model: string }) {
    this.apiKey = config.apiKey
    this.model = config.model
  }

  getModelId(): string {
    return this.model
  }

  async chat(messages: AIMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const sys = messages.find((m) => m.role === 'system')?.content
    const rest = messages.filter((m) => m.role !== 'system')
    const openaiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = []
    if (sys) openaiMessages.push({ role: 'system', content: sys })
    for (const m of rest) {
      if (m.role === 'user' || m.role === 'assistant') {
        openaiMessages.push({ role: m.role, content: m.content })
      }
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: openaiMessages,
        max_tokens: options?.maxTokens ?? 2048,
        temperature: options?.temperature ?? 0.7,
      }),
    })

    if (!response.ok) {
      const t = await response.text()
      throw new Error(`OpenAI API error: ${response.status} ${t.slice(0, 500)}`)
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string }; finish_reason?: string }[]
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
    }
    const text = data.choices?.[0]?.message?.content ?? ''
    const usage = data.usage
    const inputTokens = usage?.prompt_tokens ?? 0
    const outputTokens = usage?.completion_tokens ?? 0

    return {
      message: {
        role: 'assistant',
        content: text,
        metadata: {
          timestamp: new Date(),
          tokens: outputTokens,
          modelUsed: this.model,
        },
      },
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: usage?.total_tokens ?? inputTokens + outputTokens,
      },
      finishReason: 'stop',
    }
  }

  async generateStructured<T>(
    prompt: string,
    schema: unknown,
    options?: GenerateOptions
  ): Promise<T> {
    const enhancedPrompt = `${prompt}

IMPORTANT: Respond ONLY with valid JSON matching this schema. No markdown, no explanation, just the JSON object.

Schema:
${JSON.stringify(schema, null, 2)}`

    const res = await this.chat([{ role: 'user', content: enhancedPrompt }], {
      maxTokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature ?? 0.3,
    })
    const jsonMatch = res.message.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in response')
    try {
      return JSON.parse(jsonMatch[0]) as T
    } catch (e) {
      throw new Error(`Failed to parse JSON: ${e}`)
    }
  }

  async streamChat(
    messages: AIMessage[],
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const full = await this.chat(messages)
    onChunk(full.message.content)
  }
}

export function createOpenAIProvider(config: { apiKey: string; model: string }): OpenAIChatProvider {
  return new OpenAIChatProvider(config)
}

