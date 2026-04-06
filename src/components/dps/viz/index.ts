/**
 * DPS-2 — data visualization primitives (metrics, macro progress, Recharts shells).
 * @see docs/DESIGN_SYSTEM.md
 */
export {
  DPS_CHART_DEFAULT_HEIGHT,
  DPS_CHART_MARGINS,
  DPS_CHART_GRID_CLASS,
  DPS_CHART_AXIS_TICK_CLASS,
  DPS_CHART_TOOLTIP_WRAPPER_CLASS,
  dpsChartSeriesColor,
  DPS_CHART_COLORS,
} from './recharts-theme'
export { DpsStatCard, type DpsStatCardProps } from './dps-stat-card'
export { DpsSummaryBlock, type DpsSummaryBlockProps } from './dps-summary-block'
export { DpsCircularProgress, type DpsCircularProgressProps } from './dps-circular-progress'
export { DpsBarProgress, type DpsBarProgressProps, type DpsBarProgressColorKey } from './dps-bar-progress'
export { DpsLineChartContainer, type DpsLineChartContainerProps } from './dps-line-chart-container'
export { DpsBarChartContainer, type DpsBarChartContainerProps } from './dps-bar-chart-container'
export { DpsChartTooltipContent, type DpsChartTooltipContentProps } from './dps-chart-tooltip'
