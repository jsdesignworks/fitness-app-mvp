# Fitness App Architecture

## Overview

Next.js 15 App Router application with Supabase (PostgreSQL + Auth), domain-driven lib structure, and optional AI (Anthropic).

## High-Level Flow

- **App:** `src/app/` — routes (dashboard, auth, API).
- **Lib:** `src/lib/` — domain types, services, repositories, providers, middleware, utils.
- **Database:** Supabase migrations in `supabase/migrations/`.
- **API:** Thin route handlers in `src/app/api/` that call services and auth middleware.

## Key Directories

| Path | Purpose |
|------|--------|
| `src/app/(dashboard)/` | Authenticated dashboard pages (workouts, nutrition, etc.) |
| `src/app/(auth)/` | Login, signup, forgot/reset password, onboarding |
| `src/app/api/` | API routes (auth, workouts, nutrition, etc.) |
| `src/lib/domain/` | Type definitions and Zod validation per domain |
| `src/lib/services/` | Business logic (session, template, exercise, etc.) |
| `src/lib/repositories/` | Data access (Supabase queries) |
| `src/lib/providers/` | External integrations (AI, calendar, storage) |
| `src/lib/middleware/` | Auth, admin, rate-limit |

## Documentation

- API: see route files and inline JSDoc.
- Database: `supabase/migrations/` and `DATABASE.md` (if present).
- Deployment: `DEPLOYMENT.md` (if present).
