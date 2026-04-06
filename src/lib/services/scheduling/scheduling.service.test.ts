import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SchedulingService } from './scheduling.service'

vi.mock('@/lib/repositories/scheduling/scheduled-workout.repository', () => ({
  ScheduledWorkoutRepository: {
    create: vi.fn(),
    getById: vi.fn(),
    listByUserInRange: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('@/lib/services/audit/audit.service', () => ({
  AuditService: { log: vi.fn().mockResolvedValue(undefined) },
}))

import { ScheduledWorkoutRepository } from '@/lib/repositories/scheduling/scheduled-workout.repository'

const userId = 'user-1'
const otherUserId = 'user-2'
const scheduledId = 'sched-1'
const startAt = new Date('2025-03-10T10:00:00Z')

const mockScheduled = {
  id: scheduledId,
  userId,
  startAt,
  endAt: null,
  timezone: 'UTC',
  status: 'scheduled',
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('SchedulingService', () => {
  beforeEach(() => {
    vi.mocked(ScheduledWorkoutRepository.create).mockResolvedValue(mockScheduled as never)
    vi.mocked(ScheduledWorkoutRepository.getById).mockResolvedValue(mockScheduled as never)
    vi.mocked(ScheduledWorkoutRepository.listByUserInRange).mockResolvedValue([])
    vi.mocked(ScheduledWorkoutRepository.update).mockResolvedValue({ ...mockScheduled } as never)
  })

  describe('createScheduledWorkout', () => {
    it('creates and returns scheduled workout for user', async () => {
      const result = await SchedulingService.createScheduledWorkout(userId, {
        startAt,
        timezone: 'UTC',
      })
      expect(result.userId).toBe(userId)
      expect(result.id).toBe(scheduledId)
      expect(ScheduledWorkoutRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          startAt,
          timezone: 'UTC',
        })
      )
    })

    it('throws when startAt is invalid', async () => {
      await expect(
        SchedulingService.createScheduledWorkout(userId, {
          startAt: new Date('invalid'),
          timezone: 'UTC',
        })
      ).rejects.toThrow('Invalid startAt')
    })
  })

  describe('getSchedule', () => {
    it('returns only current user schedule in range', async () => {
      vi.mocked(ScheduledWorkoutRepository.listByUserInRange).mockResolvedValue([
        mockScheduled as never,
      ])
      const start = new Date('2025-03-01')
      const end = new Date('2025-03-31')
      const { scheduledWorkouts } = await SchedulingService.getSchedule(userId, start, end)
      expect(scheduledWorkouts).toHaveLength(1)
      expect(ScheduledWorkoutRepository.listByUserInRange).toHaveBeenCalledWith(userId, start, end)
    })
  })

  describe('update', () => {
    it('rejects when scheduled workout belongs to another user', async () => {
      vi.mocked(ScheduledWorkoutRepository.getById).mockResolvedValue({
        ...mockScheduled,
        userId: otherUserId,
      } as never)
      await expect(
        SchedulingService.update(userId, scheduledId, { status: 'skipped' })
      ).rejects.toThrow('not found or access denied')
    })

    it('updates when user owns the scheduled workout', async () => {
      const updated = await SchedulingService.update(userId, scheduledId, { status: 'skipped' })
      expect(ScheduledWorkoutRepository.update).toHaveBeenCalledWith(
        scheduledId,
        expect.objectContaining({ status: 'skipped' })
      )
      expect(updated).toBeDefined()
    })
  })

  describe('markSkipped', () => {
    it('rejects when scheduled workout belongs to another user', async () => {
      vi.mocked(ScheduledWorkoutRepository.getById).mockResolvedValue({
        ...mockScheduled,
        userId: otherUserId,
      } as never)
      await expect(SchedulingService.markSkipped(userId, scheduledId)).rejects.toThrow(
        'not found or access denied'
      )
    })

    it('marks as skipped when user owns it', async () => {
      vi.mocked(ScheduledWorkoutRepository.update).mockResolvedValue({
        ...mockScheduled,
        status: 'skipped',
      } as never)
      const result = await SchedulingService.markSkipped(userId, scheduledId)
      expect(result.status).toBe('skipped')
      expect(ScheduledWorkoutRepository.update).toHaveBeenCalledWith(scheduledId, {
        status: 'skipped',
      })
    })
  })
})
