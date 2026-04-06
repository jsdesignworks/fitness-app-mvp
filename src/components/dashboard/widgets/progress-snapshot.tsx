'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { DashboardWidget } from '../dashboard-widget'

type ProgressSnapshotProps = {
  recentProgress: unknown[]
  isLoading: boolean
  error: string | null
  onRetry?: () => void
}

export function ProgressSnapshotWidget({
  recentProgress,
  isLoading,
  error,
  onRetry,
}: ProgressSnapshotProps) {
  const entries = (Array.isArray(recentProgress) ? recentProgress : []) as { id: string; date?: string; weightKg?: number | null }[]
  const isEmpty = entries.length === 0

  return (
    <DashboardWidget
      id="progress_snapshot"
      title="Progress snapshot"
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      emptyTitle="No progress entries"
      emptyDescription="Record weight or measurements to track over time."
      emptyAction={
        <Button asChild size="sm">
          <Link href="/progress">Record progress</Link>
        </Button>
      }
      onRetry={onRetry}
    >
      <ul className="space-y-2 text-sm">
        {entries.slice(0, 5).map((e) => (
          <li key={e.id} className="flex justify-between gap-2">
            <span className="text-muted-foreground">
              {e.date ? format(new Date(e.date), 'MMM d, yyyy') : '—'}
            </span>
            {e.weightKg != null && (
              <span className="font-medium">{e.weightKg} kg</span>
            )}
          </li>
        ))}
      </ul>
      <Button asChild variant="link" size="sm" className="mt-2 p-0 h-auto">
        <Link href="/progress">View all</Link>
      </Button>
    </DashboardWidget>
  )
}
