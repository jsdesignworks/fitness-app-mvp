import { DashboardShell } from '@/components/navigation/dashboard-shell'
import { OnboardingGate } from '@/components/onboarding-gate'
import { DpsPageShell } from '@/components/dps/page-shell'
import { Toaster } from '@/components/ui/toaster'

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <OnboardingGate>
      <DashboardShell>
        <DpsPageShell>{children}</DpsPageShell>
      </DashboardShell>
      <Toaster />
    </OnboardingGate>
  )
}
