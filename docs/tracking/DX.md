# DX (Developer Experience) Tracking

Goal: the codebase stays predictable — one way to do each thing, zero lint errors,
correct file names, comments only where the code can't speak for itself.

Status: ✅ done · 🔶 partial · ⬜ todo

## Done

| # | Item | Where | Notes |
|---|------|-------|-------|
| D1 | ✅ Lint actually runs + 0 errors | `eslint.config.mjs` | Config had a syntax error (bare `rules:` in array) so `bun run lint` crashed since it was added. Fixed; vendored `src/components/ai-elements/**` excluded (upstream code); generated `src/components/ui/**` downgrades `react-hooks/set-state-in-effect` to warn. All first-party errors fixed (was 54). |
| D2 | ✅ Role checks deduplicated | `trpc.ts`, `safe-action.ts` | Both had hardcoded `["owner","admin","manager"]` arrays; now delegate to `hasRole()` from `src/lib/roles.ts` — the single source of truth. |
| D3 | ✅ File names fixed | renames | `reddis.ts`→`redis.ts`, `Notification-bell.tsx`→`notification-bell.tsx`, `Notification-list.tsx`→`notification-list.tsx`, `command-plate.tsx`→`command-palette.tsx`, `compnay-details.tsx`→`company-details.tsx` (+ all imports). |
| D4 | ✅ `parseAsOptionalEnum` helper | `src/utils/params.ts` | Replaced 8× `.withDefault("" as any)`; also exports `PRIORITY_OPTIONS` / `TASK_STATUS_OPTIONS` so `<Select>` UIs and URL params share one list. |
| D5 | ✅ `setFilter` is generic & null-safe | `src/hooks/use-filters.ts` | Value type tied to key; `null` (clear param) allowed explicitly. |
| D6 | ✅ setState-in-effect fixes | header, command-palette, members page | Derived state instead of effect-synced state; "adjust state during render" pattern for query-driven resets. |
| D7 | ✅ Debug `console.log` removed | `deals-kanban.tsx` | |
| D8 | ✅ Typo fixes | `env.ts` ("misiing") | |

## Todo (ranked)

| # | Item | Notes |
|---|------|-------|
| D9 | ⬜ Clear remaining 27 lint **warnings** | Mostly unused vars, `exhaustive-deps` on form effects, `<img>` in vendored components. Don't let the count grow. |
| D10 | ⬜ `user-org.ts` → `use-org.ts` | Hook file misnamed (not a `use*` prefix match); check usages before renaming. |
| D11 | ⬜ Set up a test framework (vitest) | There are zero tests; start with `lib/roles.ts`, `rate-limit.ts`, query-layer org-scoping. |
| D12 | ⬜ Prettier check in CI + a GitHub Action for typecheck/lint | Nothing enforces the gates today. |
| D13 | ⬜ Configure better-auth client with custom role types | Removes the cast in settings/members invite (see comment there). |

## Rules for future code (enforced in CLAUDE.md)

1. `bun run typecheck` and `bun run lint` must both pass (0 errors) before every commit.
2. No `any` — type it, infer it, or (for upstream-typed edges) cast to the library's own parameter type with a comment.
3. No hardcoded role arrays — use `src/lib/roles.ts`.
4. Shared option lists / enums live in one place (`utils/params.ts` for filters) and are imported everywhere they render.
5. Vendored directories (`ai-elements`) are not edited for style — fix real bugs only, note upstream origin.
