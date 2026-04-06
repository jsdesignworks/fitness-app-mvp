'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

type Profile = {
  userId: string
  onboardingCompletedAt: string | null
  onboardingStep: string | null
  goal: string | null
}

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (pathname === '/onboarding') {
      setChecked(true)
      return
    }
    fetch('/api/me', { credentials: 'include' })
      .then((res) => {
        if (res.status === 401) {
          router.replace('/login')
          return null
        }
        return res.json()
      })
      .then((data: Profile | null) => {
        if (data && data.onboardingCompletedAt == null) {
          router.replace('/onboarding')
        }
      })
      .catch(() => {})
      .finally(() => setChecked(true))
  }, [pathname, router])

  if (!checked && pathname !== '/onboarding') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    )
  }

  return <>{children}</>
}
