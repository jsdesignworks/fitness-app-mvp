/**
 * Design Phase System (DPS) — layout and async UI primitives for feature modules.
 * @see docs/DESIGN_SYSTEM.md
 */
export { DpsPageShell, type DpsPageShellVariant } from '@/components/dps/page-shell'
export { DpsPageHeader } from '@/components/dps/page-header'
export { DpsPageSection } from '@/components/dps/page-section'
export { DpsLoadingState } from '@/components/dps/loading-state'
export { DpsContentState, type DpsContentStateProps } from '@/components/dps/content-state'

// DPS-2 — data visualization (@/components/dps/viz)
export {
  DPS_CHART_DEFAULT_HEIGHT,
  DPS_CHART_MARGINS,
  DPS_CHART_GRID_CLASS,
  DPS_CHART_AXIS_TICK_CLASS,
  DPS_CHART_TOOLTIP_WRAPPER_CLASS,
  dpsChartSeriesColor,
  DPS_CHART_COLORS,
  DpsStatCard,
  DpsSummaryBlock,
  DpsCircularProgress,
  DpsBarProgress,
  DpsLineChartContainer,
  DpsBarChartContainer,
  DpsChartTooltipContent,
  type DpsStatCardProps,
  type DpsSummaryBlockProps,
  type DpsCircularProgressProps,
  type DpsBarProgressProps,
  type DpsBarProgressColorKey,
  type DpsLineChartContainerProps,
  type DpsBarChartContainerProps,
  type DpsChartTooltipContentProps,
} from '@/components/dps/viz'

// DPS-3 — input & interaction (@/components/dps/interaction)
export {
  DpsFormField,
  DpsFormActions,
  DpsFormErrorSummary,
  DpsModalContent,
  DPS_MODAL_CONTENT_CLASSNAME,
  dpsModalContentBaseClassName,
  DpsPendingButton,
  DpsFilterChip,
  DpsSelectionList,
  DpsToggleField,
  DpsFieldGrid,
  dpsValidate,
  zodIssuesToFieldErrors,
  type DpsFormFieldProps,
  type DpsFormActionsProps,
  type DpsFormErrorSummaryProps,
  type DpsModalContentProps,
  type DpsModalSize,
  type DpsPendingButtonProps,
  type DpsFilterChipProps,
  type DpsSelectionListProps,
  type DpsToggleFieldProps,
  type DpsFieldGridProps,
  type DpsValidateFailure,
  type DpsValidateSuccess,
} from '@/components/dps/interaction'

// DPS-4 — calendar / time UI (@/components/dps/calendar)
export {
  getMonthGrid,
  chunkWeeks,
  dateToYMDLocal,
  DpsCalendarDayCell,
  DpsCalendarMonthGrid,
  DpsCalendarMonthNav,
  DpsDayDetailModal,
  type MonthGridCell,
  type DpsCalendarDayCellProps,
  type DpsCalendarMonthGridProps,
  type DpsCalendarMonthNavProps,
  type DpsDayDetailModalProps,
} from '@/components/dps/calendar'

// DPS-5 — communication UI (@/components/dps/messaging)
export {
  DpsMessageCard,
  DpsMessageGroup,
  DpsMessageList,
  DpsNotificationBanner,
  dpsToast,
  DPS_TOAST_DEFAULT_DURATION_MS,
  type DpsMessageTone,
  type DpsMessageReadState,
  type DpsMessageAction,
  type DpsMessageCardBaseProps,
  type DpsMessageCardProps,
  type DpsMessageCardVariantProps,
  type DpsMessageGroupProps,
  type DpsMessageListProps,
  type DpsNotificationBannerProps,
  type DpsToastPayload,
} from '@/components/dps/messaging'

// DPS-6 — AI interface UI (@/components/dps/ai)
export {
  DpsChatContainer,
  DpsChatMessageBubble,
  DpsThinkingIndicator,
  DpsChatInputBar,
  DpsAiInsightCard,
  DpsInlineRecommendation,
  type DpsChatContainerProps,
  type DpsChatMessageBubbleProps,
  type DpsThinkingIndicatorProps,
  type DpsChatInputBarProps,
  type DpsAiInsightCardProps,
  type DpsInlineRecommendationProps,
} from '@/components/dps/ai'
