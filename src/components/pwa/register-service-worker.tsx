'use client'

import { useEffect } from 'react'

/**
 * Registers the minimal static-asset service worker in production, or when
 * `NEXT_PUBLIC_ENABLE_PWA_SW=true` (e.g. local SW testing). Does not cache APIs.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const enabledInDev = process.env.NEXT_PUBLIC_ENABLE_PWA_SW === 'true'
    if (process.env.NODE_ENV !== 'production' && !enabledInDev) return
    if (!('serviceWorker' in navigator)) return

    void navigator.serviceWorker.register('/sw.js').catch(() => {
      /* non-fatal: manifest-only PWA still works */
    })
  }, [])

  return null
}
