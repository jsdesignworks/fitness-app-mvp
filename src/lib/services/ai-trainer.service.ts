/**
 * AI Trainer Service
 *
 * Handles AI chat with guardrails, summarized context assembly, rate limiting,
 * multi-provider routing, and request logging.
 */

import { AiProviderRouter } from '@/lib/services/ai/ai-provider-router.service'
import {
  UserContext,
  SafetyCheck,
  SafetyViolation,
  AIMessage,
  ChatRequestResponse,
  AiContextPreview,
} from '@/lib/domain/ai.types'
import { ChatSessionRepository } from '@/lib/repositories/ai/chat-session.repository'
import { ChatMessageRepository } from '@/lib/repositories/ai/chat-message.repository'
import { AiRequestLogRepository } from '@/lib/repositories/ai/ai-request-log.repository'
import { SessionRepository } from '@/lib/repositories/workout/session.repository'
import { ScheduledWorkoutRepository } from '@/lib/repositories/scheduling/scheduled-workout.repository'
import { UserRepository } from '@/lib/repositories/user/user.repository'
import { MessageEventRepository } from '@/lib/repositories/messaging/event.repository'
import { NutritionDayRepository } from '@/lib/repositories/nutrition/nutrition-day.repository'
import { NutritionLoggingService } from '@/lib/services/nutrition/logging.service'
import type { WorkoutSession } from '@/lib/domain/workout.types'
import type { MessageEvent } from '@/lib/domain/messaging.types'
import { AI_ERROR_CODE, AITrainerServiceError, isAITrainerServiceError } from '@/lib/services/ai/ai-errors'
import type { AiRoutingProvider } from '@/lib/repositories/ai/ai-provider-preferences.repository'

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_DEFAULT = 20
const CHAT_HISTORY_LIMIT = 20
const MAX_EXERCISE_NAMES = 8
const MAX_MESSAGE_EXCERPT = 120
const MAX_FEED_MESSAGES = 6

function truncateStr(s: string, max: number): string {
  const t = s.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return `${t.slice(0, Math.max(0, max - 1))}…`
}

function todayYMDLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Monday–Sunday (local) week range for activity counts + nutrition date filter. */
function getLocalWeekMondayToSundayYmd(): { startYmd: string; endYmd: string; start: Date; endExclusive: Date } {
  const now = new Date()
  const dow = now.getDay()
  const diffToMon = dow === 0 ? -6 : 1 - dow
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMon)
  monday.setHours(0, 0, 0, 0)
  const nextMonday = new Date(monday)
  nextMonday.setDate(monday.getDate() + 7)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return {
    startYmd: fmt(monday),
    endYmd: fmt(sunday),
    start: monday,
    endExclusive: nextMonday,
  }
}

export { AI_ERROR_CODE, AITrainerServiceError, isAITrainerServiceError }

