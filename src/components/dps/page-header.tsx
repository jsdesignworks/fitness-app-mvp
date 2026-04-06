import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Standard page title row: stacks on mobile, side-by-side from sm+.
 */
export function DpsPageHeader({
  title,
  description,
  actions,
  className,
  titleId,
}: {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
  /** Link to this id from sections below for a11y */
  titleId?: string
}) {
  return (
    <header
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6',
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1
          id={titleId}
          className="font-display text-k-3xl font-normal uppercase tracking-kinetic-wide text-foreground min-[375px]:text-k-4xl"
        >
          {title}
        </h1>
        {description ? (
          <p className="text-k-sm text-muted-foreground sm:text-k-base">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
      ) : null}
    </header>
  )
}
