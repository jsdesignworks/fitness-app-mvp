import { z } from 'zod'

export const startSessionSchema = z.object({
  workoutId: z.string().uuid().optional(),
  scheduledWorkoutId: z.string().uuid().optional(),
  title: z.string().max(256).optional(),
})

export type StartSessionInput = z.infer<typeof startSessionSchema>