export class AITrainerService {
  /**
   * Build user context from DB for prompt assembly (summarized; no raw rows).
   */
  static async buildContext(userId: string): Promise<UserContext> {
    const { start: weekStart, end: weekEnd } = getThisWeekRange()
    const weekActivity = getLocalWeekMondayToSundayYmd()

    const [
      user,
      allSessions,
      scheduledThisWeek,
      feedMessages,
      nutritionDay,
      sessionWeekRows,
      nutritionDatesWeek,
    ] = await Promise.all([
      UserRepository.getById(userId),
      SessionRepository.listByUser(userId),
      ScheduledWorkoutRepository.listByUserInRange(userId, weekStart, weekEnd),
      MessageEventRepository.listByUser(userId, { limit: MAX_FEED_MESSAGES, includeDismissed: false }),
      NutritionDayRepository.getByUserAndDate(userId, todayYMDLocal()),
      SessionRepository.listSessionStartsInRange(userId, weekActivity.start, weekActivity.endExclusive),
      NutritionDayRepository.getDatesWithEntries(userId, weekActivity.startYmd, weekActivity.endYmd),
    ])

    const activeSession = await SessionRepository.getActiveSession(userId)
    const completedSessions = allSessions
      .filter((s) => s.status === 'completed' && s.endedAt)
      .sort((a, b) => (b.endedAt!.getTime() ?? 0) - (a.endedAt!.getTime() ?? 0))
    const recentCompleted = completedSessions.slice(0, 10)
    const lastWorkout = recentCompleted[0]
      ? formatLastWorkout(recentCompleted[0])
      : undefined

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const completedLast7 = completedSessions.filter(
      (s) => s.endedAt && s.endedAt >= weekAgo
    ).length
    const scheduledLast7 = scheduledThisWeek.filter(
      (s) => new Date(s.startAt) >= weekAgo
    ).length
    const adherenceSummary =
      scheduledLast7 > 0
        ? `${completedLast7} of ${scheduledLast7} planned workouts completed in the last 7 days`
        : 'No scheduled workouts in the last 7 days'

    const todaySession =
      activeSession ?? getLastCompletedToday(completedSessions)

    const workoutDays = new Set<string>()
    for (const s of sessionWeekRows) {
      if (s.status === 'abandoned') continue
      const ymd = ymdFromLocalDate(s.startedAt)
      workoutDays.add(ymd)
    }
    const nutritionDays = new Set(nutritionDatesWeek)

    let nutritionToday: UserContext['nutritionToday'] | undefined
    if (nutritionDay) {
      const totals = await NutritionLoggingService.computeDayTotals(nutritionDay.id, nutritionDay.date, {
        targetCaloriesKcal: nutritionDay.targetCaloriesKcal,
        targetProteinG: nutritionDay.targetProteinG,
        targetCarbsG: nutritionDay.targetCarbsG,
        targetFatG: nutritionDay.targetFatG,
      })
      const hasEntries =
        totals.totalCalories > 0 ||
        totals.totalProtein > 0 ||
        totals.totalCarbs > 0 ||
        totals.totalFat > 0
      nutritionToday = {
        calories: Math.round(totals.totalCalories),
        proteinG: Math.round(totals.totalProtein * 10) / 10,
        carbsG: Math.round(totals.totalCarbs * 10) / 10,
        fatG: Math.round(totals.totalFat * 10) / 10,
        targetCalories: totals.targetCalories,
        targetProteinG: totals.targetProtein,
        hasEntries,
      }
    }

    const messagingSignals = summarizeFeedMessages(feedMessages)

    return {
      user: {
        id: userId,
        firstName: user?.firstName ?? 'User',
        goals: [],
        experience: 'intermediate',
        equipment: [],
      },
      recentActivity: {
        lastWorkout,
        currentStreak: undefined,
        weeklyVolume: completedLast7,
      },
      preferences: {
        workoutFrequency: 4,
        sessionDuration: 60,
      },
      todaySession: todaySession
        ? {
            notes: todaySession.notes,
            sessionExercises: (todaySession.sessionExercises ?? []).slice(0, MAX_EXERCISE_NAMES),
          }
        : undefined,
      adherenceSummary,
      scheduledThisWeek: scheduledThisWeek.map((s) => ({
        title: truncateStr(s.titleOverride ?? 'Workout', 80),
        startAt: s.startAt,
        status: s.status,
      })),
      nutritionToday,
      calendarWeek: {
        daysWithWorkout: workoutDays.size,
        daysWithNutrition: nutritionDays.size,
        weekLabel: `${weekActivity.startYmd} → ${weekActivity.endYmd}`,
      },
      messagingSignals,
    }
  }

  /**
   * UI-safe preview for empty chat state (grounded in the same summaries as prompts).
   */
  static async getContextPreview(userId: string): Promise<AiContextPreview> {
    const ctx = await this.buildContext(userId)
    return this.contextToPreview(ctx)
  }

  private static contextToPreview(ctx: UserContext): AiContextPreview {
    const summaryLines: string[] = []
    if (ctx.recentActivity.lastWorkout) {
      const d = ctx.recentActivity.lastWorkout.date
      const dateStr = d instanceof Date ? d.toLocaleDateString() : String(d)
      summaryLines.push(
        `Last workout: ${truncateStr(ctx.recentActivity.lastWorkout.name, 60)} (${dateStr})`
      )
    } else {
      summaryLines.push('No completed workouts on record yet.')
    }
    if (ctx.adherenceSummary) summaryLines.push(`Adherence: ${ctx.adherenceSummary}`)
    if (ctx.calendarWeek) {
      summaryLines.push(
        `This week: ${ctx.calendarWeek.daysWithWorkout} day(s) with workouts, ${ctx.calendarWeek.daysWithNutrition} day(s) with nutrition (${ctx.calendarWeek.weekLabel}).`
      )
    }
    if (ctx.nutritionToday?.hasEntries) {
      const n = ctx.nutritionToday
      summaryLines.push(
        `Today’s nutrition: ~${n.calories} kcal, P ${n.proteinG}g / C ${n.carbsG}g / F ${n.fatG}g.`
      )
    } else {
      summaryLines.push('No nutrition logged today.')
    }

    const insightTitle = 'Your coaching context'
    let insightBody =
      summaryLines.slice(0, 3).join(' ') ||
      'Start logging workouts and nutrition so the AI Trainer can personalize help.'
    insightBody = truncateStr(insightBody, 360)

    let inlineHint: string | undefined
    if (ctx.messagingSignals?.length) {
      const first = ctx.messagingSignals[0]
      inlineHint = truncateStr(
        first.title ? `${first.title}: ${first.excerpt}` : first.excerpt,
        200
      )
    } else {
      inlineHint = 'Send a message to ask about training, recovery, or your schedule.'
    }

    return {
      summaryLines: summaryLines.map((s) => truncateStr(s, 200)),
      insightTitle,
      insightBody,
      inlineHint,
    }
  }

