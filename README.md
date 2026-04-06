# Fitness App MVP

A comprehensive fitness tracking platform with AI-powered personal training, nutrition tracking, workout scheduling, and behavioral messaging.

## Architecture Decisions

- **Frontend:** Next.js 14+ App Router with Server Components
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **AI Provider:** Anthropic Claude (with provider abstraction)
- **Background Jobs:** Supabase Edge Functions
- **Deployment:** Vercel (frontend) + Supabase (backend)

## Core Principles

1. **Service Layer First:** All business logic lives in `/lib/services`
2. **Provider Abstraction:** AI, storage, and external services are swappable
3. **Type Safety:** Shared domain types across frontend and backend
4. **Future-Proof:** Ready to extract API layer when mobile apps arrive

## Project Structure

```
fitness-app-mvp/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication flows
│   ├── (dashboard)/         # Main app (workouts, nutrition, calendar)
│   ├── (admin)/             # Admin interface
│   └── api/                 # API route handlers (thin wrappers)
├── lib/
│   ├── services/            # Business logic (THE CORE)
│   ├── providers/           # External service abstractions
│   ├── db/                  # Database queries
│   ├── domain/              # Shared types and schemas
│   ├── middleware/          # Auth, licensing, rate limiting
│   └── utils/               # Helpers
├── supabase/
│   ├── migrations/          # Database schema
│   └── functions/           # Edge Functions (background jobs)
└── components/              # React components
```

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/MODULE_EXECUTION.md](docs/MODULE_EXECUTION.md) | Current module order (not historical “phases”) |
| [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md) | What’s stable, in progress, next, blocked |
| [docs/DPS_PHASES.md](docs/DPS_PHASES.md) | **DPS-0 … DPS-8** — canonical design phase map (guardrail) |
| [docs/KINETIC_DESIGN_SYSTEM.md](docs/KINETIC_DESIGN_SYSTEM.md) | **Kinetic Energy** — brand tokens, typography, component patterns |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | **DPS** — tokens, layouts, async UI patterns for feature modules |
| [docs/MIGRATIONS_REQUIRED.md](docs/MIGRATIONS_REQUIRED.md) | e.g. `dashboard_preferences` column |

## Getting Started

See SETUP.md for detailed setup instructions.

### Environment

Copy `.env.example` to `.env.local` and set:

- **Required for app:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Optional (server/admin):** `SUPABASE_SERVICE_ROLE_KEY`
- **Optional (AI features):** `ANTHROPIC_API_KEY`

For local Supabase: run `supabase start` then `supabase db reset` to apply migrations.

### Run the app

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). Use [http://localhost:3000/api/health](http://localhost:3000/api/health) to verify the API, and `POST /api/workouts/sessions` (with optional body `{ "title": "My Workout" }`) to start a session (stub repositories return in-memory data).
