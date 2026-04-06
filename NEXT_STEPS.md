# Next Steps: Your Implementation Roadmap

You now have a complete architectural foundation. Here's exactly what to build next, in order.

## ✅ What You Have Right Now

### Architecture & Types
- Complete domain types (workout, nutrition, scheduling, messaging, AI)
- Service layer structure with provider abstraction
- AI provider implementation (Claude) with safety guardrails
- Database schema (workout system complete)
- Project structure optimized for future API extraction

### Documentation
- Complete setup guide
- Project structure documentation
- Service layer best practices
- Clear migration path to standalone API

## 🚀 Phase 1: Foundation (Week 1-2)

### Step 1: Initialize Project

```bash
cd fitness-app-mvp
npm install
cp .env.example .env.local
# Edit .env.local with your keys
```

### Step 2: Configure Next.js

Create these files:

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      enabled: true,
    },
  },
}
module.exports = nextConfig

// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### Step 3: Set Up Supabase

```bash
# Initialize Supabase
supabase init

# Start local Supabase
supabase start

# Run migrations
supabase db push
```

Create `lib/db/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Step 4: Set Up shadcn/ui

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input label dialog toast
```

## 🏋️ Phase 2: Core Workout System (Week 3-4)

### Priority Order:

**1. Implement WorkoutService**

File: `lib/services/workout.service.ts`

Functions to implement:
- `startSession(userId, request)` - Start a new workout
- `logSet(sessionExerciseId, setData)` - Log a set
- `completeSession(sessionId)` - Finish workout, calculate metrics
- `getSessionHistory(userId, limit)` - View past workouts

**2. Create Database Query Layer**

File: `lib/db/workouts.ts`

```typescript
export async function getExercises(filters?: {
  category?: string
  search?: string
}) {
  // Implementation
}

export async function createWorkoutSession(data: any) {
  // Implementation
}

export async function getWorkoutSession(sessionId: string) {
  // Implementation
}
```

**3. Create API Routes**

```
app/api/
├── workouts/
│   ├── start/route.ts       - POST: Start session
│   ├── exercises/route.ts   - GET: List exercises
│   └── sessions/
│       ├── [id]/route.ts    - GET: Session details
│       └── [id]/complete/route.ts - POST: Complete session
```

**4. Build Workout UI**

```
app/(dashboard)/workouts/
├── page.tsx                 - Workout library
├── session/[id]/page.tsx    - Active workout (THE KEY UI)
└── history/page.tsx         - Past workouts
```

**Focus on the active workout UI** - this is the most critical:
- Exercise list
- Set logging interface
- Timer
- Rest timer
- Quick weight/rep adjustments

## 🍎 Phase 3: Nutrition System (Week 5-6)

### Priority Order:

**1. Complete Nutrition Migrations**

Create `supabase/migrations/20250101000002_nutrition_schema.sql` with:
- foods table
- food_nutrients table
- units table
- food_portion_options table
- nutrition_days table
- meals table
- nutrition_entries table

**2. Implement NutritionService**

File: `lib/services/nutrition.service.ts`

Functions:
- `searchFoods(query, filters)` - Search food database
- `logEntry(mealId, entryData)` - Log food/recipe
- `getDailySummary(userId, date)` - Calculate macro totals
- `createRecipe(userId, recipeData)` - Create custom recipe

**3. Build Nutrition UI**

```
app/(dashboard)/nutrition/
├── page.tsx         - Daily log (main view)
├── foods/page.tsx   - Food search
└── recipes/page.tsx - Recipe manager
```

Key features:
- Quick add meals
- Macro chart (visual progress toward targets)
- Food search with barcode support (future)

## 📅 Phase 4: Scheduling (Week 7-8)

**1. Create Scheduling Migrations**

File: `supabase/migrations/20250101000003_scheduling_schema.sql`

**2. Implement SchedulingService**

File: `lib/services/scheduling.service.ts`

Functions:
- `createScheduledWorkout(userId, data)` - Schedule a workout
- `expandRecurrence(rrule, startDate, endDate)` - Generate instances
- `markComplete(scheduledWorkoutId, sessionId)` - Link to actual session
- `exportICS(userId, startDate, endDate)` - Generate calendar file

**3. Build Calendar UI**

```
app/(dashboard)/calendar/page.tsx
```

Features:
- Week/month view
- Drag-to-reschedule
- One-click start workout from schedule
- Export to calendar

