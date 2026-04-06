'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { SessionCache } from '@/lib/offline/session-cache'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DpsModalContent } from '@/components/dps/interaction'
import { EmptyState } from '@/components/common/empty-state'
import { SessionRestTimer } from '@/components/workout/session-rest-timer'
import { Plus, Dumbbell, Loader2, ChevronDown } from 'lucide-react'

type ExerciseSet = {
  id: string
  sessionExerciseId: string
  setIndex: number
  setType: string
  reps?: number
  weight?: number
  rpe?: number
  isCompleted: boolean
}

type SessionExercise = {
  id: string
  sessionId: string
  exerciseId: string
  orderIndex: number
  trackingMode: string
  sets: ExerciseSet[]
  exerciseName?: string
}

type Session = {
  id: string
  userId: string
  startedAt: string
  endedAt?: string
  status: string
  sessionExercises: SessionExercise[]
}

type Exercise = { id: string; name: string }

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const id = params?.id as string
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addExerciseOpen, setAddExerciseOpen] = useState(false)
  const [exerciseSearch, setExerciseSearch] = useState('')
  const [exerciseList, setExerciseList] = useState<Exercise[]>([])
  const [addingExercise, setAddingExercise] = useState(false)
  const [addingSetFor, setAddingSetFor] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)
  const [abandoning, setAbandoning] = useState(false)
  const [patchingSet, setPatchingSet] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)

  const fetchSession = useCallback(async () => {
    if (!id) return
    try {
      const res = await fetch(`/api/workouts/sessions/${id}`)
      if (res.status === 401 || res.status === 403) {
        setError('You don’t have access to this session.')
        setSession(null)
        setIsOffline(false)
        return
      }
      if (!res.ok) {
        const cached = SessionCache.get(id)
        if (cached) {
          setSession(cached as Session)
          setError(null)
          setIsOffline(true)
        } else {
          setError('Session not found.')
          setSession(null)
        }
        return
      }
      const data = await res.json()
      setSession(data)
      setError(null)
      setIsOffline(false)
      SessionCache.set(id, data)
    } catch {
      const cached = SessionCache.get(id)
      if (cached) {
        setSession(cached as Session)
        setError(null)
        setIsOffline(true)
      } else {
        setError('Failed to load session.')
        setSession(null)
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  useEffect(() => {
    if (!id) return
    function handleOnline() {
      const queue = SessionCache.getMutationQueue(id)
      if (queue.length === 0) {
        fetchSession()
        return
      }
      const run = async () => {
        const remaining: Array<{ type: string; payload: unknown }> = []
        for (const m of queue) {
          if (m.type === 'add_set' && m.payload && typeof m.payload === 'object' && 'sessionExerciseId' in m.payload) {
            const res = await fetch(`/api/workouts/session-exercises/${(m.payload as { sessionExerciseId: string }).sessionExerciseId}/sets`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({}),
            })
            if (!res.ok) remaining.push(m)
          }
          if (m.type === 'update_set' && m.payload && typeof m.payload === 'object' && 'setId' in m.payload) {
            const { setId, updates } = m.payload as { setId: string; updates: { reps?: number; weight?: number; rpe?: number } }
            const res = await fetch(`/api/workouts/sets/${setId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates ?? {}),
            })
            if (!res.ok) remaining.push(m)
          }
        }
        if (remaining.length === 0) {
          SessionCache.clearMutationQueue(id)
        } else {
          SessionCache.setMutationQueue(id, remaining)
        }
        await fetchSession()
      }
      run()
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [id, fetchSession])

  useEffect(() => {
    if (!addExerciseOpen) return
    const q = exerciseSearch.trim()
    const url = q
      ? `/api/workouts/exercises/search?q=${encodeURIComponent(q)}`
      : '/api/workouts/exercises'
    fetch(url)
      .then((r) => r.ok ? r.json() : [])
      .then((list) => setExerciseList(Array.isArray(list) ? list : []))
      .catch(() => setExerciseList([]))
  }, [addExerciseOpen, exerciseSearch])

  async function handleAddExercise(exerciseId: string) {
    setAddingExercise(true)
    try {
      const res = await fetch(`/api/workouts/sessions/${id}/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.message || 'Failed to add exercise')
        return
      }
      setAddExerciseOpen(false)
      setExerciseSearch('')
      await fetchSession()
    } finally {
      setAddingExercise(false)
    }
  }

  async function handleAddSet(sessionExerciseId: string) {
    setAddingSetFor(sessionExerciseId)
    try {
      const res = await fetch(`/api/workouts/session-exercises/${sessionExerciseId}/sets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.message || 'Failed to add set')
        SessionCache.enqueueMutation(id, { type: 'add_set', payload: { sessionExerciseId } })
        return
      }
      await fetchSession()
    } catch {
      SessionCache.enqueueMutation(id, { type: 'add_set', payload: { sessionExerciseId } })
      setError('Offline — change will sync when back online.')
    } finally {
      setAddingSetFor(null)
    }
  }

  async function handleUpdateSet(setId: string, updates: { reps?: number; weight?: number; rpe?: number }) {
    setPatchingSet(setId)
    try {
      const res = await fetch(`/api/workouts/sets/${setId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        await fetchSession()
      } else {
        SessionCache.enqueueMutation(id, { type: 'update_set', payload: { setId, updates } })
      }
    } catch {
      SessionCache.enqueueMutation(id, { type: 'update_set', payload: { setId, updates } })
    } finally {
      setPatchingSet(null)
    }
  }

  async function handleComplete() {
    if (!navigator.onLine) {
      toast({ title: 'Offline', description: 'You need to be online to complete the workout.', variant: 'destructive' })
      return
    }
    setCompleting(true)
    try {
      const res = await fetch(`/api/workouts/sessions/${id}/complete`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.message || 'Failed to complete')
        return
      }
      const messagesRes = await fetch('/api/messages?limit=1')
      if (messagesRes.ok) {
        const data = await messagesRes.json()
        const latest = data.messages?.[0] ?? data.events?.[0]
        if (latest?.triggerKey === 'workout_complete' && latest?.renderedBody) {
          const created = new Date(latest.createdAt).getTime()
          if (Date.now() - created < 60_000) {
            toast({ title: 'Workout complete', description: latest.renderedBody })
          }
        }
      }
      SessionCache.clear(id)
      router.push('/workouts')
    } finally {
      setCompleting(false)
    }
  }

  async function handleAbandon() {
    if (!navigator.onLine) {
      toast({ title: 'Offline', description: 'You need to be online to abandon the workout.', variant: 'destructive' })
      return
    }
    setAbandoning(true)
    try {
      const res = await fetch(`/api/workouts/sessions/${id}/abandon`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.message || 'Failed to abandon')
        return
      }
      SessionCache.clear(id)
      router.push('/workouts')
    } finally {
      setAbandoning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error && !session) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Session</h1>
        <Card className="max-w-lg shadow-card rounded-xl">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" asChild>
              <Link href="/workouts">Back to Workouts</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isReadOnly = session?.status === 'completed' || session?.status === 'abandoned'
  const title =
    session?.status === 'in_progress'
      ? 'Session in progress'
      : session?.startedAt
        ? new Date(session.startedAt).toLocaleString()
        : 'Session'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/workouts">Back to Workouts</Link>
        </Button>
      </div>

      {isOffline && (
        <p className="text-sm bg-amber-500/10 text-amber-800 dark:text-amber-200 px-3 py-2 rounded-md" role="status">
          Offline — changes will sync when back online.
        </p>
      )}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {session?.status === 'in_progress' && (
        <>
        <SessionRestTimer />
        <div className="flex flex-wrap gap-2">
          <Dialog open={addExerciseOpen} onOpenChange={setAddExerciseOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add exercise
              </Button>
            </DialogTrigger>
            <DpsModalContent size="lg">
              <DialogHeader>
                <DialogTitle>Add exercise</DialogTitle>
                <DialogDescription>Search and select an exercise to add to this session.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label htmlFor="exercise-search">Search</Label>
                  <Input
                    id="exercise-search"
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                    placeholder="Type to search exercises..."
                    className="mt-1"
                  />
                </div>
                <ul className="max-h-60 overflow-auto space-y-1 rounded-md border p-2">
                  {exerciseList.length === 0 ? (
                    <li className="text-sm text-muted-foreground py-2">No exercises found.</li>
                  ) : (
                    exerciseList.map((ex) => (
                      <li key={ex.id}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          disabled={addingExercise}
                          onClick={() => handleAddExercise(ex.id)}
                        >
                          {ex.name}
                        </Button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </DpsModalContent>
          </Dialog>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleAbandon}
            disabled={abandoning}
          >
            {abandoning ? 'Abandoning…' : 'Abandon'}
          </Button>
          <Button
            size="sm"
            onClick={handleComplete}
            disabled={completing}
          >
            {completing ? 'Completing…' : 'Complete workout'}
          </Button>
        </div>
        </>
      )}

      <Card className="shadow-card rounded-xl">
        <CardHeader className="space-y-1.5">
          <CardTitle className="text-lg">Exercises</CardTitle>
          <CardDescription>
            {session?.sessionExercises?.length
              ? `${session.sessionExercises.length} exercise(s)`
              : 'No exercises in this session.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!session?.sessionExercises?.length ? (
            <EmptyState
              icon={<Dumbbell className="h-12 w-12" />}
              title="No exercises yet"
              description={
                isReadOnly
                  ? 'This session has no logged exercises.'
                  : 'Add an exercise above to start logging sets.'
              }
            />
          ) : (
            <ul className="space-y-6">
              {session.sessionExercises.map((se, idx) => (
                <li
                  key={se.id}
                  id={`exercise-${se.id}`}
                  className="rounded-lg border border-border bg-card p-4 scroll-mt-24"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="font-medium text-foreground">
                      {se.exerciseName ?? `Exercise ${se.orderIndex}`}
                    </div>
                    {!isReadOnly && idx < session.sessionExercises.length - 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={() => {
                          const next = session.sessionExercises[idx + 1]
                          document.getElementById(`exercise-${next.id}`)?.scrollIntoView({ behavior: 'smooth' })
                        }}
                      >
                        Next exercise
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {se.sets.map((set) => (
                      <div
                        key={set.id}
                        className="flex flex-wrap items-center gap-3 py-2 border-b border-border/50 last:border-0"
                      >
                        <span className="text-sm text-muted-foreground w-8">Set {set.setIndex}</span>
                        {isReadOnly ? (
                          <>
                            <span className="text-sm">{set.reps ?? '–'} reps</span>
                            <span className="text-sm">{set.weight != null ? `${set.weight} kg` : '–'}</span>
                            {set.rpe != null && <span className="text-sm">RPE {set.rpe}</span>}
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-1">
                              <Label htmlFor={`reps-${set.id}`} className="sr-only">Reps</Label>
                              <Input
                                id={`reps-${set.id}`}
                                type="number"
                                min={0}
                                className="w-16 h-8"
                                placeholder="Reps"
                                value={set.reps ?? ''}
                                onBlur={(e) => {
                                  const v = e.target.value === '' ? undefined : Number(e.target.value)
                                  if (v !== undefined && !Number.isNaN(v) && v !== set.reps) {
                                    handleUpdateSet(set.id, { reps: v })
                                  }
                                }}
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <Label htmlFor={`weight-${set.id}`} className="sr-only">Weight</Label>
                              <Input
                                id={`weight-${set.id}`}
                                type="number"
                                min={0}
                                step={0.5}
                                className="w-20 h-8"
                                placeholder="Weight"
                                value={set.weight ?? ''}
                                onBlur={(e) => {
                                  const v = e.target.value === '' ? undefined : Number(e.target.value)
                                  if (v !== undefined && !Number.isNaN(v) && v !== set.weight) {
                                    handleUpdateSet(set.id, { weight: v })
                                  }
                                }}
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <Label htmlFor={`rpe-${set.id}`} className="sr-only">RPE</Label>
                              <Input
                                id={`rpe-${set.id}`}
                                type="number"
                                min={1}
                                max={10}
                                className="w-14 h-8"
                                placeholder="RPE"
                                value={set.rpe ?? ''}
                                onBlur={(e) => {
                                  const v = e.target.value === '' ? undefined : Number(e.target.value)
                                  if (v !== undefined && !Number.isNaN(v) && v !== set.rpe) {
                                    handleUpdateSet(set.id, { rpe: v })
                                  }
                                }}
                              />
                            </div>
                            {patchingSet === set.id && (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  {!isReadOnly && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => handleAddSet(se.id)}
                      disabled={addingSetFor === se.id}
                    >
                      {addingSetFor === se.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Plus className="h-4 w-4 mr-1" />
                      )}
                      Add set
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
