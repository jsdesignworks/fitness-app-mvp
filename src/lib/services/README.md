# Service Layer

This is **THE CORE** of your application. All business logic lives here.

## Why This Matters

When you eventually extract to a standalone API for mobile apps, you will **copy this entire directory** to your new backend. The service layer is framework-agnostic—it doesn't know if it's being called from Next.js API routes, FastAPI endpoints, or a background job.

## Design Principles

1. **Pure Business Logic:** No HTTP handling, no framework coupling
2. **Single Responsibility:** Each service handles one domain area
3. **Dependency Injection:** Services receive their dependencies (database, providers) as parameters
4. **Testable:** All functions can be unit tested without spinning up a server
5. **Stateless:** Services don't hold state between calls

## Service Structure

Each service follows this pattern:

```typescript
export class WorkoutService {
  /**
   * Start a new workout session
   * 
   * This function:
   * 1. Validates user has active license
   * 2. Fetches workout template if provided
   * 3. Creates session and pre-populates exercises
   * 4. Returns session with exercises ready to log
   */
  static async startSession(
    userId: string, 
    request: StartSessionRequest
  ): Promise<StartSessionResponse> {
    // Business logic here
  }
}
```

## Services

- `workout.service.ts` - Workout session lifecycle, PR detection, volume calculation
- `nutrition.service.ts` - Macro aggregation, meal templates, recipe math
- `scheduling.service.ts` - Recurrence expansion, conflict detection, calendar export
- `messaging.service.ts` - Trigger evaluation, template rendering, cooldown checks
- `ai-trainer.service.ts` - Prompt assembly, safety validation, recommendation generation

## How API Routes Use Services

```typescript
// app/api/workouts/start/route.ts
export async function POST(req: Request) {
  const { userId, workoutId } = await req.json()
  
  // Thin wrapper - just call the service
  const result = await WorkoutService.startSession(userId, { workoutId })
  
  return Response.json(result)
}
```

## How to Add New Features

1. Add types to `/lib/domain/[domain].types.ts`
2. Add service function to appropriate service
3. Create thin API route that calls the service
4. Test the service function directly

This pattern keeps your code clean, testable, and ready to migrate to a standalone API when the time comes.
