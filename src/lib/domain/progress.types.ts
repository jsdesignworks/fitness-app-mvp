export type ProgressEntry = {
  id: string
  userId: string
  date: string // YYYY-MM-DD
  weightKg: number | null
  measurements: Record<string, number> // e.g. { waist_cm: 85, chest_cm: 100 }
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export type CreateProgressEntryData = {
  date: string
  weightKg?: number | null
  measurements?: Record<string, number>
  notes?: string | null
}

export type UpdateProgressEntryData = Partial<{
  weightKg: number | null
  measurements: Record<string, number>
  notes: string | null
}>
