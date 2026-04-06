'use client'

/**
 * Nutrition dashboard route — SYSTEM CONSUMER (DPS-2/3).
 *
 * Wiring status (see also `docs/IMPLEMENTATION_STATUS.md`):
 * - When `/api/nutrition/days` returns 5xx with a missing-table / schema message, the page shows a
 *   neutral "module preparing" state (not a destructive error). That means the API routes exist but
 *   the Supabase migration for nutrition tables may not be applied locally.
 * - When the day endpoint succeeds, this page is fully wired: real macros from logged entries only;
 *   zeros mean no food logged, not placeholder data.
 * - Preferences/macro-target endpoints are best-effort; failures fall back to display defaults.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, UtensilsCrossed } from 'lucide-react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/common/empty-state'
import { ConfirmationDialog } from '@/components/common/confirmation-dialog'
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DpsBarProgress, DpsCircularProgress, DpsStatCard } from '@/components/dps/viz'
import {
  DpsModalContent,
  DpsFormField,
  DpsFormActions,
  DpsPendingButton,
  DpsFormErrorSummary,
  DpsSelectionList,
  dpsValidate,
} from '@/components/dps/interaction'
import { DpsPageHeader } from '@/components/dps/page-header'
import { DpsPageSection } from '@/components/dps/page-section'
import { DpsContentState } from '@/components/dps/content-state'
import { SearchInput } from '@/components/ui/search-input'
import { DISPLAY_NUTRITION_GOALS, displayMacroPercent } from '@/lib/nutrition/display-goals'
import { nutritionQuantitySchema } from '@/lib/domain/nutrition.validation'
import { isLikelyNutritionInfrastructureError } from '@/lib/nutrition/nutrition-api-errors'

type FoodNutrients = {
  foodId: string
  basisAmountG: number
  caloriesKcal: number
  proteinG: number
  carbsG: number
  fatG: number
}

type FoodSearchItem = {
  id: string
  name: string
  brand?: string
  nutrients?: FoodNutrients
}

type NutritionEntryWithFood = {
  id: string
  mealId: string
  itemType: string
  foodId?: string
  quantityAmount: number
  caloriesKcal?: number
  proteinG?: number
  carbsG?: number
  fatG?: number
  foodName?: string
  foodBrand?: string
}

type MealWithEntries = {
  id: string
  nutritionDayId: string
  mealType: string
  title?: string
  sortIndex: number
  entries: NutritionEntryWithFood[]
}

type NutritionDay = {
  id: string
  userId: string
  date: string
  targetCaloriesKcal?: number
  targetProteinG?: number
  targetCarbsG?: number
  targetFatG?: number
  meals: MealWithEntries[]
}

type Summary = {
  date: string
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  targetCalories?: number
  targetProtein?: number
  targetCarbs?: number
  targetFat?: number
}

type UserMacroTargets = {
  caloriesKcal: number | null
  proteinG: number | null
  carbsG: number | null
  fatG: number | null
}

type DisplayType = 'rings' | 'bars' | 'cards'

const quantityFormSchema = z.object({
  quantity: nutritionQuantitySchema,
})

const fetchOpts: RequestInit = { credentials: 'include' }

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function mealTypeLabel(mealType: string) {
  return mealType.charAt(0).toUpperCase() + mealType.slice(1).replace(/_/g, ' ')
}

function sumMealMacros(entries: NutritionEntryWithFood[]) {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.caloriesKcal ?? 0),
      protein: acc.protein + (e.proteinG ?? 0),
      carbs: acc.carbs + (e.carbsG ?? 0),
      fat: acc.fat + (e.fatG ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

/** Visualization max: day → user defaults → display constants (documented in UI). */
function vizTargets(day: NutritionDay | null, user: UserMacroTargets | null) {
  return {
    calories:
      day?.targetCaloriesKcal ??
      user?.caloriesKcal ??
      DISPLAY_NUTRITION_GOALS.calories,
    proteinG: day?.targetProteinG ?? user?.proteinG ?? DISPLAY_NUTRITION_GOALS.proteinG,
    carbsG: day?.targetCarbsG ?? user?.carbsG ?? DISPLAY_NUTRITION_GOALS.carbsG,
    fatG: day?.targetFatG ?? user?.fatG ?? DISPLAY_NUTRITION_GOALS.fatG,
  }
}

