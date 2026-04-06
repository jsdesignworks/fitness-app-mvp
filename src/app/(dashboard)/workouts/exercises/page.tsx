'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/common/empty-state'
import { Dumbbell, Loader2 } from 'lucide-react'

type Exercise = {
  id: string
  name: string
  category: string
  defaultTrackingMode: string
  isCustom: boolean
}

export default function ExercisesPage() {
  const [list, setList] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams()
        if (search.trim()) params.set('search', search.trim())
        const res = await fetch(`/api/workouts/exercises?${params}`)
        if (res.ok) {
          const data = await res.json()
          setList(Array.isArray(data) ? data : [])
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [search])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Exercises</h1>
        <Button asChild>
          <Link href="/workouts/exercises/new">Add exercise</Link>
        </Button>
      </div>
      <Card className="shadow-card rounded-xl">
        <CardHeader className="space-y-1.5">
          <CardTitle className="text-lg">Exercise library</CardTitle>
          <CardDescription>Browse and manage exercises. Add custom exercises or use the built-in library.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : list.length === 0 ? (
            <EmptyState
              icon={<Dumbbell className="h-12 w-12" />}
              title="No exercises yet"
              description="Add a custom exercise above or seed the database with a default library."
            >
              <Button variant="outline" asChild>
                <Link href="/workouts/exercises/new">Add exercise</Link>
              </Button>
            </EmptyState>
          ) : (
            <ul className="space-y-2">
              {list.map((ex) => (
                <li
                  key={ex.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card py-3 px-4 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <span className="font-medium text-foreground">{ex.name}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {ex.category} · {ex.defaultTrackingMode}
                      {ex.isCustom && ' · Custom'}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/workouts/exercises/${ex.id}`}>
                      {ex.isCustom ? 'Edit' : 'View'}
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
