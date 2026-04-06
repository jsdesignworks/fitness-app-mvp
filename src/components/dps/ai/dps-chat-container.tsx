'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type DpsChatContainerProps = {
  /** Message list content. Rendered inside a scrollable region. */
  children: ReactNode
  /** Input area (usually `DpsChatInputBar`). Rendered after the list. */
  inputSlot: ReactNode
  className?: string
  /**
   * Optional override: keep the same sizing pattern as other chat-like screens.
   * Defaults match the existing AI Trainer page (`min-h-[240px] max-h-[400px]`).
   */
  messageListClassName?: string
}

/**
 * Layout-only chat container: scrollable message list + bottom input slot.
 * No message logic; parents supply children and handlers.
 */
export function DpsChatContainer({
  children,
  inputSlot,
  className,
  messageListClassName,
}: DpsChatContainerProps) {
  return (
    <div className={cn('flex flex-col flex-1 min-h-0 p-0', className)}>
      <div
        className={cn(
          'flex-1 overflow-auto px-4 pb-24 sm:pb-4 min-h-[240px] max-h-[400px]',
          messageListClassName
        )}
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        {children}
      </div>
      {inputSlot}
    </div>
  )
}

