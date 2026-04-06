import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type EmptyStateProps = {
  icon?: ReactNode
  title: string
  description?: string
  children?: ReactNode
  className?: string
  /** Accessible name for the empty region */
  label?: string
}

/**
 * Empty state: keyboard-friendly actions should use Button or links with `dps-focus-ring`.
 */
export function EmptyState({ icon, title, description, children, className, label }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-4 py-10 text-center sm:py-12',
        className
      )}
      role="region"
      aria-label={label ?? title}
    >
      {icon && (
        <div className="mb-4 text-muted-foreground" aria-hidden>
          {icon}
        </div>
      )}
      <p className="font-medium text-foreground">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {children && <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row">{children}</div>}
    </div>
  )
}
