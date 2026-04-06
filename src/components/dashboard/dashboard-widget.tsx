'use client'

import { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/common/empty-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

type DashboardWidgetProps = {
  id: string
  title: string
  isLoading?: boolean
  error?: string | null
  isEmpty?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  children: ReactNode
  onRetry?: () => void
}

export function DashboardWidget({
  id,
  title,
  isLoading,
  error,
  isEmpty,
  emptyTitle,
  emptyDescription,
  emptyAction,
  children,
  onRetry,
}: DashboardWidgetProps) {
  return (
    <Card variant="default" className="h-full" data-widget-id={id}>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-3 py-2" aria-busy aria-live="polite">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}
        {!isLoading && error && (
          <EmptyState
            title="Something went wrong"
            description={error}
            children={
              onRetry ? (
                <Button variant="outline" size="sm" onClick={onRetry}>
                  Retry
                </Button>
              ) : undefined
            }
          />
        )}
        {!isLoading && !error && isEmpty && (
          <EmptyState
            title={emptyTitle ?? 'No data yet'}
            description={emptyDescription}
            children={emptyAction}
          />
        )}
        {!isLoading && !error && !isEmpty && children}
      </CardContent>
    </Card>
  )
}
