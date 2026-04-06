import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { UserProfileRepository } from '@/lib/repositories/user/profile.repository'
import type { DashboardPreferences } from '@/lib/domain/user-profile.types'
import { getAllowedWidgetIds } from '@/lib/dashboard/constants'

/**
 * GET /api/me — Return current user profile (creates one if missing).
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    )
  }
  try {
    const profile = await UserProfileRepository.getOrCreate(authResult.userId)
    return NextResponse.json({
      userId: profile.userId,
      onboardingCompletedAt: profile.onboardingCompletedAt?.toISOString() ?? null,
      onboardingStep: profile.onboardingStep,
      goal: profile.goal,
      dashboardPreferences: profile.dashboardPreferences ?? null,
      weightUnit: (profile as { weightUnit?: 'kg' | 'lb' }).weightUnit ?? null,
    })
  } catch (e) {
    const raw = e instanceof Error ? e.message : 'Failed to fetch profile'
    const migrationRelated = isLikelyMissingDbColumn(raw)
    const message = migrationRelated
      ? `${raw} Apply migrations if needed (see docs/MIGRATIONS_REQUIRED.md): supabase db push or supabase migration up.`
      : raw
    return NextResponse.json({ error: 'Server error', message }, { status: migrationRelated ? 503 : 500 })
  }
}

function isLikelyMissingDbColumn(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes('dashboard_preferences') ||
    lower.includes('weight_unit') ||
    (lower.includes('column') && lower.includes('does not exist')) ||
    lower.includes('42703')
  )
}

/**
 * PATCH /api/me — Update current user profile (onboarding, goal, etc.).
 */
export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    )
  }
  try {
    const body = await request.json().catch(() => ({}))
    const updates: {
      onboardingCompletedAt?: Date | null
      onboardingStep?: string | null
      goal?: string | null
      dashboardPreferences?: DashboardPreferences | null
      weightUnit?: 'kg' | 'lb' | null
    } = {}
    if (typeof body.onboardingCompletedAt === 'string') {
      updates.onboardingCompletedAt = body.onboardingCompletedAt ? new Date(body.onboardingCompletedAt) : null
    }
    if (body.onboardingCompletedAt === true) updates.onboardingCompletedAt = new Date()
    if (typeof body.onboardingStep === 'string') updates.onboardingStep = body.onboardingStep
    if (typeof body.goal === 'string') updates.goal = body.goal

    if (body.dashboardPreferences !== undefined) {
      const allowed = new Set(getAllowedWidgetIds())
      const raw = body.dashboardPreferences
      if (raw !== null && typeof raw !== 'object') {
        return NextResponse.json(
          { error: 'Invalid dashboardPreferences', message: 'Must be an object or null' },
          { status: 400 }
        )
      }
      if (raw === null) {
        updates.dashboardPreferences = null
      } else {
        const widgetOrder = Array.isArray(raw.widgetOrder)
          ? (raw.widgetOrder as unknown[]).filter((x): x is string => typeof x === 'string' && allowed.has(x))
          : []
        const widgetVisibility: Record<string, boolean> = {}
        if (raw.widgetVisibility != null && typeof raw.widgetVisibility === 'object' && !Array.isArray(raw.widgetVisibility)) {
          for (const [k, v] of Object.entries(raw.widgetVisibility)) {
            if (allowed.has(k) && typeof v === 'boolean') widgetVisibility[k] = v
          }
        }
        updates.dashboardPreferences = { widgetOrder, widgetVisibility }
      }
    }

    const rawWeightUnit = body.weightUnit
    if (rawWeightUnit !== undefined) {
      if (rawWeightUnit !== null && rawWeightUnit !== 'kg' && rawWeightUnit !== 'lb') {
        return NextResponse.json(
          { error: 'Bad request', message: 'weightUnit must be \"kg\", \"lb\", or null' },
          { status: 400 }
        )
      }
      updates.weightUnit = rawWeightUnit
    }

    const existing = await UserProfileRepository.getOrCreate(authResult.userId)
    const profile =
      Object.keys(updates).length === 0
        ? existing
        : await UserProfileRepository.update(authResult.userId, updates)
    return NextResponse.json({
      userId: profile.userId,
      onboardingCompletedAt: profile.onboardingCompletedAt?.toISOString() ?? null,
      onboardingStep: profile.onboardingStep,
      goal: profile.goal,
      dashboardPreferences: profile.dashboardPreferences ?? null,
      weightUnit: (profile as { weightUnit?: 'kg' | 'lb' }).weightUnit ?? null,
    })
  } catch (e) {
    const raw = e instanceof Error ? e.message : 'Failed to update profile'
    const migrationRelated = isLikelyMissingDbColumn(raw)
    const message = migrationRelated
      ? `${raw} Apply migrations if needed (see docs/MIGRATIONS_REQUIRED.md): supabase db push or supabase migration up.`
      : raw
    return NextResponse.json({ error: 'Server error', message }, { status: migrationRelated ? 503 : 500 })
  }
}