  /**
   * Enforce safety guardrails on assistant content.
   */
  static enforceGuardrails(
    content: string,
    context: UserContext
  ): SafetyCheck {
    const violations: SafetyViolation[] = []
    const lower = content.toLowerCase()

    const medicalTerms = [
      'cure',
      'heal',
      'fix',
      'treat',
      'diagnose',
      'injury',
      'pain relief',
      'medical condition',
    ]
    for (const term of medicalTerms) {
      if (lower.includes(term)) {
        violations.push({
          type: 'medical_claim',
          severity: 'high',
          description:
            'Response contains medical terminology that could be interpreted as medical advice',
          detectedIn: extractContext(content, term),
        })
      }
    }

    const extremeIndicators = [
      'every day',
      'daily workouts',
      'max out',
      'go until failure every',
      'fast for',
      'severely restrict',
      'dangerously',
    ]
    for (const indicator of extremeIndicators) {
      if (lower.includes(indicator)) {
        violations.push({
          type: 'extreme_plan',
          severity: 'medium',
          description:
            'Response may suggest extreme or unsustainable approach',
          detectedIn: extractContext(content, indicator),
        })
      }
    }

    if (context.user.injuries?.length) {
      for (const injury of context.user.injuries) {
        if (lower.includes(injury.toLowerCase())) {
          const hasDisclaimer =
            lower.includes('consult') ||
            lower.includes('doctor') ||
            lower.includes('professional')
          if (!hasDisclaimer) {
            violations.push({
              type: 'dangerous_advice',
              severity: 'high',
              description:
                'Response mentions user injury without appropriate disclaimers',
              detectedIn: extractContext(content, injury),
            })
          }
        }
      }
    }

    return { passed: violations.length === 0, violations }
  }

  /**
   * Main chat entry: rate limit, load/create session, build context, call router, persist, log.
   */
  static async respondToChat(
    userId: string,
    sessionId: string | null,
    message: string
  ): Promise<ChatRequestResponse> {
    const limit = Number(process.env.AI_CHAT_RATE_LIMIT_PER_HOUR) || RATE_LIMIT_DEFAULT
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS)
    const count = await AiRequestLogRepository.countByUserAndFeatureSince(
      userId,
      'chat',
      since
    )
    if (count >= limit) {
      throw new AITrainerServiceError(
        AI_ERROR_CODE.RATE_LIMITED,
        'AI chat rate limit exceeded. Please try again later.',
        429
      )
    }

    let session = sessionId
      ? await ChatSessionRepository.getByIdAndUser(sessionId, userId)
      : null
    if (!session) {
      session = await ChatSessionRepository.create(userId)
    }

