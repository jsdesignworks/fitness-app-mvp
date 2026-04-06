export type DashboardPreferences = {
  widgetOrder: string[]
  widgetVisibility: Record<string, boolean>
}

export type UserProfile = {
  id: string
  userId: string
  onboardingCompletedAt: Date | null
  onboardingStep: string | null
  goal: string | null
  dashboardPreferences: DashboardPreferences | null
  weightUnit: 'kg' | 'lb'
  createdAt: Date
  updatedAt: Date
}

export type UpdateUserProfileData = Partial<{
  onboardingCompletedAt: Date | null
  onboardingStep: string | null
  goal: string | null
  dashboardPreferences: DashboardPreferences | null
  weightUnit: 'kg' | 'lb' | null
}>
