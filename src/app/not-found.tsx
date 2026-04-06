import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 p-6">
      <h2 className="text-lg font-semibold text-foreground">404 – Page not found</h2>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        The page you’re looking for doesn’t exist or has been moved.
      </p>
      <Button asChild>
        <Link href="/">Go home</Link>
      </Button>
    </div>
  )
}
