import {
  AIProviderInterface,
  AIMessage,
  ChatOptions,
  ChatResponse,
  GenerateOptions,
} from '@/lib/domain/ai.types'

export function getAnthropicModelFromEnv(): string {
  return process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-4-5-20250929'
}

export class AnthropicChatProvider implements AIProviderInterface {
  private readonly apiKey: string
  private readonly model: string
  private readonly baseUrl = 'https://api.anthropic.com/v1'

  constructor(config: { apiKey: string; model: string }) {
    this.apiKey = config.apiKey
    this.model = config.model
  }

  getModelId(): string {
    return this.model
  }

  async chat(messages: AIMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const systemPrompt = this.extractSystemPrompt(messages)
    const anthropicMessages = this.convertMessages(messages)

    const body: Record<string, unknown> = {
      model: this.model,
      messages: anthropicMessages,
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature || 0.7,
      stop_sequences: options?.stopSequences,
    }
    if (systemPrompt) {
      body.system = systemPrompt
    }

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Claude API error: ${error.slice(0, 500)}`)
    }

    const data = (await response.json()) as {
      content: { text: string }[]
      usage: { input_tokens: number; output_tokens: number }
      stop_reason?: string
    }

    return {
      message: {
        role: 'assistant',
        content: data.content[0].text,
        metadata: {
          timestamp: new Date(),
          tokens: data.usage.output_tokens,
          modelUsed: this.model,
        },
      },
      usage: {
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
      finishReason: data.stop_reason === 'end_turn' ? 'stop' : 'length',
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

    const response = await this.chat(
      [
        {
          role: 'user',
          content: enhancedPrompt,
        },
      ],
      {
        maxTokens: options?.maxTokens || 4096,
        temperature: options?.temperature || 0.3,
      }
    )

    const jsonMatch = response.message.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    try {
      const parsed = JSON.parse(jsonMatch[0])
      return parsed as T
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error}`)
    }
  }

  async streamChat(
    messages: AIMessage[],
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const systemPrompt = this.extractSystemPrompt(messages)
    const anthropicMessages = this.convertMessages(messages)
    const body: Record<string, unknown> = {
      model: this.model,
      messages: anthropicMessages,
      max_tokens: 4096,
      stream: true,
    }
    if (systemPrompt) body.system = systemPrompt

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter((line) => line.trim())

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6))

          if (data.type === 'content_block_delta' && data.delta?.text) {
            onChunk(data.delta.text)
          }
        }
      }
    }
  }

  private extractSystemPrompt(messages: AIMessage[]): string | null {
    const systemMsg = messages.find((m) => m.role === 'system')
    return systemMsg?.content ?? null
  }

  private convertMessages(messages: AIMessage[]) {
    return messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }))
  }
}

export function createAnthropicProvider(config: { apiKey: string; model: string }): AnthropicChatProvider {
  return new AnthropicChatProvider(config)
}

