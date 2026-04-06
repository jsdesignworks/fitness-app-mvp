import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type DpsStatCardProps = {
  label: string
  value: ReactNode
  /** e.g. kcal, g */
  unit?: string
  description?: string
  icon?: ReactNode
  className?: string
}

/**
 * Single metric cell for dashboard / nutrition summaries.
 * Parent supplies responsive grid (e.g. grid-cols-1 sm:grid-cols-2 lg:grid-cols-4).
 */
export function DpsStatCard({ label, value, unit, description, icon, className }: DpsStatCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border/60 bg-card/50 p-3 transition-colors duration-kinetic',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-k-sm text-muted-foreground">{label}</p>
        {icon ? <span className="shrink-0 text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">{icon}</span> : null}
      </div>
      <p className="mt-1 font-medium text-foreground tabular-nums">
        {value}
        {unit ? <span className="ml-1 text-k-sm font-normal text-muted-foreground">{unit}</span> : null}
      </p>
      {description ? <p className="mt-1 text-k-xs text-muted-foreground">{description}</p> : null}
    </div>
  )
}
