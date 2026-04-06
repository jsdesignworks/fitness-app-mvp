# Design Phase System (DPS)

**Purpose:** Reusable UI systems, layout, responsiveness, and async UI patterns. **Independent of feature modules** (Nutrition, Calendar, etc.). Feature work should **consume** these primitives instead of inventing parallel styling.

**Canonical phase map (DPS-0 … DPS-8):** **[`docs/DPS_PHASES.md`](./DPS_PHASES.md)** — use this when planning or when work drifts off-scope.

**Kinetic Energy (visual spec):** **[`docs/KINETIC_DESIGN_SYSTEM.md`](./KINETIC_DESIGN_SYSTEM.md)** — full palette, type, spacing, shadows, and component CSS patterns. DPS-0 maps these into `globals.css` + Tailwind + shadcn primitives.

**Stack:** Tailwind CSS, shadcn/ui ([`components.json`](../components.json)), CSS variables in [`src/app/globals.css`](../src/app/globals.css).

---

## Tokens

| Token / variable | Role |
|------------------|------|
| `--dps-page-gutter`, `--dps-section-gap`, `--dps-stack-gap` | Vertical rhythm and spacing |
| `--dps-content-max` (56rem), `--dps-content-wide-max` (80rem) | Default vs wide content width |
| `--dps-touch-min` | Minimum touch target height (44px) |
| Semantic colors | `--primary`, `--destructive`, `--muted-foreground`, etc. (light + `.dark`) |

**Utilities:** `dps-focus-ring` (keyboard focus), `dps-section-y`, `dps-stack-y` — see `@layer utilities` in `globals.css`.

**Tailwind:** Extended in [`tailwind.config.ts`](../tailwind.config.ts) — `max-w-content`, `max-w-content-wide`, `min-h-touch`, `spacing-dps-*`, screens `xs` (320px) and `3xl` (1440px).

**Rule:** Prefer tokens and these utilities over arbitrary one-off pixel values for repeated patterns.

**Vertical rhythm rule:** inside a parent using `dps-section-y` (`space-y-*`), avoid forcing child wrappers to `!mt-0` or negative top margins unless you explicitly reintroduce equivalent spacing elsewhere. This prevents dashboard/modules from visually "touching."

### Card internal spacing (shadcn `Card`)

[`src/components/ui/card.tsx`](../src/components/ui/card.tsx) applies a single responsive padding tier on `CardHeader`, `CardContent`, and `CardFooter`:

| Breakpoint | Padding |
|------------|---------|
| default (mobile) | `p-4` |
| `sm` | `p-5` |
| `md+` | `p-6` |

- **`CardContent`** uses the same tier with `pt-0` so the block sits flush under `CardHeader` (no double gap). If you render **`CardContent` without a `CardHeader`**, override top padding explicitly (e.g. `className="pt-4 sm:pt-5 md:pt-6"`) or use full-area padding where a flush seam is not needed.
- **Structure:** prefer **Header → Content → Footer (optional)**. Put actions in `CardFooter` when they anchor the card; keep body copy and lists in `CardContent`. Avoid one-off `p-*` on inner wrappers unless the layout truly needs it (dense tables, full-bleed media, `p-0` shells).

---

## Layout components

| Component | Path | Use |
|-----------|------|-----|
| `DpsPageShell` | [`src/components/dps/page-shell.tsx`](../src/components/dps/page-shell.tsx) | Wraps dashboard main content: responsive gutters, max-width (`default` \| `wide` \| `full`). Used in [`src/app/(dashboard)/layout.tsx`](../src/app/(dashboard)/layout.tsx). |
| `DpsPageHeader` | [`page-header.tsx`](../src/components/dps/page-header.tsx) | Page title + description + actions; stacks on mobile. |
| `DpsPageSection` | [`page-section.tsx`](../src/components/dps/page-section.tsx) | Section with optional `title` / `description` and `titleId` for `aria-labelledby`. |

### App shell (DPS-1)

