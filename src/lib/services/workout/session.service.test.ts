import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'

vi.mock('@/lib/repositories/workout/session.repository', () => ({
  SessionRepository: {
    getActiveSession: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    addExercise: vi.fn(),
    updateCompletionStatus: vi.fn(),
  },
}))

vi.mock('@/lib/repositories/workout/workout.repository', () => ({
  WorkoutRepository: {
    getById: vi.fn(),
  },
}))

vi.mock('@/lib/repositories/workout/exercise.repository', () => ({
  ExerciseRepository: {
    findFirstByExactName: vi.fn(),
  },
}))

vi.mock('@/lib/repositories/scheduling/scheduled-workout.repository', () => ({
  ScheduledWorkoutRepository: {
    updateStatus: vi.fn(),
  },
}))

vi.mock('@/lib/services/messaging/messaging.service', () => ({
  MessagingService: { triggerEvent: vi.fn().mockResolvedValue({ success: true, data: null }) },
}))

vi.mock('@/lib/services/workout/stats.service', () => ({
  StatsService: {
    calculateSessionStats: vi.fn().mockResolvedValue({ totalVolume: 1000, durationMinutes: 45 }),
    detectPRs: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('@/lib/services/audit/audit.service', () => ({
  AuditService: { log: vi.fn().mockResolvedValue(undefined) },
}))

vi.mock('@/lib/utils/logger', () => ({ logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn() } }))

import { SessionRepository } from '@/lib/repositories/workout/session.repository'
import { WorkoutRepository } from '@/lib/repositories/workout/workout.repository'
import { ScheduledWorkoutRepository } from '@/lib/repositories/scheduling/scheduled-workout.repository'

let WorkoutSessionService: typeof import('./session.service').WorkoutSessionService

const userId = 'user-1'
const sessionId = 'session-1'
const otherUserId = 'user-2'

const mockSession = {
  id: sessionId,
  userId,
  workoutId: null,
  scheduledWorkoutId: null,
  startedAt: new Date(),
  timezone: 'UTC',
  completionStatus: 'in_progress',
  status: 'in_progress',
  sessionExercises: [],
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('WorkoutSessionService', () => {
  beforeAll(async () => {
    ;({ WorkoutSessionService } = await import('./session.service'))
  })

  beforeEach(() => {
    vi.mocked(SessionRepository.getActiveSession).mockResolvedValue(null)
    vi.mocked(SessionRepository.getById).mockResolvedValue(null)
    vi.mocked(SessionRepository.create).mockResolvedValue(mockSession as never)
    vi.mocked(SessionRepository.updateCompletionStatus).mockResolvedValue(undefined as never)
    vi.mocked(SessionRepository.addExercise).mockResolvedValue(undefined as never)
  })

  describe('startSession', () => {
    it('rejects when user already has an active session', async () => {
      vi.mocked(SessionRepository.getActiveSession).mockResolvedValue(mockSession as never)
      const result = await WorkoutSessionService.startSession(userId, { title: 'Freestyle' })
      expect(result.success).toBe(false)
      expect((result as unknown as { error: { code: string } }).error.code).toBe('ACTIVE_SESSION_EXISTS')
    })

    it('creates session when no active session and no template', async () => {
      const result = await WorkoutSessionService.startSession(userId, { title: 'Freestyle' })
      expect(result.success).toBe(true)
      expect(SessionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          title: 'Freestyle',
          completionStatus: 'in_progress',
        })
      )
    })

    it('rejects when workout template not found', async () => {
      vi.mocked(WorkoutRepository.getById).mockResolvedValue(null)
      const result = await WorkoutSessionService.startSession(userId, { workoutId: 'w1' })
      expect(result.success).toBe(false)
      expect((result as unknown as { error: { code: string } }).error.code).toBe('WORKOUT_NOT_FOUND')
    })
  })

  describe('completeSession', () => {
    it('rejects when session belongs to another user', async () => {
      vi.mocked(SessionRepository.getById).mockResolvedValue({
        ...mockSession,
        userId: otherUserId,
      } as never)
      const result = await WorkoutSessionService.completeSession(userId, sessionId)
      expect(result.success).toBe(false)
      expect((result as unknown as { error: { code: string } }).error.code).toBe('SESSION_NOT_FOUND')
    })

    it('returns success when session already completed (idempotent)', async () => {
      vi.mocked(SessionRepository.getById).mockResolvedValue({
        ...mockSession,
        completionStatus: 'completed',
      } as never)
      const result = await WorkoutSessionService.completeSession(userId, sessionId)
      expect(result.success).toBe(true)
      expect(SessionRepository.updateCompletionStatus).not.toHaveBeenCalled()
    })

    it('completes session and updates status when valid', async () => {
      vi.mocked(SessionRepository.getById).mockResolvedValue(mockSession as never)
      const result = await WorkoutSessionService.completeSession(userId, sessionId)
      expect(result.success).toBe(true)
      expect(SessionRepository.updateCompletionStatus).toHaveBeenCalledWith(
        sessionId,
        'completed',
        expect.any(Object)
      )
    })
  })

  describe('abandonSession', () => {
    it('rejects when session belongs to another user', async () => {
      vi.mocked(SessionRepository.getById).mockResolvedValue({
        ...mockSession,
        userId: otherUserId,
      } as never)
      const result = await WorkoutSessionService.abandonSession(userId, sessionId)
      expect(result.success).toBe(false)
      expect((result as unknown as { error: { code: string } }).error.code).toBe('SESSION_NOT_FOUND')
    })

    it('updates status to abandoned when valid', async () => {
      vi.mocked(SessionRepository.getById).mockResolvedValue(mockSession as never)
      const result = await WorkoutSessionService.abandonSession(userId, sessionId)
      expect(result.success).toBe(true)
      expect(SessionRepository.updateCompletionStatus).toHaveBeenCalledWith(
        sessionId,
        'abandoned',
        expect.any(Object)
      )
    })

    it('updates linked scheduled workout to skipped when present', async () => {
      const scheduledId = 'sched-1'
      vi.mocked(SessionRepository.getById).mockResolvedValue({
        ...mockSession,
        scheduledWorkoutId: scheduledId,
      } as never)
      await WorkoutSessionService.abandonSession(userId, sessionId)
      expect(ScheduledWorkoutRepository.updateStatus).toHaveBeenCalledWith(scheduledId, 'skipped')
    })
  })
})
