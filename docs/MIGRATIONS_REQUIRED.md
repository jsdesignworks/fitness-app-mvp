# Required migrations (full checklist)

Apply the full Supabase migration set in environments where you deploy the app.

```bash
# Local (drops + recreates)
supabase db reset

# Or (incremental)
supabase migration up

# Linked remote
supabase db push
```

If you see API errors that mention missing tables/columns (e.g. `does not exist`, `42703`), the API will return a `503` with a pointer back here.

## Baseline user + dashboard prefs

- `20250306000001_user_profiles_schema.sql`
  - `user_profiles` base profile table (typed data + RLS)
- `20250326000004_user_weight_unit.sql`
  - `user_profiles.weight_unit` (preferred weight unit for Progress UI)
- `20250307000001_dashboard_preferences.sql`
  - adds `user_profiles.dashboard_preferences` (widget order + visibility)
- `20250309000001_seed_preset_exercises.sql`
  - seeds starter preset exercises used by workout presets/builders

## Core workouts + session lifecycle

- `20250101000001_workouts_schema.sql`
  - workout sessions, exercises, sets, and lifecycle fields

## Scheduling + agenda

- `20250223000001_scheduling_schema.sql`
  - scheduled workouts used by the Calendar/Agenda experiences

## Nutrition tracking (used by Dashboard, Calendar, Messaging, AI context)

- `20250222000001_nutrition_schema.sql`
  - `nutrition_days`, `meals`, `nutrition_entries`, and supporting nutrition tables
- `20250222000002_nutrition_seed_foods.sql`
  - seed foods catalog
- `20250310000001_nutrition_user_settings.sql`
  - user nutrition display + macro target settings

## Messaging (in-app feed powering reminders + AI context signals)

- `20250224000001_messaging_schema.sql`
  - `message_events` and related delivery tracking
- `20250326000001_message_feed_enhancements.sql`
  - feed-specific columns on `message_events` and preference flags on `user_message_preferences`

## Habits (create/edit/delete + log/resist)

- `20250306000002_habits_schema.sql`
  - `habits` + `habit_logs` with `good` vs `bad` and `logged` vs `resisted`
- `20250326000003_habits_archive_schema.sql`
  - adds `habits.archived_at` for soft-archive (retains `habit_logs` history)

## Progress (weight + measurement history)

- `20250306000003_progress_schema.sql`
  - `progress_entries` with unique `(user_id, date)`

## AI Trainer (chat sessions/messages + provider prefs + request audit)

- `20250225000001_ai_trainer_schema.sql`
  - `ai_chat_sessions`, `ai_chat_messages`, `ai_request_logs` base schema + RLS
- `20250326000002_ai_provider_preferences.sql`
  - `ai_provider_preferences` (default + fallback + allowFallback)
  - extends `ai_request_logs` with `provider`, `status`, `error_message`

## Audit logs

- `20250306000004_audit_log_schema.sql`
  - app audit/event logging used by Habits and other modules
