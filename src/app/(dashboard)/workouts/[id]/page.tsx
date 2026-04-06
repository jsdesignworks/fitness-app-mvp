import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Props = { params: Promise<{ id: string }> }

export default async function CompletedSessionPage({ params }: Props) {
  const { id } = await params
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Completed session</h1>
      <Card className="max-w-lg shadow-card rounded-xl">
        <CardHeader className="space-y-1.5">
          <CardTitle className="text-lg">Session summary</CardTitle>
          <CardDescription>Session ID: {id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            View details and history will be added in a later step.
          </p>
          <Button variant="outline" asChild>
            <Link href="/workouts">Back to Workouts</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
