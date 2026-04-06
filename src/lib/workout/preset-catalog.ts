/**
 * Built-in workout presets resolved against seeded exercise names in the DB.
 * Future: AI trainer can recommend preset_slug here.
 */

export type PresetCatalogItem = {
  exerciseName: string
  orderIndex: number
  /** Shown in UI; sets are seeded when session is created from template flow — session page adds sets manually */
  plannedSets: number
  restSeconds?: number
}

export type WorkoutPresetDefinition = {
  slug: string
  title: string
  description: string
  items: PresetCatalogItem[]
}

export const WORKOUT_PRESETS: WorkoutPresetDefinition[] = [
  {
    slug: 'full_body_beginner',
    title: 'Full Body Beginner',
    description: 'Compound lifts covering the whole body.',
    items: [
      { exerciseName: 'Barbell Squat', orderIndex: 1, plannedSets: 3, restSeconds: 120 },
      { exerciseName: 'Barbell Bench Press', orderIndex: 2, plannedSets: 3, restSeconds: 120 },
      { exerciseName: 'Barbell Row', orderIndex: 3, plannedSets: 3, restSeconds: 120 },
      { exerciseName: 'Overhead Press', orderIndex: 4, plannedSets: 3, restSeconds: 90 },
      { exerciseName: 'Romanian Deadlift', orderIndex: 5, plannedSets: 3, restSeconds: 120 },
    ],
  },
  {
    slug: 'push',
    title: 'Push',
    description: 'Chest, shoulders, triceps.',
    items: [
      { exerciseName: 'Barbell Bench Press', orderIndex: 1, plannedSets: 4, restSeconds: 120 },
      { exerciseName: 'Overhead Press', orderIndex: 2, plannedSets: 3, restSeconds: 120 },
      { exerciseName: 'Cable Fly', orderIndex: 3, plannedSets: 3, restSeconds: 90 },
      { exerciseName: 'Lateral Raise', orderIndex: 4, plannedSets: 3, restSeconds: 60 },
      { exerciseName: 'Tricep Pushdown', orderIndex: 5, plannedSets: 3, restSeconds: 60 },
    ],
  },
  {
    slug: 'pull',
    title: 'Pull',
    description: 'Back and biceps.',
    items: [
      { exerciseName: 'Barbell Row', orderIndex: 1, plannedSets: 4, restSeconds: 120 },
      { exerciseName: 'Lat Pulldown', orderIndex: 2, plannedSets: 3, restSeconds: 90 },
      { exerciseName: 'Dumbbell Row', orderIndex: 3, plannedSets: 3, restSeconds: 90 },
      { exerciseName: 'Bicep Curl', orderIndex: 4, plannedSets: 3, restSeconds: 60 },
    ],
  },
  {
    slug: 'legs',
    title: 'Legs',
    description: 'Quads, hamstrings, glutes.',
    items: [
      { exerciseName: 'Barbell Squat', orderIndex: 1, plannedSets: 4, restSeconds: 150 },
      { exerciseName: 'Romanian Deadlift', orderIndex: 2, plannedSets: 3, restSeconds: 120 },
      { exerciseName: 'Leg Press', orderIndex: 3, plannedSets: 3, restSeconds: 120 },
      { exerciseName: 'Leg Curl', orderIndex: 4, plannedSets: 3, restSeconds: 90 },
      { exerciseName: 'Leg Extension', orderIndex: 5, plannedSets: 3, restSeconds: 90 },
    ],
  },
  {
    slug: 'upper_body',
    title: 'Upper Body',
    description: 'Mixed upper compound and accessories.',
    items: [
      { exerciseName: 'Barbell Bench Press', orderIndex: 1, plannedSets: 3, restSeconds: 120 },
      { exerciseName: 'Barbell Row', orderIndex: 2, plannedSets: 3, restSeconds: 120 },
      { exerciseName: 'Overhead Press', orderIndex: 3, plannedSets: 3, restSeconds: 90 },
      { exerciseName: 'Lat Pulldown', orderIndex: 4, plannedSets: 3, restSeconds: 90 },
    ],
  },
  {
    slug: 'lower_body',
    title: 'Lower Body',
    description: 'Squat pattern and posterior chain.',
    items: [
      { exerciseName: 'Barbell Squat', orderIndex: 1, plannedSets: 4, restSeconds: 150 },
      { exerciseName: 'Romanian Deadlift', orderIndex: 2, plannedSets: 3, restSeconds: 120 },
      { exerciseName: 'Walking Lunge', orderIndex: 3, plannedSets: 3, restSeconds: 90 },
      { exerciseName: 'Hip Thrust', orderIndex: 4, plannedSets: 3, restSeconds: 120 },
    ],
  },
  {
    slug: 'dumbbell_only',
    title: 'Dumbbell Only',
    description: 'Minimal equipment upper and lower.',
    items: [
      { exerciseName: 'Dumbbell Bench Press', orderIndex: 1, plannedSets: 3, restSeconds: 90 },
      { exerciseName: 'Dumbbell Row', orderIndex: 2, plannedSets: 3, restSeconds: 90 },
      { exerciseName: 'Walking Lunge', orderIndex: 3, plannedSets: 3, restSeconds: 90 },
      { exerciseName: 'Bicep Curl', orderIndex: 4, plannedSets: 3, restSeconds: 60 },
    ],
  },
  {
    slug: 'bodyweight_only',
    title: 'Bodyweight Only',
    description: 'No equipment required.',
    items: [
      { exerciseName: 'Push-up', orderIndex: 1, plannedSets: 3, restSeconds: 60 },
      { exerciseName: 'Pull-up', orderIndex: 2, plannedSets: 3, restSeconds: 90 },
      { exerciseName: 'Plank', orderIndex: 3, plannedSets: 3, restSeconds: 60 },
    ],
  },
]

export function getPresetBySlug(slug: string): WorkoutPresetDefinition | undefined {
  return WORKOUT_PRESETS.find((p) => p.slug === slug)
}
