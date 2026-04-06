/**
 * DPS-4 — Calendar / time UI (presentation only). Feature modules supply dates and predicates.
 */
export {
  getMonthGrid,
  chunkWeeks,
  dateToYMDLocal,
  type MonthGridCell,
} from '@/components/dps/calendar/calendar-month-matrix'

export { DpsCalendarDayCell, type DpsCalendarDayCellProps } from '@/components/dps/calendar/dps-calendar-day-cell'

export { DpsCalendarMonthGrid, type DpsCalendarMonthGridProps } from '@/components/dps/calendar/dps-calendar-month-grid'

export { DpsCalendarMonthNav, type DpsCalendarMonthNavProps } from '@/components/dps/calendar/dps-calendar-month-nav'

export { DpsDayDetailModal, type DpsDayDetailModalProps } from '@/components/dps/calendar/dps-day-detail-modal'
