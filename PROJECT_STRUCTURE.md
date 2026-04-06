# Complete Project Structure

This document shows the full architecture of your fitness app MVP.

## Directory Tree

```
fitness-app-mvp/
├── README.md
├── SETUP.md
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── .env.local
├── .env.example
│
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with theme provider
│   ├── page.tsx                 # Landing page
│   │
│   ├── (auth)/                  # Authentication routes (no navbar)
│   │   ├── layout.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── onboarding/
│   │       └── page.tsx
│   │
│   ├── (dashboard)/             # Main app (with sidebar/nav)
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── workouts/
│   │   │   ├── page.tsx         # Workout library
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx     # Workout details
│   │   │   ├── session/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx # Active workout session
│   │   │   └── history/
│   │   │       └── page.tsx     # Workout history
│   │   ├── nutrition/
│   │   │   ├── page.tsx         # Daily nutrition log
│   │   │   ├── foods/
│   │   │   │   └── page.tsx     # Food library
│   │   │   └── recipes/
│   │   │       └── page.tsx     # Recipe manager
│   │   ├── calendar/
│   │   │   └── page.tsx         # Workout schedule
│   │   ├── progress/
│   │   │   └── page.tsx         # Body progress tracking
│   │   ├── chat/
│   │   │   └── page.tsx         # AI trainer chat
│   │   └── settings/
│   │       └── page.tsx
│   │
│   ├── (admin)/                 # Admin interface
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── users/
│   │   │   └── page.tsx         # User management
│   │   ├── licenses/
│   │   │   └── page.tsx         # License management
│   │   └── moderation/
│   │       └── page.tsx
│   │
│   └── api/                     # API Routes (thin wrappers)
│       ├── workouts/
│       │   ├── start/
│       │   │   └── route.ts
│       │   ├── complete/
│       │   │   └── route.ts
│       │   └── [id]/
│       │       └── route.ts
│       ├── nutrition/
│       │   ├── log/
│       │   │   └── route.ts
│       │   ├── summary/
│       │   │   └── route.ts
│       │   └── search/
│       │       └── route.ts
│       ├── scheduling/
│       │   ├── create/
│       │   │   └── route.ts
│       │   ├── calendar/
│       │   │   └── route.ts
│       │   └── export/
│       │       └── route.ts
│       ├── messaging/
│       │   ├── preferences/
│       │   │   └── route.ts
│       │   └── history/
│       │       └── route.ts
│       └── ai/
│           ├── chat/
│           │   └── route.ts
│           └── recommendations/
│               └── route.ts
│
├── lib/                         # Core application logic
│   ├── domain/                  # Type definitions (SINGLE SOURCE OF TRUTH)
│   │   ├── README.md
│   │   ├── workout.types.ts     ✅ Created
│   │   ├── nutrition.types.ts   ✅ Created
│   │   ├── scheduling.types.ts  ✅ Created
│   │   ├── messaging.types.ts   ✅ Created
│   │   ├── ai.types.ts          ✅ Created
│   │   └── user.types.ts        # User, license, roles
│   │
│   ├── services/                # Business logic (THE CORE)
│   │   ├── README.md            ✅ Created
│   │   ├── workout.service.ts   # Session lifecycle, PR detection
│   │   ├── nutrition.service.ts # Macro aggregation, recipe math
│   │   ├── scheduling.service.ts # Recurrence, calendar export
│   │   ├── messaging.service.ts # Trigger evaluation, templates
│   │   └── ai-trainer.service.ts ✅ Created
│   │
│   ├── providers/               # External service abstractions
│   │   ├── ai.provider.ts       ✅ Created (Claude + OpenAI ready)
│   │   ├── storage.provider.ts  # Supabase Storage
│   │   └── calendar.provider.ts # Google Calendar integration
│   │
│   ├── db/                      # Database queries
│   │   ├── supabase.ts          # Client initialization
│   │   ├── workouts.ts          # Workout queries
│   │   ├── nutrition.ts         # Nutrition queries
│   │   ├── scheduling.ts        # Schedule queries
│   │   └── users.ts             # User queries
│   │
│   ├── middleware/              # Request middleware
│   │   ├── auth.ts              # Authentication
│   │   ├── license.ts           # License validation
│   │   ├── rate-limit.ts        # Rate limiting
│   │   └── admin.ts             # Admin role check
│   │
│   └── utils/                   # Utility functions
│       ├── date.ts              # Date/timezone helpers
│       ├── units.ts             # Unit conversions
│       ├── validation.ts        # Input validation
│       └── crypto.ts            # Encryption/hashing
│
├── components/                  # React components
│   ├── ui/                      # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...                  # All shadcn components
│   │
│   ├── workout/                 # Workout-specific components
│   │   ├── exercise-card.tsx
│   │   ├── set-logger.tsx
│   │   ├── workout-timer.tsx
│   │   └── session-summary.tsx
│   │
│   ├── nutrition/               # Nutrition components
│   │   ├── food-search.tsx
│   │   ├── macro-chart.tsx
│   │   ├── meal-card.tsx
│   │   └── nutrition-summary.tsx
│   │
│   ├── calendar/                # Calendar components
│   │   ├── week-view.tsx
│   │   ├── month-view.tsx
│   │   └── workout-card.tsx
│   │
│   ├── chat/                    # AI chat components
│   │   ├── chat-interface.tsx
│   │   ├── message-bubble.tsx
│   │   └── typing-indicator.tsx
│   │
│   └── shared/                  # Shared components
│       ├── navbar.tsx
│       ├── sidebar.tsx
│       ├── theme-toggle.tsx
│       └── loading-spinner.tsx
│
├── supabase/                    # Supabase configuration
│   ├── config.toml              # Local development config
│   │
│   ├── migrations/              # Database migrations
│   │   ├── 20250101000000_initial_schema.sql
│   │   ├── 20250101000001_workouts.sql
│   │   ├── 20250101000002_nutrition.sql
│   │   ├── 20250101000003_scheduling.sql
│   │   └── 20250101000004_messaging.sql
│   │
│   ├── seed.sql                 # Seed data for development
│   │
│   └── functions/               # Supabase Edge Functions
│       ├── daily-nutrition-update/
│       │   └── index.ts
│       ├── streak-reminders/
│       │   └── index.ts
│       └── calendar-sync/
│           └── index.ts
│
├── public/                      # Static assets
│   ├── images/
│   │   ├── exercises/           # Exercise demonstration images
│   │   └── branding/
│   └── icons/
│
└── tests/                       # Tests
    ├── unit/
    │   ├── services/
    │   └── utils/
    └── integration/
        └── api/
```

