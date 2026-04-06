/**
 * AI Domain Types
 * 
 * Represents the AI trainer system:
 * - Provider abstraction (Claude, OpenAI, etc.)
 * - Chat interactions
 * - Workout recommendations
 * - Safety guardrails
 */

// ============================================================================
// CORE ENUMS
// ============================================================================

export type AIProvider = 
  | 'anthropic'
  | 'openai'

export type AIModel = 
  | 'claude-sonnet-4-5-20250929'
  | 'claude-opus-4-5-20251101'
  | 'gpt-4o'
  | 'gpt-4o-mini'

export type MessageRole = 
  | 'system'
  | 'user'
  | 'assistant'

export type RecommendationType = 
  | 'workout_plan'
  | 'exercise_swap'
  | 'progression_advice'
  | 'recovery_suggestion'
  | 'nutrition_adjustment'
  | 'form_tip'

export type SafetyViolationType = 
  | 'medical_claim'
  | 'extreme_plan'
  | 'dangerous_advice'
  | 'scope_violation'

// ============================================================================
// PROVIDER INTERFACE (ABSTRACTION)
// ============================================================================

export interface AIProviderConfig {
  provider: AIProvider
  model: AIModel
  apiKey: string
  maxTokens?: number
  temperature?: number
  topP?: number
}

export interface AIMessage {
  role: MessageRole
  content: string
  metadata?: {
    timestamp: Date
    tokens?: number
    modelUsed?: string
  }
}

export interface AIProviderInterface {
  /**
   * Generate a chat response
   */
  chat(messages: AIMessage[], options?: ChatOptions): Promise<ChatResponse>
  
  /**
   * Generate structured output (JSON)
   */
  generateStructured<T>(
    prompt: string, 
    schema: any, 
    options?: GenerateOptions
  ): Promise<T>
  
  /**
   * Stream a response (for real-time chat)
   */
  streamChat(
    messages: AIMessage[], 
    onChunk: (chunk: string) => void
  ): Promise<void>
}

// ============================================================================
// CHAT INTERACTIONS
// ============================================================================

export interface ChatOptions {
  maxTokens?: number
  temperature?: number
  stopSequences?: string[]
  userId?: string // for rate limiting
}

export interface ChatResponse {
  message: AIMessage
  usage: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  finishReason: 'stop' | 'length' | 'safety'
  cached?: boolean
}

export interface ChatSession {
  id: string
  userId: string
  messages: AIMessage[]
  context: UserContext
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// USER CONTEXT (FOR PROMPT ASSEMBLY)
// ============================================================================

export interface UserContext {
  user: {
    id: string
    firstName: string
    goals: string[]
    experience: 'beginner' | 'intermediate' | 'advanced'
    equipment: string[]
    injuries?: string[]
    constraints?: string[]
  }
  
  recentActivity: {
    lastWorkout?: {
      name: string
      date: Date
      exercises: string[]
    }
    weeklyVolume?: number
    currentStreak?: number
  }
  
  preferences: {
    workoutFrequency: number // days per week
    sessionDuration: number // minutes
    preferredSplit?: string // 'upper_lower', 'ppl', 'full_body'
  }
  
  nutrition?: {
    currentCalories?: number
    targetCalories?: number
    proteinTarget?: number
  }

  /** Optional: built by AiTrainerService for "today" and adherence. */
  todaySession?: {
    notes?: string
    sessionExercises?: { exerciseName?: string }[]
  }
  adherenceSummary?: string
  scheduledThisWeek?: Array<{ title: string; startAt: Date; status: string }>

  /** Summarized nutrition (today), safe for prompts. */
  nutritionToday?: {
    calories: number
    proteinG: number
    carbsG: number
    fatG: number
    targetCalories?: number
    targetProteinG?: number
    hasEntries: boolean
  }

  /** Unique local calendar days in the current week with activity. */
  calendarWeek?: {
    daysWithWorkout: number
    daysWithNutrition: number
    weekLabel: string
  }

