import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorMessage } from '@/components/common/error-message'
import { DpsLoadingState } from '@/components/dps/loading-state'
import { cn } from '@/lib/utils'

export type DpsContentStateProps = {
  isLoading: boolean
  error?: string | null
  onRetry?: () => void
  loadingLabel?: string
  /** When true and not loading/error, show empty UI instead of children */
  empty?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  emptyIcon?: ReactNode
  className?: string
  children: ReactNode
}

/**
 * Canonical async UI pattern: loading → error (with retry) → empty → success.
 * Use for page-level or section-level data; keeps states consistent across modules.
 */
export function DpsContentState({
  isLoading,
  error,
  onRetry,
  loadingLabel,
  empty,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  emptyAction,
  emptyIcon,
  className,
  children,
}: DpsContentStateProps) {
  if (isLoading) {
    return (
      <div className={cn('w-full', className)}>
        <DpsLoadingState label={loadingLabel} />
      </div>
    )
  }

  if (error) {
    return (
      <div
        className={cn(
          'rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-4 dps-stack-y',
          className
        )}
      >
        <ErrorMessage message={error} />
        {onRetry ? (
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </div>
    )
  }

  if (empty) {
    return (
      <div className={cn('rounded-lg border border-border bg-card', className)}>
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
        >
          {emptyAction}
        </EmptyState>
      </div>
    )
  }

  return <>{children}</>
}
