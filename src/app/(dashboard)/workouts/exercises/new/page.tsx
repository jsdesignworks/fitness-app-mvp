'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const CATEGORIES = ['strength', 'cardio', 'mobility', 'flexibility', 'plyometric', 'balance'] as const
const TRACKING_MODES = [
  'strength_sets',
  'cardio_time_distance',
  'bodyweight_reps',
  'timed_hold',
  'intervals',
] as const

export default function NewExercisePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [category, setCategory] = useState<string>(CATEGORIES[0])
  const [defaultTrackingMode, setDefaultTrackingMode] = useState<string>(TRACKING_MODES[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const res = await fetch('/api/workouts/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, defaultTrackingMode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Failed to create exercise')
        return
      }
      router.push('/workouts/exercises')
    } catch {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Add exercise</h1>
      <Card className="shadow-card rounded-xl max-w-lg">
        <CardHeader className="space-y-1.5">
          <CardTitle className="text-lg">Custom exercise</CardTitle>
          <CardDescription>Create a new exercise for your library.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bench Press"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tracking">Default tracking mode</Label>
              <Select value={defaultTrackingMode} onValueChange={setDefaultTrackingMode}>
                <SelectTrigger id="tracking" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRACKING_MODES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Creating…' : 'Create exercise'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/workouts/exercises">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
