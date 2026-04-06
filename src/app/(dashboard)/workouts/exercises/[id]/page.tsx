'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
import { Loader2 } from 'lucide-react'

const CATEGORIES = ['strength', 'cardio', 'mobility', 'flexibility', 'plyometric', 'balance'] as const
const TRACKING_MODES = [
  'strength_sets',
  'cardio_time_distance',
  'bodyweight_reps',
  'timed_hold',
  'intervals',
] as const

type Exercise = {
  id: string
  name: string
  category: string
  defaultTrackingMode: string
  isCustom: boolean
  createdBy?: string
  metadata?: {
    primaryMuscles?: string[]
    secondaryMuscles?: string[]
    equipment?: string[]
    instructions?: string
    videoUrl?: string
    difficulty?: string
  }
}

export default function ExerciseEditPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<string>(CATEGORIES[0])
  const [defaultTrackingMode, setDefaultTrackingMode] = useState<string>(TRACKING_MODES[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/workouts/exercises/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setExercise(data)
        if (data) {
          setName(data.name)
          setCategory(data.category)
          setDefaultTrackingMode(data.defaultTrackingMode)
        }
      })
      .catch(() => setExercise(null))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return
    setError(null)
    setSaving(true)
    try {
      const res = await fetch(`/api/workouts/exercises/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, defaultTrackingMode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Failed to update exercise')
        return
      }
      router.push('/workouts/exercises')
    } catch {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (!exercise) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Exercise</h1>
        <Card className="max-w-lg">
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">Exercise not found.</p>
            <Button variant="outline" asChild>
              <Link href="/workouts/exercises">Back to exercises</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canEdit = exercise.isCustom

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        {canEdit ? 'Edit exercise' : 'Exercise'}
      </h1>
      <Card className="shadow-card rounded-xl max-w-lg">
        <CardHeader className="space-y-1.5">
          <CardTitle className="text-lg">{exercise.name}</CardTitle>
          <CardDescription>
            {canEdit ? 'Update your custom exercise.' : 'System exercise — view only.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {exercise.metadata && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm">
              <p className="font-medium text-foreground">Exercise details</p>
              {exercise.metadata.difficulty && (
                <p>
                  <span className="text-muted-foreground">Difficulty:</span> {exercise.metadata.difficulty}
                </p>
              )}
              {exercise.metadata.primaryMuscles?.length ? (
                <p>
                  <span className="text-muted-foreground">Primary:</span>{' '}
                  {exercise.metadata.primaryMuscles.join(', ')}
                </p>
              ) : null}
              {exercise.metadata.secondaryMuscles?.length ? (
                <p>
                  <span className="text-muted-foreground">Secondary:</span>{' '}
                  {exercise.metadata.secondaryMuscles.join(', ')}
                </p>
              ) : null}
              {exercise.metadata.equipment?.length ? (
                <p>
                  <span className="text-muted-foreground">Equipment:</span>{' '}
                  {exercise.metadata.equipment.join(', ')}
                </p>
              ) : null}
              {exercise.metadata.instructions && (
                <p className="whitespace-pre-wrap">
                  <span className="text-muted-foreground block mb-1">Instructions</span>
                  {exercise.metadata.instructions}
                </p>
              )}
              {exercise.metadata.videoUrl && (
                <p>
                  <a
                    href={exercise.metadata.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    Video reference
                  </a>
                </p>
              )}
            </div>
          )}
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
                disabled={!canEdit}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory} disabled={!canEdit}>
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
              <Select value={defaultTrackingMode} onValueChange={setDefaultTrackingMode} disabled={!canEdit}>
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
              {canEdit && (
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              )}
              <Button type="button" variant="outline" asChild>
                <Link href="/workouts/exercises">Back to exercises</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
