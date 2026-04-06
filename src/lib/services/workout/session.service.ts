// src/lib/services/workout/session.service.ts

import { SessionRepository } from '@/lib/repositories/workout/session.repository'
import { WorkoutRepository } from '@/lib/repositories/workout/workout.repository'
import { ExerciseRepository } from '@/lib/repositories/workout/exercise.repository'
import { getPresetBySlug } from '@/lib/workout/preset-catalog'
import { ScheduledWorkoutRepository } from '@/lib/repositories/scheduling/scheduled-workout.repository'
import { MessagingService } from '@/lib/services/messaging/messaging.service'
import { StatsService } from '@/lib/services/workout/stats.service'
import { AuditService } from '@/lib/services/audit/audit.service'
import { Result, ok, err } from '@/lib/domain/shared/types'
import { WorkoutSession, SessionExercise, Set } from '@/lib/domain/workout.types'
import { AppError } from '@/lib/utils/errors'
import { logger } from '@/lib/utils/logger'

/**
 * WorkoutSessionService
 * 
 * Core business logic for workout session lifecycle.
 * This is PORTABLE - when you move to standalone API, this code moves verbatim.
 * 
 * Responsibilities:
 * - Start sessions (from template or scheduled workout or freestyle)
 * - Complete sessions (mark done, calculate stats, trigger messaging)
 * - Update sessions (edit sets, reorder exercises)
 * - Abandon/resume sessions
 * 
 * Does NOT:
 * - Handle HTTP requests (that's API routes)
 * - Query database directly (that's repositories)
 * - Send messages directly (that's MessagingService)
 */
