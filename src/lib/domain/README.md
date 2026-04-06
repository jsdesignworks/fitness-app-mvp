# Domain Layer

This directory contains the **shared type definitions and schemas** that represent your business domain. These types are used across:

- Frontend components
- API route handlers
- Service layer functions
- Database queries
- AI provider contracts

## Modules

- `workout.types.ts` - Workout, exercises, sessions, sets
- `nutrition.types.ts` - Foods, recipes, meals, nutrition entries
- `scheduling.types.ts` - Scheduled workouts, recurrence rules, calendar events
- `messaging.types.ts` - Message templates, triggers, user preferences
- `user.types.ts` - User profiles, licenses, roles, onboarding state
- `ai.types.ts` - AI provider interfaces, chat messages, recommendations

## Design Principles

1. **Single Source of Truth:** Every entity has one canonical type definition
2. **Immutable Contracts:** Once deployed, types should only be extended, not changed
3. **Validation Ready:** Use Zod schemas for runtime validation
4. **Database Agnostic:** Types represent the domain, not the database schema

## Example

```typescript
// workout.types.ts
export interface Exercise {
  id: string
  name: string
  category: ExerciseCategory
  defaultTrackingMode: TrackingMode
  metadata?: ExerciseMetadata
}

export type ExerciseCategory = 'strength' | 'cardio' | 'mobility' | 'flexibility'
export type TrackingMode = 'strength_sets' | 'cardio_time_distance' | 'bodyweight'
```