    const history = await ChatMessageRepository.listBySession(
      session.id,
      CHAT_HISTORY_LIMIT
    )
    const context = await this.buildContext(userId)
    const systemPrompt = this.buildSystemPrompt(context)
    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: message },
    ]

    await ChatMessageRepository.insert(session.id, 'user', message)
    ChatSessionRepository.touch(session.id).catch(() => {})

    const start = Date.now()
    let providerUsed: AiRoutingProvider | undefined
    let modelUsed = ''
    let usage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 }

    try {
      const routed = await AiProviderRouter.chat(userId, messages, {
        maxTokens: 2048,
        temperature: 0.7,
        userId,
      })
      providerUsed = routed.providerUsed
      modelUsed = routed.modelUsed
      usage = routed.response.usage

      const latencyMs = Date.now() - start

      const safetyCheck = this.enforceGuardrails(
        routed.response.message.content,
        context
      )
      const finalContent = safetyCheck.passed
        ? routed.response.message.content
        : this.getSafeFallbackMessage(safetyCheck)

      await ChatMessageRepository.insert(session.id, 'assistant', finalContent)
      ChatSessionRepository.touch(session.id).catch(() => {})

      const logEnabled = process.env.AI_REQUEST_LOG_ENABLED !== 'false'
      if (logEnabled) {
        AiRequestLogRepository.insert({
          userId,
          feature: 'chat',
          model: modelUsed,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          latencyMs,
          provider: providerUsed,
          status: 'success',
          errorMessage: null,
        }).catch(() => {})
      }

      return {
        sessionId: session.id,
        response: { role: 'assistant' as const, content: finalContent },
        usage,
        safetyCheck,
      }
    } catch (e) {
      const latencyMs = Date.now() - start
      const logEnabled = process.env.AI_REQUEST_LOG_ENABLED !== 'false'
      const errMsg =
        e instanceof Error ? truncateStr(e.message, 500) : 'Unknown error'
      if (logEnabled) {
        AiRequestLogRepository.insert({
          userId,
          feature: 'chat',
          model: modelUsed || undefined,
          inputTokens: 0,
          outputTokens: 0,
          latencyMs,
          provider: providerUsed ?? null,
          status: 'failed',
          errorMessage: errMsg,
        }).catch(() => {})
      }
      if (isAITrainerServiceError(e)) throw e
      throw e
    }
  }

  private static buildSystemPrompt(context: UserContext): string {
    const lines: string[] = [
      `You are an AI personal trainer helping ${context.user.firstName}.`,
      '',
      '## User Profile',
      `- Experience: ${context.user.experience}`,
      `- Goals: ${context.user.goals.length ? context.user.goals.join(', ') : 'General fitness'}`,
      `- Available equipment: ${context.user.equipment.length ? context.user.equipment.join(', ') : 'Not specified'}`,
    ]
    if (context.user.injuries?.length) {
      lines.push(`- Injuries/limitations: ${context.user.injuries.join(', ')}`)
    }
    if (context.user.constraints?.length) {
      lines.push(`- Constraints: ${context.user.constraints.join(', ')}`)
    }

    lines.push('', '## Recent Activity')
    if (context.recentActivity.lastWorkout) {
      const d = context.recentActivity.lastWorkout.date
      const dateStr = d instanceof Date ? d.toLocaleDateString() : String(d)
      const ex = (context.recentActivity.lastWorkout.exercises ?? [])
        .slice(0, MAX_EXERCISE_NAMES)
        .join(', ')
      lines.push(
        `- Last workout: ${context.recentActivity.lastWorkout.name} on ${dateStr}${ex ? ` (exercises include: ${ex})` : ''}`
      )
    } else {
      lines.push('- No recent workouts')
    }
    if (context.recentActivity.currentStreak != null) {
      lines.push(`- Current streak: ${context.recentActivity.currentStreak} days`)
    }
    if (context.adherenceSummary) {
      lines.push(`- Adherence: ${context.adherenceSummary}`)
    }
    if (context.todaySession) {
      const n = context.todaySession.sessionExercises?.length ?? 0
      lines.push(
        `- Today's workout: ${context.todaySession.notes ?? 'Workout'} (${n} exercises in view)`
      )
    }
    if (context.scheduledThisWeek?.length) {
      lines.push(
        `- This week's schedule: ${context.scheduledThisWeek.map((w) => `${w.title} (${w.status})`).join(', ')}`
      )
    }

    if (context.nutritionToday) {
      const n = context.nutritionToday
      if (n.hasEntries) {
        lines.push(
          '',
          '## Nutrition (today, summarized)',
          `- Logged: ~${n.calories} kcal; protein ${n.proteinG}g, carbs ${n.carbsG}g, fat ${n.fatG}g`,
          n.targetCalories != null
            ? `- Target calories (if set): ${n.targetCalories}`
            : '- Targets: not set or unavailable'
        )
        if (n.targetProteinG != null) {
          lines.push(`- Target protein (if set): ${n.targetProteinG}g`)
        }
      } else {
        lines.push('', '## Nutrition (today)', '- No entries logged today')
      }
    }

    if (context.calendarWeek) {
      lines.push(
        '',
        '## Calendar (this week, summarized)',
        `- Days with at least one workout: ${context.calendarWeek.daysWithWorkout}`,
        `- Days with nutrition entries: ${context.calendarWeek.daysWithNutrition}`
      )
    }

    if (context.messagingSignals?.length) {
      lines.push('', '## In-app updates (summarized)', ...context.messagingSignals.map(
        (m) =>
          `- [${m.messageType}] ${m.title ? `${m.title}: ` : ''}${m.excerpt}`
      ))
    }

    lines.push(
      '',
      '## Preferences',
      `- Workout frequency: ${context.preferences.workoutFrequency} days/week`,
      `- Session duration: ${context.preferences.sessionDuration} minutes`
    )
    if (context.preferences.preferredSplit) {
      lines.push(`- Preferred split: ${context.preferences.preferredSplit}`)
    }

    lines.push(
      '',
      '## CRITICAL SAFETY RULES',
      '1. NEVER provide medical advice or diagnose conditions',
      '2. NEVER recommend extreme or dangerous exercises',
      '3. ALWAYS emphasize proper form and gradual progression',
      '4. ALWAYS recommend consulting professionals for injuries or pain',
      '5. NEVER claim specific health outcomes (e.g., "cure", "fix", "heal")',
      '6. Stay within the scope of fitness coaching only',
      '',
      '## Your Role',
      '- Provide evidence-based fitness advice',
      '- Suggest appropriate exercises and progressions',
      '- Motivate and encourage consistency',
      '- Adapt recommendations to user\'s context',
      '- Be supportive but realistic',
      '',
      'Respond conversationally, keep it concise, and always prioritize safety.'
    )
    return lines.filter(Boolean).join('\n')
  }

  private static getSafeFallbackMessage(safetyCheck: SafetyCheck): string {
    const high = safetyCheck.violations.filter((v) => v.severity === 'high')
    if (high.length > 0) {
      return `I want to help, but I need to stay within my role as a fitness coach. For medical concerns or injuries, please consult with a healthcare professional. I'm here to help with workout planning, exercise selection, and fitness guidance. What fitness-related questions can I help with?`
    }
    return `Let me rephrase that in a more balanced way. What specific aspect of your fitness journey can I help with?`
  }
}

