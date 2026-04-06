# Implementation status (snapshot)

Short, practical; update when modules shift.

## Stable

- Foundation: workout session lifecycle, core APIs, and user profile row (`user_profiles`) with typed dashboard preferences (when migrations applied).

## In progress

- **Dashboard Command Center**: widget layout, visibility, order—backend uses partial `PATCH /api/me` updates; verify save/hide in staging after migrations.
- **Design Phase System (DPS)**: Canonical phases **[`docs/DPS_PHASES.md`](./DPS_PHASES.md)** (DPS-0…8). Implementation notes: [`docs/DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) — layout shell, page header/section, `DpsContentState`; Dashboard + Workouts hub integrated.
- **Nutrition (DPS consumer)**: `/(dashboard)/nutrition` uses `DpsPageHeader`, `DpsPageSection`, `DpsContentState`, macro viz modes (rings/bars/cards) with `GET/PATCH /api/nutrition/preferences`, user defaults via `user_macro_targets` + `GET/PATCH /api/nutrition/macro-targets`, unified add/edit modal (`DpsSelectionList`, `dpsValidate`, `DpsPendingButton`), and `DELETE /api/nutrition/entries/[id]`. Apply migration `20250310000001_nutrition_user_settings.sql` for DB support. If the nutrition tables are not migrated, the page shows a **neutral staged** message (via `isLikelyNutritionInfrastructureError`) instead of a generic red error.

**Nutrition schema vs “food_logs” wording:** Specs that mention a generic `food_logs` / `food_log_items` flow map to the existing tables: `nutrition_days` (user + date), `meals` (breakfast/lunch/dinner/snack), `nutrition_entries` (logged lines with quantity and computed macros), with `foods` and `food_nutrients` as the catalog. The module is fully wired to this model; no parallel `food_logs` tables are introduced.

- **Calendar (DPS-4 consumer)**: `/(dashboard)/calendar` month view uses DPS-4 primitives (`DpsCalendarMonthNav`, `DpsCalendarMonthGrid`, `DpsDayDetailModal`) and `GET /api/calendar/month` to aggregate non-abandoned workout sessions per local day and nutrition days that have entries (with calorie sums). The **Agenda** tab remains on `GET /api/scheduling/schedule` for upcoming scheduled workouts.

- **Messaging (DPS-5 consumer)**: `/(dashboard)/messages` uses `DpsMessageList`, `DpsMessageCard`, `DpsMessageGroup`, `DpsNotificationBanner`, and `dpsToast`. Apply migration `20250326000001_message_feed_enhancements.sql` for feed columns on `message_events` and category toggles on `user_message_preferences`. `GET /api/messages` runs a lightweight sync from real session, nutrition, and calendar aggregation (deduped rows), then returns non-dismissed messages; `PATCH /api/messages/[id]` updates read/dismiss; preferences at `GET/PATCH /api/messages/preferences`. Template-driven `message_events` from workouts still merge into the feed.

- **AI Trainer (orchestration)**: `/(dashboard)/chat` uses DPS-6 chat primitives + `DpsAiInsightCard` / `DpsInlineRecommendation` for grounded empty states from `contextPreview`. Apply migration `20250326000002_ai_provider_preferences.sql` for `ai_provider_preferences` and `ai_request_logs` audit columns. APIs: `GET/PATCH /api/ai/preferences`, `GET /api/ai/conversations`, `GET /api/ai/conversations/[id]`, `GET/POST /api/ai/chat` (normalized `errorCode` includes `RATE_LIMITED`, `INVALID_PROVIDER_CONFIGURATION`, `PROVIDER_UNAVAILABLE`, `PROVIDER_RESPONSE_FAILED`). Session restore uses `localStorage` as a hint only; backend list is source of truth. Env: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, optional `OPENAI_MODEL`, `ANTHROPIC_MODEL`, `AI_DEFAULT_PROVIDER`, `AI_CHAT_RATE_LIMIT_PER_HOUR`.

## Built, needs QA

- **Workouts Engine**: hub, presets, builder, active session, history metrics via `StatsService`—run through manual QA before Nutrition.
- **Habits (base)**: create/delete + log/resist flows exist; needs archive, streak surfacing, and a fully guided daily check-in UX.
- **Progress (base)**: weight + notes + chart/history exist; needs unit preference awareness and expanded measurement/history UX.

## Next

- **Nutrition QA** — verify RLS + migrations in staging; optional UI for editing `user_macro_targets` without raw API.

## After that

- Calendar / Scheduling → Messaging → AI Trainer v1 → Polish/Scale (see [MODULE_EXECUTION.md](./MODULE_EXECUTION.md)).

## Blocked

- None documented here; if `dashboard_preferences` errors appear, see [MIGRATIONS_REQUIRED.md](./MIGRATIONS_REQUIRED.md).

## Superseded

- Older “phase” labels in historical docs are **not** the execution schedule; use module plans + this status note.
