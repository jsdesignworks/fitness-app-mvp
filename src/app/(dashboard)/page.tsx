'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useDashboardPreferences } from '@/hooks/use-dashboard-preferences'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { WIDGET_IDS, DEFAULT_DASHBOARD_PREFERENCES } from '@/lib/dashboard/constants'
import { DpsPageHeader } from '@/components/dps/page-header'
import { DpsPageSection } from '@/components/dps/page-section'
import { ErrorMessage } from '@/components/common/error-message'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { DashboardEditSlot } from '@/components/dashboard/dashboard-edit-slot'
import { TodaysWorkoutWidget } from '@/components/dashboard/widgets/todays-workout'
import { WeeklySummaryWidget } from '@/components/dashboard/widgets/weekly-summary'
import { MacrosTodayWidget } from '@/components/dashboard/widgets/macros-today'
import { HabitsTodayWidget } from '@/components/dashboard/widgets/habits-today'
import { ProgressSnapshotWidget } from '@/components/dashboard/widgets/progress-snapshot'
import { UpcomingCalendarWidget } from '@/components/dashboard/widgets/upcoming-calendar'
import { AiInsightWidget } from '@/components/dashboard/widgets/ai-insight'
import { Dumbbell, UtensilsCrossed, CheckSquare, Calendar, TrendingUp } from 'lucide-react'

const WIDGET_TITLES: Record<string, string> = {
  todays_workout: "Today's workout",
  weekly_summary: 'Weekly summary',
  macros_today: 'Macros today',
  habits_today: 'Habits today',
  progress_snapshot: 'Progress snapshot',
  upcoming_calendar: 'Upcoming',
  ai_insight: 'AI insight (preview)',
}

const allowedSet = new Set<string>(WIDGET_IDS)

function nutritionSummaryHasData(summary: unknown): boolean {
  if (!summary || typeof summary !== 'object') return false
  const s = summary as Record<string, unknown>
  const cal = Number(s.totalCalories ?? 0)
  const p = Number(s.totalProtein ?? s.totalProteinG ?? 0)
  const c = Number(s.totalCarbs ?? s.totalCarbsG ?? 0)
  const f = Number(s.totalFat ?? s.totalFatG ?? 0)
  return cal > 0 || p > 0 || c > 0 || f > 0
}