/** Recommendations use only persisted targets (day snapshot or user defaults), not display fallback. */
function recommendationTargets(day: NutritionDay | null, user: UserMacroTargets | null) {
  return {
    calories: day?.targetCaloriesKcal ?? user?.caloriesKcal ?? undefined,
    proteinG: day?.targetProteinG ?? user?.proteinG ?? undefined,
    carbsG: day?.targetCarbsG ?? user?.carbsG ?? undefined,
    fatG: day?.targetFatG ?? user?.fatG ?? undefined,
  }
}

function nutritionRecommendations(summary: Summary, day: NutritionDay | null, user: UserMacroTargets | null): string[] {
  const t = recommendationTargets(day, user)
  const hasAny =
    t.calories != null || t.proteinG != null || t.carbsG != null || t.fatG != null
  if (!hasAny) {
    return [
      'No saved targets for this day or your profile. Save default macro targets or set targets on the day when logging to get tailored suggestions.',
    ]
  }
  const lines: string[] = []
  if (t.proteinG != null) {
    const rem = t.proteinG - summary.totalProtein
    if (rem > 0) lines.push(`About ${Math.round(rem)} g protein remaining to hit your target.`)
    else if (rem < -5) lines.push(`Protein is above target by about ${Math.round(Math.abs(rem))} g.`)
  }
  if (t.fatG != null) {
    const rem = t.fatG - summary.totalFat
    if (rem < -5) lines.push(`Fat is above target by about ${Math.round(Math.abs(rem))} g.`)
  }
  if (t.carbsG != null) {
    const rem = t.carbsG - summary.totalCarbs
    if (rem > 10) lines.push(`Roughly ${Math.round(rem)} g carbs left toward your target.`)
  }
  if (t.calories != null) {
    const rem = t.calories - summary.totalCalories
    if (rem > 50) lines.push(`About ${Math.round(rem)} kcal remaining today.`)
    else if (rem < -100) lines.push(`Calories are above target by about ${Math.round(Math.abs(rem))} kcal.`)
  }
  if (lines.length === 0) return ['You are close to your targets for logged foods today.']
  return lines
}

function usingDisplayFallback(day: NutritionDay | null, user: UserMacroTargets | null) {
  const noDay =
    day?.targetCaloriesKcal == null &&
    day?.targetProteinG == null &&
    day?.targetCarbsG == null &&
    day?.targetFatG == null
  const noUser =
    !user ||
    (user.caloriesKcal == null &&
      user.proteinG == null &&
      user.carbsG == null &&
      user.fatG == null)
  return noDay && noUser
}

