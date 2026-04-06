'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DashboardWidget } from '../dashboard-widget'
import { Check, Circle } from 'lucide-react'

type HabitsTodayProps = {
  habitsAndLogsToday: { habits: unknown[]; logs: unknown[] }
  isLoading: boolean
  error: string | null
  onRetry?: () => void
}

export function HabitsTodayWidget({
  habitsAndLogsToday,
  isLoading,
  error,
  onRetry,
}: HabitsTodayProps) {
  const habits = (habitsAndLogsToday?.habits ?? []) as { id: string; name?: string }[]
  const logs = (habitsAndLogsToday?.logs ?? []) as { habitId: string }[]
  const hasHabits = Array.isArray(habits) && habits.length > 0
  const loggedIds = new Set(logs.map((l) => l.habitId))

  const isEmpty = !hasHabits

  return (
    <DashboardWidget
      id="habits_today"
      title="Habits today"
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      emptyTitle="No habits yet"
      emptyDescription="Add habits to track daily check-ins."
      emptyAction={
        <Button asChild size="sm">
          <Link href="/habits">Add habit</Link>
        </Button>
      }
      onRetry={onRetry}
    >
      <ul className="space-y-2">
        {habits.map((h) => (
          <li key={h.id} className="flex items-center gap-2 text-sm">
            {loggedIds.has(h.id) ? (
              <Check className="h-4 w-4 text-green-600 shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span>{h.name ?? 'Habit'}</span>
          </li>
        ))}
      </ul>
      <Button asChild variant="link" size="sm" className="mt-2 p-0 h-auto">
        <Link href="/habits">Check in</Link>
      </Button>
    </DashboardWidget>
  )
}