## 🤖 Phase 5: AI Integration (Week 9-10)

**You already have the foundation!** Just wire it up:

**1. Create API Route**

File: `app/api/ai/chat/route.ts`

```typescript
import { AITrainerService } from '@/lib/services/ai-trainer.service'

export async function POST(req: Request) {
  const { userId, message } = await req.json()
  const response = await AITrainerService.chat({ userId, message })
  return Response.json(response)
}
```

**2. Build Chat UI**

```
app/(dashboard)/chat/page.tsx
```

Features:
- Message history
- Streaming responses
- Context awareness (show recent workouts, nutrition)
- Quick actions (generate plan, swap exercise)

## 💬 Phase 6: Messaging System (Week 11-12)

**1. Create Messaging Migrations**

File: `supabase/migrations/20250101000004_messaging_schema.sql`

**2. Implement MessagingService**

File: `lib/services/messaging.service.ts`

Functions:
- `evaluateTriggers(userId, triggerKey, metadata)` - Check if message should send
- `sendMessage(userId, templateId, context)` - Send notification
- `checkCooldown(userId, triggerKey)` - Prevent spam

**3. Create Edge Function for Background Messages**

File: `supabase/functions/streak-reminders/index.ts`

**4. Add In-App Notifications**

Component: `components/shared/notification-center.tsx`

## 🎨 Phase 7: Polish & Launch (Week 13-14)

**1. Theme Implementation**
- Light/dark/system mode
- Futuristic aesthetic with Tailwind

**2. Onboarding Flow**
```
app/(auth)/onboarding/page.tsx
```
- Goals selection
- Equipment availability
- Experience level
- Initial schedule

**3. Admin Interface**
```
app/(admin)/
├── users/page.tsx      - User management
├── licenses/page.tsx   - License management
└── moderation/page.tsx - Content moderation
```

**4. Testing**
- Test all service functions
- Test API routes
- User acceptance testing

**5. Deploy**
```bash
vercel deploy --prod
supabase db push --linked
```

## 🛠️ Development Tips

### Daily Workflow

1. **Morning**: Pick ONE feature from the priority list
2. **Start with types**: Define in `/lib/domain/`
3. **Implement service**: Add to `/lib/services/`
4. **Create API route**: Thin wrapper in `/app/api/`
5. **Build UI**: Component in `/app/(dashboard)/`
6. **Test**: Verify end-to-end
7. **Commit**: One feature per commit

### Testing as You Go

```bash
# Test service directly (no HTTP needed)
import { WorkoutService } from '@/lib/services/workout.service'
const result = await WorkoutService.startSession('user-id', {...})
console.log(result)
```

### Common Pitfalls to Avoid

❌ **Don't:** Put business logic in API routes
✅ **Do:** Keep API routes as thin wrappers

❌ **Don't:** Couple to specific AI provider in services
✅ **Do:** Use provider abstraction

❌ **Don't:** Store computed values in database
✅ **Do:** Calculate on-demand or use materialized views

❌ **Don't:** Skip RLS policies
✅ **Do:** Lock down every table with proper policies

## 📊 Success Metrics for MVP

You're ready to launch when:
- ✅ User can log a complete workout
- ✅ User can track daily nutrition
- ✅ User can schedule workouts
- ✅ AI chat responds helpfully and safely
- ✅ User receives motivational messages
- ✅ Light/dark theme works
- ✅ All data is properly secured (RLS)
- ✅ License validation works

## 🆘 When You Get Stuck

**Architecture Questions:**
- Re-read the service layer README
- Check if you're following the separation of concerns
- Ask: "Would this still work if I moved to FastAPI tomorrow?"

**Database Questions:**
- Review the data model documents
- Check RLS policies
- Use Supabase dashboard to inspect data

**AI Questions:**
- Test provider abstraction directly
- Check safety guardrails are working
- Verify API key and rate limits

## 🚀 Beyond MVP

Once MVP is solid:
- Add mobile apps (extract API layer)
- Implement advanced features (habits, goals)
- Add integrations (Apple Health, Fitbit)
- Build social features (share progress)
- Create workout programs marketplace

## The Bottom Line

You have **everything you need** to build this right. The architecture is sound, the patterns are battle-tested, and the path is clear.

**Start with Phase 1 today. Ship Phase 2 in two weeks. Launch MVP in 3 months.**

You got this. Now go build.
