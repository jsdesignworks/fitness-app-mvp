/**
 * Pure month matrix helpers for DPS-4 calendar grids — no I/O, no scheduling logic.
 */

export type MonthGridCell =
  | {
      kind: 'padding'
      date: null
      ymd: null
      dayOfMonth: null
    }
  | {
      kind: 'day'
      date: Date
      /** Local calendar date as YYYY-MM-DD */
      ymd: string
      dayOfMonth: number
    }

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Local YYYY-MM-DD (not UTC) — matches typical calendar cell semantics. */
export function dateToYMDLocal(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/**
 * Builds a fixed-length list of cells (multiple of 7) for a month view.
 * Week starts Sunday (0) — aligns with `getDay()` and common US calendar grids.
 */
export function getMonthGrid(year: number, month: number): MonthGridCell[] {
  const startPad = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const totalCells = Math.ceil((startPad + daysInMonth) / 7) * 7
  const cells: MonthGridCell[] = []
  for (let i = 0; i < totalCells; i++) {
    if (i < startPad) {
      cells.push({ kind: 'padding', date: null, ymd: null, dayOfMonth: null })
      continue
    }
    const dayNum = i - startPad + 1
    if (dayNum > daysInMonth) {
      cells.push({ kind: 'padding', date: null, ymd: null, dayOfMonth: null })
      continue
    }
    const date = new Date(year, month, dayNum)
    cells.push({
      kind: 'day',
      date,
      ymd: dateToYMDLocal(date),
      dayOfMonth: dayNum,
    })
  }
  return cells
}

/** Split flat month cells into weeks (rows of 7). */
export function chunkWeeks(cells: MonthGridCell[]): MonthGridCell[][] {
  const rows: MonthGridCell[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7))
  }
  return rows
}
