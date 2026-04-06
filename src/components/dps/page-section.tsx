import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Vertical rhythm wrapper for a major block (widgets grid, history list, etc.).
 */
export function DpsPageSection({
  title,
  description,
  children,
  className,
  titleId,
}: {
  title?: string
  description?: string
  children: ReactNode
  className?: string
  titleId?: string
}) {
  const hasHeading = Boolean(title)

  return (
    <section
      className={cn('dps-section-y', className)}
      aria-labelledby={hasHeading ? titleId : undefined}
    >
      {hasHeading ? (
        <div className="space-y-1">
          <h2
            id={titleId}
            className="font-display text-k-xl font-normal uppercase tracking-kinetic-wide text-foreground"
          >
            {title}
          </h2>
          {description ? (
            <p className="text-k-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}
