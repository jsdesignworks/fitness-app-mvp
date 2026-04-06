# DPS phase map (canonical — guardrail)

**Use this document to stay aligned** when design or implementation drifts. It is **independent of feature modules** (Nutrition, Workouts, etc.). Feature UI should **slot into** these phases, not replace them ad hoc.

**Related:** [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) (tokens, components, integration), [MODULE_EXECUTION.md](./MODULE_EXECUTION.md) (module order).

---

## Phase index

| ID | Name | Scope |
|----|------|--------|
| **DPS-0** | Design Foundation (global system) | Tokens, color, typography, spacing, dark mode, semantic palette, global rules — **no feature-specific UI** |
| **DPS-1** | Core Layout & Navigation System | App shell, nav, page structure, responsive gutters, `DpsPageShell` / headers / sections |
| **DPS-2** | Data Visualization System | Metrics, charts, macros display — **presentation layer**; data comes from APIs later |
| **DPS-3** | Input & Interaction System | Forms, builders, modals, validation UX patterns — **not** backend validation |
| **DPS-4** | Scheduling & Time UI System | Calendar, timeline, time pickers — layout and interaction only |
| **DPS-5** | Communication UI System | Messages, notifications, in-app comms surfaces |
| **DPS-6** | AI Interface System | Chat UI, context cards, AI affordances |
| **DPS-7** | Behavioral UI System | Habits, progress, onboarding flows — **behavioral** UX patterns |
| **DPS-8** | Polish, Motion, Accessibility, Responsiveness Hardening | Motion tokens, reduced-motion, focus, contrast, breakpoint QA — **last layer** before treating UI as “done” |

---

## How to use (anti-drift)

1. **Name the phase** when planning or reviewing PRs (“this belongs in DPS-3”).
2. **Do not skip lower phases** for a higher-level concern (e.g. don’t build DPS-6 chat chrome without DPS-0/1 baseline).
3. **Feature modules consume DPS** — they do not redefine global tokens or layout from scratch.
4. If you **intentionally** break alignment, document the exception in the PR or a short note in [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md).

---

## Repo snapshot (may change)

| Phase | Approx. status in codebase |
|-------|----------------------------|
| DPS-0 | **Active (Kinetic)** — dark-first tokens, Bebas Neue + DM Sans, gradient primary CTA, cyan accent; see [`KINETIC_DESIGN_SYSTEM.md`](./KINETIC_DESIGN_SYSTEM.md) |
| DPS-1 | **Done** — Kinetic app shell: `DashboardShell` (`AppSidebar` + `MobileNav` Sheet), shared [`nav-config`](../src/components/navigation/nav-config.tsx) / [`MainNavLinks`](../src/components/navigation/main-nav-links.tsx), `DpsPageShell` unchanged; see [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) “App shell” |
| DPS-2 | **Done** — metrics + macro progress + Recharts shells in [`src/components/dps/viz/`](../src/components/dps/viz/); Dashboard macros widget, Nutrition daily totals, Progress line chart consume primitives; see [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) “Data visualization” |
| DPS-3 | **Done (locked for Nutrition)** — interaction layer in [`src/components/dps/interaction/`](../src/components/dps/interaction/): Zod client helper [`validation.ts`](../src/components/dps/interaction/validation.ts), `DpsSelectionList` contract, modal `size` tiers (`sm`/`md`/`lg`), `DpsPendingButton`, Select/Input-aligned focus; feature modules **consume** only — see [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) “Input and interaction” |
| DPS-4 | **Done (primitives)** — month grid, day cell, month nav, day-detail modal shell in [`src/components/dps/calendar/`](../src/components/dps/calendar/); demo-only [`design/dps-4`](../src/app/(dashboard)/design/dps-4/page.tsx); no backend; the [`calendar`](../src/app/(dashboard)/calendar/page.tsx) feature may adopt these primitives later — see [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) “Calendar / time UI” |
| DPS-5 | **Done (primitives)** — message cards, list, feed states, notification banner, `dpsToast` helpers in [`src/components/dps/messaging/`](../src/components/dps/messaging/); demo [`design/dps-5`](../src/app/(dashboard)/design/dps-5/page.tsx); no backend — see [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) “Communication UI” |
| DPS-6 | **Done (primitives)** — chat container/bubbles/input + insight/recommendation surfaces in [`src/components/dps/ai/`](../src/components/dps/ai/) — UI-only (no AI calls). |
| DPS-7 | Planned / ad hoc in feature pages — **formalize** as modules need them |
| DPS-8 | Ongoing — fold into releases before “stable” claims |

Update this table when a phase is formally completed or started.
