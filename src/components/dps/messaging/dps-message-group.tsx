'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type DpsMessageGroupProps = {
  /** Section label (e.g. "Today", "Workouts"). No date logic here—parent supplies label. */
  label: string
  children: ReactNode
  className?: string
  /** Optional id for `aria-labelledby` on the section. */
  labelId?: string
}

/**
 * Presentational grouping for message feeds. Does not compute dates or categories.
 */
export function DpsMessageGroup({ label, children, className, labelId }: DpsMessageGroupProps) {
  const id = labelId ?? undefined
  return (
    <section
      className={cn('dps-stack-y', className)}
      aria-labelledby={id}
    >
      <h3 id={id} className="text-k-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </h3>
      <div className="dps-stack-y">{children}</div>
    </section>
  )
}