- **Dashboard routes** under `(dashboard)` use **`DashboardShell`** ([`src/components/navigation/dashboard-shell.tsx`](../src/components/navigation/dashboard-shell.tsx)): **left sidebar** (`lg+`) with primary nav + theme; **below `lg`**, a **sticky top bar** + **Sheet** drawer (menu) for the same links and theme — no horizontal scrolling nav strip.
- **Main** scrolls beside the sidebar; **page content** stays inside **`DpsPageShell`** from the layout.
- **Rule:** Do **not** add an extra outer `max-w-*` wrapper on pages unless you intentionally need **`DpsPageShell variant="wide"`** (or `full`) — the shell already owns content width and gutters.

---

## Data visualization (DPS-2)

**Path:** [`src/components/dps/viz/`](../src/components/dps/viz/) — also re-exported from [`dps/index.ts`](../src/components/dps/index.ts).

| Component | Use |
|-----------|-----|
| `DpsStatCard` | Single metric (label, value, optional unit/icon) inside a bordered cell; parent owns responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, etc.). |
| `DpsSummaryBlock` | Optional title + stacked rows for narrative or list summaries without full `Card` chrome. |
| `DpsCircularProgress` | Ring for 0–100% (e.g. calories vs goal); `aria-*` on progressbar. |
| `DpsBarProgress` | Labeled horizontal bar; `max <= 0` shows empty track only. Colors use `chart-1`…`chart-5` tokens. |
| `DpsLineChartContainer` / `DpsBarChartContainer` | Client wrappers: `ResponsiveContainer` + `LineChart` / `BarChart` with shared margins. Pass Recharts children (`CartesianGrid`, axes, `Line`, `Bar`, `Tooltip`). |
| `DpsChartTooltipContent` | Styled tooltip body for Recharts `Tooltip` `content` prop. |
| `recharts-theme` | `DPS_CHART_*` constants, `dpsChartSeriesColor`, `DPS_CHART_COLORS` — align strokes with `--chart-1`…`--chart-5` in `globals.css`. |

**Display-only macro targets:** [`src/lib/nutrition/display-goals.ts`](../src/lib/nutrition/display-goals.ts) — UI placeholders until user goals exist in the API.

**Rule:** Do not duplicate Recharts setup (margins, colors, tooltip chrome) on feature pages; compose these primitives or extend in `dps/viz` first.

---

## Input and interaction (DPS-3)

**Path:** [`src/components/dps/interaction/`](../src/components/dps/interaction/) — re-exported from [`dps/index.ts`](../src/components/dps/index.ts).

### Locked foundation (Nutrition onward)

**DPS-3 is infrastructure, not a living redesign target** during feature work. New modules **consume** these primitives; they do **not** add parallel form/modal/list patterns in feature folders. If something is missing, extend [`dps/interaction`](../src/components/dps/interaction/) first (or document a one-off exception in [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)).

### Client validation (Zod)

- **Helper:** [`validation.ts`](../src/components/dps/interaction/validation.ts) — `dpsValidate(schema, input)` returns `{ ok: true, data }` or `{ ok: false, formError?, fieldErrors }` (first Zod issue per top-level key). Use `zodIssuesToFieldErrors` if you need custom shaping.
- **Rule:** Define **Zod** schemas next to the feature (or in shared `lib` for cross-cutting shapes). Call `dpsValidate` before submit; map `fieldErrors` to `DpsFormField` `error` and use `DpsFormErrorSummary` / `formError` for non-field messages. **Server and service validation stay authoritative** — client validation is UX only (early feedback, fewer pointless requests).
- **Non-goal:** Mandating `react-hook-form` in this repo unless adopted explicitly later.

**Example (reference):** [`workouts/build/page.tsx`](../src/app/(dashboard)/workouts/build/page.tsx) — builder name + exercise count use `dpsValidate` with a small schema.

### `DpsSelectionList` contract

Use for searchable pickers, modal lists, and any “select from API results” UI. **Do not** fork new list + loading + empty + error chrome in feature code.