export default function NutritionPage() {
  const [date, setDate] = useState(() => {
    const d = new Date()
    return d.toISOString().slice(0, 10)
  })
  const [nutritionDay, setNutritionDay] = useState<NutritionDay | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  /** True when the API exists but DB objects are missing / migrations not applied — show staged UI, not a red error. */
  const [dataLayerUnavailable, setDataLayerUnavailable] = useState(false)
  /** Non-blocking notice (e.g. delete failed) — must not replace the whole page via DpsContentState error. */
  const [pageNotice, setPageNotice] = useState<string | null>(null)

  const [displayType, setDisplayType] = useState<DisplayType>('bars')
  const [userMacroTargets, setUserMacroTargets] = useState<UserMacroTargets | null>(null)
  const [prefsLoaded, setPrefsLoaded] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMealId, setModalMealId] = useState<string | null>(null)
  const [editEntry, setEditEntry] = useState<NutritionEntryWithFood | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FoodSearchItem[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const [selectedFood, setSelectedFood] = useState<FoodSearchItem | null>(null)
  const [quantity, setQuantity] = useState('1')
  const [quantityFieldError, setQuantityFieldError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const deleteInFlight = useRef(false)

  const fetchDay = useCallback(async (d: string) => {
    setLoading(true)
    setLoadError(null)
    setDataLayerUnavailable(false)
    setPageNotice(null)
    try {
      const res = await fetch(`/api/nutrition/days?date=${encodeURIComponent(d)}`, fetchOpts)
      let data: { nutritionDay?: NutritionDay; summary?: Summary; message?: string } = {}
      try {
        data = (await res.json()) as typeof data
      } catch {
        data = {}
      }
      const msg = data.message

      if (res.status === 401) {
        setLoadError(msg || 'Sign in to view nutrition.')
        setNutritionDay(null)
        setSummary(null)
        return
      }

      if (!res.ok) {
        setNutritionDay(null)
        setSummary(null)
        if (res.status >= 500 && isLikelyNutritionInfrastructureError(msg)) {
          setDataLayerUnavailable(true)
          return
        }
        setLoadError(msg || `Could not load nutrition (${res.status}).`)
        return
      }

      setNutritionDay(data.nutritionDay ?? null)
      setSummary(data.summary ?? null)
    } catch {
      setLoadError('Network error — could not reach the server.')
      setNutritionDay(null)
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadPreferences = useCallback(async () => {
    try {
      const res = await fetch('/api/nutrition/preferences', fetchOpts)
      if (!res.ok) return
      const data = await res.json()
      const dt = data.displayType as DisplayType
      if (dt === 'rings' || dt === 'bars' || dt === 'cards') setDisplayType(dt)
    } catch {
      /* keep default */
    }
  }, [])

  const loadMacroTargets = useCallback(async () => {
    try {
      const res = await fetch('/api/nutrition/macro-targets', fetchOpts)
      if (!res.ok) return
      const data = await res.json()
      setUserMacroTargets({
        caloriesKcal: data.caloriesKcal ?? null,
        proteinG: data.proteinG ?? null,
        carbsG: data.carbsG ?? null,
        fatG: data.fatG ?? null,
      })
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    fetchDay(date)
  }, [date, fetchDay])

  useEffect(() => {
    if (prefsLoaded) return
    setPrefsLoaded(true)
    void loadPreferences()
    void loadMacroTargets()
  }, [prefsLoaded, loadPreferences, loadMacroTargets])

  const runFoodSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([])
      setSearchError(null)
      return
    }
    setSearching(true)
    setSearchError(null)
    try {
      const res = await fetch(
        `/api/nutrition/foods/search?q=${encodeURIComponent(q.trim())}`,
        fetchOpts
      )
      const data = await res.json()
      if (!res.ok) {
        setSearchError(data.message || 'Search failed')
        setSearchResults([])
        return
      }
      const raw = Array.isArray(data.foods) ? data.foods : []
      setSearchResults(
        raw.map((f: { id: string; name: string; brandName?: string; nutrients?: FoodNutrients }) => ({
          id: f.id,
          name: f.name,
          brand: f.brandName,
          nutrients: f.nutrients,
        }))
      )
    } catch {
      setSearchError('Could not search foods')
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    if (!modalOpen || editEntry) {
      setSearchResults([])
      setSearchError(null)
      return
    }
    if (!searchQuery.trim()) {
      setSearchResults([])
      setSearchError(null)
      return
    }
    const t = setTimeout(() => void runFoodSearch(searchQuery), 300)
    return () => clearTimeout(t)
  }, [modalOpen, editEntry, searchQuery, runFoodSearch])

  async function persistDisplayType(dt: DisplayType) {
    const prev = displayType
    setDisplayType(dt)
    try {
      const res = await fetch('/api/nutrition/preferences', {
        ...fetchOpts,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayType: dt }),
      })
      if (!res.ok) setDisplayType(prev)
    } catch {
      setDisplayType(prev)
    }
  }

  function prevDay() {
    const d = new Date(date + 'T12:00:00')
    d.setDate(d.getDate() - 1)
    setDate(d.toISOString().slice(0, 10))
  }

  function nextDay() {
    const d = new Date(date + 'T12:00:00')
    d.setDate(d.getDate() + 1)
    setDate(d.toISOString().slice(0, 10))
  }

  function openAddFood(mealId: string) {
    setModalMealId(mealId)
    setEditEntry(null)
    setModalOpen(true)
    setSearchQuery('')
    setSelectedFood(null)
    setQuantity('1')
    setQuantityFieldError(undefined)
    setFormError(null)
    setSearchResults([])
    setSearchError(null)
  }

  function openEditFood(entry: NutritionEntryWithFood) {
    setModalMealId(entry.mealId)
    setEditEntry(entry)
    setModalOpen(true)
    setSearchQuery('')
    setSelectedFood(
      entry.foodId
        ? { id: entry.foodId, name: entry.foodName ?? 'Food', brand: entry.foodBrand }
        : { id: '', name: entry.foodName ?? 'Food', brand: entry.foodBrand }
    )
    setQuantity(String(entry.quantityAmount))
    setQuantityFieldError(undefined)
    setFormError(null)
    setSearchError(null)
  }

  function closeModal(open: boolean) {
    setModalOpen(open)
    if (!open) {
      setEditEntry(null)
      setModalMealId(null)
      setSelectedFood(null)
      setFormError(null)
      setQuantityFieldError(undefined)
    }
  }

  async function handleModalSubmit() {
    setFormError(null)
    setQuantityFieldError(undefined)
    const parsed = dpsValidate(quantityFormSchema, { quantity })
    if (!parsed.ok) {
      setQuantityFieldError(parsed.fieldErrors.quantity)
      if (parsed.formError) setFormError(parsed.formError)
      return
    }
    const qty = parsed.data.quantity

    if (editEntry) {
      setSubmitting(true)
      try {
        const res = await fetch(`/api/nutrition/entries/${editEntry.id}`, {
          ...fetchOpts,
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantityAmount: qty }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setFormError((data as { message?: string }).message || 'Failed to update entry')
          return
        }
        closeModal(false)
        await fetchDay(date)
      } catch {
        setFormError('Failed to update entry')
      } finally {
        setSubmitting(false)
      }
      return
    }

    if (!modalMealId || !selectedFood) {
      setFormError('Select a food and enter quantity.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/nutrition/entries', {
        ...fetchOpts,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealId: modalMealId,
          foodId: selectedFood.id,
          quantityAmount: qty,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setFormError((data as { message?: string }).message || 'Failed to add entry')
        return
      }
      closeModal(false)
      await fetchDay(date)
    } catch {
      setFormError('Failed to add entry')
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || deleteInFlight.current) return
    deleteInFlight.current = true
    setDeleting(true)
    try {
      const res = await fetch(`/api/nutrition/entries/${deleteTarget.id}`, {
        ...fetchOpts,
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setPageNotice((data as { message?: string }).message || 'Could not remove that entry.')
        return
      }
      setDeleteTarget(null)
      await fetchDay(date)
    } catch {
      setPageNotice('Could not remove that entry.')
    } finally {
      deleteInFlight.current = false
      setDeleting(false)
    }
  }

  const isToday = date === new Date().toISOString().slice(0, 10)

  const hasAnyLoggedFood = useMemo(() => {
    if (!nutritionDay?.meals?.length) return false
    return nutritionDay.meals.some((m) => m.entries.length > 0)
  }, [nutritionDay])

  const targets = useMemo(
    () => vizTargets(nutritionDay, userMacroTargets),
    [nutritionDay, userMacroTargets]
  )

  const showDisplayFallbackNote = usingDisplayFallback(nutritionDay, userMacroTargets)

  const dateNav = (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="icon" onClick={prevDay} aria-label="Previous day">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[11rem] text-center font-medium text-k-sm sm:text-k-base">
        {formatDate(date)}
        {isToday ? <span className="ml-1 text-muted-foreground">(today)</span> : null}
      </span>
      <Button variant="outline" size="icon" onClick={nextDay} aria-label="Next day">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )

  const displayToggle = (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Macro display style">
      {(['rings', 'bars', 'cards'] as const).map((dt) => (
        <Button
          key={dt}
          type="button"
          size="sm"
          variant={displayType === dt ? 'default' : 'outline'}
          onClick={() => void persistDisplayType(dt)}
        >
          {dt === 'rings' ? 'Rings' : dt === 'bars' ? 'Bars' : 'Cards'}
        </Button>
      ))}
    </div>
  )

  const macroBlock =
    summary && nutritionDay ? (
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0">
          <CardTitle className="text-k-lg font-display uppercase tracking-kinetic-wide">Daily macros</CardTitle>
          {displayToggle}
        </CardHeader>
        <CardContent className="space-y-4">
          {displayType === 'rings' ? (
            <div className="flex flex-wrap justify-around gap-6">
              <DpsCircularProgress
                value={displayMacroPercent(summary.totalCalories, targets.calories)}
                label="Cal"
                subLabel={`${Math.round(summary.totalCalories)} / ${Math.round(targets.calories)}`}
                strokeColor="hsl(var(--chart-1))"
              />
              <DpsCircularProgress
                value={displayMacroPercent(summary.totalProtein, targets.proteinG)}
                label="P"
                subLabel={`${Math.round(summary.totalProtein)} / ${Math.round(targets.proteinG)} g`}
                strokeColor="hsl(var(--chart-2))"
              />
              <DpsCircularProgress
                value={displayMacroPercent(summary.totalCarbs, targets.carbsG)}
                label="C"
                subLabel={`${Math.round(summary.totalCarbs)} / ${Math.round(targets.carbsG)} g`}
                strokeColor="hsl(var(--chart-3))"
              />
              <DpsCircularProgress
                value={displayMacroPercent(summary.totalFat, targets.fatG)}
                label="F"
                subLabel={`${Math.round(summary.totalFat)} / ${Math.round(targets.fatG)} g`}
                strokeColor="hsl(var(--chart-4))"
              />
            </div>
          ) : null}

          {displayType === 'bars' ? (
            <div className="space-y-3 border-border/60 pt-1">
              <DpsBarProgress
                label="Calories"
                value={summary.totalCalories}
                max={targets.calories}
                valueDisplay={`${Math.round(summary.totalCalories)} kcal`}
                colorKey={1}
              />
              <DpsBarProgress
                label="Protein"
                value={summary.totalProtein}
                max={targets.proteinG}
                valueDisplay={`${Math.round(summary.totalProtein)} g`}
                colorKey={2}
              />
              <DpsBarProgress
                label="Carbs"
                value={summary.totalCarbs}
                max={targets.carbsG}
                valueDisplay={`${Math.round(summary.totalCarbs)} g`}
                colorKey={3}
              />
              <DpsBarProgress
                label="Fat"
                value={summary.totalFat}
                max={targets.fatG}
                valueDisplay={`${Math.round(summary.totalFat)} g`}
                colorKey={4}
              />
            </div>
          ) : null}

          {displayType === 'cards' ? (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <DpsStatCard
                label="Calories"
                value={Math.round(summary.totalCalories)}
                unit="kcal"
                description={`${Math.round(displayMacroPercent(summary.totalCalories, targets.calories))}% of target`}
              />
              <DpsStatCard
                label="Protein"
                value={Math.round(summary.totalProtein)}
                unit="g"
                description={`${Math.round(displayMacroPercent(summary.totalProtein, targets.proteinG))}% of target`}
              />
              <DpsStatCard
                label="Carbs"
                value={Math.round(summary.totalCarbs)}
                unit="g"
                description={`${Math.round(displayMacroPercent(summary.totalCarbs, targets.carbsG))}% of target`}
              />
              <DpsStatCard
                label="Fat"
                value={Math.round(summary.totalFat)}
                unit="g"
                description={`${Math.round(displayMacroPercent(summary.totalFat, targets.fatG))}% of target`}
              />
            </div>
          ) : null}

          <p className="text-k-xs text-muted-foreground">
            {showDisplayFallbackNote
              ? 'Targets shown use app defaults until you save profile macro defaults (applied to new days) or set targets on the day.'
              : 'Targets use this day’s saved values, then your profile defaults when the day has no targets.'}
            {' '}Quantities multiply the food’s nutrient basis (same as logging).
          </p>
        </CardContent>
      </Card>
    ) : null

  const recommendations =
    summary && nutritionDay ? (
      <Card>
        <CardHeader>
          <CardTitle className="text-k-lg font-display uppercase tracking-kinetic-wide">Today’s notes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-k-sm text-muted-foreground">
            {nutritionRecommendations(summary, nutritionDay, userMacroTargets).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    ) : null

  const showStagedInfrastructure = dataLayerUnavailable && !loading
  const showMainContent = Boolean(!loading && !loadError && nutritionDay && summary && !dataLayerUnavailable)
  const showEmptyFallback =
    !loading && !loadError && !dataLayerUnavailable && (!nutritionDay || !summary)

  return (
    <div className="dps-section-y">
      <DpsPageHeader
        title="Nutrition"
        description="Log meals by day. Macros use your food database and basis amounts."
        actions={dateNav}
        titleId="nutrition-page-title"
      />

      {pageNotice ? (
        <div
          role="status"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-k-sm text-destructive"
        >
          {pageNotice}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-2 h-auto p-0 text-destructive underline"
            onClick={() => setPageNotice(null)}
          >
            Dismiss
          </Button>
        </div>
      ) : null}

      <DpsContentState
        isLoading={loading}
        error={loadError}
        onRetry={() => fetchDay(date)}
        loadingLabel="Loading nutrition day…"
        empty={showEmptyFallback}
        emptyTitle="No nutrition data loaded"
        emptyDescription="Try again, or check that you are signed in and the nutrition data layer is available."
        emptyIcon={<UtensilsCrossed className="h-8 w-8" />}
      >
        {showStagedInfrastructure ? (
          <DpsPageSection titleId="nutrition-staged-section">
            <Card className="border-dashed border-border/80 bg-muted/10">
              <CardContent className="pt-4 sm:pt-5 md:pt-6">
                <div className="dps-stack-y">
                  <EmptyState
                    icon={<UtensilsCrossed className="h-8 w-8" />}
                    title="Nutrition module is being prepared"
                    description="Food logging and macro tracking will appear here once the Nutrition data layer is connected in your environment (run Supabase migrations). This is not a broken page — the feature is staged."
                  />
                  <p className="text-center text-k-xs text-muted-foreground max-w-md mx-auto">
                    Day navigation above stays available; connecting the database will load real data. No sample
                    macros are shown on purpose.
                  </p>
                </div>
              </CardContent>
            </Card>
          </DpsPageSection>
        ) : null}
        {showMainContent ? (
          <>
            {!hasAnyLoggedFood ? (
              <div
                className="rounded-lg border border-border/60 bg-muted/15 px-4 py-3 text-k-sm text-muted-foreground"
                role="status"
              >
                No food logged for this day.
              </div>
            ) : null}
            <DpsPageSection titleId="nutrition-macros-section">{macroBlock}</DpsPageSection>
            <DpsPageSection titleId="nutrition-rec-section">{recommendations}</DpsPageSection>
            <DpsPageSection title="Meals" description="Subtotals reflect logged items in each block.">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {(nutritionDay as NutritionDay).meals.map((meal) => {
                  const sub = sumMealMacros(meal.entries)
                  return (
                    <Card key={meal.id} className="flex flex-col">
                      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
                        <div>
                          <CardTitle className="text-k-base">{mealTypeLabel(meal.mealType)}</CardTitle>
                          <p className="text-k-xs text-muted-foreground tabular-nums">
                            Subtotal: {Math.round(sub.calories)} kcal · P {Math.round(sub.protein)}g · C{' '}
                            {Math.round(sub.carbs)}g · F {Math.round(sub.fat)}g
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAddFood(meal.id)}
                          className="gap-1 shrink-0"
                        >
                          <Plus className="h-4 w-4" />
                          Add food
                        </Button>
                      </CardHeader>
                      <CardContent className="flex-1">
                        {meal.entries.length === 0 ? (
                          <EmptyState
                            icon={<UtensilsCrossed className="h-8 w-8" />}
                            title="No items logged"
                            description="Add a food to log this meal."
                          >
                            <Button variant="outline" size="sm" onClick={() => openAddFood(meal.id)}>
                              Add food
                            </Button>
                          </EmptyState>
                        ) : (
                          <ul className="space-y-2">
                            {meal.entries.map((entry) => (
                              <li
                                key={entry.id}
                                className="flex flex-col gap-2 border-b border-border py-2 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium truncate">{entry.foodName ?? 'Food'}</p>
                                  {entry.foodBrand ? (
                                    <p className="text-k-xs text-muted-foreground truncate">{entry.foodBrand}</p>
                                  ) : null}
                                  <p className="text-k-sm text-muted-foreground tabular-nums">
                                    Qty {entry.quantityAmount} (× basis){' '}
                                    {entry.caloriesKcal != null && `· ${Math.round(entry.caloriesKcal)} kcal`}
                                    {entry.proteinG != null && ` · P ${Math.round(entry.proteinG)}g`}
                                    {entry.carbsG != null && ` C ${Math.round(entry.carbsG)}g`}
                                    {entry.fatG != null && ` F ${Math.round(entry.fatG)}g`}
                                  </p>
                                </div>
                                <div className="flex shrink-0 gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => openEditFood(entry)}>
                                    Edit
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() =>
                                      setDeleteTarget({
                                        id: entry.id,
                                        label: entry.foodName ?? 'this entry',
                                      })
                                    }
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </DpsPageSection>
          </>
        ) : null}
      </DpsContentState>

      <Dialog open={modalOpen} onOpenChange={closeModal}>
        <DpsModalContent size="lg">
          <DialogHeader>
            <DialogTitle>{editEntry ? 'Edit food' : 'Add food'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editEntry ? (
              <DpsFormField
                label="Search foods"
                hint="Results are from your catalog; pick one to set quantity."
              >
                <SearchInput
                  placeholder="Type food name…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </DpsFormField>
            ) : null}

            {!editEntry ? (
              <DpsSelectionList<FoodSearchItem>
                items={searchResults}
                keyExtractor={(f) => f.id}
                loading={searching}
                emptyMessage={
                  searchQuery.trim() ? 'No foods match. Try another search.' : 'Type to search foods.'
                }
                error={searchError}
                onRetry={() => void runFoodSearch(searchQuery)}
                onSelectItem={(f) => {
                  setSelectedFood(f)
                  setFormError(null)
                }}
                isItemSelected={(f) => selectedFood?.id === f.id}
                renderItem={(f) => (
                  <span className="flex flex-col items-start gap-0.5 text-left">
                    <span className="font-medium">{f.name}</span>
                    {f.brand ? (
                      <span className="text-k-xs text-muted-foreground">{f.brand}</span>
                    ) : null}
                    {f.nutrients ? (
                      <span className="text-k-xs text-muted-foreground">
                        {Math.round(f.nutrients.caloriesKcal)} kcal per basis ({f.nutrients.basisAmountG}g)
                      </span>
                    ) : null}
                  </span>
                )}
              />
            ) : (
              <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                <p className="text-k-xs text-muted-foreground">Selected food</p>
                <p className="font-medium">{selectedFood?.name ?? 'Food'}</p>
                {selectedFood?.brand ? (
                  <p className="text-k-xs text-muted-foreground truncate">{selectedFood.brand}</p>
                ) : null}
                <p className="text-k-xs text-muted-foreground mt-1">
                  Changing the food on edit is not supported — delete and add if needed.
                </p>
              </div>
            )}

            {(selectedFood || editEntry) && (
              <>
                <DpsFormField
                  label="Quantity"
                  hint="Multiplier for the food’s nutrient basis (same rule as when logging)."
                  error={quantityFieldError}
                >
                  <Input
                    variant="number"
                    min={0.01}
                    step={0.1}
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(e.target.value)
                      setQuantityFieldError(undefined)
                    }}
                  />
                </DpsFormField>
                <DpsFormErrorSummary message={formError} />
                <DpsFormActions>
                  {!editEntry && selectedFood ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedFood(null)
                        setQuantity('1')
                        setQuantityFieldError(undefined)
                      }}
                    >
                      Change food
                    </Button>
                  ) : null}
                  <DpsPendingButton
                    type="button"
                    pending={submitting}
                    pendingLabel={editEntry ? 'Saving…' : 'Adding…'}
                    onClick={() => void handleModalSubmit()}
                  >
                    {editEntry ? 'Save changes' : 'Add entry'}
                  </DpsPendingButton>
                </DpsFormActions>
              </>
            )}
          </div>
        </DpsModalContent>
      </Dialog>

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}
        title="Remove food?"
        description={
          deleteTarget
            ? `Remove ${deleteTarget.label} from this meal? This cannot be undone.`
            : undefined
        }
        confirmLabel={deleting ? 'Removing…' : 'Remove'}
        variant="destructive"
        onConfirm={async () => {
          await confirmDelete()
        }}
      />
    </div>
  )
}
