/**
 * Messaging Domain Types
 * 
 * Represents the behavioral messaging system:
 * - User preferences (tone, frequency, quiet hours)
 * - Message templates (dynamic content)
 * - Message triggers (when to send)
 * - Message events (delivery tracking)
 */

// ============================================================================
// CORE ENUMS
// ============================================================================

export type ToneStyle = 
  | 'coach'      // Supportive, instructional
  | 'calm'       // Gentle, mindful
  | 'hype'       // Energetic, motivational
  | 'minimal'    // Brief, to the point

export type MessageFrequency = 
  | 'low'        // Only critical notifications
  | 'normal'     // Balanced approach
  | 'high'       // More frequent encouragement

export type MessageChannel = 
  | 'in_app'     // Banner/toast in app
  | 'push'       // Push notification
  | 'email'      // Email notification

export type MessageTriggerKey = 
  | 'workout_complete'
  | 'streak_reminder'
  | 'milestone_reached'
  | 'on_login'
  | 'on_first_login'
  | 'on_workout_start'
  | 'on_workout_complete'
  | 'on_streak_hit'
  | 'on_milestone'
  | 'on_pr'
  | 'on_skip_detected'
  | 'on_recovery_needed'
  | 'on_habit_logged'
  | 'on_habit_resisted'
  | 'on_goal_progress'
  | 'scheduled_reminder'
  /** In-app feed rows synced from product state (not template-driven). */
  | 'system_feed'

/** Alias used by MessagingService */
export type TriggerKey = MessageTriggerKey

export type DeliveryStatus = 
  | 'queued'
  | 'sent'
  | 'skipped'
  | 'failed'

// ============================================================================
// USER PREFERENCES
// ============================================================================

export interface UserMessagePreferences {
  userId: string
  enabled?: boolean
  toneStyle: ToneStyle
  messageFrequency: MessageFrequency
  quietHoursStart?: string // HH:MM format
  quietHoursEnd?: string
  preferredChannels: MessageChannel[]
  profanityAllowed: boolean
  /** In-app feed: reminders (e.g. active session). */
  showReminders?: boolean
  /** In-app feed: system summaries (nutrition nudge, calendar context). */
  showSystemUpdates?: boolean
  /** In-app feed: progress-style updates (when wired). */
  showProgressUpdates?: boolean
  accessibilityOptions?: {
    screenReaderOptimized?: boolean
    reduceMotion?: boolean
    highContrast?: boolean
  }
  updatedAt: Date
}

// ============================================================================
// MESSAGE TEMPLATES
// ============================================================================

export interface MessageTemplate {
  id: string
  messageKey: string // e.g., 'workout_complete_praise'
  toneStyle: ToneStyle
  variantWeight: number // for rotation (1-10)
  templateText: string // with placeholders like {firstName}, {streakCount}
  locale: string
  metadata?: {
    emoji?: string
    soundEffect?: string
    hapticPattern?: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface MessagePlaceholder {
  key: string // e.g., 'firstName', 'streakCount'
  description: string
  exampleValue: string
}

// ============================================================================
// MESSAGE TRIGGERS
// ============================================================================

export interface MessageTrigger {
  id: string
  triggerKey: MessageTriggerKey
  conditions: TriggerCondition[]
  cooldownMinutes: number // prevent spam
  priority: number // 1-10, higher = more important
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TriggerCondition {
  field: string // e.g., 'streakCount', 'workoutCount', 'daysSinceLastWorkout'
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in'
  value: string | number | string[]
  description?: string
}

// ============================================================================
// MESSAGE EVENTS (DELIVERY TRACKING)
// ============================================================================

export interface MessageEvent {
  id: string
  userId: string
  triggerKey: MessageTriggerKey
  templateId: string
  renderedBody?: string
  createdAt: Date
  deliveredAt?: Date
  channel: MessageChannel
  deliveryStatus: DeliveryStatus
  reasonSkipped?: string
  metadata?: {
    clickedAt?: Date
    dismissedAt?: Date
    userInteractionType?: 'clicked' | 'dismissed' | 'ignored'
  }
  /** Feed extensions (nullable in DB for legacy rows). */
  messageType?: string
  tone?: string
  title?: string | null
  ctaLabel?: string | null
  ctaHref?: string | null
  isRead?: boolean
  isDismissed?: boolean
  dedupeKey?: string | null
}

// ============================================================================
// COMPUTED CONTEXT (NOT STORED, PASSED TO TEMPLATE RENDERER)
// ============================================================================

export interface MessageContext {
  /** Convenience for trigger payloads; when present, same as user.id */
  userId?: string
  /** Allow trigger-specific payload (e.g. streakCount, sessionId, timestamp) */
  [key: string]: unknown
  user?: {
    id: string
    firstName: string
    preferredName?: string
    timezone: string
    preferences: UserMessagePreferences
  }
  
  trigger?: {
    key: MessageTriggerKey
    timestamp: Date
    metadata?: Record<string, any>
  }
  
  stats?: {
    streakCount?: number
    totalWorkouts?: number
    totalVolume?: number
    durationMinutes?: number
    weeklyGoalProgress?: number
    recentPRs?: Array<{ exerciseName: string; value: number }>
    daysSinceLastWorkout?: number
  }
  
  goals?: {
    currentGoal?: string
    targetDate?: Date
    progress?: number
  }
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface EvaluateTriggersRequest {
  userId: string
  triggerKey: MessageTriggerKey
  metadata?: Record<string, any>
}

export interface EvaluateTriggersResponse {
  shouldSend: boolean
  template?: MessageTemplate
  renderedMessage?: string
  channel: MessageChannel
  skipReason?: string
}

export interface SendMessageRequest {
  userId: string
  templateId: string
  channel: MessageChannel
  context: MessageContext
  scheduleFor?: Date
}

export interface SendMessageResponse {
  eventId: string
  sent: boolean
  deliveredAt?: Date
  error?: string
}

export interface GetMessageHistoryRequest {
  userId: string
  startDate?: Date
  endDate?: Date
  channel?: MessageChannel
  limit?: number
}

export interface GetMessageHistoryResponse {
  events: MessageEvent[]
  total: number
  unreadCount: number
}

export interface UpdateMessagePreferencesRequest {
  userId: string
  toneStyle?: ToneStyle
  messageFrequency?: MessageFrequency
  quietHoursStart?: string
  quietHoursEnd?: string
  preferredChannels?: MessageChannel[]
}

// ============================================================================
// COOLDOWN MANAGEMENT
// ============================================================================

export interface CooldownCheck {
  userId: string
  triggerKey: MessageTriggerKey
}

export interface CooldownCheckResponse {
  isInCooldown: boolean
  lastSentAt?: Date
  canSendAgainAt?: Date
  remainingMinutes?: number
}

// ============================================================================
// BATCH MESSAGING (FOR SCHEDULED REMINDERS)
// ============================================================================

export interface BatchSendRequest {
  userIds: string[]
  triggerKey: MessageTriggerKey
  templateOverride?: string
  respectQuietHours: boolean
  respectCooldowns: boolean
}

export interface BatchSendResponse {
  queued: number
  skipped: number
  errors: Array<{
    userId: string
    reason: string
  }>
}
