'use client'

import { type ReactNode } from 'react'
import { BarChart, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'
import { DPS_CHART_DEFAULT_HEIGHT, DPS_CHART_MARGINS } from './recharts-theme'

export type DpsBarChartContainerProps<T extends Record<string, unknown> = Record<string, unknown>> = {
  data: T[]
  height?: number
  className?: string
  children: ReactNode
}

/**
 * Responsive BarChart shell with DPS margins. For Nutrition/week views and future macros charts.
 */
export function DpsBarChartContainer<T extends Record<string, unknown>>({
  data,
  height = DPS_CHART_DEFAULT_HEIGHT,
  className,
  children,
}: DpsBarChartContainerProps<T>) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ ...DPS_CHART_MARGINS }}>
          {children}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
