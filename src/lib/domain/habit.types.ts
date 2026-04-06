export type HabitType = 'good' | 'bad'
export type HabitLogKind = 'logged' | 'resisted'

export type Habit = {
  id: string
  userId: string
  name: string
  type: HabitType
  createdAt: Date
  updatedAt: Date
}

export type HabitLog = {
  id: string
  habitId: string
  userId: string
  loggedAt: string // YYYY-MM-DD
  kind: HabitLogKind
  createdAt: Date
}

export type CreateHabitData = {
  name: string
  type: HabitType
}

export type CreateHabitLogData = {
  habitId: string
  loggedAt: string // YYYY-MM-DD
  kind: HabitLogKind
}
