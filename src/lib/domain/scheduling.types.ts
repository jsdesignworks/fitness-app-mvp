/**
 * Scheduling Domain Types
 * 
 * Represents the scheduling and calendar system:
 * - Scheduled workouts (what you plan to do)
 * - Recurrence rules (for repeating workouts)
 * - Calendar connections (external calendar sync)
 */

// ============================================================================
// CORE ENUMS
// ============================================================================

export type ScheduledStatus = 
  | 'scheduled'
  | 'completed'
  | 'skipped'
  | 'moved'
  | 'in_progress'

export type ScheduleSource = 
  | 'user_created'     // Manually created by user
  | 'generated_plan'   // AI-generated program
  | 'template'         // From workout template
  | 'recurring'        // From recurrence rule

export type CalendarProvider = 
  | 'google'
  | 'apple'
  | 'outlook'

export type SyncState = 
  | 'ok'
  | 'needs_update'
  | 'error'
  | 'pending'

// ============================================================================
// SCHEDULED WORKOUTS
// ============================================================================

export interface ScheduledWorkout {
  id: string
  userId: string
  workoutId?: string // template, nullable if placeholder
  titleOverride?: string // override template name
  startAt: Date
  endAt?: Date
  timezone: string
  status: ScheduledStatus
  notes?: string
  source: ScheduleSource
  recurrenceId?: string // links to recurrence rule
  
  // Links to execution
  completedSessionId?: string // link to actual workout session
  
  createdAt: Date
  updatedAt: Date
}

export interface ScheduledWorkoutRecurrence {
  id: string
  scheduledWorkoutId: string
  rrule: string // RFC 5545 RRULE format
  untilAt?: Date
  exceptions?: string[] // ISO date strings of excluded dates
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// CALENDAR SYNC
// ============================================================================

export interface CalendarConnection {
  id: string
  userId: string
  provider: CalendarProvider
  externalCalendarId: string
  accessTokenEncrypted: string
  refreshTokenEncrypted: string
  tokenExpiresAt: Date
  scopes: string[]
  status: 'active' | 'revoked' | 'expired'
  createdAt: Date
  updatedAt: Date
}

export interface CalendarEventLink {
  id: string
  scheduledWorkoutId: string
  provider: CalendarProvider
  externalEventId: string
  externalCalendarId: string
  lastSyncedAt: Date
  syncState: SyncState
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// CALENDAR EXPORT
// ============================================================================

export interface ICSExportOptions {
  userId: string
  startDate: Date
  endDate: Date
  includeCompleted?: boolean
  includeSkipped?: boolean
}

export interface ICSFeedOptions {
  userId: string
  token: string // private feed token
  daysAhead?: number // default 90
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateScheduledWorkoutRequest {
  userId: string
  workoutId?: string
  titleOverride?: string
  startAt: Date
  endAt?: Date
  timezone: string
  notes?: string
  
  // Optional recurrence
  recurrence?: {
    rrule: string
    untilAt?: Date
  }
}

export interface CreateScheduledWorkoutResponse {
  scheduledWorkout: ScheduledWorkout
  instances?: ScheduledWorkout[] // if recurring, first N instances
}

export interface UpdateScheduledWorkoutRequest {
  scheduledWorkoutId: string
  startAt?: Date
  endAt?: Date
  status?: ScheduledStatus
  notes?: string
  applyToSeries?: boolean // if recurring, apply to all future instances
}

export interface RescheduleWorkoutRequest {
  scheduledWorkoutId: string
  newStartAt: Date
  newEndAt?: Date
  reason?: string
}

export interface MarkWorkoutCompleteRequest {
  scheduledWorkoutId: string
  sessionId: string // link to executed session
}

export interface GetScheduleRequest {
  userId: string
  startDate: Date
  endDate: Date
  includeCompleted?: boolean
}

export interface GetScheduleResponse {
  scheduledWorkouts: ScheduledWorkout[]
  summary: {
    totalScheduled: number
    completed: number
    skipped: number
    upcoming: number
  }
}

// ============================================================================
// CALENDAR INTEGRATION
// ============================================================================

export interface ConnectCalendarRequest {
  userId: string
  provider: CalendarProvider
  authCode: string
  redirectUri: string
  externalCalendarId: string
}

export interface ConnectCalendarResponse {
  connection: CalendarConnection
  synced: boolean
}

export interface SyncToCalendarRequest {
  userId: string
  provider: CalendarProvider
  scheduledWorkoutIds?: string[] // if empty, sync all upcoming
}

export interface SyncToCalendarResponse {
  synced: number
  failed: number
  errors: Array<{
    scheduledWorkoutId: string
    error: string
  }>
}

export interface GenerateICSFeedResponse {
  feedUrl: string
  expiresAt?: Date
}

// ============================================================================
// RECURRENCE HELPERS (NOT STORED, FOR CALCULATION)
// ============================================================================

export interface RecurrenceInstance {
  startAt: Date
  endAt?: Date
  isException: boolean
}

export interface ExpandRecurrenceRequest {
  rrule: string
  startDate: Date
  endDate: Date
  timezone: string
  exceptions?: string[]
}

export interface ExpandRecurrenceResponse {
  instances: RecurrenceInstance[]
  count: number
}

// ============================================================================
// SCHEDULING CONFLICTS
// ============================================================================

export interface ConflictCheck {
  scheduledWorkoutId: string
  proposedStartAt: Date
  proposedEndAt: Date
}

export interface ConflictCheckResponse {
  hasConflict: boolean
  conflictingWorkouts: ScheduledWorkout[]
  suggestion?: {
    startAt: Date
    endAt: Date
    reason: string
  }
}
