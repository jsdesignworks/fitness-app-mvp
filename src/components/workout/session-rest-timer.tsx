'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Timer } from 'lucide-react'

type SessionRestTimerProps = {
  disabled?: boolean
}

/**
 * Local rest countdown between sets; does not persist (future: tie to set completion events).
 */
export function SessionRestTimer({ disabled }: SessionRestTimerProps) {
  const [targetSec, setTargetSec] = useState(90)
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (remaining === null || remaining <= 0) return
    const id = window.setTimeout(() => {
      setRemaining((r) => (r === null ? null : r - 1))
    }, 1000)
    return () => window.clearTimeout(id)
  }, [remaining])

  function start() {
    const s = Math.max(0, Math.min(600, targetSec))
    setRemaining(s)
  }

  function stop() {
    setRemaining(null)
  }

  return (
    <Card className="shadow-card rounded-xl border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Timer className="h-4 w-4" />
          Rest timer
        </CardTitle>
        <CardDescription>Optional countdown between sets.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="rest-sec">Seconds</Label>
          <Input
            id="rest-sec"
            type="number"
            min={0}
            max={600}
            className="w-24"
            value={targetSec}
            onChange={(e) => setTargetSec(Number(e.target.value) || 0)}
            disabled={disabled || (remaining !== null && remaining > 0)}
          />
        </div>
        {remaining !== null && remaining > 0 ? (
          <>
            <div className="text-2xl font-mono tabular-nums py-2">{remaining}s</div>
            <Button type="button" variant="outline" size="sm" onClick={stop}>
              Stop
            </Button>
          </>
        ) : (
          <Button type="button" size="sm" onClick={start} disabled={disabled}>
            Start
          </Button>
        )}
        {remaining === 0 && (
          <span className="text-sm text-muted-foreground">Time&apos;s up</span>
        )}
      </CardContent>
    </Card>
  )
}
