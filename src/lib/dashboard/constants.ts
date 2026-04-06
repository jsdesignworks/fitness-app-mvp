/**
 * Widget registry and default layout for the dashboard command center.
 */

export const WIDGET_IDS = [
  'todays_workout',
  'weekly_summary',
  'macros_today',
  'habits_today',
  'progress_snapshot',
  'upcoming_calendar',
  'ai_insight',
] as const

export type WidgetId = (typeof WIDGET_IDS)[number]

const defaultVisibility: Record<string, boolean> = {}
WIDGET_IDS.forEach((id) => {
  /** AI module not shipped — hide preview widget until user opts in. */
  defaultVisibility[id] = id === 'ai_insight' ? false : true
})

export const DEFAULT_DASHBOARD_PREFERENCES = {
  widgetOrder: [...WIDGET_IDS],
  widgetVisibility: defaultVisibility,
} as const

export function getAllowedWidgetIds(): string[] {
  return [...WIDGET_IDS]
}
