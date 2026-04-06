/**
 * Workout Domain Types
 * 
 * Represents the complete workout tracking system:
 * - Exercise dictionary (canonical exercises)
 * - Workout templates (planned structures)
 * - Workout sessions (executed instances)
 * - Sets (atomic tracking units)
 */

// ============================================================================
// CORE ENUMS
// ============================================================================

export type ExerciseCategory = 
  | 'strength' 
  | 'cardio' 
  | 'mobility' 
  | 'flexibility'
  | 'plyometric'
  | 'balance'

export type TrackingMode = 
  | 'strength_sets'           // Reps + weight
  | 'cardio_time_distance'    // Duration + distance
  | 'bodyweight_reps'         // Just reps
  | 'timed_hold'              // Duration only
  | 'intervals'               // Multiple efforts

export type SetType = 
  | 'warmup' 
  | 'working' 
  | 'drop' 
  | 'failure' 
  | 'rest_pause'
  | 'backoff'

export type SessionStatus = 
  | 'planned'
  | 'in_progress' 
  | 'completed' 
  | 'partial'
  | 'abandoned'

export type MuscleGroup = 
  | 'chest' 
  | 'back' 
  | 'shoulders' 
  | 'biceps' 
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'

export type EquipmentType = 
  | 'barbell' 
  | 'dumbbell' 
  | 'kettlebell' 
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'resistance_band'
  | 'none'

// ============================================================================
// EXERCISE DICTIONARY
// ============================================================================

export interface ExerciseMetadata {
  equipment?: EquipmentType[]
  primaryMuscles: MuscleGroup[]
  secondaryMuscles?: MuscleGroup[]
  instructions?: string
  videoUrl?: string
  formCues?: string[]
  /** e.g. beginner | intermediate | advanced — stored in metadata JSON from seed or custom */
  difficulty?: string
}

export interface Exercise {
  id: string
  name: string
  category: ExerciseCategory
  defaultTrackingMode: TrackingMode
  metadata?: ExerciseMetadata
  aliases?: string[]
  isCustom: boolean
  createdBy?: string // user_id if custom
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// WORKOUT TEMPLATES (PLANNED STRUCTURES)
// ============================================================================

export interface WorkoutTemplate {
  id: string
  userId: string
  name: string
  notes?: string
  items: WorkoutTemplateItem[]
  createdAt: Date
  updatedAt: Date
}

export interface WorkoutTemplateItem {
  id: string
  workoutId: string
  orderIndex: number
  exerciseId: string
  plannedStructure?: {
    sets?: number
    repsRange?: [number, number] // e.g., [8, 12]
    targetWeight?: number
    targetDuration?: number // seconds
    targetDistance?: number // meters
    restSeconds?: number
  }
  groupingKey?: string // e.g., 'superset_a', 'circuit_1'
}

// ============================================================================
// WORKOUT SESSIONS (EXECUTED INSTANCES)
// ============================================================================

export interface WorkoutSession {
  id: string
  userId: string
  workoutId?: string // nullable - can be freestyle
  scheduledWorkoutId?: string // link to scheduled workout
  startedAt: Date
  endedAt?: Date
  timezone: string
  status: SessionStatus
  /** Alias for status used by session service */
  completionStatus?: SessionStatus
  notes?: string
  perceivedExertion?: number // 1-10 scale (RPE)
  bodyweight?: number
  sessionExercises: SessionExercise[]
  createdAt: Date
  updatedAt: Date
}

export interface SessionExercise {
  id: string
  sessionId: string
  exerciseId: string
  orderIndex: number
  sourceWorkoutItemId?: string // traceability to template
  trackingMode: TrackingMode
  notes?: string
  sets: ExerciseSet[]
  targetRepsRange?: [number, number]
  targetRPE?: number
  /** Populated when loading from DB (join with exercises.name) */
  exerciseName?: string
}

// ============================================================================
// SETS (ATOMIC TRACKING UNIT)
// ============================================================================

export interface ExerciseSet {
  id: string
  sessionExerciseId: string
  setIndex: number // 1, 2, 3...
  setType: SetType
  
  // Nullable fields for different tracking modes
  reps?: number
  weight?: number // in user's preferred unit
  durationSeconds?: number
  distanceMeters?: number
  rpe?: number // Rate of Perceived Exertion (1-10)
  
  isCompleted: boolean
  notes?: string
  
  // Advanced tracking
  tempo?: string // e.g., '3-1-1' (eccentric-pause-concentric)
  restSecondsActual?: number
  failureFlag?: boolean
  assistanceWeight?: number // for assisted exercises
  
  createdAt: Date
  updatedAt: Date
}

/** Alias for ExerciseSet used by session service */
export type Set = ExerciseSet

// ============================================================================
// COMPUTED METRICS (NOT STORED, DERIVED)
// ============================================================================

export interface SessionMetrics {
  totalVolume: number // sum of (sets × reps × weight)
  totalSets: number
  totalDuration: number // seconds
  exerciseCount: number
  personalRecords: PersonalRecord[]
}

export interface PersonalRecord {
  exerciseId: string
  exerciseName: string
  recordType: 'max_weight' | 'max_reps' | 'max_volume' | 'longest_duration'
  value: number
  achievedAt: Date
  previousBest?: number
}

// ============================================================================
// REQUEST/RESPONSE TYPES (FOR API/SERVICE LAYER)
// ============================================================================

export interface StartSessionRequest {
  userId: string
  workoutId?: string
  scheduledWorkoutId?: string
  bodyweight?: number
}

export interface StartSessionResponse {
  session: WorkoutSession
  prepopulatedExercises: SessionExercise[]
}

export interface LogSetRequest {
  sessionExerciseId: string
  setIndex: number
  setType: SetType
  reps?: number
  weight?: number
  durationSeconds?: number
  distanceMeters?: number
  rpe?: number
  notes?: string
}

export interface CompleteSessionRequest {
  sessionId: string
  perceivedExertion?: number
  notes?: string
}

export interface CompleteSessionResponse {
  session: WorkoutSession
  metrics: SessionMetrics
  achievements: Achievement[]
}

export interface Achievement {
  type: 'personal_record' | 'streak' | 'milestone' | 'volume_goal'
  title: string
  description: string
  iconUrl?: string
}
