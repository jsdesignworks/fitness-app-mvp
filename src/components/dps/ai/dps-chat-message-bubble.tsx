'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { DpsThinkingIndicator } from './dps-thinking-indicator'

export type DpsChatMessageBubbleProps = {
  role: 'user' | 'assistant'
  text: ReactNode
  timestamp?: ReactNode
  /** When true, renders typing indicator instead of text. */
  isLoading?: boolean
  onRetry?: () => void
  className?: string
}

export function DpsChatMessageBubble({
  role,
  text,
  timestamp,
  isLoading,
  onRetry,
  className,
}: DpsChatMessageBubbleProps) {
  const isUser = role === 'user'

  return (
    <div
      className={cn('flex', isUser ? 'justify-end' : 'justify-start', className)}
      role="article"
      aria-label={isUser ? 'User message' : 'Assistant message'}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-3 py-2 text-k-sm leading-relaxed',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
        )}
      >
        {isLoading ? (
          <DpsThinkingIndicator className={isUser ? 'text-primary-foreground/80' : 'text-muted-foreground'} />
        ) : (
          <p className="whitespace-pre-wrap break-words">{text}</p>
        )}
        {timestamp ? (
          <time
            className={cn(
              'mt-1 block text-k-xs tabular-nums',
              isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}
          >
            {timestamp}
          </time>
        ) : null}
        {onRetry && !isLoading ? (
          <div className="mt-2">
            {/* UI-only: parent decides what retry means. */}
            <button type="button" className="dps-focus-ring rounded-sm underline" onClick={onRetry}>
              Retry
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

