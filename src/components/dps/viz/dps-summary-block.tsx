import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type DpsSummaryBlockProps = {
  title?: string
  children: ReactNode
  className?: string
}

/**
 * Lightweight section for stacked metric rows or narrative summary (no full Card chrome).
 */
export function DpsSummaryBlock({ title, children, className }: DpsSummaryBlockProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {title ? (
        <h3 className="font-display text-k-sm font-normal uppercase tracking-kinetic-wide text-muted-foreground">
          {title}
        </h3>
      ) : null}
      <div className="dps-stack-y text-k-sm text-foreground">{children}</div>
    </div>
  )
}
