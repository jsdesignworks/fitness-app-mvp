import { dateToYMDLocal } from '@/components/dps/calendar/calendar-month-matrix'
import { getCalendarMonth } from '@/lib/services/calendar/calendar-month.service'
import { MessageEventRepository } from '@/lib/repositories/messaging/event.repository'
import { NutritionDayRepository } from '@/lib/repositories/nutrition/nutrition-day.repository'
import { SessionRepository } from '@/lib/repositories/workout/session.repository'
import { UserMessagePreferencesRepository } from '@/lib/repositories/messaging/preferences.repository'

const TRIGGER_FEED = 'system_feed' as const

function weekStartEndYMD(): { start: string; end: string } {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const start = new Date(d)
  start.setDate(diff)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return { start: dateToYMDLocal(start), end: dateToYMDLocal(end) }
}

/**
 * Upserts or removes deduped in-app rows from real workout, nutrition, and calendar data.
 * Does not invent milestones; skips sections when user preferences disable them.
 */
export async function syncInAppFeedForUser(userId: string): Promise<void> {
  const prefs = await UserMessagePreferencesRepository.getByUserId(userId)
  const enabled = prefs?.enabled !== false
  if (!enabled) return

  const showReminders = prefs?.showReminders !== false
  const showSystem = prefs?.showSystemUpdates !== false

  if (showReminders) {
    const session = await SessionRepository.getActiveSession(userId)
    if (session?.id) {
      await MessageEventRepository.upsertFeedMessage({
        userId,
        dedupeKey: 'live:active_session',
        triggerKey: TRIGGER_FEED,
        messageType: 'workout',
        tone: 'info',
        title: 'Workout in progress',
        renderedBody: 'You have an active session. Resume when you are ready.',
        ctaLabel: 'Open session',
        ctaHref: `/workouts/session/${session.id}`,
      })
    } else {
      await MessageEventRepository.deleteByDedupeKey(userId, 'live:active_session')
    }
  } else {
    await MessageEventRepository.deleteByDedupeKey(userId, 'live:active_session')
  }

  if (showSystem) {
    const today = dateToYMDLocal(new Date())
    const withFood = await NutritionDayRepository.getDatesWithEntries(userId, today, today)
    const dedupeNutrition = `daily:no_nutrition_${today}`
    if (withFood.length === 0) {
      await MessageEventRepository.upsertFeedMessage({
        userId,
        dedupeKey: dedupeNutrition,
        triggerKey: TRIGGER_FEED,
        messageType: 'nutrition',
        tone: 'warning',
        title: 'No food logged today',
        renderedBody: 'Log a meal to track today’s nutrition.',
        ctaLabel: 'Log food',
        ctaHref: '/nutrition',
      })
    } else {
      await MessageEventRepository.deleteByDedupeKey(userId, dedupeNutrition)
    }

    const { start: wStart, end: wEnd } = weekStartEndYMD()
    const now = new Date()
    const cal = await getCalendarMonth(userId, now.getFullYear(), now.getMonth() + 1)
    let activeDays = 0
    for (const day of cal.days) {
      if (day.date < wStart || day.date > wEnd) continue
      if (day.hasWorkout || day.hasNutrition) activeDays += 1
    }
    const dedupeWeek = `calendar:week_${wStart}`
    if (activeDays > 0) {
      const label = activeDays === 1 ? '1 day' : `${activeDays} days`
      await MessageEventRepository.upsertFeedMessage({
        userId,
        dedupeKey: dedupeWeek,
        triggerKey: TRIGGER_FEED,
        messageType: 'calendar',
        tone: 'info',
        title: 'Activity this week',
        renderedBody: `You have logged activity on ${label} this week (workouts and/or meals).`,
        ctaLabel: 'Calendar',
        ctaHref: '/calendar',
      })
    } else {
      await MessageEventRepository.deleteByDedupeKey(userId, dedupeWeek)
    }
  } else {
    const today = dateToYMDLocal(new Date())
    await MessageEventRepository.deleteByDedupeKey(userId, `daily:no_nutrition_${today}`)
    const { start: wStart } = weekStartEndYMD()
    await MessageEventRepository.deleteByDedupeKey(userId, `calendar:week_${wStart}`)
  }
}
