'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  chunkWeeks,
  dateToYMDLocal,
  getMonthGrid,
  type MonthGridCell,
} from '@/components/dps/calendar/calendar-month-matrix'
import { DpsCalendarDayCell } from '@/components/dps/calendar/dps-calendar-day-cell'

const DEFAULT_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export type DpsCalendarMonthGridProps = {
  year: number
  month: number
  /** Local YYYY-MM-DD or null */
  selectedYmd: string | null
  onSelectYmd: (ymd: string) => void
  /** Optional: mark a day as having generic “activity” (visual dot only) */
  hasActivity?: (ymd: string) => boolean
  /** Mark a day non-interactive (e.g. outside min/max range) */
  isDateDisabled?: (ymd: string) => boolean
  /** Today’s local YYYY-MM-DD — when omitted, uses the current local date */
  todayYmd?: string
  /** Referenced by `aria-labelledby` on the grid */
  labelId?: string
  weekdayLabels?: readonly string[]
  className?: string
}

/**
 * 7-column month grid with weekday headers. Data-agnostic — parent supplies selection and optional predicates.
 */
export function DpsCalendarMonthGrid({
  year,
  month,
  selectedYmd,
  onSelectYmd,
  hasActivity,
  isDateDisabled,
  todayYmd: todayYmdProp,
  labelId,
  weekdayLabels = DEFAULT_WEEKDAYS,
  className,
}: DpsCalendarMonthGridProps) {
  const resolvedTodayYmd = todayYmdProp ?? dateToYMDLocal(new Date())
  const cells = React.useMemo(() => getMonthGrid(year, month), [year, month])
  const weeks = React.useMemo(() => chunkWeeks(cells), [cells])

  const gridLabel = React.useMemo(() => {
    return new Date(year, month).toLocaleString(undefined, { month: 'long', year: 'numeric' })
  }, [year, month])

  return (
    <div
      role="grid"
      aria-labelledby={labelId}
      aria-label={gridLabel}
      className={cn('w-full', className)}
    >
      <div
        role="row"
        className="grid grid-cols-7 gap-px bg-border sm:gap-0.5 md:gap-1"
      >
        {weekdayLabels.map((name) => (
          <div
            key={name}
            role="columnheader"
            className="bg-muted/50 px-1 py-2 text-center text-k-xs font-medium text-muted-foreground sm:text-k-sm"
          >
            {name}
          </div>
        ))}
      </div>

      {weeks.map((week, wi) => (
        <div
          key={wi}
          role="row"
          className="grid grid-cols-7 gap-px bg-border sm:gap-0.5 md:gap-1"
        >
          {week.map((cell, di) => (
            <MonthGridCellView
              key={cell.kind === 'day' ? cell.ymd : `pad-${wi}-${di}`}
              cell={cell}
              selectedYmd={selectedYmd}
              todayYmd={resolvedTodayYmd}
              onSelectYmd={onSelectYmd}
              hasActivity={hasActivity}
              isDateDisabled={isDateDisabled}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function MonthGridCellView({
  cell,
  selectedYmd,
  todayYmd,
  onSelectYmd,
  hasActivity,
  isDateDisabled,
}: {
  cell: MonthGridCell
  selectedYmd: string | null
  todayYmd: string
  onSelectYmd: (ymd: string) => void
  hasActivity?: (ymd: string) => boolean
  isDateDisabled?: (ymd: string) => boolean
}) {
  if (cell.kind === 'padding') {
    return <DpsCalendarDayCell variant="padding" />
  }

  const ymd = cell.ymd
  const selected = selectedYmd === ymd
  const today = todayYmd === ymd
  const disabled = isDateDisabled?.(ymd) ?? false
  const activity = hasActivity?.(ymd) ?? false

  return (
    <DpsCalendarDayCell
      variant="day"
      dayOfMonth={cell.dayOfMonth}
      isToday={today}
      isSelected={selected}
      disabled={disabled}
      hasActivity={activity}
      onSelect={disabled ? undefined : () => onSelectYmd(ymd)}
    />
  )
}
