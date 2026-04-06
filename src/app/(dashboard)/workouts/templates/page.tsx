'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/common/empty-state'
import { Dumbbell, Loader2 } from 'lucide-react'

type Template = {
  id: string
  userId: string
  name: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export default function TemplatesPage() {
  const [list, setList] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/workouts/templates')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setList(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Templates</h1>
        <Button asChild>
          <Link href="/workouts/templates/new">New template</Link>
        </Button>
      </div>
      <Card className="shadow-card rounded-xl">
        <CardHeader className="space-y-1.5">
          <CardTitle className="text-lg">Workout templates</CardTitle>
          <CardDescription>Create and manage reusable workout plans. Start a session from a template in one click.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : list.length === 0 ? (
            <EmptyState
              icon={<Dumbbell className="h-12 w-12" />}
              title="No templates yet"
              description="Create a template to quickly start consistent workouts."
            >
              <Button asChild>
                <Link href="/workouts/templates/new">Create template</Link>
              </Button>
            </EmptyState>
          ) : (
            <ul className="space-y-2">
              {list.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card py-3 px-4 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <span className="font-medium text-foreground">{t.name}</span>
                    {t.notes && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{t.notes}</p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/workouts/templates/${t.id}`}>Edit</Link>
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
