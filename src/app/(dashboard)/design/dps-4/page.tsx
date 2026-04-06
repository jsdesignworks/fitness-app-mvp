'use client'

/**
 * DPS-4 showcase — local state only, no APIs or fake events.
 * Activity dot is driven by an explicit demo toggle + selected day, not schedule data.
 */

import { useCallback, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  DpsCalendarMonthGrid,
  DpsCalendarMonthNav,
  DpsDayDetailModal,
  DpsPageHeader,
  DpsPageSection,
  dateToYMDLocal,
} from '@/components/dps'

const MONTH_LABEL_ID = 'dps4-demo-month-label'

export default function Dps4CalendarDemoPage() {
  const now = useMemo(() => new Date(), [])
  const [year, setYear] = useState(() => now.getFullYear())
  const [month, setMonth] = useState(() => now.getMonth())
  const [selectedYmd, setSelectedYmd] = useState<string | null>(() => dateToYMDLocal(now))
  const [showActivityOnSelected, setShowActivityOnSelected] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)

  const monthLabel = useMemo(
    () => new Date(year, month).toLocaleString(undefined, { month: 'long', year: 'numeric' }),
    [year, month]
  )

  const prevMonth = useCallback(() => {
    if (month === 0) {
      setMonth(11)
      setYear((y) => y - 1)
    } else {
      setMonth((m) => m - 1)
    }
  }, [month])

  const nextMonth = useCallback(() => {
    if (month === 11) {
      setMonth(0)
      setYear((y) => y + 1)
    } else {
      setMonth((m) => m + 1)
    }
  }, [month])

  const goToToday = useCallback(() => {
    const d = new Date()
    setYear(d.getFullYear())
    setMonth(d.getMonth())
    setSelectedYmd(dateToYMDLocal(d))
  }, [])

  const hasActivity = useCallback(
    (ymd: string) => showActivityOnSelected && selectedYmd != null && ymd === selectedYmd,
    [showActivityOnSelected, selectedYmd]
  )

  const selectedLabel = selectedYmd
    ? new Date(selectedYmd + 'T12:00:00').toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'No day selected'

  return (
    <div className="dps-section-y">
      <DpsPageHeader
        title="DPS-4 — Calendar / time UI"
        description="Reusable month grid and day shell. No scheduling data."
        titleId="dps4-demo-title"
      />

      <DpsPageSection title="Month grid" titleId="dps4-demo-grid-section">
        <Card>
          <CardHeader>
            <CardTitle className="text-k-lg font-display uppercase tracking-kinetic-wide">Demo controls</CardTitle>
            <CardDescription>
              Toggle adds a presentational activity dot on the selected day only — not real events.
            </CardDescription>
          </CardHeader>
          <CardContent className="dps-stack-y">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="dps4-activity-demo"
                  checked={showActivityOnSelected}
                  onCheckedChange={setShowActivityOnSelected}
                />
                <Label htmlFor="dps4-activity-demo" className="text-k-sm font-normal">
                  Show activity indicator on selected day
                </Label>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setDetailOpen(true)} disabled={!selectedYmd}>
                Open day detail shell
              </Button>
            </div>

            <DpsCalendarMonthNav
              label={monthLabel}
              labelId={MONTH_LABEL_ID}
              onPrevMonth={prevMonth}
              onNextMonth={nextMonth}
              onGoToToday={goToToday}
              showTodayButton
            />

            <div className="overflow-x-auto rounded-md border border-border bg-card p-1 sm:p-2">
              <DpsCalendarMonthGrid
                year={year}
                month={month}
                selectedYmd={selectedYmd}
                onSelectYmd={setSelectedYmd}
                hasActivity={hasActivity}
                labelId={MONTH_LABEL_ID}
              />
            </div>

            <p className="text-k-xs text-muted-foreground">
              Selected: <span className="font-medium text-foreground">{selectedYmd ?? '—'}</span>
              {selectedYmd ? ` · ${selectedLabel}` : null}
            </p>
          </CardContent>
        </Card>
      </DpsPageSection>

      <DpsDayDetailModal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title={selectedYmd ? `Day — ${selectedLabel}` : 'Day'}
      >
        {selectedYmd ? (
          <p>
            Placeholder body for <span className="font-mono text-foreground">{selectedYmd}</span>. Wire a module in
            later.
          </p>
        ) : null}
      </DpsDayDetailModal>
    </div>
  )
}
