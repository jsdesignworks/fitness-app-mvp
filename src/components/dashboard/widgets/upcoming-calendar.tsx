'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { DashboardWidget } from '../dashboard-widget'

type UpcomingCalendarProps = {
  upcomingSchedule: { scheduledWorkouts?: unknown[] }
  /** Current month: days with workout or nutrition activity (calendar aggregation). */
  activeDaysThisMonth?: number
  isLoading: boolean
  error: string | null
  onRetry?: () => void
}

export function UpcomingCalendarWidget({
  upcomingSchedule,
  activeDaysThisMonth = 0,
  isLoading,
  error,
  onRetry,
}: UpcomingCalendarProps) {
  const list = (upcomingSchedule?.scheduledWorkouts ?? []) as { id: string; startAt?: string; titleOverride?: string }[]
  const isEmpty = list.length === 0

  return (
    <DashboardWidget
      id="upcoming_calendar"
      title="Upcoming"
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      emptyTitle="Nothing scheduled"
      emptyDescription="Schedule a workout for the next 7 days."
      emptyAction={
        <Button asChild size="sm">
          <Link href="/calendar/schedule">Schedule workout</Link>
        </Button>
      }
      onRetry={onRetry}
    >
      {activeDaysThisMonth > 0 ? (
        <p className="text-k-xs text-muted-foreground mb-3">
          This month:{' '}
          <span className="font-medium text-foreground">{activeDaysThisMonth}</span> day
          {activeDaysThisMonth !== 1 ? 's' : ''} with logged activity.
        </p>
      ) : null}
      <ul className="space-y-2 text-sm">
        {list.slice(0, 5).map((w) => (
          <li key={w.id}>
            {w.startAt && format(new Date(w.startAt), 'EEE M/d, HH:mm')}: {w.titleOverride ?? 'Workout'}
          </li>
        ))}
      </ul>
      {list.length > 5 && (
        <p className="text-muted-foreground text-sm mt-1">+{list.length - 5} more</p>
      )}
      <Button asChild variant="link" size="sm" className="mt-2 p-0 h-auto">
        <Link href="/calendar">View calendar</Link>
      </Button>
    </DashboardWidget>
  )
}
