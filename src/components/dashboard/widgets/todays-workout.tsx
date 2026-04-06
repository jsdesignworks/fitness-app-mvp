'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DashboardWidget } from '../dashboard-widget'

type TodaysWorkoutProps = {
  activeSession: unknown
  /** From calendar aggregation: any logged workout session today (non-abandoned). */
  todayHasWorkoutActivity: boolean
  isLoading: boolean
  error: string | null
  onRetry?: () => void
}

export function TodaysWorkoutWidget({
  activeSession,
  todayHasWorkoutActivity,
  isLoading,
  error,
  onRetry,
}: TodaysWorkoutProps) {
  const session = activeSession as { id?: string; status?: string } | null
  const hasActiveSession = session != null && typeof session === 'object' && Boolean(session.id)
  /** `/api/workouts/sessions/current` only returns in-progress sessions. */
  const showResume = Boolean(hasActiveSession)
  const showCompletedToday = !showResume && todayHasWorkoutActivity
  const isEmpty = !showResume && !showCompletedToday && !isLoading && !error

  return (
    <DashboardWidget
      id="todays_workout"
      title="Today's workout"
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      emptyTitle="No workout logged today"
      emptyDescription="Start a session or complete a workout to see it here."
      emptyAction={
        <Button asChild size="sm">
          <Link href="/workouts">Start workout</Link>
        </Button>
      }
      onRetry={onRetry}
    >
      {showResume && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            You have an active session. Pick up where you left off.
          </p>
          <Button asChild size="sm">
            <Link href={session?.id ? `/workouts/session/${session.id}` : '/workouts'}>
              Continue workout
            </Link>
          </Button>
        </div>
      )}
      {showCompletedToday && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Workout activity logged today. View history for details.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/workouts">View workouts</Link>
          </Button>
        </div>
      )}
    </DashboardWidget>
  )
}