function summarizeFeedMessages(events: MessageEvent[]): UserContext['messagingSignals'] {
  const byType = new Map<string, MessageEvent>()
  for (const ev of events) {
    const key = ev.messageType ?? 'system'
    if (!byType.has(key)) byType.set(key, ev)
  }
  const out: NonNullable<UserContext['messagingSignals']> = []
  for (const ev of byType.values()) {
    const raw =
      ev.title?.trim() ||
      ev.renderedBody?.trim() ||
      ''
    if (!raw) continue
    out.push({
      messageType: ev.messageType ?? 'system',
      title: ev.title,
      excerpt: truncateStr(raw.replace(/[\r\n]+/g, ' '), MAX_MESSAGE_EXCERPT),
    })
    if (out.length >= 5) break
  }
  return out.length ? out : undefined
}

function getThisWeekRange(): { start: Date; end: Date } {
  const now = new Date()
  const day = now.getUTCDay()
  const start = new Date(now)
  start.setUTCDate(now.getUTCDate() - (day === 0 ? 6 : day - 1))
  start.setUTCHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setUTCDate(start.getUTCDate() + 7)
  return { start, end }
}

function ymdFromLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getLastCompletedToday(sessions: WorkoutSession[]): WorkoutSession | null {
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  for (const s of sessions) {
    if (s.status !== 'completed' || !s.endedAt) continue
    if (s.endedAt >= todayStart) return s
  }
  return null
}

function formatLastWorkout(session: WorkoutSession): {
  name: string
  date: Date
  exercises: string[]
} {
  const name = session.notes ?? 'Workout'
  const date = session.endedAt ?? session.startedAt
  const exercises = (session.sessionExercises ?? [])
    .map((e) => e.exerciseName)
    .filter(Boolean)
    .slice(0, MAX_EXERCISE_NAMES) as string[]
  return { name, date, exercises }
}

function extractContext(text: string, term: string, radius = 50): string {
  const index = text.toLowerCase().indexOf(term.toLowerCase())
  if (index === -1) return term
  const start = Math.max(0, index - radius)
  const end = Math.min(text.length, index + term.length + radius)
  return '...' + text.slice(start, end) + '...'
}
