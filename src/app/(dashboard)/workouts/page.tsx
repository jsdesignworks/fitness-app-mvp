'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Dumbbell,
  Play,
  List,
  Sparkles,
  Wrench,
  RotateCcw,
} from 'lucide-react'
import { DpsContentState } from '@/components/dps/content-state'
import { DpsPageHeader } from '@/components/dps/page-header'
import { DpsPageSection } from '@/components/dps/page-section'
import { ErrorMessage } from '@/components/common/error-message'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DpsModalContent } from '@/components/dps/interaction'
import { EmptyState } from '@/components/common/empty-state'

type SessionListItem = {
  id: string
  startedAt: string
  endedAt?: string
  status?: string
  sessionExercises?: { id: string }[]
  displayTitle?: string
  workoutName?: string | null
  statsSummary?: {
    totalVolume: number
    durationMinutes: number
    exerciseCount: number
    totalSets: number
  }
}

type Template = { id: string; name: string }

type PresetMeta = { slug: string; title: string; description: string; exerciseCount: number }

export default function WorkoutsPage() {
  const [sessions, setSessions] = useState<SessionListItem[]>([])
  const [activeSession, setActiveSession] = useState<SessionListItem | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [presets, setPresets] = useState<PresetMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [presetDialogOpen, setPresetDialogOpen] = useState(false)
  const router = useRouter()

  const load = useCallback(async () => {
    setFetchError(null)
    try {
      const [listRes, currentRes, templatesRes, presetsRes] = await Promise.all([
        fetch('/api/workouts/sessions', { credentials: 'include' }),
        fetch('/api/workouts/sessions/current', { credentials: 'include' }),
        fetch('/api/workouts/templates', { credentials: 'include' }),
        fetch('/api/workouts/presets', { credentials: 'include' }),
      ])
      if (listRes.ok) {
        const data = await listRes.json()
        setSessions(Array.isArray(data) ? data : [])
      }
      if (currentRes.ok) {
        const current = await currentRes.json()
        setActiveSession(current?.id ? current : null)
      }
      if (templatesRes.ok) {
        const data = await templatesRes.json()
        setTemplates(Array.isArray(data) ? data : [])
      }
      if (presetsRes.ok) {
        const data = await presetsRes.json()
        setPresets(Array.isArray(data) ? data : [])
      }
    } catch {
      setFetchError('Failed to load workouts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function postSession(body: Record<string, unknown>) {
    setStarting(true)
    setActionError(null)
    try {
      const res = await fetch('/api/workouts/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        const base = data.message || data.error || 'Failed to start workout'
        if (res.status === 409) {
          setActionError(
            `${base} Finish or abandon your current session before starting another.`
          )
        } else {
          setActionError(base)
        }
        return
      }
      if (data.id) {
        router.push(`/workouts/session/${data.id}`)
      }
    } catch {
      setActionError('Something went wrong')
    } finally {
      setStarting(false)
    }
  }

  async function handleStartBlank() {
    await postSession({ title: 'Workout' })
  }

  async function handleStartFromTemplate(templateId: string) {
    setTemplateDialogOpen(false)
    await postSession({ workoutId: templateId })
  }

  async function handleStartPreset(slug: string) {
    setPresetDialogOpen(false)
    await postSession({ presetSlug: slug })
  }

  async function handleRepeat(sessionId: string) {
    await postSession({ duplicateFromSessionId: sessionId })
  }

  const historySessions = sessions.filter((s) => s.status !== 'in_progress')

  return (
    <div className="dps-section-y">
      <DpsPageHeader
        title="Workouts"
        description="Plan, perform, and review training sessions."
        titleId="workouts-title"
      />

      {actionError ? <ErrorMessage message={actionError} /> : null}

      <DpsContentState
        isLoading={loading}
        error={fetchError}
        onRetry={load}
        loadingLabel="Loading workouts…"
      >
        <>
          {activeSession?.id && (
            <Card variant="elevated" className="border-accent/40 bg-accent/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Play className="h-5 w-5 text-accent" />
                    Active session
                  </CardTitle>
                  <CardDescription>
                    Resume where you left off — progress is saved on the server.
                  </CardDescription>
                </div>
                <Button asChild size="lg">
                  <Link href={`/workouts/session/${activeSession.id}`}>
                    <Play className="h-4 w-4 mr-2" />
                    Resume workout
                  </Link>
                </Button>
              </CardHeader>
            </Card>
          )}

          <DpsPageSection title="Start a workout" titleId="workouts-start-section">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card variant="default">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-k-base">
                    <Sparkles className="h-4 w-4 text-accent" />
                    Preset programs
                  </CardTitle>
                  <CardDescription>Full body, push/pull/legs, equipment-focused plans.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Dialog open={presetDialogOpen} onOpenChange={setPresetDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full" disabled={starting}>
                        Choose preset
                      </Button>
                    </DialogTrigger>
                    <DpsModalContent size="lg">
                      <DialogHeader>
                        <DialogTitle>Start from preset</DialogTitle>
                        <DialogDescription>
                          Uses exercises from your library (seeded on first migration).
                        </DialogDescription>
                      </DialogHeader>
                      <ul className="space-y-2">
                        {presets.map((p) => (
                          <li key={p.slug}>
                            <Button
                              variant="outline"
                              className="w-full justify-start h-auto py-3 flex-col items-start"
                              onClick={() => handleStartPreset(p.slug)}
                              disabled={starting}
                            >
                              <span className="font-medium">{p.title}</span>
                              <span className="text-xs text-muted-foreground font-normal">
                                {p.description} · {p.exerciseCount} exercises
                              </span>
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </DpsModalContent>
                  </Dialog>
                </CardContent>
              </Card>

              <Card variant="default">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-k-base">
                    <Wrench className="h-4 w-4 text-accent" />
                    Custom builder
                  </CardTitle>
                  <CardDescription>Filter by muscle and equipment, reorder, save or start.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="secondary" className="w-full" asChild>
                    <Link href="/workouts/build">Open builder</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card variant="default">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-k-base">
                    <List className="h-4 w-4 text-accent" />
                    Your templates
                  </CardTitle>
                  <CardDescription>Start from a workout you saved earlier.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full" disabled={starting || templates.length === 0}>
                        Pick template
                      </Button>
                    </DialogTrigger>
                    <DpsModalContent size="md">
                      <DialogHeader>
                        <DialogTitle>Start from template</DialogTitle>
                        <DialogDescription>Choose a saved template.</DialogDescription>
                      </DialogHeader>
                      <ul className="max-h-60 space-y-1 overflow-y-auto overscroll-contain">
                        {templates.map((t) => (
                          <li key={t.id}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => handleStartFromTemplate(t.id)}
                              disabled={starting}
                            >
                              {t.name}
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </DpsModalContent>
                  </Dialog>
                  <Button variant="link" className="w-full p-0 h-auto text-sm" asChild>
                    <Link href="/workouts/templates/new">Create template</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card variant="default" className="sm:col-span-2 lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-k-base">
                    <Dumbbell className="h-4 w-4 text-accent" />
                    Quick start
                  </CardTitle>
                  <CardDescription>Empty session — add exercises as you go.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="secondary" className="w-full" onClick={handleStartBlank} disabled={starting}>
                    {starting ? 'Starting…' : 'Start empty workout'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </DpsPageSection>

          <DpsPageSection title="History" titleId="workouts-history-section">
            <Card variant="default">
              <CardContent className="pt-6">
                {historySessions.length === 0 ? (
                  <EmptyState
                    title="No workouts yet"
                    description="Start a preset, a custom workout, or a quick empty session to build history."
                  >
                    <Button onClick={handleStartBlank} disabled={starting}>
                      Start workout
                    </Button>
                  </EmptyState>
                ) : (
                  <ul className="space-y-2">
                    {historySessions.map((s) => {
                      const st = s.statsSummary
                      const title = s.displayTitle || 'Workout'
                      const dateStr = s.startedAt ? new Date(s.startedAt).toLocaleString() : ''
                      return (
                        <li
                          key={s.id}
                          className="flex flex-col gap-2 rounded-lg border border-border bg-card py-3 px-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="space-y-1">
                            <span className="font-medium text-foreground">{title}</span>
                            <span className="text-xs text-muted-foreground">{dateStr}</span>
                            <span className="text-xs text-muted-foreground">
                              {s.status ?? '–'}
                              {st
                                ? ` · ${st.durationMinutes ? `${st.durationMinutes} min` : '—'} · vol ${st.totalVolume ?? 0} · ${st.exerciseCount ?? 0} ex · ${st.totalSets ?? 0} sets`
                                : ''}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={s.status === 'in_progress' ? `/workouts/session/${s.id}` : `/workouts/${s.id}`}>
                                {s.status === 'in_progress' ? 'Resume' : 'View'}
                              </Link>
                            </Button>
                            {s.status !== 'in_progress' && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleRepeat(s.id)}
                                disabled={starting}
                              >
                                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                                Repeat
                              </Button>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </DpsPageSection>

          <p className="text-xs text-muted-foreground">
            <Link href="/workouts/exercises" className="dps-focus-ring rounded-sm underline">
              Exercise library
            </Link>
            {' · '}
            <Link href="/workouts/templates" className="dps-focus-ring rounded-sm underline">
              Manage templates
            </Link>
          </p>
        </>
      </DpsContentState>
    </div>
  )
}