| Prop | Required | Notes |
|------|----------|--------|
| `items` | yes | `T[]` — any row type. |
| `keyExtractor` | yes | Stable string key per row. |
| `renderItem` | yes | `(item: T) => ReactNode` — row content. |
| `onSelectItem` | no | If set, rows render as full-width buttons; click selects `item`. Omit for display-only lists. |
| `isItemSelected` | no | Optional `(item) => boolean` for selected styling. |
| `loading` | no | Shows centered spinner; hides list. |
| `emptyMessage` | no | When not loading and `items.length === 0`. |
| `error` / `onRetry` | no | Error banner + optional retry. |
| `maxHeightClassName` / `className` / `listClassName` | no | Layout only. |

**Nutrition:** food search results should use `DpsSelectionList` (or an extension added under `dps/interaction`), not a one-off `<ul>`.

**Types:** `DpsSelectionListProps<T>` is exported from the DPS barrel.

### Modal sizing (`DpsModalContent`)

[`DpsModalContent`](../src/components/dps/interaction/dps-modal-content.tsx) adds viewport margin, max height, and scroll; **`size`** picks width tier (default **`md`**):

| `size` | Approx. use |
|--------|-------------|
| `sm` | Confirmations, tiny forms (e.g. habits, [`ConfirmationDialog`](../src/components/common/confirmation-dialog.tsx)). |
| `md` | Default dialogs, simple lists (e.g. template picker). |
| `lg` | Data-heavy pickers (exercise/food search, presets with descriptions). |

Shared classes: `dpsModalContentBaseClassName`; legacy `DPS_MODAL_CONTENT_CLASSNAME` = base + `md` width.

### Pending / disabled pattern

- **Primary submit:** Prefer [`DpsPendingButton`](../src/components/dps/interaction/dps-pending-button.tsx) — `pending`, `pendingLabel`, `disabled`, `aria-busy` while pending.
- **Manual pattern:** `Button` with `disabled={pending}`, label swap (`Saving…`), optional `aria-busy` on the control or a wrapping `role="status"`.
- **Inputs:** Disable fields that must not change mid-flight when it prevents double submit; not every field must disable — document per flow (critical path vs optimistic). Avoid silent double POSTs; prefer visible pending state.
- **Optimistic UI:** Out of scope for DPS-3 primitives; keep explicit loading/error semantics when adding optimism later.

### Interaction states (checklist)

Use tokens consistently: **hover** (muted/accent borders), **focus-visible** (ring accent + offset), **active** (pressed affordance where relevant), **disabled** (opacity + `pointer-events` / `cursor`).

| Control | Focus / interaction |
|---------|---------------------|
| [`Button`](../src/components/ui/button.tsx) | shadcn `focus-visible:ring-*` |
| [`Input`](../src/components/ui/input.tsx) | `focus-visible:ring-accent` + offset |
| [`SelectTrigger`](../src/components/ui/select.tsx) | `focus-visible:ring-accent` + offset (aligned with Input) |
| `DpsFilterChip` | `dps-focus-ring` + transition |
| [`Switch`](../src/components/ui/switch.tsx) | `focus-visible:ring-accent` + offset |
| Dialog close | Radix close button ring (accent) |

### Components (summary)

| Component | Use |
|-----------|-----|
| `DpsFormField` | Label + single control + optional `hint` / `error` + `aria-invalid` / `aria-describedby`; `size="dense"` for compact grids. |
| `DpsFormActions` | Responsive row for primary/secondary buttons at end of forms. |
| `DpsFormErrorSummary` | One form-level message (`role="alert"`). |
| `DpsPendingButton` | Submit button with pending spinner + `aria-busy`. |
| `DpsModalContent` | `DialogContent` + safe viewport + scroll + `size="sm" \| "md" \| "lg"`. |
| `DpsFilterChip` | Toolbar filter / toggle chip (`aria-pressed`). |
| `DpsSelectionList` | Selectable / display list + loading + empty + error. |
| `DpsToggleField` | Labeled row + `Switch`. |
| `DpsFieldGrid` | Responsive field columns (`1-sm2`, `1-sm2-md4`, `1-sm4`). |

**Base controls:** [`Input`](../src/components/ui/input.tsx), [`SearchInput`](../src/components/ui/search-input.tsx), [`Select`](../src/components/ui/select.tsx), [`Label`](../src/components/ui/label.tsx), [`Switch`](../src/components/ui/switch.tsx), [`Dialog`](../src/components/ui/dialog.tsx).

