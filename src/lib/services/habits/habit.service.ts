import { HabitRepository, HabitLogRepository } from '@/lib/repositories/habits/habit.repository'
import { MessagingService } from '@/lib/services/messaging/messaging.service'
import { AuditService } from '@/lib/services/audit/audit.service'
import type { Habit, HabitLog, HabitLogKind } from '@/lib/domain/habit.types'

export const HabitService = {
  async listHabits(userId: string): Promise<Habit[]> {
    return HabitRepository.listByUser(userId)
  },

  async createHabit(userId: string, data: { name: string; type: 'good' | 'bad' }): Promise<Habit> {
    return HabitRepository.create(userId, data)
  },

  async updateHabit(
    userId: string,
    habitId: string,
    data: { name?: string; type?: 'good' | 'bad' }
  ): Promise<Habit> {
    return HabitRepository.update(userId, habitId, data)
  },

  async deleteHabit(userId: string, habitId: string): Promise<void> {
    return HabitRepository.delete(userId, habitId)
  },

  async listLogs(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<HabitLog[]> {
    return HabitLogRepository.listByUserAndRange(userId, startDate, endDate)
  },

  async logHabit(
    userId: string,
    data: { habitId: string; loggedAt: string; kind: HabitLogKind }
  ): Promise<HabitLog> {
    const habit = await HabitRepository.getById(data.habitId)
    if (!habit || habit.userId !== userId) {
      throw new Error('Habit not found')
    }
    const log = await HabitLogRepository.create(userId, data)
    const triggerKey = data.kind === 'logged' ? 'on_habit_logged' : 'on_habit_resisted'
    await MessagingService.triggerEvent(triggerKey, {
      userId,
      habitName: habit.name,
      habitType: habit.type,
      kind: data.kind,
      loggedAt: data.loggedAt,
      timestamp: new Date(),
    })
    await AuditService.log({
      userId,
      action: 'habit_log',
      entityType: 'habit_log',
      entityId: log.id,
      newValue: { habitId: data.habitId, kind: data.kind, loggedAt: data.loggedAt },
    })
    return log
  },
}