  /** In-app message feed signals (titles + short excerpts). */
  messagingSignals?: Array<{
    messageType: string
    title?: string | null
    excerpt: string
  }>
}

/** Serializable preview for chat empty state + GET /api/ai/chat (no prompt leakage). */
export interface AiContextPreview {
  summaryLines: string[]
  insightTitle: string
  insightBody: string
  inlineHint?: string
}

// ============================================================================
// RECOMMENDATIONS
// ============================================================================

export interface GenerateRecommendationRequest {
  userId: string
  type: RecommendationType
  context: UserContext
  specificRequest?: string
}

export interface WorkoutPlanRecommendation {
  type: 'workout_plan'
  planName: string
  description: string
  durationWeeks: number
  workouts: Array<{
    dayOfWeek: number // 0-6
    name: string
    exercises: Array<{
      exerciseId?: string
      exerciseName: string
      sets: number
      repsRange: [number, number]
      restSeconds: number
      notes?: string
    }>
  }>
  rationale: string
  warnings?: string[]
}

export interface ExerciseSwapRecommendation {
  type: 'exercise_swap'
  originalExerciseId: string
  originalExerciseName: string
  alternatives: Array<{
    exerciseId?: string
    exerciseName: string
    reason: string
    difficulty: 'easier' | 'similar' | 'harder'
  }>
  rationale: string
}

export interface ProgressionAdviceRecommendation {
  type: 'progression_advice'
  exerciseId: string
  exerciseName: string
  currentPerformance: {
    sets: number
    reps: number
    weight: number
  }
  nextStep: {
    method: 'increase_weight' | 'increase_reps' | 'increase_sets' | 'advanced_technique'
    target: {
      sets?: number
      reps?: number
      weight?: number
    }
    timeline: string
  }
  rationale: string
}

export type AIRecommendation = 
  | WorkoutPlanRecommendation
  | ExerciseSwapRecommendation
  | ProgressionAdviceRecommendation

// ============================================================================
// SAFETY GUARDRAILS
// ============================================================================

export interface SafetyCheck {
  passed: boolean
  violations: SafetyViolation[]
}

export interface SafetyViolation {
  type: SafetyViolationType
  severity: 'low' | 'medium' | 'high'
  description: string
  detectedIn: string // excerpt of problematic content
}

export interface ValidateResponseRequest {
  response: string
  context: UserContext
}

export interface ValidateResponseResponse {
  isValid: boolean
  safetyCheck: SafetyCheck
  sanitizedResponse?: string
}

// ============================================================================
// PROMPT ASSEMBLY
// ============================================================================

export interface PromptTemplate {
  id: string
  name: string
  systemPrompt: string
  userPromptTemplate: string
  placeholders: string[]
  model: AIModel
  maxTokens: number
  temperature: number
}

export interface AssemblePromptRequest {
  templateId: string
  context: UserContext
  userMessage: string
}

export interface AssemblePromptResponse {
  systemPrompt: string
  userPrompt: string
  messages: AIMessage[]
}

// ============================================================================
// RATE LIMITING & AUDIT
// ============================================================================

export interface RateLimitCheck {
  userId: string
  feature: 'chat' | 'recommendation' | 'validation'
}

export interface RateLimitCheckResponse {
  allowed: boolean
  remaining: number
  resetAt: Date
  reason?: string
}

export interface AIAuditLog {
  id: string
  userId: string
  provider: AIProvider
  model: AIModel
  feature: string
  inputTokens: number
  outputTokens: number
  latencyMs: number
  cached: boolean
  cost?: number
  createdAt: Date
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface ChatRequest {
  userId: string
  message: string
  sessionId?: string // optional, for continuing conversation
}

export interface ChatRequestResponse {
  sessionId: string
  response: AIMessage
  usage: ChatResponse['usage']
  safetyCheck: SafetyCheck
}

export interface GenerateOptions {
  temperature?: number
  maxTokens?: number
  retries?: number
}

export interface GenerateStructuredRequest<T> {
  userId: string
  prompt: string
  schema: any // JSON schema
  options?: GenerateOptions
}

export interface GenerateStructuredResponse<T> {
  data: T
  usage: ChatResponse['usage']
  valid: boolean
  validationErrors?: string[]
}
