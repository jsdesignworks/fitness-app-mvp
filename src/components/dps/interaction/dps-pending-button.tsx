'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type DpsPendingButtonProps = Omit<ButtonProps, 'aria-busy'> & {
  pending?: boolean
  pendingLabel: React.ReactNode
}

/**
 * Submit-style button: disables while pending, shows spinner + label, sets `aria-busy`.
 */
export const DpsPendingButton = React.forwardRef<HTMLButtonElement, DpsPendingButtonProps>(
  ({ pending, pendingLabel, children, disabled, className, ...props }, ref) => (
    <Button
      ref={ref}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={cn(className)}
      {...props}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" aria-hidden />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  )
)
DpsPendingButton.displayName = 'DpsPendingButton'
