'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type ProtectedRouteProps = {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    fetch('/api/auth/session')
      .then((res) => {
        if (!res.ok) router.replace('/login')
      })
      .catch(() => router.replace('/login'))
  }, [mounted, router])

  if (!mounted) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return <>{children}</>
}
