'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type DpsCalendarMonthNavProps = {
  label: string
  labelId?: string
  onPrevMonth: () => void
  onNextMonth: () => void
  onGoToToday?: () => void
  showTodayButton?: boolean
  className?: string
}

/**
 * Previous / next month controls with accessible month label. Optional “Today” jump.
 */
export function DpsCalendarMonthNav({
  label,
  labelId,
  onPrevMonth,
  onNextMonth,
  onGoToToday,
  showTodayButton = false,
  className,
}: DpsCalendarMonthNavProps) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-2', className)}>
      <div className="flex min-w-0 flex-1 items-center justify-center gap-2 sm:justify-start sm:gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onPrevMonth}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 id={labelId} className="min-w-0 truncate text-center text-k-base font-semibold sm:text-k-lg">
          {label}
        </h2>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onNextMonth}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      {showTodayButton && onGoToToday ? (
        <Button type="button" variant="secondary" size="sm" onClick={onGoToToday} className="shrink-0">
          Today
        </Button>
      ) : null}
    </div>
  )
}