## Key Files to Create Next

### Configuration Files

1. **package.json** - Dependencies
2. **.env.example** - Environment variables template
3. **next.config.js** - Next.js configuration
4. **tailwind.config.ts** - Tailwind + shadcn setup
5. **tsconfig.json** - TypeScript configuration

### Core Implementation

1. **lib/db/supabase.ts** - Supabase client
2. **lib/middleware/auth.ts** - Authentication middleware
3. **lib/middleware/license.ts** - License validation
4. **lib/services/workout.service.ts** - Workout business logic
5. **lib/services/scheduling.service.ts** - Scheduling logic
6. **lib/services/messaging.service.ts** - Messaging logic

### Database Migrations

1. **Initial schema** - Users, licenses, roles
2. **Workouts schema** - All workout tables
3. **Nutrition schema** - All nutrition tables
4. **Scheduling schema** - Calendar and recurrence
5. **Messaging schema** - Templates and triggers

## Architecture Flow

```
User Request
    ↓
Next.js App Router (app/)
    ↓
API Route (app/api/) - thin wrapper
    ↓
Middleware (lib/middleware/) - auth, license, rate limit
    ↓
Service Layer (lib/services/) - business logic
    ↓
Provider Layer (lib/providers/) - external services
    ↓
Database Layer (lib/db/) - queries
    ↓
Supabase (PostgreSQL + Auth + Storage)
```

## Migration Path to Standalone API

When you add mobile apps:

1. Create new repository for API (FastAPI or NestJS)
2. Copy `/lib/services/` to new API
3. Copy `/lib/domain/` to new API
4. Implement HTTP handlers in new API that call services
5. Point Next.js frontend to new API URL
6. Keep `/app/api/` as thin proxy during transition
7. Eventually remove `/app/api/` completely

The service layer stays identical. Only the HTTP layer changes.
