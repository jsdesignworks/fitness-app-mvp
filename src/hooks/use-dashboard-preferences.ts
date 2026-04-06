'use client'

import { useCallback, useEffect, useState } from 'react'
import type { DashboardPreferences } from '@/lib/domain/user-profile.types'
import { DEFAULT_DASHBOARD_PREFERENCES } from '@/lib/dashboard/constants'

type MeResponse = {
  userId?: string
  dashboardPreferences?: DashboardPreferences | null
  [key: string]: unknown
}

export function useDashboardPreferences(): {
  preferences: DashboardPreferences
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateDashboardPreferences: (payload: DashboardPreferences) => Promise<void>
} {
  const [preferences, setPreferences] = useState<DashboardPreferences>(() => ({
    widgetOrder: [...DEFAULT_DASHBOARD_PREFERENCES.widgetOrder],
    widgetVisibility: { ...DEFAULT_DASHBOARD_PREFERENCES.widgetVisibility },
  }))
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/me', { credentials: 'include' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message ?? body.error ?? `Request failed: ${res.status}`)
      }
      const data: MeResponse = await res.json()
      setPreferences(
        data.dashboardPreferences ?? {
          widgetOrder: [...DEFAULT_DASHBOARD_PREFERENCES.widgetOrder],
          widgetVisibility: { ...DEFAULT_DASHBOARD_PREFERENCES.widgetVisibility },
        }
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load preferences')
      setPreferences({
        widgetOrder: [...DEFAULT_DASHBOARD_PREFERENCES.widgetOrder],
        widgetVisibility: { ...DEFAULT_DASHBOARD_PREFERENCES.widgetVisibility },
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  const updateDashboardPreferences = useCallback(
    async (payload: DashboardPreferences) => {
      setError(null)
      try {
        const res = await fetch('/api/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ dashboardPreferences: payload }),
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(body.message ?? body.error ?? `Update failed: ${res.status}`)
        }
        setPreferences(body.dashboardPreferences ?? payload)
        try {
          await refetch()
        } catch {
          // Refetch failed; save succeeded and state is already set from response
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to save preferences'
        setError(message)
        throw e
      }
    },
    [refetch]
  )

  return {
    preferences,
    isLoading,
    error,
    refetch,
    updateDashboardPreferences,
  }
}
