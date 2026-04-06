'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { DPS_CHART_TOOLTIP_WRAPPER_CLASS } from './recharts-theme'

/** Loose match for Recharts tooltip payload entries (name may be number in some charts). */
export type DpsChartTooltipPayloadItem = {
  name?: string | number
  value?: unknown
  color?: string
  dataKey?: string | number
  payload?: unknown
}

export type DpsChartTooltipContentProps = {
  active?: boolean
  label?: ReactNode
  payload?: DpsChartTooltipPayloadItem[]
  formatter?: (value: unknown, name: string) => ReactNode
}

/**
 * Use with Recharts Tooltip: content={<DpsChartTooltipContent ... />}
 * Or pass a custom formatter for value cells.
 */
export function DpsChartTooltipContent({
  active,
  label,
  payload,
  formatter,
}: DpsChartTooltipContentProps) {
  if (!active || !payload?.length) return null
  return (
    <div className={cn(DPS_CHART_TOOLTIP_WRAPPER_CLASS)}>
      {label != null && label !== '' ? <p className="mb-1 font-medium text-foreground">{label}</p> : null}
      <ul className="space-y-0.5">
        {payload.map((p, i) => (
          <li key={i} className="flex items-center gap-2 text-k-sm">
            {p.color ? (
              <span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: p.color }} />
            ) : null}
            <span className="text-muted-foreground">{p.name != null ? String(p.name) : 'Value'}:</span>
            <span className="tabular-nums text-foreground">
              {formatter ? formatter(p.value, String(p.name ?? '')) : String(p.value ?? '—')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
