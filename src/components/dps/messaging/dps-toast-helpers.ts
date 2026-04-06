'use client'

import { toast } from '@/hooks/use-toast'

/** Default visibility for DPS toast helpers (ms). Radix passes this to each toast root. */
export const DPS_TOAST_DEFAULT_DURATION_MS = 5_000

export type DpsToastPayload = {
  title?: string
  description?: string
  /** Time on screen in ms. Defaults to `DPS_TOAST_DEFAULT_DURATION_MS`. */
  duration?: number
}

function durationOrDefault(duration?: number) {
  return duration ?? DPS_TOAST_DEFAULT_DURATION_MS
}

/**
 * Typed wrappers around the app `toast()` API — same state as `useToast`, no second toaster.
 * Prefer these for success / warning / info to pick up DPS-5 styles in `components/ui/toast.tsx`.
 */
export const dpsToast = {
  success: (input: DpsToastPayload) =>
    toast({
      ...input,
      variant: 'success',
      duration: durationOrDefault(input.duration),
    }),

  warning: (input: DpsToastPayload) =>
    toast({
      ...input,
      variant: 'warning',
      duration: durationOrDefault(input.duration),
    }),

  info: (input: DpsToastPayload) =>
    toast({
      ...input,
      variant: 'info',
      duration: durationOrDefault(input.duration),
    }),

  destructive: (input: DpsToastPayload) =>
    toast({
      ...input,
      variant: 'destructive',
      duration: durationOrDefault(input.duration),
    }),

  default: (input: DpsToastPayload) =>
    toast({
      ...input,
      variant: 'default',
      duration: durationOrDefault(input.duration),
    }),
}
