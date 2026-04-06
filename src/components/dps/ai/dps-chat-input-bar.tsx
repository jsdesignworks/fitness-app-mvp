'use client'

import type { FormEvent } from 'react'
import { useId } from 'react'
import { Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type DpsChatInputBarProps = {
  value: string
  onChange: (next: string) => void
  onSend: (message: string) => void | Promise<void>
  placeholder?: string
  disabled?: boolean
  isSending?: boolean
  className?: string
}

/**
 * Reusable chat input bar: input + send, disabled while sending, mobile-safe sticky.
 * UI-only; parent provides `onSend`.
 */
export function DpsChatInputBar({
  value,
  onChange,
  onSend,
  placeholder = 'Ask about your workout…',
  disabled,
  isSending,
  className,
}: DpsChatInputBarProps) {
  const id = useId()
  const isDisabled = Boolean(disabled || isSending)
  const canSend = value.trim().length > 0 && !isDisabled

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!canSend) return
    void onSend(value)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'sticky bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur',
        'px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:static sm:bg-transparent sm:py-3',
        className
      )}
      aria-label="Chat input"
    >
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="sr-only">
          Message
        </label>
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={isDisabled}
          onKeyDown={(e) => {
            // Let Enter submit naturally; prevent accidental newline (single-line input).
            if (e.key === 'Enter') {
              // no-op: handled by form submit
            }
          }}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!canSend}
          aria-busy={isSending || undefined}
          className="dps-focus-ring shrink-0"
        >
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
        </Button>
      </div>
    </form>
  )
}

