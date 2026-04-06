import type { ExerciseSet } from '@/lib/domain/workout.types'

const NOT_IMPLEMENTED = 'SetRepository stub not implemented'

export const SetRepository = {
  async getById(_id: string): Promise<ExerciseSet | null> {
    return null
  },

  async add(
    _sessionExerciseId: string,
    _data: Partial<ExerciseSet> & { setIndex: number }
  ): Promise<ExerciseSet> {
    throw new Error(NOT_IMPLEMENTED)
  },

  async update(_id: string, _data: Partial<ExerciseSet>): Promise<ExerciseSet> {
    throw new Error(NOT_IMPLEMENTED)
  },

  async delete(_id: string): Promise<void> {
    throw new Error(NOT_IMPLEMENTED)
  },
}
