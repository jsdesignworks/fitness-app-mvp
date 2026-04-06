import { cn } from '@/lib/utils'

export type DpsCircularProgressProps = {
  /** 0–100; values outside range are clamped */
  value: number
  size?: number
  strokeWidth?: number
  label?: string
  subLabel?: string
  className?: string
  /** CSS color for arc (default: accent token) */
  strokeColor?: string
}

/**
 * SVG ring progress. When value is meaningful, exposes progressbar semantics.
 */
export function DpsCircularProgress({
  value,
  size = 88,
  strokeWidth = 6,
  label,
  subLabel,
  className,
  strokeColor = 'hsl(var(--accent))',
}: DpsCircularProgressProps) {
  const pct = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0))
  const r = (size - strokeWidth) / 2
  const c = 2 * Math.PI * r
  const dashOffset = c - (pct / 100) * c

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div
        className="relative shrink-0"
        style={{ width: size, height: size }}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ? `${label}: ${Math.round(pct)} percent` : `${Math.round(pct)} percent`}
      >
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            className="stroke-muted/40"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-kinetic ease-out"
          />
        </svg>
        {label || subLabel ? (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-1 text-center">
            {label ? <span className="text-k-xs font-medium leading-tight text-foreground">{label}</span> : null}
            {subLabel ? (
              <span className="text-[10px] leading-tight text-muted-foreground">{subLabel}</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
