'use client'

import { type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type DpsSelectionListProps<T> = {
  items: T[]
  keyExtractor: (item: T) => string
  renderItem: (item: T) => ReactNode
  onSelectItem?: (item: T) => void
  /** Highlights row styles when true */
  isItemSelected?: (item: T) => boolean
  loading?: boolean
  emptyMessage?: string
  error?: string | null
  onRetry?: () => void
  className?: string
  listClassName?: string
  /** Scrollable list region */
  maxHeightClassName?: string
}

/**
 * Selectable list with loading / empty / error regions for pickers and modals.
 */
export function DpsSelectionList<T>({
  items,
  keyExtractor,
  renderItem,
  onSelectItem,
  isItemSelected,
  loading,
  emptyMessage = 'Nothing to show.',
  error,
  onRetry,
  className,
  listClassName,
  maxHeightClassName = 'max-h-56',
}: DpsSelectionListProps<T>) {
  return (
    <div className={cn('space-y-2', className)}>
      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-k-sm text-destructive"
        >
          <p>{error}</p>
          {onRetry ? (
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
        </div>
      ) : null}
      {!error && loading ? (
        <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
          <span className="sr-only">Loading</span>
        </div>
      ) : null}
      {!error && !loading ? (
        <ul
          className={cn(
            'space-y-1 overflow-y-auto overscroll-contain rounded-lg border border-border p-2',
            maxHeightClassName,
            listClassName
          )}
          role="list"
        >
          {items.map((item) => {
            const selected = isItemSelected?.(item) ?? false
            const content = renderItem(item)
            if (onSelectItem) {
              return (
                <li key={keyExtractor(item)} className="min-w-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-selected={selected}
                    className={cn(
                      'h-auto min-h-touch w-full justify-start whitespace-normal py-2 text-left sm:min-h-0',
                      selected && 'bg-accent/10 text-accent'
                    )}
                    onClick={() => onSelectItem(item)}
                  >
                    {content}
                  </Button>
                </li>
              )
            }
            return (
              <li key={keyExtractor(item)} className="min-w-0">
                {content}
              </li>
            )
          })}
          {items.length === 0 ? (
            <li className="py-6 text-center text-k-sm text-muted-foreground">{emptyMessage}</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  )
}
