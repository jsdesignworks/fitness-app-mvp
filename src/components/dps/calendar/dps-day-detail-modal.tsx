'use client'

import * as React from 'react'
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DpsModalContent, type DpsModalSize } from '@/components/dps/interaction/dps-modal-content'

export type DpsDayDetailModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  /** Replace default placeholder body */
  children?: React.ReactNode
  size?: DpsModalSize
}

/**
 * Shell for a future “day details” surface — no data fetching. Uses DPS-3 modal tiers.
 */
export function DpsDayDetailModal({
  open,
  onOpenChange,
  title,
  children,
  size = 'md',
}: DpsDayDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DpsModalContent size={size}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="text-k-sm text-muted-foreground">
          {children ?? <p>Content slot — connect a feature module later.</p>}
        </div>
      </DpsModalContent>
    </Dialog>
  )
}
