/**
 * Volume and duration from logged sets; PR detection is a future enhancement.
 */
import type { WorkoutSession, PersonalRecord } from '@/lib/domain/workout.types'

export type SessionStatsResult = {
  totalVolume: number
  durationMinutes: number
  exerciseCount: number
  totalSets: number
}

export const StatsService = {
  /**
   * Sum reps × weight for completed working sets; duration from started/ended when both exist.
   */
  async calculateSessionStats(session: WorkoutSession): Promise<SessionStatsResult> {
    let totalVolume = 0
    let totalSets = 0
    for (const se of session.sessionExercises ?? []) {
      for (const set of se.sets ?? []) {
        if (!set.isCompleted) continue
        totalSets += 1
        const reps = set.reps
        const weight = set.weight
        if (reps != null && weight != null && Number.isFinite(reps) && Number.isFinite(weight)) {
          totalVolume += reps * weight
        }
      }
    }
    const exerciseCount = session.sessionExercises?.length ?? 0
    let durationMinutes = 0
    if (session.endedAt && session.startedAt) {
      const ms = session.endedAt.getTime() - session.startedAt.getTime()
      durationMinutes = Math.max(0, Math.round((ms / 60000) * 10) / 10)
    }
    return {
      totalVolume: Math.round(totalVolume * 100) / 100,
      durationMinutes,
      exerciseCount,
      totalSets,
    }
  },

  async detectPRs(_userId: string, _session: WorkoutSession): Promise<PersonalRecord[]> {
    return []
  },
}
