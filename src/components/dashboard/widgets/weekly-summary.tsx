'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { DashboardWidget } from '../dashboard-widget'
import { Dumbbell, UtensilsCrossed } from 'lucide-react'

type WeeklySummaryProps = {
  weekSchedule: { scheduledWorkouts?: unknown[] }
  datesWithFood?: string[]
  /** Days this ISO week with workout or nutrition activity (calendar aggregation). */
  activeDaysThisWeek?: number
  isLoading: boolean
  error: string | null
  onRetry?: () => void
}

export function WeeklySummaryWidget({
  weekSchedule,
  datesWithFood = [],
  activeDaysThisWeek = 0,
  isLoading,
  error,
  onRetry,
}: WeeklySummaryProps) {
  const workouts = (weekSchedule?.scheduledWorkouts ?? []) as { id: string; startAt?: string; titleOverride?: string; status?: string }[]
  const hasWorkouts = Array.isArray(workouts) && workouts.length > 0
  const hasFood = Array.isArray(datesWithFood) && datesWithFood.length > 0
  const hasCalendarActivity = activeDaysThisWeek > 0
  const isEmpty = !hasWorkouts && !hasFood && !hasCalendarActivity

  return (
    <DashboardWidget
      id="weekly_summary"
      title="Weekly summary"
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      emptyTitle="No activity this week"
      emptyDescription="Schedule a workout or log your first meal to see your week here."
      emptyAction={
        <div className="flex flex-wrap gap-2 justify-center">
          <Button asChild size="sm">
            <Link href="/calendar/schedule">Schedule workout</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/nutrition">Log food</Link>
          </Button>
        </div>
      }
      onRetry={onRetry}
    >
      <div className="space-y-3 text-sm">
        {hasCalendarActivity && (
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">{activeDaysThisWeek}</span> day
            {activeDaysThisWeek !== 1 ? 's' : ''} with logged activity this week (workouts and/or nutrition).
          </p>
        )}
        {hasWorkouts && (
          <div className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-primary shrink-0" />
            <span>
              {workouts.length} workout{workouts.length !== 1 ? 's' : ''} scheduled
              {workouts.some((w) => w.status === 'completed') && (
                <span className="text-muted-foreground">
                  {' '}({workouts.filter((w) => w.status === 'completed').length} completed)
                </span>
              )}
            </span>
          </div>
        )}
        {hasFood && (
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-primary shrink-0" />
            <span>Food logged on {datesWithFood.length} day{datesWithFood.length !== 1 ? 's' : ''}</span>
          </div>
        )}
        {workouts.slice(0, 3).map((w) => (
          <div key={w.id} className="text-muted-foreground pl-6">
            {w.startAt && format(new Date(w.startAt), 'EEE M/d')}: {w.titleOverride ?? 'Workout'}
            {w.status && w.status !== 'scheduled' && w.status !== 'in_progress' && ` (${w.status})`}
          </div>
        ))}
        {workouts.length > 3 && (
          <p className="text-muted-foreground pl-6">+{workouts.length - 3} more</p>
        )}
        <Button asChild variant="link" size="sm" className="p-0 h-auto">
          <Link href="/calendar">View full week</Link>
        </Button>
      </div>
    </DashboardWidget>
  )
}
