// src/lib/services/messaging/messaging.service.ts

import { MessageTemplateRepository } from '@/lib/repositories/messaging/template.repository'
import { MessageEventRepository } from '@/lib/repositories/messaging/event.repository'
import { UserRepository } from '@/lib/repositories/user/user.repository'
import { TemplateService } from './template.service'
import { CooldownService } from './cooldown.service'
import { Result, ok, err } from '@/lib/domain/shared/types'
import { MessageContext, MessageEvent, TriggerKey } from '@/lib/domain/messaging.types'
import { AppError } from '@/lib/utils/errors'
import { logger } from '@/lib/utils/logger'

/**
 * MessagingService
 * 
 * Handles all user-facing messages (motivational, reminder, celebration, etc.)
 * 
 * Key principles:
 * - Respects quiet hours
 * - Enforces cooldowns
 * - Personalizes based on tone preference
 * - Never spammy
 * 
 * This is CALLABLE from:
 * - Workout completion (via service)
 * - Edge Functions (cron reminders)
 * - AI trainer (contextual tips)
 * - Calendar events
 */
export class MessagingService {
  /**
   * Trigger a message based on an event
   * 
   * Examples:
   * - triggerEvent('workout_complete', { userId, sessionId, stats, prs })
   * - triggerEvent('streak_milestone', { userId, streakCount: 7 })
   * - triggerEvent('pr_achieved', { userId, exercise, newRecord })
   */
  static async triggerEvent(
    triggerKey: TriggerKey,
    context: MessageContext
  ): Promise<Result<MessageEvent | null>> {
    try {
      const userId = context.userId
      if (!userId) {
        return err(new AppError('INVALID_CONTEXT', 'userId is required'))
      }
      logger.info('Evaluating message trigger', { triggerKey, userId })

      // 1. Get user preferences (tone, quiet hours, frequency)
      const userPrefs = await UserRepository.getMessagePreferences(userId)
      if (!userPrefs.enabled) {
        logger.debug('Messaging disabled for user', { userId })
        return ok(null) // User opted out
      }

      // 2. Check if we're in quiet hours
      if (this.isQuietHours(userPrefs.quietHoursStart ?? null, userPrefs.quietHoursEnd ?? null)) {
        logger.debug('In quiet hours, skipping message', { userId })
        return ok(null)
      }

      // 3. Check cooldowns (don't spam the same trigger)
      const cooldownCheck = await CooldownService.canTrigger(
        userId,
        triggerKey,
        userPrefs.messageFrequency
      )

      if (!cooldownCheck.allowed) {
        logger.debug('Cooldown active, skipping message', { 
          userId, 
          triggerKey,
          nextAllowedAt: cooldownCheck.nextAllowedAt 
        })
        return ok(null)
      }

      // 4. Select appropriate template
      const template = await TemplateService.selectTemplate(
        triggerKey,
        userPrefs.toneStyle,
        context
      )

      if (!template) {
        logger.warn('No template found for trigger', { triggerKey, toneStyle: userPrefs.toneStyle })
        return ok(null)
      }

      // 5. Render template with user context
      const templateContext = await this.buildTemplateContext(userId, context)
      const renderedMessage = await TemplateService.renderTemplate(
        template,
        templateContext
      )

      // 6. Queue/send the message
      const messageEvent = await this.deliverMessage(
        userId,
        triggerKey,
        template.id,
        renderedMessage,
        userPrefs.preferredChannels
      )

      // 7. Record cooldown
      await CooldownService.recordTrigger(userId, triggerKey)

      logger.info('Message triggered successfully', { 
        userId, 
        triggerKey, 
        messageId: messageEvent.id 
      })

      return ok(messageEvent)

    } catch (error) {
      logger.error('Failed to trigger message', { error, triggerKey, context })
      return err(new AppError('MESSAGE_TRIGGER_FAILED', 'Failed to trigger message'))
    }
  }

  /**
   * Evaluate streak reminders (called by Edge Function cron)
   * 
   * Finds users with active streaks at risk and nudges them
   */
  static async evaluateStreakReminders(): Promise<void> {
    try {
      logger.info('Evaluating streak reminders')

      // Find users who:
      // - Have a streak >= 3 days
      // - Haven't logged a workout today
      // - Are within their active hours (not sleeping)
      const usersAtRisk = await UserRepository.getUsersWithStreaksAtRisk()

      for (const user of usersAtRisk) {
        await this.triggerEvent('streak_reminder', {
          userId: user.id,
          streakCount: user.currentStreak,
          timestamp: new Date(),
        })
      }

      logger.info('Streak reminders evaluated', { count: usersAtRisk.length })

    } catch (error) {
      logger.error('Failed to evaluate streak reminders', { error })
    }
  }

  /**
   * Send milestone celebrations (called after major achievements)
   */
  static async celebrateMilestone(
    userId: string,
    milestoneType: string,
    data: any
  ): Promise<void> {
    await this.triggerEvent('milestone_reached', {
      userId,
      milestoneType,
      data,
      timestamp: new Date(),
    })
  }

  /**
   * Private: Check if current time is in user's quiet hours
   */
  private static isQuietHours(
    quietStart: string | null, // e.g., "22:00"
    quietEnd: string | null     // e.g., "08:00"
  ): boolean {
    if (!quietStart || !quietEnd) return false

    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    const [startHour, startMinute] = quietStart.split(':').map(Number)
    const [endHour, endMinute] = quietEnd.split(':').map(Number)

    const currentTime = currentHour * 60 + currentMinute
    const startTime = startHour * 60 + startMinute
    const endTime = endHour * 60 + endMinute

    // Handle overnight quiet hours (22:00 to 08:00)
    if (endTime < startTime) {
      return currentTime >= startTime || currentTime <= endTime
    }

    return currentTime >= startTime && currentTime <= endTime
  }

  /**
   * Private: Build context for template rendering
   */
  private static async buildTemplateContext(
    userId: string,
    eventContext: MessageContext
  ): Promise<Record<string, any>> {
    const user = await UserRepository.getById(userId)

    return {
      first_name: user?.firstName || 'there',
      username: user?.username,
      ...eventContext,
    }
  }

  /**
   * Private: Actually deliver the message
   * For MVP, this might just create an in-app notification
   * Later: push notifications, email, SMS
   */
  private static async deliverMessage(
    userId: string,
    triggerKey: TriggerKey,
    templateId: string,
    renderedBody: string,
    preferredChannels: string[]
  ): Promise<MessageEvent> {
    const channel = preferredChannels.includes('in_app') ? 'in_app' : (preferredChannels[0] ?? 'in_app')
    const event = await MessageEventRepository.create({
      userId,
      triggerKey,
      templateId,
      renderedBody,
      channel,
      deliveryStatus: 'queued',
    })

    if (channel === 'in_app') {
      const now = new Date()
      await MessageEventRepository.updateStatus(event.id, 'sent', now)
      return { ...event, deliveryStatus: 'sent' as const, deliveredAt: now }
    }

    return event
  }
}
