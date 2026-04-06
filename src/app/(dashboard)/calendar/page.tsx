'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarPlus, List, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/common/empty-state'
import {
  DpsCalendarMonthGrid,
  DpsCalendarMonthNav,
  DpsDayDetailModal,
  DpsPageHeader,
  DpsContentState,
  dateToYMDLocal,
} from '@/components/dps'

type ScheduledWorkout = {
  id: string
  userId: string
  workoutId?: string
  titleOverride?: string
  startAt: string
  endAt?: string
  timezone: string
  status: string
  notes?: string
}

type CalendarMonthDay = {
  date: string
  hasWorkout: boolean
  workoutCount: number
  hasNutrition: boolean
  totalCaloriesKcal: number | null
}

type CalendarMonthResponse = {
  year: number
  month: number
  startDate: string
  endDate: string
  days: CalendarMonthDay[]
}

function toYMD(d: Date) {
  return d.toISOString().slice(0, 10)
}

function formatTime(iso: string) {
  const t = new Date(iso)
  return t.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

const MONTH_LABEL_ID = 'calendar-month-title'
const fetchOpts: RequestInit = { credentials: 'include' }

function AgendaItem({
  workout,
  dateStr,
  onSkip,
}: {
  workout: ScheduledWorkout
  dateStr: string
  onSkip: () => void
}) {
  const [skipping, setSkipping] = useState(false)
  if (workout.status === 'skipped' || workout.status === 'completed') {
    return (
      <li className="flex items-center justify-between border-b border-border py-2 last:border-0 opacity-75">
        <div>
          <p className="font-medium">{workout.titleOverride || 'Workout'}</p>
          <p className="text-sm text-muted-foreground">
            {dateStr} · {formatTime(workout.startAt)} · {workout.status}
          </p>
        </div>
      </li>
    )
  }
  return (
    <li className="flex items-center justify-between border-b border-border py-2 last:border-0">
      <div>
        <p className="font-medium">{workout.titleOverride || 'Workout'}</p>
        <p className="text-sm text-muted-foreground">
          {dateStr} · {formatTime(workout.startAt)} · {workout.status}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        disabled={skipping}
        onClick={async () => {
          setSkipping(true)
          await onSkip()
          setSkipping(false)
        }}
      >
        {skipping ? '…' : 'Skip'}
      </Button>
    </li>
  )
}

export default function CalendarPage() {
  const [view, setView] = useState<'month' | 'agenda'>('month')
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth())

  const [monthData, setMonthData] = useState<CalendarMonthResponse | null>(null)
  const [monthLoading, setMonthLoading] = useState(true)
  const [monthError, setMonthError] = useState<string | null>(null)

  const [selectedYmd, setSelectedYmd] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const [agendaWorkouts, setAgendaWorkouts] = useState<ScheduledWorkout[]>([])
  const [agendaLoading, setAgendaLoading] = useState(true)
  const [agendaError, setAgendaError] = useState<string | null>(null)

  const fetchMonth = useCallback(async () => {
    setMonthLoading(true)
    setMonthError(null)
    try {
      const res = await fetch(
        `/api/calendar/month?year=${year}&month=${month + 1}`,
        fetchOpts
      )
      const data = (await res.json()) as { message?: string } & Partial<CalendarMonthResponse>
      if (!res.ok) {
        setMonthError(data.message || 'Failed to load calendar')
        setMonthData(null)
        return
      }
      setMonthData({
        year: data.year ?? year,
        month: data.month ?? month + 1,
        startDate: data.startDate ?? '',
        endDate: data.endDate ?? '',
        days: Array.isArray(data.days) ? data.days : [],
      })
    } catch {
      setMonthError('Network error — could not load calendar.')
      setMonthData(null)
    } finally {
      setMonthLoading(false)
    }
  }, [year, month])

  const fetchSchedule = useCallback(async (start: Date, end: Date) => {
    const startStr = toYMD(start)
    const endStr = toYMD(end)
    const res = await fetch(
      `/api/scheduling/schedule?start=${encodeURIComponent(startStr)}&end=${encodeURIComponent(endStr)}`,
      fetchOpts
    )
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setAgendaError((data as { message?: string }).message || 'Failed to load schedule')
      return []
    }
    const data = await res.json()
    return (data.scheduledWorkouts ?? []) as ScheduledWorkout[]
  }, [])

  useEffect(() => {
    if (view !== 'month') return
    void fetchMonth()
  }, [view, fetchMonth])

  useEffect(() => {
    if (view !== 'agenda') return
    setAgendaLoading(true)
    setAgendaError(null)
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 14)
    void fetchSchedule(start, end).then((list) => {
      setAgendaWorkouts(list)
      setAgendaLoading(false)
    })
  }, [view, fetchSchedule])

  const monthLabel = new Date(year, month).toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  const dayByYmd = useMemo(() => {
    const m = new Map<string, CalendarMonthDay>()
    for (const d of monthData?.days ?? []) {
      m.set(d.date, d)
    }
    return m
  }, [monthData])

  const hasActivity = useCallback(
    (ymd: string) => {
      const d = dayByYmd.get(ymd)
      return Boolean(d?.hasWorkout || d?.hasNutrition)
    },
    [dayByYmd]
  )

  const emptyMonth =
    monthData &&
    monthData.days.length > 0 &&
    monthData.days.every((d) => !d.hasWorkout && !d.hasNutrition)

  const selectedDay = selectedYmd ? dayByYmd.get(selectedYmd) : undefined

  const selectedDateLabel =
    selectedYmd != null
      ? new Date(selectedYmd + 'T12:00:00').toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : ''

  function prevMonth() {
    setSelectedYmd(null)
    setDetailOpen(false)
    if (month === 0) {
      setMonth(11)
      setYear((y) => y - 1)
    } else {
      setMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    setSelectedYmd(null)
    setDetailOpen(false)
    if (month === 11) {
      setMonth(0)
      setYear((y) => y + 1)
    } else {
      setMonth((m) => m + 1)
    }
  }

  function goToToday() {
    const now = new Date()
    setYear(now.getFullYear())
    setMonth(now.getMonth())
    setSelectedYmd(dateToYMDLocal(now))
  }

  function onSelectYmd(ymd: string) {
    setSelectedYmd(ymd)
    setDetailOpen(true)
  }

  const viewToggle = (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant={view === 'month' ? 'default' : 'outline'} size="sm" onClick={() => setView('month')}>
        <CalendarDays className="mr-1 h-4 w-4" />
        Month
      </Button>
      <Button variant={view === 'agenda' ? 'default' : 'outline'} size="sm" onClick={() => setView('agenda')}>
        <List className="mr-1 h-4 w-4" />
        Agenda
      </Button>
      <Link href="/calendar/schedule">
        <Button size="sm" className="gap-1">
          <CalendarPlus className="h-4 w-4" />
          Schedule workout
        </Button>
      </Link>
      <Link href="/calendar/export">
        <Button variant="outline" size="sm">
          Export
        </Button>
      </Link>
    </div>
  )

  return (
    <div className="container max-w-5xl dps-section-y py-6">
      <DpsPageHeader
        title="Calendar"
        description="Month activity from workouts and nutrition logging."
        actions={viewToggle}
        titleId="calendar-page-title"
      />

      {view === 'month' ? (
        <DpsContentState
          isLoading={monthLoading}
          error={monthError}
          onRetry={() => void fetchMonth()}
          loadingLabel="Loading month…"
        >
          {monthData ? (
            <div className="dps-stack-y">
              <DpsCalendarMonthNav
                label={monthLabel}
                labelId={MONTH_LABEL_ID}
                onPrevMonth={prevMonth}
                onNextMonth={nextMonth}
                onGoToToday={goToToday}
                showTodayButton
              />

              <Card>
                <CardContent className="pt-4 sm:pt-5 md:pt-6">
                  <DpsCalendarMonthGrid
                    year={year}
                    month={month}
                    selectedYmd={selectedYmd}
                    onSelectYmd={onSelectYmd}
                    hasActivity={hasActivity}
                    labelId={MONTH_LABEL_ID}
                  />
                </CardContent>
              </Card>

              {emptyMonth ? (
                <p
                  className="rounded-lg border border-border/60 bg-muted/15 px-4 py-3 text-center text-k-sm text-muted-foreground"
                  role="status"
                >
                  No activity recorded this month.
                </p>
              ) : null}
            </div>
          ) : null}
        </DpsContentState>
      ) : (
        <>
          {agendaError ? (
            <div className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">{agendaError}</div>
          ) : null}
          {agendaLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading…</div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Next 14 days</CardTitle>
                <CardDescription>Upcoming scheduled workouts</CardDescription>
              </CardHeader>
              <CardContent>
                {agendaWorkouts.length === 0 ? (
                  <EmptyState
                    icon={<CalendarDays className="h-8 w-8" />}
                    title="No scheduled workouts"
                    description="Schedule a workout to see it here."
                  >
                    <Link href="/calendar/schedule">
                      <Button variant="outline" size="sm">
                        Schedule workout
                      </Button>
                    </Link>
                  </EmptyState>
                ) : (
                  <ul className="space-y-2">
                    {agendaWorkouts.map((w) => {
                      const start = new Date(w.startAt)
                      const dateStr = start.toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })
                      return (
                        <AgendaItem
                          key={w.id}
                          workout={w}
                          dateStr={dateStr}
                          onSkip={async () => {
                            const res = await fetch(`/api/scheduling/schedule/${w.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'skipped' }),
                              credentials: 'include',
                            })
                            if (res.ok) {
                              const s = new Date()
                              s.setHours(0, 0, 0, 0)
                              const e = new Date(s)
                              e.setDate(e.getDate() + 14)
                              const list = await fetchSchedule(s, e)
                              setAgendaWorkouts(list)
                            }
                          }}
                        />
                      )
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      <DpsDayDetailModal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title={selectedYmd ? selectedDateLabel : 'Day'}
        size="md"
      >
        {selectedYmd && selectedDay ? (
          <div className="dps-stack-y text-foreground">
            <div>
              <p className="text-k-xs font-medium uppercase tracking-wide text-muted-foreground">Workouts</p>
              <p className="text-k-sm">
                {selectedDay.workoutCount === 0
                  ? 'No workouts'
                  : `${selectedDay.workoutCount} workout${selectedDay.workoutCount === 1 ? '' : 's'}`}
              </p>
            </div>
            <div>
              <p className="text-k-xs font-medium uppercase tracking-wide text-muted-foreground">Nutrition</p>
              <p className="text-k-sm">
                {!selectedDay.hasNutrition
                  ? 'No nutrition logged'
                  : selectedDay.totalCaloriesKcal != null
                    ? `${Math.round(selectedDay.totalCaloriesKcal)} kcal logged`
                    : 'Logged (calories not totaled)'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href="/workouts">View workouts</Link>
              </Button>
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href="/nutrition">View nutrition</Link>
              </Button>
            </div>
          </div>
        ) : selectedYmd ? (
          <p className="text-k-sm text-muted-foreground">No data for this day.</p>
        ) : null}
      </DpsDayDetailModal>
    </div>
  )
}
