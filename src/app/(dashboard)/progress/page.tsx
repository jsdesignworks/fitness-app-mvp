'use client'

import { useEffect, useState } from 'react'
import { format, subMonths } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DpsFormField, DpsToggleField } from '@/components/dps/interaction'
import { Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import {
  DpsChartTooltipContent,
  DpsLineChartContainer,
  DPS_CHART_AXIS_TICK_CLASS,
  DPS_CHART_COLORS,
} from '@/components/dps/viz'
import { useToast } from '@/hooks/use-toast'

type ProgressEntry = {
  id: string
  date: string
  weightKg: number | null
  measurements: Record<string, number>
  notes: string | null
}

const today = () => new Date().toISOString().slice(0, 10)
const LB_PER_KG = 2.20462262185
type WeightUnit = 'kg' | 'lb'
const WEIGHT_UNIT_STORAGE_KEY = 'fitness_weight_unit'

export default function ProgressPage() {
  const { toast } = useToast()
  const [entries, setEntries] = useState<ProgressEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [date, setDate] = useState(today())
  const [weightKg, setWeightKg] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg')
  const [savingWeightUnit, setSavingWeightUnit] = useState(false)

  const rangeStart = format(subMonths(new Date(), 3), 'yyyy-MM-dd')
  const rangeEnd = today()

  async function loadEntries() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/progress?start=${rangeStart}&end=${rangeEnd}`, { credentials: 'include' })
      if (!res.ok) {
        if (res.status === 401) {
          setEntries([])
          setError('Please sign in again to view your progress.')
          return
        }
        setEntries([])
        const data = await res.json().catch(() => ({}))
        setError(data.message || 'Failed to load progress.')
        return
      }
      const data = (await res.json()) as ProgressEntry[]
      setEntries(data)
    } catch {
      setEntries([])
      setError('Failed to load progress.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadEntries()
  }, [rangeStart, rangeEnd])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(WEIGHT_UNIT_STORAGE_KEY)
      if (stored === 'lb' || stored === 'kg') {
        setWeightUnit(stored)
      }
    } catch {
      // Ignore storage failures (private mode/quota).
    }
  }, [])

  useEffect(() => {
    // Prefer profile-backed unit preference; localStorage is only a temporary convenience fallback.
    async function loadWeightUnitFromProfile() {
      try {
        const res = await fetch('/api/me', { credentials: 'include' })
        if (!res.ok) return
        const data = (await res.json()) as { weightUnit?: 'kg' | 'lb' | null }
        if (data.weightUnit === 'kg' || data.weightUnit === 'lb') {
          setWeightUnit(data.weightUnit)
        }
      } catch {
        // Ignore profile failures; keep UI functional.
      }
    }
    void loadWeightUnitFromProfile()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const res = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        weightKg:
          weightKg && weightKg.trim().length > 0
            ? Number.isFinite(Number(weightKg))
              ? weightUnit === 'lb'
                ? Number(weightKg) / LB_PER_KG
                : Number(weightKg)
              : null
            : null,
        notes: notes || null,
      }),
      credentials: 'include',
    })
    setSubmitting(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      if (res.status === 401) {
        toast({
          title: 'Session expired',
          description: 'Please sign in again to continue.',
          variant: 'destructive',
        })
        setError('Please sign in again to view your progress.')
        return
      }
      toast({ title: 'Error', description: data.message || 'Failed to save', variant: 'destructive' })
      return
    }
    toast({ title: 'Progress saved' })
    setWeightKg('')
    setNotes('')
    loadEntries()
  }

  const chartData = entries
    .filter((e) => e.weightKg != null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({
      date: e.date,
      weight: weightUnit === 'lb' ? e.weightKg! * LB_PER_KG : e.weightKg!,
    }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Progress</h1>
      <p className="text-muted-foreground">Track weight and body measurements over time.</p>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Log entry</CardTitle>
          <CardDescription>
            Record weight ({weightUnit}) and optional notes for any date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <DpsToggleField
              id="weight-unit"
              label="Display weight in pounds"
              description="Stored values are always in kg; this only changes how they’re shown."
              checked={weightUnit === 'lb'}
              onCheckedChange={(checked) => {
                const next: WeightUnit = checked ? 'lb' : 'kg'
                setWeightUnit(next)
                try {
                  localStorage.setItem(WEIGHT_UNIT_STORAGE_KEY, next)
                } catch {
                  // Ignore storage failures.
                }

                setSavingWeightUnit(true)
                fetch('/api/me', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ weightUnit: next }),
                })
                  .then(async (res) => {
                    if (!res.ok) {
                      const data = await res.json().catch(() => ({}))
                      throw new Error(data.message || data.error || 'Failed to save unit preference')
                    }
                  })
                  .catch((e) => {
                    toast({
                      title: 'Unit preference not saved',
                      description: e instanceof Error ? e.message : 'Please try again.',
                      variant: 'destructive',
                    })
                  })
                  .finally(() => setSavingWeightUnit(false))
              }}
              disabled={savingWeightUnit}
            />
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DpsFormField label="Date" htmlFor="date">
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </DpsFormField>
              <DpsFormField
                label={`Weight (${weightUnit})`}
                htmlFor="weight"
                hint="Optional; decimals allowed."
              >
                <Input
                  id="weight"
                  type="number"
                  variant="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g. 72.5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                />
              </DpsFormField>
            </div>
            <DpsFormField label="Notes (optional)" htmlFor="notes">
              <Input
                id="notes"
                placeholder="e.g. Post workout"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </DpsFormField>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weight trend</CardTitle>
          <CardDescription>Last 3 months</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm py-8">Loading…</p>
          ) : error ? (
            <div className="space-y-3 py-4">
              <p className="text-destructive text-sm">{error}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void loadEntries()}>
                Retry
              </Button>
            </div>
          ) : chartData.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8">No weight entries yet. Log one above.</p>
          ) : (
            <DpsLineChartContainer data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.6} />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => format(new Date(d), 'M/d')}
                tick={{ className: DPS_CHART_AXIS_TICK_CLASS }}
              />
              <YAxis domain={['auto', 'auto']} tick={{ className: DPS_CHART_AXIS_TICK_CLASS }} />
              <Tooltip
                cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeDasharray: '4 4' }}
                content={(props) => (
                  <DpsChartTooltipContent
                    {...props}
                    label={
                      typeof props.label === 'string'
                        ? format(new Date(props.label), 'MMM d, yyyy')
                        : props.label
                    }
                    formatter={(v) => `${v} ${weightUnit}`}
                  />
                )}
              />
              <Line
                type="monotone"
                dataKey="weight"
                name="Weight"
                stroke={DPS_CHART_COLORS[1]}
                strokeWidth={2}
                dot={{ r: 3, fill: DPS_CHART_COLORS[1] }}
              />
            </DpsLineChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent entries</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : error ? (
            <p className="text-muted-foreground text-sm">Unable to load entries. Please try again.</p>
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground text-sm">No entries yet.</p>
          ) : (
            <ul className="space-y-2">
              {entries.slice(0, 14).map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm"
                >
                  <span className="font-medium">{format(new Date(e.date), 'MMM d, yyyy')}</span>
                  <span>
                    {e.weightKg != null
                      ? `${weightUnit === 'lb' ? e.weightKg * LB_PER_KG : e.weightKg} ${weightUnit}`
                      : '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
