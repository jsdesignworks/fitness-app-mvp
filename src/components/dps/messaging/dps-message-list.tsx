'use client'

import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorMessage } from '@/components/common/error-message'
import { DpsLoadingState } from '@/components/dps/loading-state'
import { cn } from '@/lib/utils'

export type DpsMessageListProps = {
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  loadingLabel?: string
  /** When true (and not loading/error), show empty UI instead of children. */
  empty?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  emptyIcon?: ReactNode
  /** Message cards or custom feed content. */
  children: ReactNode
  className?: string
  /** Adds `role="list"` when children are direct message rows (avoid with grouped sections). */
  listRole?: boolean
}

/**
 * Vertical message feed with the same async states as `DpsContentState`:
 * loading → error (retry) → empty → populated.
 */
export function DpsMessageList({
  isLoading = false,
  error,
  onRetry,
  loadingLabel,
  empty = false,
  emptyTitle = 'No messages',
  emptyDescription,
  emptyAction,
  emptyIcon,
  children,
  className,
  listRole = false,
}: DpsMessageListProps) {
  if (isLoading) {
    return (
      <div className={cn('w-full', className)}>
        <DpsLoadingState label={loadingLabel ?? 'Loading messages…'} />
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
          <Button type="button" variant="outline" size="sm" className="dps-focus-ring w-fit" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </div>
    )
  }

  if (empty) {
    return (
      <div className={cn('rounded-lg border border-border bg-card', className)}>
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription}>
          {emptyAction}
        </EmptyState>
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)} role={listRole ? 'list' : undefined}>
      {children}
    </div>
  )
}
