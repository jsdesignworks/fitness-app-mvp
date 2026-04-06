/**
 * Shared Recharts layout + token hooks for DPS-2.
 * Series colors use globals.css --chart-1 … --chart-5 (Tailwind `chart.*`).
 */

export const DPS_CHART_DEFAULT_HEIGHT = 240

export const DPS_CHART_MARGINS = { top: 8, right: 12, left: 0, bottom: 8 } as const

/** SVG / Recharts stroke for grid lines — matches muted border feel */
export const DPS_CHART_GRID_CLASS = 'stroke-muted'

/** Recharts axis tick — use on XAxis/YAxis tick={{ className }} */
export const DPS_CHART_AXIS_TICK_CLASS = 'text-xs fill-muted-foreground'

/** Tooltip outer wrapper (Recharts Tooltip contentStyle is object; use content + className on custom wrapper inside) */
export const DPS_CHART_TOOLTIP_WRAPPER_CLASS =
  'rounded-lg border border-border bg-card px-3 py-2 text-k-sm text-foreground shadow-md'

const CHART_VAR = (n: 1 | 2 | 3 | 4 | 5) => `hsl(var(--chart-${n}))`

/** Stroke/fill for series by index (cycles chart-1 … chart-5) */
export function dpsChartSeriesColor(index: number): string {
  const n = ((index % 5) + 1) as 1 | 2 | 3 | 4 | 5
  return CHART_VAR(n)
}

export const DPS_CHART_COLORS = {
  1: CHART_VAR(1),
  2: CHART_VAR(2),
  3: CHART_VAR(3),
  4: CHART_VAR(4),
  5: CHART_VAR(5),
} as const