**Rules:** Prefer `DpsModalContent` over raw `DialogContent`. Use `DpsFormField` + `dpsValidate` for consistent validation UX; backend validation remains in services.

---

## Calendar / time UI (DPS-4)

**Path:** [`src/components/dps/calendar/`](../src/components/dps/calendar/) — re-exported from [`dps/index.ts`](../src/components/dps/index.ts).

Presentation-only primitives for month views and day affordances. **No scheduling logic, no API calls, no invented events** inside these components. Parents pass dates, selection handlers, and optional predicates (e.g. “has activity” for a dot).

| Component / util | Use |
|------------------|-----|
| `getMonthGrid` / `chunkWeeks` / `dateToYMDLocal` | Pure helpers for a Sunday-start month matrix and local `YYYY-MM-DD` strings. |
| `DpsCalendarDayCell` | Single day or padding cell: today, selected, disabled, optional activity dot (`--chart-2`); uses shared focus ring. |
| `DpsCalendarMonthGrid` | 7-column grid + weekday header row; `role="grid"` + `columnheader` / `row` / `gridcell`. Responsive gaps: `gap-px` → `sm:gap-0.5` → `md:gap-1`. |
| `DpsCalendarMonthNav` | Prev/next month + month label; optional **Today** button. |
| `DpsDayDetailModal` | `Dialog` + `DpsModalContent` shell for a future “day details” surface — placeholder body only. |

**Activity indicators:** The optional dot is **visual only** and driven by a parent callback (`hasActivity(ymd)`). Do not embed fake schedules or sample event lists in DPS-4.

**Keyboard:** Day buttons are focusable with visible `:focus-visible`. Full roving-tabindex / arrow-key navigation is a **future** hardening item (see DPS-8).

**QA:** Local-state demo at [`src/app/(dashboard)/design/dps-4/page.tsx`](../src/app/(dashboard)/design/dps-4/page.tsx) — breakpoint check at 320px / 768px / 1024px+. The [`calendar`](../src/app/(dashboard)/calendar/page.tsx) feature month view consumes these primitives with real data from [`GET /api/calendar/month`](../src/app/api/calendar/month/route.ts).

---

## Communication UI (DPS-5)

**Path:** [`src/components/dps/messaging/`](../src/components/dps/messaging/) — re-exported from [`dps/index.ts`](../src/components/dps/index.ts).

Reusable **presentation** for in-app messages, feeds, inline banners, and transient toasts. **No messaging backend, no automation, no API calls** inside these components. Parents supply copy and handlers; activity or notification **logic** lives in feature modules.

| Surface | When to use |
|---------|-------------|
| `DpsMessageCard` | Durable rows: inbox-style items with optional title, body, timestamp, tone (`info` \| `success` \| `warning` \| `error` \| `system`), read/highlight states, optional dismiss + CTAs. |
| `DpsMessageList` | Vertical feed with **loading → error (+ retry) → empty → children**, same rhythm as `DpsContentState`. Use `listRole` only when children are direct list rows (not nested grouped sections). |
| `DpsMessageGroup` | Section label + stacked children — **UI only**; no date/category logic (parent passes labels like “Today”). |
| `DpsNotificationBanner` | Inline full-width notice inside a page/section (not fixed). **Error** tone: `role="alert"`. Other tones: `role="status"` + `aria-live="polite"`. |
| `dpsToast` / toast variants | Transient feedback: use `dpsToast.success` / `warning` / `info` (wrappers around the app [`useToast`](../src/hooks/use-toast.ts) + [`Toaster`](../src/components/ui/toaster.tsx)). Extended variants live in [`toast.tsx`](../src/components/ui/toast.tsx) (`success`, `warning`, `info`); **one** global toaster — do not add a second library (e.g. Sonner) for the same job. |

**Activity / content rule:** Message bodies are **props**. Do not embed fake schedules, sample notifications, or AI text inside DPS-5 primitives.

**Default toast duration:** `DPS_TOAST_DEFAULT_DURATION_MS` (5s) in [`dps-toast-helpers.ts`](../src/components/dps/messaging/dps-toast-helpers.ts); override per call with `duration`.

