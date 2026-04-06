'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DpsModalContent } from '@/components/dps/interaction'
import { Plus, Trash2, Loader2 } from 'lucide-react'

type Exercise = { id: string; name: string }
type TemplateItem = { exerciseId: string; orderIndex: number; plannedSets: number; exerciseName: string }
type Template = {
  id: string
  name: string
  notes?: string
  items: Array<{
    id: string
    exerciseId: string
    orderIndex: number
    plannedStructure?: { sets?: number }
    exerciseName?: string
  }>
}

export default function TemplateEditPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<TemplateItem[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [exerciseSearch, setExerciseSearch] = useState('')
  const [exerciseList, setExerciseList] = useState<Exercise[]>([])

  useEffect(() => {
    if (!id) return
    fetch(`/api/workouts/templates/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setTemplate(data)
        if (data) {
          setName(data.name)
          setNotes(data.notes ?? '')
          setItems(
            (data.items ?? []).map((it: { exerciseId: string; orderIndex: number; plannedStructure?: { sets?: number }; exerciseName?: string }) => ({
              exerciseId: it.exerciseId,
              orderIndex: it.orderIndex,
              plannedSets: it.plannedStructure?.sets ?? 3,
              exerciseName: it.exerciseName ?? 'Exercise',
            }))
          )
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!addOpen) return
    const url = exerciseSearch.trim()
      ? `/api/workouts/exercises/search?q=${encodeURIComponent(exerciseSearch.trim())}`
      : '/api/workouts/exercises'
    fetch(url)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setExerciseList(Array.isArray(data) ? data : []))
  }, [addOpen, exerciseSearch])

  function addExercise(ex: Exercise) {
    setItems((prev) => [
      ...prev,
      {
        exerciseId: ex.id,
        orderIndex: prev.length + 1,
        plannedSets: 3,
        exerciseName: ex.name,
      },
    ])
    setAddOpen(false)
    setExerciseSearch('')
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index).map((it, i) => ({ ...it, orderIndex: i + 1 })))
  }

  function setPlannedSets(index: number, value: number) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, plannedSets: value } : it)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return
    setError(null)
    setSaving(true)
    try {
      const res = await fetch(`/api/workouts/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          notes: notes || undefined,
          items: items.map((it) => ({
            exerciseId: it.exerciseId,
            orderIndex: it.orderIndex,
            plannedStructure: { sets: it.plannedSets },
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Failed to update template')
        return
      }
      router.push('/workouts/templates')
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
  if (!template) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Template</h1>
        <Card className="max-w-lg">
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">Template not found.</p>
            <Button variant="outline" asChild>
              <Link href="/workouts/templates">Back to templates</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit template</h1>
      <Card className="shadow-card rounded-xl max-w-2xl">
        <CardHeader className="space-y-1.5">
          <CardTitle className="text-lg">{template.name}</CardTitle>
          <CardDescription>Changes only affect this template. Past sessions are unchanged.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <div>
              <Label htmlFor="name">Template name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Exercises</Label>
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add exercise
                    </Button>
                  </DialogTrigger>
                  <DpsModalContent size="lg">
                    <DialogHeader>
                      <DialogTitle>Add exercise</DialogTitle>
                      <DialogDescription>Search and select an exercise.</DialogDescription>
                    </DialogHeader>
                    <Input
                      placeholder="Search..."
                      value={exerciseSearch}
                      onChange={(e) => setExerciseSearch(e.target.value)}
                      className="mt-2"
                    />
                    <ul className="max-h-60 overflow-auto space-y-1 mt-2">
                      {exerciseList.map((ex) => (
                        <li key={ex.id}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => addExercise(ex)}
                          >
                            {ex.name}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </DpsModalContent>
                </Dialog>
              </div>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No exercises. Add at least one.</p>
              ) : (
                <ul className="space-y-2">
                  {items.map((it, index) => (
                    <li
                      key={`${it.exerciseId}-${index}`}
                      className="flex items-center gap-2 rounded-lg border border-border bg-card py-2 px-3"
                    >
                      <span className="text-muted-foreground w-6">{index + 1}.</span>
                      <span className="flex-1 font-medium">{it.exerciseName}</span>
                      <Input
                        type="number"
                        min={1}
                        className="w-16 h-8"
                        value={it.plannedSets}
                        onChange={(e) => setPlannedSets(index, Number(e.target.value) || 1)}
                      />
                      <span className="text-xs text-muted-foreground">sets</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving || items.length === 0}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/workouts/templates">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
