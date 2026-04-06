'use client'

import * as React from 'react'
import { DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export type DpsModalSize = 'sm' | 'md' | 'lg'

/** Shared layout: safe viewport height, horizontal margin, scroll. Width tier from `size`. */
export const dpsModalContentBaseClassName =
  'max-h-[min(92dvh,920px)] w-[calc(100vw-1.5rem)] overflow-y-auto overscroll-contain sm:w-full'

const sizeMaxWidthClass: Record<DpsModalSize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-4xl',
}

/** @deprecated Prefer `dpsModalContentBaseClassName` + `size` on `DpsModalContent`; kept for overrides. */
export const DPS_MODAL_CONTENT_CLASSNAME = cn(dpsModalContentBaseClassName, sizeMaxWidthClass.md)

export type DpsModalContentProps = React.ComponentPropsWithoutRef<typeof DialogContent> & {
  /** Default `md` — simple forms `sm`, pickers / data-heavy `lg`. */
  size?: DpsModalSize
}

export const DpsModalContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  DpsModalContentProps
>(({ className, size = 'md', ...props }, ref) => (
  <DialogContent
    ref={ref}
    className={cn(dpsModalContentBaseClassName, sizeMaxWidthClass[size], className)}
    {...props}
  />
))
DpsModalContent.displayName = 'DpsModalContent'
