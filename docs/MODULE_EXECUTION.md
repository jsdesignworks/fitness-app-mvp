# Module execution order (canonical)

Use this document for **current implementation order**. Do **not** use historical phase numbers (e.g. “Phase 1/2/3…”) as the primary execution logic—they may conflict with reality.

## Status

| Module / workstream | Status |
|---------------------|--------|
| **Foundation** (auth, profile, workout session lifecycle) | Verified |
| **Dashboard Command Center** | In progress (preferences save/hide verified in code; confirm in your environment) |
| **Workouts Engine** | Built; requires QA/polish verification before depending on it |
| **Design Phase System (DPS)** | UI system: tokens, layouts, async patterns — **use for all new feature UI**; phase map **[`DPS_PHASES.md`](./DPS_PHASES.md)** (DPS-0…8); independent of feature modules |
| **Nutrition** | Next **feature** module (after DPS consumption is aligned) |
| **Calendar / Scheduling** | After Nutrition |
| **Messaging Engine** | Planned |
| **AI Trainer v1** | Planned |
| **Polish and Scale** | Planned |

## Source of truth

- **Broad roadmap** (if present in repo): useful for migration narrative and long-term structure.
- **Page/module plans** and **current app state**: source of truth for **what to build next** and in what order.
- **This file**: short internal snapshot for prompts and handoffs.

## Roles (project convention)

- **Claude**: design / UX guidance.
- **Cursor**: schema, services, APIs, persistence, validation, hardening, tests.
