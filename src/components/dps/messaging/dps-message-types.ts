import type { ReactNode } from 'react'

/** Visual tone for message surfaces (not business logic). */
export type DpsMessageTone = 'info' | 'success' | 'warning' | 'error' | 'system'

/** Read / emphasis state for message cards. */
export type DpsMessageReadState = 'unread' | 'read' | 'highlighted'

export type DpsMessageAction = {
  label: string
  onClick: () => void
  /** Primary uses default button; secondary uses outline. */
  variant?: 'primary' | 'secondary'
}

export type DpsMessageCardBaseProps = {
  /** Main text; supports long content (wraps). */
  body: ReactNode
  title?: ReactNode
  timestamp?: ReactNode
  tone?: DpsMessageTone
  readState?: DpsMessageReadState
  icon?: ReactNode
  /** When set, shows a dismiss control (caller handles clearing from list). */
  onDismiss?: () => void
  dismissLabel?: string
  /** Primary CTA (e.g. View workout). */
  primaryAction?: DpsMessageAction
  /** Secondary control (e.g. Snooze) — not the same as dismiss. */
  secondaryAction?: DpsMessageAction
  /** When inside `DpsMessageGroup`, set true so the card is a proper list item. */
  asListItem?: boolean
  className?: string
}
