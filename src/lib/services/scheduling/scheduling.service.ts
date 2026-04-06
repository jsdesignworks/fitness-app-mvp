import { ScheduledWorkoutRepository } from '@/lib/repositories/scheduling/scheduled-workout.repository'
import { AuditService } from '@/lib/services/audit/audit.service'
import type { ScheduledWorkout, ScheduledStatus } from '@/lib/domain/scheduling.types'

export type CreateScheduledWorkoutPayload = {
  workoutId?: string | null
  titleOverride?: string | null
  startAt: Date
  endAt?: Date | null
  timezone: string
  notes?: string | null
}

export const SchedulingService = {
  async createScheduledWorkout(
    userId: string,
    payload: CreateScheduledWorkoutPayload
  ): Promise<ScheduledWorkout> {
    if (!payload.startAt || Number.isNaN(payload.startAt.getTime())) {
      throw new Error('Invalid startAt')
    }
    const created = await ScheduledWorkoutRepository.create({
      userId,
      workoutId: payload.workoutId ?? null,
      titleOverride: payload.titleOverride ?? null,
      startAt: payload.startAt,
      endAt: payload.endAt ?? null,
      timezone: payload.timezone ?? 'UTC',
      notes: payload.notes ?? null,
      source: 'user_created',
    })
    await AuditService.log({
      userId,
      action: 'schedule_create',
      entityType: 'scheduled_workout',
      entityId: created.id,
      newValue: { startAt: payload.startAt.toISOString(), titleOverride: payload.titleOverride },
    })
    return created
  },

  async reschedule(
    userId: string,
    scheduledWorkoutId: string,
    newStartAt: Date,
    newEndAt?: Date | null
  ): Promise<ScheduledWorkout> {
    const existing = await ScheduledWorkoutRepository.getById(scheduledWorkoutId)
    if (!existing || existing.userId !== userId) {
      throw new Error('Scheduled workout not found or access denied')
    }
    return ScheduledWorkoutRepository.update(scheduledWorkoutId, {
      startAt: newStartAt,
      endAt: newEndAt ?? null,
      status: 'scheduled',
    })
  },

  async markSkipped(userId: string, scheduledWorkoutId: string): Promise<ScheduledWorkout> {
    const existing = await ScheduledWorkoutRepository.getById(scheduledWorkoutId)
    if (!existing || existing.userId !== userId) {
      throw new Error('Scheduled workout not found or access denied')
    }
    return ScheduledWorkoutRepository.update(scheduledWorkoutId, { status: 'skipped' })
  },

  async getSchedule(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ scheduledWorkouts: ScheduledWorkout[] }> {
    const scheduledWorkouts = await ScheduledWorkoutRepository.listByUserInRange(
      userId,
      startDate,
      endDate
    )
    return { scheduledWorkouts }
  },

  async update(
    userId: string,
    scheduledWorkoutId: string,
    updates: { notes?: string | null; startAt?: Date; endAt?: Date | null; status?: ScheduledStatus }
  ): Promise<ScheduledWorkout> {
    const existing = await ScheduledWorkoutRepository.getById(scheduledWorkoutId)
    if (!existing || existing.userId !== userId) {
      throw new Error('Scheduled workout not found or access denied')
    }
    const payload: Parameters<typeof ScheduledWorkoutRepository.update>[1] = {}
    if (updates.notes !== undefined) payload.notes = updates.notes
    if (updates.startAt !== undefined) payload.startAt = updates.startAt
    if (updates.endAt !== undefined) payload.endAt = updates.endAt
    if (updates.status !== undefined) payload.status = updates.status
    const updated = await ScheduledWorkoutRepository.update(scheduledWorkoutId, payload)
    await AuditService.log({
      userId,
      action: 'schedule_update',
      entityType: 'scheduled_workout',
      entityId: scheduledWorkoutId,
      newValue: { status: updates.status ?? updated.status },
    })
    return updated
  },
}