export default function DashboardHomePage() {
  const {
    preferences,
    isLoading: prefsLoading,
    error: prefsError,
    updateDashboardPreferences,
  } = useDashboardPreferences()
  const dashboardData = useDashboardData()

  const [editMode, setEditMode] = useState(false)
  const [localOrder, setLocalOrder] = useState<string[]>([])
  const [localVisibility, setLocalVisibility] = useState<Record<string, boolean>>({})

  const effectiveOrder = useMemo(() => {
    const order = preferences.widgetOrder?.length
      ? preferences.widgetOrder.filter((id) => allowedSet.has(id))
      : DEFAULT_DASHBOARD_PREFERENCES.widgetOrder
    const withMissing = [...order]
    WIDGET_IDS.forEach((id) => {
      if (!order.includes(id)) withMissing.push(id)
    })
    return withMissing
  }, [preferences.widgetOrder])

  const effectiveVisibility = useMemo(() => {
    const base = { ...DEFAULT_DASHBOARD_PREFERENCES.widgetVisibility }
    if (preferences.widgetVisibility && typeof preferences.widgetVisibility === 'object') {
      Object.entries(preferences.widgetVisibility).forEach(([k, v]) => {
        if (allowedSet.has(k) && typeof v === 'boolean') base[k] = v
      })
    }
    return base
  }, [preferences.widgetVisibility])

  const orderInEdit = editMode ? localOrder.length ? localOrder : effectiveOrder : effectiveOrder
  const visibilityInEdit = editMode
    ? Object.keys(localVisibility).length
      ? { ...effectiveVisibility, ...localVisibility }
      : effectiveVisibility
    : effectiveVisibility

  const startEdit = () => {
    setLocalOrder([...effectiveOrder])
    setLocalVisibility({ ...effectiveVisibility })
    setEditMode(true)
  }

  const cancelEdit = () => {
    setLocalOrder([])
    setLocalVisibility({})
    setEditMode(false)
  }

  const saveEdit = async () => {
    try {
      await updateDashboardPreferences({
        widgetOrder: orderInEdit,
        widgetVisibility: visibilityInEdit,
      })
      setLocalOrder([])
      setLocalVisibility({})
      setEditMode(false)
    } catch {
      // Error surfaced by hook
    }
  }

  const moveUp = (id: string) => {
    const idx = orderInEdit.indexOf(id)
    if (idx <= 0) return
    const next = [...orderInEdit]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    setLocalOrder(next)
  }

  const moveDown = (id: string) => {
    const idx = orderInEdit.indexOf(id)
    if (idx < 0 || idx >= orderInEdit.length - 1) return
    const next = [...orderInEdit]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    setLocalOrder(next)
  }

  const toggleVisible = (id: string) => {
    setLocalVisibility((prev) => ({ ...prev, [id]: !visibilityInEdit[id] }))
  }

  const hasAnyData =
    dashboardData.activeSession != null ||
    dashboardData.todayHasWorkoutActivity ||
    dashboardData.activeDaysThisWeek > 0 ||
    dashboardData.activeDaysThisMonth > 0 ||
    (dashboardData.weekSchedule?.scheduledWorkouts?.length ?? 0) > 0 ||
    dashboardData.weekNutritionDates.length > 0 ||
    nutritionSummaryHasData(dashboardData.todayNutrition?.summary) ||
    (dashboardData.habitsAndLogsToday?.habits?.length ?? 0) > 0 ||
    (dashboardData.recentProgress?.length ?? 0) > 0
  const showFirstTimeBlock =
    !prefsLoading &&
    !dashboardData.isLoading &&
    !hasAnyData

  const refetch = dashboardData.refetch
  const isLoading = dashboardData.isLoading
  const error = dashboardData.error

  return (
    <div className="dps-section-y">
      <DpsPageHeader
        title="Dashboard"
        description="Your command center."
        titleId="dashboard-title"
        actions={
          !editMode ? (
            <Button variant="outline" size="sm" onClick={startEdit} disabled={prefsLoading}>
              Edit dashboard
            </Button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={saveEdit}>
                Save
              </Button>
              <Button variant="outline" size="sm" onClick={cancelEdit}>
                Cancel
              </Button>
            </div>
          )
        }
      />

      <QuickActions />

      {prefsError ? <ErrorMessage message={prefsError} variant="warning" /> : null}

      {showFirstTimeBlock && (
        <Card variant="elevated" className="border-dashed border-accent/30">
          <CardHeader>
            <CardTitle className="text-foreground">Your command center is empty</CardTitle>
            <CardDescription>Here&apos;s how to get started:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
          <ul className="list-inside list-disc space-y-2 text-k-sm text-muted-foreground">
            <li>
              <Link href="/workouts" className="dps-focus-ring inline-flex items-center gap-1 rounded-sm text-accent hover:underline">
                <Dumbbell className="h-4 w-4" /> Start a workout
              </Link>
            </li>
            <li>
              <Link href="/nutrition" className="dps-focus-ring inline-flex items-center gap-1 rounded-sm text-accent hover:underline">
                <UtensilsCrossed className="h-4 w-4" /> Log food today
              </Link>
            </li>
            <li>
              <Link href="/habits" className="dps-focus-ring inline-flex items-center gap-1 rounded-sm text-accent hover:underline">
                <CheckSquare className="h-4 w-4" /> Add a habit
              </Link>
            </li>
            <li>
              <Link href="/calendar/schedule" className="dps-focus-ring inline-flex items-center gap-1 rounded-sm text-accent hover:underline">
                <Calendar className="h-4 w-4" /> Schedule a workout
              </Link>
            </li>
            <li>
              <Link href="/progress" className="dps-focus-ring inline-flex items-center gap-1 rounded-sm text-accent hover:underline">
                <TrendingUp className="h-4 w-4" /> Record progress
              </Link>
            </li>
          </ul>
          </CardContent>
        </Card>
      )}

      <DpsPageSection>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {(editMode ? orderInEdit : orderInEdit.filter((id) => visibilityInEdit[id] !== false))
          .filter((id) => allowedSet.has(id))
          .map((id, index, arr) => {
            const title = WIDGET_TITLES[id] ?? id
            const canMoveUp = index > 0
            const canMoveDown = index < arr.length - 1
            const visible = visibilityInEdit[id] !== false

            const content = id === 'todays_workout' ? (
              <TodaysWorkoutWidget
                activeSession={dashboardData.activeSession}
                todayHasWorkoutActivity={dashboardData.todayHasWorkoutActivity}
                isLoading={isLoading}
                error={error}
                onRetry={refetch}
              />
            ) : id === 'weekly_summary' ? (
              <WeeklySummaryWidget
                weekSchedule={dashboardData.weekSchedule}
                datesWithFood={dashboardData.weekNutritionDates}
                activeDaysThisWeek={dashboardData.activeDaysThisWeek}
                isLoading={isLoading}
                error={error}
                onRetry={refetch}
              />
            ) : id === 'macros_today' ? (
              <MacrosTodayWidget
                todayNutrition={dashboardData.todayNutrition}
                isLoading={isLoading}
                error={error}
                onRetry={refetch}
              />
            ) : id === 'habits_today' ? (
              <HabitsTodayWidget
                habitsAndLogsToday={dashboardData.habitsAndLogsToday}
                isLoading={isLoading}
                error={error}
                onRetry={refetch}
              />
            ) : id === 'progress_snapshot' ? (
              <ProgressSnapshotWidget
                recentProgress={dashboardData.recentProgress}
                isLoading={isLoading}
                error={error}
                onRetry={refetch}
              />
            ) : id === 'upcoming_calendar' ? (
              <UpcomingCalendarWidget
                upcomingSchedule={dashboardData.upcomingSchedule}
                activeDaysThisMonth={dashboardData.activeDaysThisMonth}
                isLoading={isLoading}
                error={error}
                onRetry={refetch}
              />
            ) : id === 'ai_insight' ? (
              <AiInsightWidget
                hasWorkoutData={
                  dashboardData.activeSession != null ||
                  (dashboardData.weekSchedule?.scheduledWorkouts?.length ?? 0) > 0 ||
                  dashboardData.todayHasWorkoutActivity
                }
                hasNutritionData={
                  nutritionSummaryHasData(dashboardData.todayNutrition?.summary) ||
                  dashboardData.weekNutritionDates.length > 0
                }
                isLoading={isLoading}
                error={error}
                onRetry={refetch}
              />
            ) : null

            return (
              <DashboardEditSlot
                key={id}
                widgetId={id}
                title={title}
                visible={visible}
                canMoveUp={canMoveUp}
                canMoveDown={canMoveDown}
                onMoveUp={() => moveUp(id)}
                onMoveDown={() => moveDown(id)}
                onToggleVisible={() => toggleVisible(id)}
                editMode={editMode}
              >
                {content}
              </DashboardEditSlot>
            )
          })}
        </div>
      </DpsPageSection>
    </div>
  )
}
