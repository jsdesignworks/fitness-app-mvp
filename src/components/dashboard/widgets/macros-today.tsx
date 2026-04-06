'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DashboardWidget } from '../dashboard-widget'
import {
  DpsBarProgress,
  DpsCircularProgress,
  DpsStatCard,
} from '@/components/dps/viz'
import { DISPLAY_NUTRITION_GOALS, displayMacroPercent } from '@/lib/nutrition/display-goals'

type MacrosTodayProps = {
  todayNutrition: { nutritionDay?: unknown; summary?: unknown }
  isLoading: boolean
  error: string | null
  onRetry?: () => void
}

export function MacrosTodayWidget({
  todayNutrition,
  isLoading,
  error,
  onRetry,
}: MacrosTodayProps) {
  const summary = todayNutrition?.summary as Record<string, unknown> | undefined
  /** API summary uses `totalProtein` / `totalCarbs` / `totalFat` (see DailyNutritionSummary). */
  const proteinRaw =
    summary?.totalProtein ?? summary?.totalProteinG ?? summary?.total_protein
  const carbsRaw = summary?.totalCarbs ?? summary?.totalCarbsG ?? summary?.total_carbs
  const fatRaw = summary?.totalFat ?? summary?.totalFatG ?? summary?.total_fat
  const hasEntries =
    summary != null &&
    typeof summary === 'object' &&
    (Number(summary.totalCalories) > 0 ||
      Number(proteinRaw) > 0 ||
      Number(carbsRaw) > 0 ||
      Number(fatRaw) > 0)
  const isEmpty = !hasEntries

  const cal = Number(summary?.totalCalories) || 0
  const protein = Number(proteinRaw) || 0
  const carbs = Number(carbsRaw) || 0
  const fat = Number(fatRaw) || 0

  const calPct = Math.min(100, displayMacroPercent(cal, DISPLAY_NUTRITION_GOALS.calories))

  return (
    <DashboardWidget
      id="macros_today"
      title="Macros today"
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      emptyTitle="No food logged today"
      emptyDescription="Log your first meal to track macros."
      emptyAction={
        <Button asChild size="sm">
          <Link href="/nutrition">Log food</Link>
        </Button>
      }
      onRetry={onRetry}
    >
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex shrink-0 justify-center sm:justify-start">
            <DpsCircularProgress
              value={calPct}
              size={96}
              strokeWidth={7}
              label={String(Math.round(cal))}
              subLabel="kcal"
              strokeColor="hsl(var(--chart-1))"
            />
          </div>
          <div className="grid w-full min-w-0 flex-1 grid-cols-1 gap-2 xs:grid-cols-3">
            <DpsStatCard label="Protein" value={Math.round(protein)} unit="g" />
            <DpsStatCard label="Carbs" value={Math.round(carbs)} unit="g" />
            <DpsStatCard label="Fat" value={Math.round(fat)} unit="g" />
          </div>
        </div>
        <div className="space-y-3 border-t border-border/60 pt-3">
          <DpsBarProgress
            label="Protein"
            value={protein}
            max={DISPLAY_NUTRITION_GOALS.proteinG}
            valueDisplay={`${Math.round(protein)} g`}
            colorKey={2}
          />
          <DpsBarProgress
            label="Carbs"
            value={carbs}
            max={DISPLAY_NUTRITION_GOALS.carbsG}
            valueDisplay={`${Math.round(carbs)} g`}
            colorKey={3}
          />
          <DpsBarProgress
            label="Fat"
            value={fat}
            max={DISPLAY_NUTRITION_GOALS.fatG}
            valueDisplay={`${Math.round(fat)} g`}
            colorKey={4}
          />
        </div>
        <p className="text-k-xs text-muted-foreground">
          Targets are display defaults until goals exist in your profile.
        </p>
        <Button asChild variant="link" size="sm" className="h-auto p-0">
          <Link href="/nutrition">View day</Link>
        </Button>
      </div>
    </DashboardWidget>
  )
}