export class WorkoutSessionService {
  /**
   * Start a new workout session
   * 
   * Can be called from:
   * - Web UI (user clicks "Start Workout")
   * - Mobile app
   * - Scheduled automation
   * - AI trainer recommendation
   */
  static async startSession(
    userId: string,
    options: {
      workoutId?: string           // Start from a template
      scheduledWorkoutId?: string  // Start from calendar item
      title?: string               // For freestyle sessions
      presetSlug?: string          // Built-in preset (see preset-catalog)
      duplicateFromSessionId?: string // Repeat a past session structure
    }
  ): Promise<Result<WorkoutSession>> {
    try {
      logger.info('Starting workout session', { userId, options })

      // 1. Validate: User can only have one active session at a time
      const activeSession = await SessionRepository.getActiveSession(userId)
      if (activeSession) {
        return err(new AppError('ACTIVE_SESSION_EXISTS', 'You already have an active workout'))
      }

      // 2. Build session exercises from template, preset, duplicate, or freestyle
      let workoutTemplate: Awaited<ReturnType<typeof WorkoutRepository.getById>> = null
      let sessionExercises: Partial<SessionExercise>[] = []
      let resolvedWorkoutId: string | null = options.workoutId || null

      if (options.workoutId) {
        const templateResult = await WorkoutRepository.getById(options.workoutId)
        if (!templateResult) {
          return err(new AppError('WORKOUT_NOT_FOUND', 'Workout template not found'))
        }
        workoutTemplate = templateResult
        sessionExercises = await this.copyTemplateToSession(workoutTemplate)
      } else if (options.presetSlug) {
        const preset = getPresetBySlug(options.presetSlug)
        if (!preset) {
          return err(new AppError('PRESET_NOT_FOUND', 'Unknown workout preset'))
        }
        resolvedWorkoutId = null
        for (const item of preset.items) {
          const ex = await ExerciseRepository.findFirstByExactName(item.exerciseName)
          if (!ex) {
            return err(
              new AppError(
                'PRESET_EXERCISE_MISSING',
                `Exercise "${item.exerciseName}" is not in your library. Run DB migrations or add the exercise.`
              )
            )
          }
          sessionExercises.push({
            exerciseId: ex.id,
            orderIndex: item.orderIndex,
            trackingMode: ex.defaultTrackingMode,
          })
        }
      } else if (options.duplicateFromSessionId) {
        const src = await SessionRepository.getById(options.duplicateFromSessionId)
        if (!src || src.userId !== userId) {
          return err(new AppError('SESSION_NOT_FOUND', 'Workout session not found'))
        }
        if (src.status === 'in_progress') {
          return err(new AppError('SESSION_INVALID', 'Finish or abandon the active session before repeating another'))
        }
        if (!src.sessionExercises?.length) {
          return err(new AppError('SESSION_EMPTY', 'That workout has no exercises to repeat'))
        }
        resolvedWorkoutId = null
        sessionExercises = src.sessionExercises.map((se) => ({
          exerciseId: se.exerciseId,
          orderIndex: se.orderIndex,
          trackingMode: se.trackingMode,
        }))
      }

      const presetTitle = options.presetSlug ? getPresetBySlug(options.presetSlug)?.title : undefined
      const defaultTitle =
        options.title ||
        workoutTemplate?.name ||
        presetTitle ||
        (options.duplicateFromSessionId ? 'Repeated workout' : 'Workout')

      // 3. Create the session
      const session = await SessionRepository.create({
        userId,
        workoutId: resolvedWorkoutId,
        scheduledWorkoutId: options.scheduledWorkoutId || null,
        startedAt: new Date(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        completionStatus: 'in_progress',
        title: defaultTitle,
      })

      // 4. Create session exercises with seeded sets
      for (const exercise of sessionExercises) {
        if (!exercise.exerciseId || exercise.orderIndex == null || !exercise.trackingMode) continue
        await SessionRepository.addExercise(session.id, {
          exerciseId: exercise.exerciseId,
          orderIndex: exercise.orderIndex,
          trackingMode: exercise.trackingMode,
          sourceWorkoutItemId: exercise.sourceWorkoutItemId,
          notes: exercise.notes,
        })
      }

      // 5. If linked to scheduled workout, mark it as started
      if (options.scheduledWorkoutId) {
        await ScheduledWorkoutRepository.updateStatus(
          options.scheduledWorkoutId,
          'in_progress'
        )
      }

      // 6. Fetch complete session with exercises and sets
      const completeSession = await SessionRepository.getById(session.id)

      logger.info('Session started successfully', { sessionId: session.id })

      return ok(completeSession!)

    } catch (error) {
      logger.error('Failed to start session', { error, userId, options })
      return err(new AppError('SESSION_START_FAILED', 'Failed to start workout session'))
    }
  }

  /**
   * Complete a workout session
   * 
   * This is where the magic happens:
   * - Calculate total volume
   * - Detect PRs
   * - Update streaks
   * - Trigger messaging
   */
  static async completeSession(
    userId: string,
    sessionId: string
  ): Promise<Result<void>> {
    try {
      logger.info('Completing workout session', { userId, sessionId })

      // 1. Validate session exists and belongs to user
      const session = await SessionRepository.getById(sessionId)
      if (!session || session.userId !== userId) {
        return err(new AppError('SESSION_NOT_FOUND', 'Workout session not found'))
      }

      if (session.completionStatus === 'completed') {
        return ok(undefined) // Idempotent: already completed
      }

      // 2. Calculate derived stats
      const stats = await StatsService.calculateSessionStats(session)

      // 3. Check for PRs (personal records)
      const prs = await StatsService.detectPRs(userId, session)

      // 4. Mark session as complete
      await SessionRepository.updateCompletionStatus(sessionId, 'completed', {
        endedAt: new Date(),
        totalVolume: stats.totalVolume,
        totalDuration: stats.durationMinutes,
      })

      // 5. Update linked scheduled workout if exists
      if (session.scheduledWorkoutId) {
        await ScheduledWorkoutRepository.updateStatus(
          session.scheduledWorkoutId,
          'completed',
          { completedSessionId: sessionId }
        )
      }

      // 6. Update user streaks (this might be in a separate StreakService)
      // await StreakService.updateWorkoutStreak(userId, session.startedAt)

      // 7. Trigger messaging system
      await MessagingService.triggerEvent('workout_complete', {
        userId,
        sessionId,
        stats,
        prs,
        timestamp: new Date(),
      })

      await AuditService.log({
        userId,
        action: 'session_complete',
        entityType: 'workout_session',
        entityId: sessionId,
        newValue: { volume: stats.totalVolume, durationMinutes: stats.durationMinutes },
      })

      logger.info('Session completed successfully', { 
        sessionId, 
        volume: stats.totalVolume,
        prs: prs.length 
      })

      return ok(undefined)

    } catch (error) {
      logger.error('Failed to complete session', { error, userId, sessionId })
      return err(new AppError('SESSION_COMPLETE_FAILED', 'Failed to complete workout'))
    }
  }

  /**
   * Abandon/cancel a session
   * User started but didn't finish
   */
  static async abandonSession(
    userId: string,
    sessionId: string
  ): Promise<Result<void>> {
    try {
      const session = await SessionRepository.getById(sessionId)
      if (!session || session.userId !== userId) {
        return err(new AppError('SESSION_NOT_FOUND', 'Session not found'))
      }

      await SessionRepository.updateCompletionStatus(sessionId, 'abandoned', {
        endedAt: new Date(),
      })

      // Update scheduled workout if linked
      if (session.scheduledWorkoutId) {
        await ScheduledWorkoutRepository.updateStatus(
          session.scheduledWorkoutId,
          'skipped'
        )
      }

      await AuditService.log({
        userId,
        action: 'session_abandon',
        entityType: 'workout_session',
        entityId: sessionId,
      })

      logger.info('Session abandoned', { sessionId })

      return ok(undefined)

    } catch (error) {
      logger.error('Failed to abandon session', { error })
      return err(new AppError('SESSION_ABANDON_FAILED', 'Failed to abandon session'))
    }
  }

  /**
   * Add an exercise to an in-progress session (e.g. freestyle add)
   */
  static async addExerciseToSession(
    userId: string,
    sessionId: string,
    payload: { exerciseId: string; trackingMode?: string }
  ): Promise<Result<SessionExercise>> {
    try {
      const session = await SessionRepository.getById(sessionId)
      if (!session || session.userId !== userId) {
        return err(new AppError('SESSION_NOT_FOUND', 'Workout session not found'))
      }
      if (session.status !== 'in_progress') {
        return err(new AppError('SESSION_NOT_ACTIVE', 'Can only add exercises to a session in progress'))
      }
      const nextOrderIndex =
        session.sessionExercises.length === 0
          ? 1
          : Math.max(...session.sessionExercises.map((e) => e.orderIndex)) + 1
      const trackingMode = (payload.trackingMode ?? 'strength_sets') as SessionExercise['trackingMode']
      const created = await SessionRepository.addExercise(sessionId, {
        exerciseId: payload.exerciseId,
        orderIndex: nextOrderIndex,
        trackingMode,
      })
      return ok(created)
    } catch (error) {
      logger.error('Failed to add exercise to session', { error })
      return err(new AppError('ADD_EXERCISE_FAILED', 'Failed to add exercise to session'))
    }
  }

  /**
   * Add a set to a session exercise
   */
  static async addSet(
    userId: string,
    sessionExerciseId: string,
    setData: Partial<Set>
  ): Promise<Result<Set>> {
    try {
      // Validate ownership
      const exercise = await SessionRepository.getSessionExercise(sessionExerciseId)
      if (!exercise || exercise.session.userId !== userId) {
        return err(new AppError('UNAUTHORIZED', 'Not authorized'))
      }

      // Get current max set index
      const maxIndex = await SessionRepository.getMaxSetIndex(sessionExerciseId)

      const set = await SessionRepository.addSet(sessionExerciseId, {
        ...setData,
        setIndex: maxIndex + 1,
        isCompleted: true,
      })

      return ok(set)

    } catch (error) {
      logger.error('Failed to add set', { error })
      return err(new AppError('ADD_SET_FAILED', 'Failed to add set'))
    }
  }

  /**
   * Update a set (edit reps, weight, etc.)
   */
  static async updateSet(
    userId: string,
    setId: string,
    updates: Partial<Set>
  ): Promise<Result<Set>> {
    try {
      // Validate ownership
      const set = await SessionRepository.getSet(setId)
      if (!set || set.sessionExercise.session.userId !== userId) {
        return err(new AppError('UNAUTHORIZED', 'Not authorized'))
      }

      const updated = await SessionRepository.updateSet(setId, updates)

      return ok(updated)

    } catch (error) {
      logger.error('Failed to update set', { error })
      return err(new AppError('UPDATE_SET_FAILED', 'Failed to update set'))
    }
  }

  /**
   * Private helper: Copy workout template to session exercises
   */
  private static async copyTemplateToSession(
    workout: any // Replace with proper Workout type
  ): Promise<Partial<SessionExercise>[]> {
    // This would copy workout_items to session_exercises structure
    // Including seeding empty sets based on planned structure
    const exercises: Partial<SessionExercise>[] = []

    for (const item of workout.items) {
      const exercise: Partial<SessionExercise> = {
        exerciseId: item.exerciseId,
        orderIndex: item.orderIndex,
        sourceWorkoutItemId: item.id,
        trackingMode: item.exercise?.defaultTrackingMode ?? 'strength_sets',
        sets: this.seedSetsFromTemplate(item) as SessionExercise['sets'],
      }
      exercises.push(exercise)
    }

    return exercises
  }

  /**
   * Private helper: Seed empty sets for an exercise
   */
  private static seedSetsFromTemplate(item: any): Partial<Set>[] {
    // If template has planned structure like "3x8", seed 3 empty sets
    const plannedSets = item.plannedStructure?.sets || 3
    
    return Array.from({ length: plannedSets }, (_, i) => ({
      setIndex: i + 1,
      setType: 'working',
      isCompleted: false,
      // Pre-fill with last session's weights if available
    }))
  }
}