**QA:** Local UI-only demo at [`src/app/(dashboard)/design/dps-5/page.tsx`](../src/app/(dashboard)/design/dps-5/page.tsx).

---

## AI Interface UI (DPS-6)

**Path:** [`src/components/dps/ai/`](../src/components/dps/ai/) — re-exported from [`dps/index.ts`](../src/components/dps/index.ts).

Presentation-only primitives for AI chat and AI insight/recommendation surfaces. **No AI calls** and **no backend logic** inside these components; parents drive state via props (e.g. `isSending`, `isLoading`) and provide copy/handlers.

| Component | Use |
|-----------|-----|
| `DpsChatContainer` | Scrollable chat region + input slot (sticky on mobile). |
| `DpsChatMessageBubble` | Role-based bubble (`user` vs `assistant`) with optional timestamp and loading indicator. |
| `DpsThinkingIndicator` | Animated dots used for assistant “thinking/typing”. |
| `DpsChatInputBar` | Input + send button; keyboard submit; mobile-safe sticky wrapper. |
| `DpsAiInsightCard` | Reusable card for short “AI insight” copy with optional CTA. |
| `DpsInlineRecommendation` | Small embedded recommendation block for inline notices. |

**Loading rule:** when a parent sets a bubble’s `isLoading` / assistant thinking state, render thinking UI only (no fabricated assistant text).

QA: Local demo/reuse via the `/(dashboard)/chat` AI Trainer page refactor (UI-only).

---

## Async / state patterns

| Component | Path | Use |
|-----------|------|-----|
| `DpsContentState` | [`content-state.tsx`](../src/components/dps/content-state.tsx) | **Loading → error (+ retry) → empty → children.** Use for **fetch** errors; keep **action** errors (e.g. POST) separate so a failed save does not replace the whole page. |
| `DpsLoadingState` | [`loading-state.tsx`](../src/components/dps/loading-state.tsx) | Accessible loading region (`role="status"`, `aria-busy`). |

**Shared primitives** (not duplicated):

- [`EmptyState`](../src/components/common/empty-state.tsx) — empty UI; `role="region"`.
- [`ErrorMessage`](../src/components/common/error-message.tsx) — `destructive` \| `warning`.
- [`LoadingSpinner`](../src/components/common/loading-spinner.tsx) — inline spinner with `aria-label`.

---

## Responsiveness

| Range | Target |
|-------|--------|
| 320px+ (`xs`) | Mobile; comfortable touch targets; **Sheet** menu for nav (no horizontal nav strip) |
| 768px+ (`md`) | Tablet; multi-column grids |
| 1024px+ (`lg`) | Desktop; dashboard 3-column widget grid |
| 1440px+ (`3xl`) | Wide; optional `DpsPageShell variant="wide"` for future dense layouts |

---

## Accessibility

- **Focus:** Interactive links and custom controls use `dps-focus-ring` where shadcn `Button` / `focus-visible` is not enough. Buttons use `focus-visible:ring` from shadcn.
- **Contrast:** Use semantic `text-foreground` / `text-muted-foreground` / `text-destructive` on `background` / `card` — avoid hardcoded grays outside tokens.
- **Alerts:** `ErrorMessage` uses `role="alert"`; loading regions use `role="status"` and `aria-live="polite"` where appropriate.

---

## Integration for feature modules

1. Wrap new dashboard routes under existing `(dashboard)` layout (already includes `DpsPageShell`).
2. Start with `DpsPageHeader` + `DpsPageSection` + `DpsContentState` for list/detail pages.
3. Reuse `EmptyState` / `ErrorMessage` / `Card` + `shadow-card` for cards; do not fork new empty/error components unless the pattern is genuinely new.
4. **Do not** add feature APIs or DB logic under DPS; UI-only wiring only.

**Barrel export:** [`src/components/dps/index.ts`](../src/components/dps/index.ts).

---

## References

- [MODULE_EXECUTION.md](./MODULE_EXECUTION.md) — DPS before Nutrition in the workstream order.
- [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) — current status snapshot.
