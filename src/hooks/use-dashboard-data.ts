'use client'

import { useCallback, useEffect, useState } from 'react'
import { dateToYMDLocal } from '@/components/dps/calendar/calendar-month-matrix'
import type { CalendarMonthPayload } from '@/lib/services/calendar/calendar-month.service'

function todayYMDLocal(): string {
  return dateToYMDLocal(new Date())
}

function weekStartEnd(): { start: string; end: string } {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const start = new Date(d)
  start.setDate(diff)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return {
    start: dateToYMDLocal(start),
    end: dateToYMDLocal(end),
  }
}

function twoWeeksAgo(): string {
  const d = new Date()
  d.setDate(d.getDate() - 14)
  return dateToYMDLocal(d)
}

function nextWeekEnd(): string {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return dateToYMDLocal(d)
}

async function safeFetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { credentials: 'include' })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export type DashboardData = {
  activeSession: unknown
  /** True if calendar aggregation shows workout activity for local today (non-abandoned sessions). */
  todayHasWorkoutActivity: boolean
  weekSchedule: { scheduledWorkouts?: unknown[] }
  weekNutritionDates: string[]
  todayNutrition: { nutritionDay?: unknown; summary?: unknown }
  /** Days in current ISO week with workout or nutrition activity (from calendar month API). */
  activeDaysThisWeek: number
  /** Days in current month with workout or nutrition activity. */
  activeDaysThisMonth: number
  calendarMonth: CalendarMonthPayload | null
  habitsAndLogsToday: { habits: unknown[]; logs: unknown[] }
  recentProgress: unknown[]
  upcomingSchedule: { scheduledWorkouts?: unknown[] }
  isLoading: boolean
  /** Set only when the dashboard cannot load anything useful (rare). */
  error: string | null
}

const emptySchedule = { scheduledWorkouts: [] }
const emptyNutrition = { nutritionDay: null, summary: null }
const emptyHabitsAndLogs = { habits: [], logs: [] }

export function useDashboardData(): DashboardData & { refetch: () => Promise<void> } {
  const [activeSession, setActiveSession] = useState<unknown>(null)
  const [todayHasWorkoutActivity, setTodayHasWorkoutActivity] = useState(false)
  const [weekSchedule, setWeekSchedule] = useState<{ scheduledWorkouts?: unknown[] }>(emptySchedule)
  const [weekNutritionDates, setWeekNutritionDates] = useState<string[]>([])
  const [todayNutrition, setTodayNutrition] = useState<{ nutritionDay?: unknown; summary?: unknown }>(emptyNutrition)
  const [activeDaysThisWeek, setActiveDaysThisWeek] = useState(0)
  const [activeDaysThisMonth, setActiveDaysThisMonth] = useState(0)
  const [calendarMonth, setCalendarMonth] = useState<CalendarMonthPayload | null>(null)
  const [habitsAndLogsToday, setHabitsAndLogsToday] = useState<{ habits: unknown[]; logs: unknown[] }>(emptyHabitsAndLogs)
  const [recentProgress, setRecentProgress] = useState<unknown[]>([])
  const [upcomingSchedule, setUpcomingSchedule] = useState<{ scheduledWorkouts?: unknown[] }>(emptySchedule)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const today = todayYMDLocal()
    const { start: weekStart, end: weekEnd } = weekStartEnd()
    const progressStart = twoWeeksAgo()
    const upcomingEnd = nextWeekEnd()
    const now = new Date()
    const calYear = now.getFullYear()
    const calMonth = now.getMonth() + 1

    try {
      const [
        sessionJson,
        weekSchedJson,
        nutritionJson,
        weekNutJson,
        habitsJson,
        logsJson,
        progressJson,
        upcomingJson,
        calendarJson,
      ] = await Promise.all([
        safeFetchJson<unknown>('/api/workouts/sessions/current'),
        safeFetchJson<{ scheduledWorkouts?: unknown[] }>(
          `/api/scheduling/schedule?start=${encodeURIComponent(weekStart)}&end=${encodeURIComponent(weekEnd)}`
        ),
        safeFetchJson<{ nutritionDay?: unknown; summary?: unknown }>(
          `/api/nutrition/days?date=${encodeURIComponent(today)}`
        ),
        safeFetchJson<{ datesWithEntries?: string[] }>(
          `/api/nutrition/week?start=${encodeURIComponent(weekStart)}&end=${encodeURIComponent(weekEnd)}`
        ),
        safeFetchJson<unknown[]>('/api/habits'),
        safeFetchJson<unknown[]>(
          `/api/habits/logs?start=${encodeURIComponent(today)}&end=${encodeURIComponent(today)}`
        ),
        safeFetchJson<unknown[]>(
          `/api/progress?start=${encodeURIComponent(progressStart)}&end=${encodeURIComponent(today)}`
        ),
        safeFetchJson<{ scheduledWorkouts?: unknown[] }>(
          `/api/scheduling/schedule?start=${encodeURIComponent(today)}&end=${encodeURIComponent(upcomingEnd)}`
        ),
        safeFetchJson<CalendarMonthPayload>(
          `/api/calendar/month?year=${calYear}&month=${calMonth}`
        ),
      ])

      setActiveSession(sessionJson ?? null)

      setWeekSchedule(weekSchedJson && weekSchedJson.scheduledWorkouts ? weekSchedJson : emptySchedule)

      if (nutritionJson && (nutritionJson.nutritionDay != null || nutritionJson.summary != null)) {
        setTodayNutrition({
          nutritionDay: nutritionJson.nutritionDay,
          summary: nutritionJson.summary,
        })
      } else {
        setTodayNutrition(emptyNutrition)
      }

      setWeekNutritionDates(
        Array.isArray(weekNutJson?.datesWithEntries) ? weekNutJson!.datesWithEntries! : []
      )

      setHabitsAndLogsToday({
        habits: Array.isArray(habitsJson) ? habitsJson : [],
        logs: Array.isArray(logsJson) ? logsJson : [],
      })

      setRecentProgress(Array.isArray(progressJson) ? progressJson : [])

      setUpcomingSchedule(
        upcomingJson && upcomingJson.scheduledWorkouts ? upcomingJson : emptySchedule
      )

      setCalendarMonth(calendarJson)

      let todayWorkout = false
      let monthActive = 0
      let weekActive = 0

      if (calendarJson?.days?.length) {
        for (const day of calendarJson.days) {
          const active = Boolean(day.hasWorkout || day.hasNutrition)
          if (active) monthActive += 1
          if (active && day.date >= weekStart && day.date <= weekEnd) weekActive += 1
          if (day.date === today && day.hasWorkout) todayWorkout = true
        }
      }
      setTodayHasWorkoutActivity(todayWorkout)
      setActiveDaysThisMonth(monthActive)
      setActiveDaysThisWeek(weekActive)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return {
    activeSession,
    todayHasWorkoutActivity,
    weekSchedule,
    weekNutritionDates,
    todayNutrition,
    activeDaysThisWeek,
    activeDaysThisMonth,
    calendarMonth,
    habitsAndLogsToday,
    recentProgress,
    upcomingSchedule,
    isLoading,
    error,
    refetch,
  }
}
