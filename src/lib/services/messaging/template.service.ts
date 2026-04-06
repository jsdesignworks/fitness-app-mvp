import { MessageTemplateRepository } from '@/lib/repositories/messaging/template.repository'
import type { MessageTemplate, MessageContext, TriggerKey } from '@/lib/domain/messaging.types'

export const TemplateService = {
  async selectTemplate(
    triggerKey: TriggerKey,
    toneStyle: string,
    _context: MessageContext | Record<string, unknown>
  ): Promise<MessageTemplate | null> {
    const templates = await MessageTemplateRepository.getByTriggerAndTone(triggerKey, toneStyle)
    if (templates.length === 0) return null
    // Pick first; could weight by variantWeight or random later
    return templates[0] ?? null
  },

  async renderTemplate(
    template: MessageTemplate,
    context: Record<string, unknown>
  ): Promise<string> {
    let text = template.templateText
    const placeholders = text.match(/\{(\w+)\}/g) ?? []
    for (const ph of placeholders) {
      const key = ph.slice(1, -1)
      const value = context[key] ?? context[key === 'firstName' ? 'first_name' : key]
      text = text.replace(ph, String(value ?? ''))
    }
    return text
  },
}
