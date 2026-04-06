'use client'

import { type ReactNode } from 'react'
import { LineChart, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'
import { DPS_CHART_DEFAULT_HEIGHT, DPS_CHART_MARGINS } from './recharts-theme'

export type DpsLineChartContainerProps<T extends Record<string, unknown> = Record<string, unknown>> = {
  data: T[]
  height?: number
  className?: string
  /** Chart body: CartesianGrid, XAxis, YAxis, Tooltip, Line, etc. */
  children: ReactNode
}

/**
 * Responsive LineChart shell with DPS margins. Pass Recharts children inside.
 */
export function DpsLineChartContainer<T extends Record<string, unknown>>({
  data,
  height = DPS_CHART_DEFAULT_HEIGHT,
  className,
  children,
}: DpsLineChartContainerProps<T>) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ ...DPS_CHART_MARGINS }}>
          {children}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
