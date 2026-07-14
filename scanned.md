# React Doctor Scan — Findings & Changes

**Date:** 2026-07-14
**Tool:** [react-doctor](https://react.doctor) v0.7.7 (`bunx react-doctor -y --verbose`)
**Result:** 173 issues (16 errors, 157 warnings) → **127 issues (0 genuine errors remaining)**

---

## 1. What Was Fixed

### 1.1 Bugs — leaked timers & subscriptions (`effect-needs-cleanup`)

| File | Problem | Fix |
|---|---|---|
| `src/app/(private)/accept-invitation/[id]/page.tsx` | The 1.5s redirect `setTimeout` was never cleared; worse, if the component unmounted *before* the accept-invitation promise resolved, the `.then` would still set state and start a timer on an unmounted component | Added an `active` flag checked inside `.then`/`.catch` plus a cleanup that sets `active = false` and clears the timer |
| `src/modules/search/components/command-palette.tsx` | Focus `setTimeout` on palette open had no cleanup | Timer id captured, `clearTimeout` returned from the effect |
| `src/components/ui/carousel.tsx` | `reInit` listener never unsubscribed | File was verified unused and deleted instead (see §1.6) |

### 1.2 Bugs — ref mutated during render (`no-ref-current-in-render`)

`src/components/ai-elements/code-block.tsx` invalidated stale async syntax-highlighting tokens by writing to a ref during render. Rewritten to React's sanctioned **adjust-state-during-render** pattern (compare previous props held in state, reset derived state when they change). This also removed the `eslint-disable react-hooks/refs` comments that previously suppressed the same problem for ESLint.

### 1.3 Accessibility

- **`require-reduced-motion` (error):** added a global `@media (prefers-reduced-motion: reduce)` guard to `src/styles/globals.css` (WCAG 2.3.3). The unused `motion` animation library was also removed.
- **`click-events-have-key-events` / `no-static-element-interactions`:**
  - Notification items (`notification-bell.tsx`) — now `role="button"`, `tabIndex={0}`, Enter/Space activation, and a visible focus ring.
  - Task cards (`tasks-board.tsx`) — now `role="button"`, `tabIndex={0}`, `aria-label`, and **E** opens the edit dialog. Enter/Space were deliberately *not* used because dnd-kit's keyboard sensor reserves them for picking up and dropping cards.
- **`button-has-type`:** explicit `type="button"` on the command-palette result rows and the task complete-toggle so they can never accidentally submit a form.
- **`html-has-lang`:** `lang="en"` added to the `<html>` element in `src/app/global-error.tsx` (the root layout already had it).

### 1.4 Performance

- **`js-hoist-intl` / `no-locale-format-in-render`:** `Intl.NumberFormat` / `Intl.DateTimeFormat` instances were being constructed on every call — and these utils run in every table row and card. Now:
  - `format-compact-number.ts` — single hoisted formatter
  - `format-currency.ts` — formatter cache keyed by `currency:compact`
  - `format-date.ts` — formatter cache keyed by the options shape
- **`async-await-in-loop`:** the task-due cron scanner (`task-reminder.ts`) now sends its Inngest events with `Promise.all` instead of one-by-one. The automation runner's sequential action loop was left as-is deliberately — workflow actions run in order.

### 1.5 Modernization

- **`zod-v4-prefer-top-level-string-formats` (13 sites):** `z.string().email()` → `z.email()` and `z.string().url()` → `z.url()` across `env.ts`, the validation schemas, the register page, the members page, and the contact form.

### 1.6 Dead code removed (`unused-file`, `unused-dependency`)

Every deletion was verified with a repo-wide import search before removal.

**Files (10):**
`src/components/ui/accordion.tsx`, `alert.tsx`, `carousel.tsx`, `checkbox.tsx`, `empty.tsx`, `sonner.tsx`, `src/db/queries/index.ts`, `src/modules/ai/components/ai-action-button.tsx`, `src/modules/notifications/components/notification-list.tsx`, `src/utils/truncate.ts`

**Dependencies (10):**
`motion`, `@xyflow/react`, `@rive-app/react-webgl2`, `media-chrome`, `tokenlens`, `ansi-to-react`, `react-jsx-parser`, `client-only`, `@radix-ui/react-use-controllable-state`, and `embla-carousel-react` (freed by the carousel deletion). Less install time, smaller supply-chain surface.

---

## 2. Findings Reviewed and Rejected (false positives)

### 2.1 `no-impure-state-updater` — 11 "errors"

The rule flagged ordinary event handlers that call two state setters, e.g.:

```tsx
function handleEdit(company: Company) {
    setEditCompany(company)
    setFormOpen(true)
}
```

This is standard, documented React — these are event handlers, not updater callbacks passed to `setState`, so the "React may run updater functions more than once" concern does not apply. Each of the 11 sites was inspected individually (companies/contacts tables, deals kanban, tasks board, documents list, automation page, header, vendored ai-elements). **No changes made.**

### 2.2 `no-derived-useState` — document editor draft state

`document-detail.tsx` seeds `title`/`content` state from the loaded document. That's an intentional *draft buffer* for the editor (the `isDirty` comparison depends on it), not accidental derived state. **No change.**

### 2.3 `no-array-index-as-key` — skeleton placeholders

Both hits are static skeleton lists that never reorder; index keys are fine there. **No change.**

### 2.4 `only-export-components` — Next.js conventions

Flags pages exporting `metadata` alongside the component — that's the required Next.js App Router convention. **No change.**

---

## 3. Remaining Warnings (accepted, with reasons)

| Rule | Count | Why it's left |
|---|---|---|
| `unused-export` | ~78 | Mostly DB query helpers and shadcn variants exported for future use. Mass-deleting exports is a migration-scale change react-doctor itself advises against doing in one unreviewed pass. |
| `exhaustive-deps` | 9 | Pre-existing hook-dependency warnings; each needs individual judgment to avoid behavior changes. |
| `no-giant-component` | 1 | `pipeline-builder.tsx` — a worthwhile refactor, but purely structural; separate PR material. |
| `prefer-dynamic-import` | 3 | Suggests lazy-loading heavy components (charts/markdown); an optimization pass for later. |
| `js-combine-iterations` | 4 | Chained `.filter().map()` micro-optimizations on small arrays; readability wins. |
| `jsx-no-constructed-context-values` / `rerender-state-only-in-handlers` | 2 | Vendored ai-elements internals; low impact. |

---

## 4. Follow-up Worth a Decision

- **`src/server/ai/rag/retrieval.ts` is unreachable dead code**, but `PINECONE_API_KEY` is a *required* env var. If the RAG feature isn't planned soon, deleting the file, the `@pinecone-database/pinecone` dependency, and the env requirement would remove a whole deployment prerequisite. Left in place pending a product decision.
- React-doctor offers a project install (`npx react-doctor install --yes`) that adds a `doctor` script and CI integration — worth considering if you want this scan to run on every PR.

---

## 5. Verification

After all changes: `bun run typecheck` ✓ · `bun run lint` ✓ (0 errors) · `bun run build` ✓ · re-scan shows 127 issues with all remaining errors confirmed as false positives (§2.1).
