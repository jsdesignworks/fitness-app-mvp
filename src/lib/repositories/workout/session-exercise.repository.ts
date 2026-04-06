import type { SessionExercise } from '@/lib/domain/workout.types'

const NOT_IMPLEMENTED = 'SessionExerciseRepository stub not implemented'

export const SessionExerciseRepository = {
  async getById(_id: string): Promise<SessionExercise | null> {
    return null
  },

  async add(_sessionId: string, _data: Partial<SessionExercise>): Promise<SessionExercise> {
    throw new Error(NOT_IMPLEMENTED)
  },

  async update(_id: string, _data: Partial<SessionExercise>): Promise<SessionExercise> {
    throw new Error(NOT_IMPLEMENTED)
  },
}
