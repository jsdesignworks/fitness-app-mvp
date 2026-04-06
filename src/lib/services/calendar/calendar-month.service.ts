import { dateToYMDLocal } from '@/components/dps/calendar/calendar-month-matrix'
import { SessionRepository } from '@/lib/repositories/workout/session.repository'
import { NutritionDayRepository } from '@/lib/repositories/nutrition/nutrition-day.repository'

export type CalendarMonthDay = {
  date: string
  hasWorkout: boolean
  workoutCount: number
  hasNutrition: boolean
  totalCaloriesKcal: number | null
}

export type CalendarMonthPayload = {
  year: number
  month: number
  startDate: string
  endDate: string
  days: CalendarMonthDay[]
}

/**
 * Aggregates workout session counts and nutrition totals per calendar day (server local timezone
 * for session bucketing, aligned with `dateToYMDLocal`).
 */
export async function getCalendarMonth(
  userId: string,
  year: number,
  month1to12: number
): Promise<CalendarMonthPayload> {
  const monthIndex = month1to12 - 1
  const lastDay = new Date(year, monthIndex + 1, 0).getDate()
  const startYmd = dateToYMDLocal(new Date(year, monthIndex, 1))
  const endYmd = dateToYMDLocal(new Date(year, monthIndex, lastDay))

  const days: CalendarMonthDay[] = []
  for (let d = 1; d <= lastDay; d++) {
    const ymd = dateToYMDLocal(new Date(year, monthIndex, d))
    days.push({
      date: ymd,
      hasWorkout: false,
      workoutCount: 0,
      hasNutrition: false,
      totalCaloriesKcal: null,
    })
  }

  const rangeStart = new Date(year, monthIndex, 1, 0, 0, 0, 0)
  const rangeEndExclusive = new Date(year, monthIndex + 1, 1, 0, 0, 0, 0)

  const [sessions, datesWithEntries, caloriesByDate] = await Promise.all([
    SessionRepository.listSessionStartsInRange(userId, rangeStart, rangeEndExclusive),
    NutritionDayRepository.getDatesWithEntries(userId, startYmd, endYmd),
    NutritionDayRepository.sumCaloriesByDateInRange(userId, startYmd, endYmd),
  ])

  const workoutCounts = new Map<string, number>()
  for (const s of sessions) {
    if (s.status === 'abandoned') continue
    const ymd = dateToYMDLocal(s.startedAt)
    workoutCounts.set(ymd, (workoutCounts.get(ymd) ?? 0) + 1)
  }

  const nutritionDates = new Set(datesWithEntries)

  const dayIndex = new Map(days.map((x, i) => [x.date, i]))
  for (const [ymd, count] of workoutCounts) {
    const i = dayIndex.get(ymd)
    if (i === undefined) continue
    days[i].workoutCount = count
    days[i].hasWorkout = count > 0
  }

  for (const ymd of nutritionDates) {
    const i = dayIndex.get(ymd)
    if (i === undefined) continue
    days[i].hasNutrition = true
    const raw = caloriesByDate.get(ymd)
    const total = raw != null ? Math.round(raw * 10) / 10 : 0
    days[i].totalCaloriesKcal = total
  }

  return {
    year,
    month: month1to12,
    startDate: startYmd,
    endDate: endYmd,
    days,
  }
}
