import { cn } from '@/lib/utils'

export type DpsBarProgressColorKey = 1 | 2 | 3 | 4 | 5

const CHART_BG: Record<DpsBarProgressColorKey, string> = {
  1: 'bg-chart-1',
  2: 'bg-chart-2',
  3: 'bg-chart-3',
  4: 'bg-chart-4',
  5: 'bg-chart-5',
}

export type DpsBarProgressProps = {
  label: string
  value: number
  /** If <= 0, only the empty track is shown (no fill). */
  max: number
  /** Optional value line on the right (e.g. "120 g") */
  valueDisplay?: string
  colorKey?: DpsBarProgressColorKey
  className?: string
}

/**
 * Horizontal macro-style bar. Ratio = value / max when max > 0.
 */
export function DpsBarProgress({
  label,
  value,
  max,
  valueDisplay,
  colorKey = 2,
  className,
}: DpsBarProgressProps) {
  const safeMax = max > 0 ? max : 0
  const ratio = safeMax > 0 ? Math.min(1, Math.max(0, value / safeMax)) : 0
  const pct = Math.round(ratio * 100)

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between gap-2 text-k-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums text-foreground">{valueDisplay ?? `${Math.round(value)}`}</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted/50"
        role="progressbar"
        aria-valuenow={safeMax > 0 ? Math.round(value) : 0}
        aria-valuemin={0}
        aria-valuemax={safeMax > 0 ? Math.round(safeMax) : 0}
        aria-label={`${label}: ${pct} percent of target`}
      >
        {safeMax > 0 ? (
          <div
            className={cn('h-full rounded-full transition-[width] duration-kinetic ease-out', CHART_BG[colorKey])}
            style={{ width: `${pct}%` }}
          />
        ) : null}
      </div>
    </div>
  )
}
