'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export type DpsCalendarDayCellProps = {
  /** Padding cell — no date, not interactive */
  variant: 'padding' | 'day'
  dayOfMonth?: number
  isToday?: boolean
  isSelected?: boolean
  /** Non-interactive (e.g. out of allowed range) */
  disabled?: boolean
  /** Presentational only — parent decides meaning (e.g. “has activity”); no fake events here */
  hasActivity?: boolean
  onSelect?: () => void
  className?: string
}

/**
 * Single calendar day or empty padding cell. Uses DPS focus ring on interactive days.
 */
export function DpsCalendarDayCell({
  variant,
  dayOfMonth,
  isToday = false,
  isSelected = false,
  disabled = false,
  hasActivity = false,
  onSelect,
  className,
}: DpsCalendarDayCellProps) {
  if (variant === 'padding') {
    return (
      <div
        role="gridcell"
        aria-hidden="true"
        className={cn(
          'min-h-[3.75rem] bg-muted/25 sm:min-h-20 md:min-h-[5.5rem]',
          className
        )}
      />
    )
  }

  const inactive = disabled || !onSelect

  return (
    <div role="gridcell" className={cn('min-h-0 p-px sm:p-0.5', className)}>
      <Button
        type="button"
        variant="ghost"
        disabled={inactive}
        aria-selected={isSelected}
        aria-current={isToday ? 'date' : undefined}
        onClick={inactive ? undefined : onSelect}
        className={cn(
          'h-full w-full min-h-[3.75rem] flex-col gap-1 rounded-md border border-transparent p-1.5 sm:min-h-20 sm:p-2 md:min-h-[5.5rem]',
          'text-k-sm font-medium tabular-nums',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          isToday && 'border-border bg-muted/40',
          isSelected && 'border-primary bg-primary/10 text-foreground shadow-sm',
          !isSelected && !isToday && 'hover:bg-muted/50',
          inactive && 'cursor-not-allowed opacity-40 hover:bg-transparent'
        )}
      >
        <span className={cn('leading-none', isToday && 'font-semibold text-accent')}>{dayOfMonth}</span>
        <span className="flex min-h-[0.5rem] items-end justify-center gap-0.5" aria-hidden={!hasActivity}>
          {hasActivity ? (
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--chart-2))]" />
          ) : null}
        </span>
      </Button>
    </div>
  )
}
