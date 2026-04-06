'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dumbbell, UtensilsCrossed, CheckSquare, TrendingUp, Calendar } from 'lucide-react'

export function QuickActions() {
  return (
    <Card variant="elevated" className="transition-shadow hover:shadow-glow-cyan">
      <CardHeader className="space-y-1.5">
        <CardTitle>Quick actions</CardTitle>
        <CardDescription>Start a workout, log food, check in on habits, or schedule your next session.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3 space-y-0">
        <Button asChild>
          <Link href="/workouts" className="inline-flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            Start workout
          </Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/nutrition" className="inline-flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4" />
            Log food
          </Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/habits" className="inline-flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Habit check-in
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/progress" className="inline-flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Record progress
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/calendar/schedule" className="inline-flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedule workout
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
