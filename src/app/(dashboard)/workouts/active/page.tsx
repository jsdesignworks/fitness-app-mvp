'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/common/loading-spinner'

export default function ActiveWorkoutPage() {
  const router = useRouter()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/workouts/sessions/current')
      .then((res) => res.json())
      .then((data) => {
        if (data?.id) {
          setSessionId(data.id)
        } else {
          setSessionId(null)
        }
      })
      .catch(() => setSessionId(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <LoadingSpinner />
      </div>
    )
  }

  if (sessionId) {
    router.replace(`/workouts/session/${sessionId}`)
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Active workout</h1>
      <Card className="shadow-card rounded-xl max-w-lg">
        <CardHeader className="space-y-1.5">
          <CardTitle className="text-lg">No active session</CardTitle>
          <CardDescription>Start a workout from the workouts list.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/workouts">Go to workouts</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
