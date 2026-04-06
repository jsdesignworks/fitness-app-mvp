'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DpsModalContent } from '@/components/dps/interaction'
import { Plus, Check, X, Target, Pencil, Archive } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

type Habit = {
  id: string
  name: string
  type: 'good' | 'bad'
  streakDays: number
  checkedInToday: boolean
}

type HabitLogRow = {
  habitId: string
  loggedAt: string
  kind: 'logged' | 'resisted'
}

const today = () => new Date().toISOString().slice(0, 10)

function isoDateDaysAgoUTC(daysAgo: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

function addDaysUTC(isoDateYYYYMMDD: string, deltaDays: number): string {
  const [y, m, d] = isoDateYYYYMMDD.split('-').map((n) => Number(n))
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + deltaDays)
  return dt.toISOString().slice(0, 10)
}

export default function HabitsPage() {
  const { toast } = useToast()
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<'good' | 'bad'>('good')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editHabitId, setEditHabitId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState<'good' | 'bad'>('good')

  async function loadHabits() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/habits', { credentials: 'include' })
      if (!res.ok) {
        if (res.status === 401) {
          setHabits([])
          setError('Please sign in again to view your habits.')
          return
        }
        setHabits([])
        const data = await res.json().catch(() => ({}))
        setError(data.message || 'Failed to load habits.')
        return
      }
      const data = (await res.json()) as Array<Omit<Habit, 'streakDays' | 'checkedInToday'>>
      const baseHabits: Habit[] = data.map((h) => ({ ...h, streakDays: 0, checkedInToday: false }))
      const todayIso = today()
      const rangeStart = isoDateDaysAgoUTC(120)
      const logsRes = await fetch(`/api/habits/logs?start=${rangeStart}&end=${todayIso}`, {
        credentials: 'include',
      })
      if (!logsRes.ok) {
        if (logsRes.status === 401) {
          setHabits([])
          setError('Please sign in again to view your habits.')
          return
        }
        // Habits still render; streaks are best-effort.
        toast({
          title: 'Streaks unavailable',
          description: 'Could not load habit history. Your habits still show normally.',
          variant: 'destructive',
        })
        setHabits(baseHabits)
        return
      }

      const logs = (await logsRes.json()) as HabitLogRow[]
      const computed = baseHabits.map((h) => {
        const kindToCheck = h.type === 'good' ? 'logged' : 'resisted'
        const dates = new Set(
          logs
            .filter((l) => l.habitId === h.id && l.kind === kindToCheck)
            .map((l) => l.loggedAt)
        )
        const checkedInToday = dates.has(todayIso)
        let streakDays = 0
        let cursor = todayIso
        while (dates.has(cursor)) {
          streakDays += 1
          cursor = addDaysUTC(cursor, -1)
        }
        return { ...h, streakDays, checkedInToday }
      })

      setHabits(computed)
    } catch {
      setHabits([])
      setError('Failed to load habits.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadHabits()
  }, [])

  async function handleAddHabit(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), type: newType }),
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
        setError('Please sign in again to view your habits.')
        return
      }
      toast({ title: 'Error', description: data.message || 'Failed to add habit', variant: 'destructive' })
      return
    }
    setNewName('')
    setNewType('good')
    setDialogOpen(false)
    loadHabits()
    toast({ title: 'Habit added' })
  }

  async function handleLog(habitId: string, kind: 'logged' | 'resisted') {
    const res = await fetch('/api/habits/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habitId, loggedAt: today(), kind }),
      credentials: 'include',
    })
    if (!res.ok) {
      if (res.status === 401) {
        toast({
          title: 'Session expired',
          description: 'Please sign in again to continue.',
          variant: 'destructive',
        })
        setError('Please sign in again to view your habits.')
        return
      }
      toast({ title: 'Error', description: 'Failed to log', variant: 'destructive' })
      return
    }
    toast({ title: kind === 'logged' ? 'Logged' : 'Resisted — good job!' })
    void loadHabits()
  }

  async function handleDelete(habitId: string) {
    const res = await fetch(`/api/habits/${habitId}`, { method: 'DELETE', credentials: 'include' })
    if (!res.ok) {
      if (res.status === 401) {
        toast({
          title: 'Session expired',
          description: 'Please sign in again to continue.',
          variant: 'destructive',
        })
        setError('Please sign in again to view your habits.')
        return
      }
      toast({ title: 'Error', description: 'Failed to archive', variant: 'destructive' })
      return
    }
    void loadHabits()
    toast({ title: 'Habit archived' })
  }

  function openEdit(habit: Habit) {
    setEditHabitId(habit.id)
    setEditName(habit.name)
    setEditType(habit.type)
    setEditDialogOpen(true)
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editHabitId) return
    const name = editName.trim()
    if (!name) return

    const res = await fetch(`/api/habits/${editHabitId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type: editType }),
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
        setError('Please sign in again to view your habits.')
        return
      }
      toast({ title: 'Error', description: data.message || 'Failed to update habit', variant: 'destructive' })
      return
    }

    setEditDialogOpen(false)
    setEditHabitId(null)
    setEditName('')
    setEditType('good')
    void loadHabits()
    toast({ title: 'Habit updated' })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Habits</h1>
      <p className="text-muted-foreground">
        Create good habits (log when done) and resist bad ones. Archive to keep history; streaks are computed from your real daily logs.
      </p>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg">Your habits</CardTitle>
            <CardDescription>Log or resist for today ({format(new Date(), 'MMM d, yyyy')})</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add habit
              </Button>
            </DialogTrigger>
            <DpsModalContent size="sm">
              <DialogHeader>
                <DialogTitle>Add habit</DialogTitle>
                <DialogDescription>Good habits you want to do; bad habits you want to resist.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddHabit} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="habit-name">Name</Label>
                  <Input
                    id="habit-name"
                    placeholder="e.g. Stretch 10 min"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        checked={newType === 'good'}
                        onChange={() => setNewType('good')}
                        className="rounded-full"
                      />
                      Good (log when done)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        checked={newType === 'bad'}
                        onChange={() => setNewType('bad')}
                        className="rounded-full"
                      />
                      Bad (log when resisted)
                    </label>
                  </div>
                </div>
                <Button type="submit">Add</Button>
              </form>
            </DpsModalContent>
          </Dialog>
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DpsModalContent size="sm">
              <DialogHeader>
                <DialogTitle>Edit habit</DialogTitle>
                <DialogDescription>Update the name and whether it’s a good or resisted habit.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-habit-name">Name</Label>
                  <Input
                    id="edit-habit-name"
                    placeholder="e.g. Stretch 10 min"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="edit-type"
                        checked={editType === 'good'}
                        onChange={() => setEditType('good')}
                        className="rounded-full"
                      />
                      Good (log when done)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="edit-type"
                        checked={editType === 'bad'}
                        onChange={() => setEditType('bad')}
                        className="rounded-full"
                      />
                      Bad (log when resisted)
                    </label>
                  </div>
                </div>
                <Button type="submit">Save</Button>
              </form>
            </DpsModalContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : error ? (
            <div className="space-y-3 py-2">
              <p className="text-destructive text-sm">{error}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void loadHabits()}>
                Retry
              </Button>
            </div>
          ) : habits.length === 0 ? (
            <p className="text-muted-foreground text-sm">No habits yet. Add one to get started.</p>
          ) : (
            <ul className="space-y-3">
              {habits.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {h.type === 'good' ? (
                      <Target className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium truncate">{h.name}</span>
                        <span className="text-xs text-muted-foreground">({h.type})</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {h.streakDays > 0 ? `${h.streakDays} day streak` : 'No streak yet'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {h.type === 'good' ? (
                      <Button
                        size="sm"
                        variant="default"
                        disabled={h.checkedInToday}
                        onClick={() => handleLog(h.id, 'logged')}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {h.checkedInToday ? 'Logged' : 'Log'}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={h.checkedInToday}
                        onClick={() => handleLog(h.id, 'resisted')}
                      >
                        {h.checkedInToday ? 'Resisted today' : 'Resisted'}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(h)}
                      aria-label={`Edit ${h.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(h.id)}
                      aria-label={`Archive ${h.name}`}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
