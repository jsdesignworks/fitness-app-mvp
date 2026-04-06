'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const STEPS = [
  { id: 'goal', title: 'Set your goal', description: 'What do you want to focus on?' },
  { id: 'ready', title: "You're all set", description: 'Jump into workouts, nutrition, calendar, messages, and AI coaching.' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [stepIndex, setStepIndex] = useState(0)
  const [goal, setGoal] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleFinish() {
    setLoading(true)
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          onboardingCompletedAt: true,
          onboardingStep: 'done',
          ...(goal ? { goal } : {}),
        }),
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (res.status === 401) {
          toast({
            title: 'Session expired',
            description: 'Please sign in again to continue.',
            variant: 'destructive',
          })
          return
        }
        throw new Error(data.message || data.error || 'Failed to finish onboarding')
      }
      router.replace('/')
      router.refresh()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to finish onboarding'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const step = STEPS[stepIndex]
  const isLast = stepIndex === STEPS.length - 1

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="mb-8">
        <div className="flex gap-2 mb-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{step.title}</h1>
        <p className="text-muted-foreground mt-1">{step.description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {step.id === 'goal' ? 'Primary goal' : 'Get started'}
          </CardTitle>
          <CardDescription>
            {step.id === 'goal'
              ? 'e.g. Build strength, Lose weight, Stay consistent'
              : 'Head to the dashboard to schedule a workout, log food, and see your week.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step.id === 'goal' && (
            <div className="space-y-2">
              <Label htmlFor="goal">Goal (optional)</Label>
              <Input
                id="goal"
                placeholder="e.g. Build strength"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>
          )}

          {step.id === 'ready' && (
            <div className="space-y-3 pt-2">
              <div className="text-sm font-medium text-foreground">Quick links</div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button asChild variant="secondary" className="justify-start">
                  <Link href="/workouts">Workouts</Link>
                </Button>
                <Button asChild variant="secondary" className="justify-start">
                  <Link href="/nutrition">Nutrition</Link>
                </Button>
                <Button asChild variant="secondary" className="justify-start">
                  <Link href="/calendar">Calendar</Link>
                </Button>
                <Button asChild variant="secondary" className="justify-start">
                  <Link href="/messages">Messages</Link>
                </Button>
                <Button asChild variant="secondary" className="justify-start sm:col-span-2">
                  <Link href="/chat">AI Trainer</Link>
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                You can explore now or press “Get started” to finish onboarding.
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {!isLast ? (
              <Button onClick={() => setStepIndex((i) => i + 1)} className="flex-1">
                Next
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={loading} className="flex-1">
                {loading ? 'Finishing…' : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Get started
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
