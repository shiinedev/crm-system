# Codebase Review — CRM System

**Date:** 2026-07-12
**Scope:** Full review of the codebase for deploy-readiness, security, performance, and UI/UX.
**Verdict:** Solid architecture (tRPC + Drizzle + better-auth + org-scoped multi-tenancy is done right), but the app **does not build today**, several advertised features are dead code, and there are must-fix security/performance gaps before production.

---

## 1. Deploy Blockers (must fix before any deployment)

### 1.1 `bun run build` fails ❌
Production build fails with a TypeScript error:

```
./src/components/ai-elements/schema-display.tsx:110:34
Type error: Type '... | number | ...' is not assignable to type 'string | TrustedHTML'.
  dangerouslySetInnerHTML={{ __html: children ?? highlightedPath }}
```

**Fix:** coerce to string: `{ __html: String(children ?? highlightedPath) }` — or better, since this is a vendored ai-elements component, remove the unused ai-elements files entirely (see §3.6).

### 1.2 ESLint is completely broken ❌
`bun run lint` crashes with `SyntaxError: Unexpected token ':'`. In `eslint.config.mjs` the `rules:` block is a bare object property floating inside the array — invalid JavaScript:

```js
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([...]),
  rules: {                                    // ← syntax error
    "@typescript-eslint/no-empty-object-type": "error"
  }
]);
```

**Fix:** wrap it in a config object: `{ rules: { ... } }`.

### 1.3 No database migrations committed ❌
`drizzle.config.ts` points to `./src/db/migrations`, but that directory doesn't exist. There is no way to reproduce the schema on a fresh database except `db:push` (unsafe for production — no history, no rollback).

**Fix:** run `bun run db:generate`, commit the migration files, and use `db:migrate` in the deploy pipeline.

### 1.4 No `.env.example` ❌
Required env vars are only discoverable by reading `src/lib/env.ts`. Anyone deploying (including CI) has to reverse-engineer the configuration.

**Fix:** commit a `.env.example` with all keys (no values): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `PINECONE_API_KEY`, `PINECONE_INDEX`, `OPENROUTER_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — plus the missing Inngest keys (§1.5).

### 1.5 Inngest production keys are not in env validation ❌
`src/lib/env.ts` has no `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY`. In production, the `/api/webhooks/inngest` endpoint requires a signing key to verify requests — without it the endpoint won't work (and if signature verification were skipped, anyone could invoke your background functions).

### 1.6 No CI at all
No `.github/workflows`, no tests, no test runner configured. At minimum add a workflow that runs `typecheck`, `lint`, and `build` on PRs — items 1.1 and 1.2 would have been caught immediately.

---

## 2. Broken / Dead Features (built but not wired)

### 2.1 The entire background-job layer is dead code 🔴
`inngest.send()` is **never called anywhere in the codebase**. Consequences:

- **Automation workflows never run.** The workflow builder UI (`/automation`) saves workflows, but nothing emits `crm/automation.trigger`, so `automation-runner` never fires.
- **Lead scoring never runs.** `lead-scorer` listens for `crm/contact.created`, which is never sent from `contacts.actions.ts` / `contacts.router.ts`.
- **Task reminders never fire.** `crm/task.due` is never emitted (there's also no cron that scans for due tasks — the reminder function only reacts to an event nobody sends).

**Fix:** emit events from the mutation paths (e.g. after `createContact`, after `changeDealStage`), and convert `task-reminder` to a cron-triggered function that scans for tasks due in the next N minutes.

### 2.2 Google sign-in button that cannot work 🔴
`login/page.tsx` renders a "Continue with Google" button calling `signIn.social({ provider: "google" })`, but the `socialProviders` block in `src/server/auth/auth.ts` is **commented out**. Clicking the button fails at runtime.

**Fix:** either configure Google OAuth (uncomment + add env vars) or remove the button until it's ready. Same check applies to the register page.

### 2.3 No password reset / email flow 🟠
`emailAndPassword` is enabled with `requireEmailVerification: false` and **no email provider is configured anywhere**. There is no "forgot password" page and no `sendResetPassword` handler. A production SaaS where users can never recover their account is a support disaster.

**Fix:** integrate an email sender (Resend is the usual pairing), add `sendResetPassword` + verification emails, and a `/forgot-password` page.

### 2.4 Audit log schema exists but nothing writes to it 🟠
`audit.schema.ts` and `audit.queries.ts` exist, but no action, router, or job ever inserts an audit row. For a multi-tenant CRM with roles, an audit trail is usually a requirement — right now it's an empty table.

**Fix:** write audit entries in the mutation middlewares (safe-action / tRPC) or in each destructive action (delete, role change, org settings).

### 2.5 Empty stub files 🟡
These files are committed but completely empty (0 lines):

- `src/hooks/use-permissions.ts`
- `src/hooks/use-realtime-channel.ts`
- `src/hooks/user-org.ts`
- `src/stores/ai-chat.store.ts`
- `src/stores/command.store.ts`
- `src/stores/ui.store.ts`

Either implement them or delete them — empty modules that other devs might import cause confusing runtime errors.

### 2.6 Documents "upload" without storage 🟡
`documents` schema has `fileUrl` / `mimeType`, but there is no upload route and no storage integration (S3/UploadThing/Vercel Blob). Documents are effectively markdown notes only. Fine for now, but the schema advertises more than the app delivers — and when uploads land, they'll need content-type validation and size limits.

---

## 3. Security Findings

**What's already good:** org-scoping is enforced consistently — every query filters by `organizationId`, tRPC procedures layer auth → org → role correctly, `safe-action.ts` verifies real DB membership (not just the session claim), secrets are validated via `@t3-oss/env-nextjs`, no `.env` files are committed, and Zod validates all mutation inputs.

### 3.1 No rate limiting on the AI chat endpoint 🔴
`POST /api/ai/chat` streams LLM responses (with up to 6 tool-call steps hitting your DB per request) for any logged-in user with **no rate limit and no message-size validation**. Even on a free OpenRouter model, this is a cost/DoS hole once you attach a paid model — and `req.json()` accepts unbounded payloads.

**Fix:** you already have Upstash Redis — add `@upstash/ratelimit` (e.g. 20 req/min/user) to this route, cap `messages` array length and per-message size with a Zod schema before `convertToModelMessages`.

### 3.2 No security headers 🟠
`next.config.ts` is empty. No CSP, no HSTS, no `X-Frame-Options`, no `Referrer-Policy`.

**Fix (minimum viable):**

```ts
const nextConfig: NextConfig = {
  headers: async () => [{
    source: "/(.*)",
    headers: [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ],
  }],
}
```

### 3.3 No rate limiting on auth endpoints 🟠
better-auth ships a built-in rate limiter but it is not configured in `auth.ts`. Login/register are open to credential-stuffing.

**Fix:** enable `rateLimit` in the betterAuth config (it can use your Upstash Redis as secondary storage), and consider `advanced.ipAddress` config behind your proxy.

### 3.4 Automation workflow JSON is stored unvalidated 🟠
`workflowSchema` validates `trigger` / `conditions` / `actions` only as **strings**, but `automation-runner` does `JSON.parse(workflow.actions)` and trusts the shape (`action.config.userId`, etc.). Malformed JSON kills the whole run for every workflow after it; and a crafted `notify_user` action can send notifications to **any userId**, including users in other orgs (the `createNotification` call doesn't verify the target user belongs to `orgId`).

**Fix:** define real Zod schemas for trigger/conditions/actions, parse-and-validate at save time (`z.string().transform(JSON.parse).pipe(actionSchema)`), verify target users are org members, and wrap each workflow execution in try/catch so one bad workflow can't halt the rest.

### 3.5 `logger: console` on better-auth 🟡
`auth.ts` sets `logger: console`, which can write session/user details into production logs. Remove it or gate it to development.

### 3.6 ~90 vendored `ai-elements` components expand your attack/maintenance surface 🟡
`src/components/ai-elements/` contains dozens of unused components, several using `dangerouslySetInnerHTML` (one of which currently breaks the build, §1.1). Delete the ones you don't use — the AI chat panel only needs a handful.

### 3.7 External URLs rendered as links 🟡
`companies-table.tsx` renders `company.website` directly as `href`. A stored value of `javascript:alert(1)` becomes an XSS vector. `rel="noopener noreferrer"` is already there (good); also validate the URL scheme (`http(s)://` only) in `createCompanySchema`.

---

## 4. Performance Findings

### 4.1 No pagination anywhere 🔴
`companies.list`, `contacts.list`, `deals.list`, `tasks.list` all return **every row in the org**, with `SELECT *` (including heavy columns like `aiSummary`, `aiInsights`, `notes`, `metadata`). Tables then filter **client-side**. This is fine at 50 rows and unusable at 5,000.

**Fix:** cursor-paginate the list procedures (`limit` + `cursor` on `createdAt/id`), select only the columns the table renders, move filtering into the query (you already have `useFilters` URL state to drive it), and use `useInfiniteQuery`.

### 4.2 The AI tools have the same problem 🟠
`listCompanies` / `listContacts` / `listDeals` tools fetch all rows then `.map()`. `listOpenTasks` fetches **all tasks** then filters in JS. Add `limit` params and status filters at the SQL level — this also keeps LLM context small.

### 4.3 Dashboard summary runs 4 sequential queries 🟡
`getDashboardSummary` awaits 4 counts one-by-one. Wrap in `Promise.all` (or one SQL statement with subselects). Also: `cacheKeys.dashboardSummary` exists but the dashboard never uses the Redis cache — wire it up (60s TTL is plenty).

### 4.4 `ILIKE '%q%'` search without trigram index 🟡
All search queries use leading-wildcard `ilike`, which can't use B-tree indexes → sequential scans. Add `pg_trgm` GIN indexes on searched columns (`companies.name`, contact names/emails, `deals.title`), or accept it until row counts grow.

### 4.5 Missing composite/filter indexes 🟡
Common access path is `(organization_id, deleted_at)` + sort on `created_at`. Current indexes are single-column on `organization_id`. Add composite indexes like `(organization_id, created_at)` where lists sort by recency, and on `deals (organization_id, stage_id)` for the kanban.

### 4.6 `console.log` in render paths 🟡
`companies-table.tsx:49`, `deals-kanban.tsx:29,36` log full datasets on every render. Remove them, and add `compiler: { removeConsole: { exclude: ["error", "warn"] } }` to `next.config.ts` as a safety net.

### 4.7 Notification badge never shows 🟡 (also a UX bug)
`NotificationsBell` fetches with `{ enabled: open }`, and the unread count is derived from that query — so the badge is always empty until the user opens the popover. Fetch the unread count unconditionally (there's already a `notifications.unread` procedure) with a `refetchInterval` (e.g. 60s), and keep the full list gated on `open`.

### 4.8 Font loading 🟡
Three Google font families are loaded (`Geist`, `Geist Mono`, `Lora`) and the `<html>` element applies `font-serif` globally. If Lora isn't a deliberate brand choice, drop it — fonts are render-blocking weight.

---

## 5. UI / UX Findings

**What's already good:** consistent shadcn/ui usage, dark mode via `next-themes`, empty states with calls-to-action, loading skeletons on tables, URL-driven filters (`nuqs`) so views are shareable, command palette (⌘K) with global search.

### 5.1 Destructive actions have no confirmation 🔴
"Delete" on companies (and deals) fires the soft-delete mutation **immediately from a dropdown item**. One mis-click destroys data with no undo affordance. Add an `AlertDialog` confirm (or a toast with an Undo action, since deletes are soft).

### 5.2 No global metadata / SEO shell 🟠
`src/app/layout.tsx` exports **no `metadata`** — no default title template, description, favicon config, or Open Graph. Add:

```ts
export const metadata: Metadata = {
  title: { default: "CRM", template: "%s · CRM" },
  description: "...",
}
```

### 5.3 No route-level `loading.tsx` / `error.tsx` 🟠
Only a `global-error.tsx` and `not-found.tsx` exist. Server-rendered pages (dashboard, analytics, company details) have no Suspense fallback → blank screen during data fetch on slow connections, and any thrown error unmounts to the global error page. Add `loading.tsx` and `error.tsx` under `(private)`.

### 5.4 Hover-only affordances break keyboard & touch 🟡
Row action buttons use `opacity-0 group-hover:opacity-100` — invisible to keyboard users (focus doesn't reveal them) and awkward on touch devices. Add `focus-within:opacity-100` and consider always-visible on small screens.

### 5.5 Kanban drag & drop is mouse-only 🟡
Native HTML5 DnD in `deals-kanban.tsx` has no keyboard or touch support. Consider `@dnd-kit` (keyboard sensors, touch, a11y announcements) — also gives you optimistic reordering.

### 5.6 Notification items aren't actionable 🟡
Clicking a notification only marks it read — it doesn't navigate to the related deal/task (`metadata` has the IDs). Users expect click-through.

### 5.7 Buttons don't show pending state consistently 🟡
Login does (`isPending`), but most mutation buttons (delete, form submits in dialogs) don't disable or show a spinner while the mutation is in flight — double-submits are possible. `next-safe-action`'s `useAction` exposes `status` — use it.

### 5.8 File-name typos (polish, but visible in every import) 🟡
`reddis.ts`, `generrate-text.ts`, `compnay-details.tsx`, `companies-skelton.tsx`, `command-plate.tsx` (→ palette), `Notification-bell.tsx` / `Notification-list.tsx` (inconsistent PascalCase), `EMPPED_MODEL` (→ EMBED_MODEL), env error message `"OPENROUTER_API_KEY is misiing"`. Rename in one sweep before more code depends on them.

---

## 6. Deployment Checklist (Vercel + Neon + Upstash + Inngest + Pinecone)

The stack is already serverless-friendly (Neon HTTP driver, Upstash REST, Inngest serve handler). Recommended order:

1. **Fix §1.1 and §1.2** so `build` and `lint` pass. Re-run `bun run typecheck && bun run lint && bun run build` locally.
2. **Generate + commit migrations** (`bun run db:generate`), run `db:migrate` against the production Neon database.
3. **Add `.env.example`** and set all env vars in Vercel (Production + Preview). Generate a strong `BETTER_AUTH_SECRET` (`openssl rand -base64 32`). Set `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` to the real domain.
4. **Inngest:** create a production app, set `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY` (add both to `env.ts`), and register the `/api/webhooks/inngest` endpoint in the Inngest dashboard. Note: until §2.1 is fixed, no events flow.
5. **Wire the missing features or hide them:** disable the Google button (§2.2), decide on automation (§2.1) — shipping a workflow builder that silently does nothing will burn user trust.
6. **Security headers + rate limiting** (§3.1–§3.3).
7. **Add minimal CI** (typecheck + lint + build on PR) before the first deploy, so you never regress §1 again.
8. **Observability:** add Sentry (or Vercel's error monitoring) — right now server errors are swallowed into generic messages (`safe-action.ts` returns "An unexpected error occurred" and logs nothing).

---

## 7. Suggested Priority Order

| # | Item | Area | Effort |
|---|------|------|--------|
| 1 | Fix build error in `schema-display.tsx` (§1.1) | Deploy | Minutes |
| 2 | Fix `eslint.config.mjs` syntax (§1.2) | Deploy | Minutes |
| 3 | Generate & commit Drizzle migrations (§1.3) | Deploy | Small |
| 4 | `.env.example` + Inngest keys in `env.ts` (§1.4–1.5) | Deploy | Small |
| 5 | Remove/disable Google sign-in button (§2.2) | Bug | Minutes |
| 6 | Delete confirmation dialogs (§5.1) | UX | Small |
| 7 | Rate limit + validate AI chat route (§3.1) | Security | Small |
| 8 | Security headers in `next.config.ts` (§3.2) | Security | Minutes |
| 9 | Emit Inngest events from mutations (§2.1) | Feature | Medium |
| 10 | Pagination on list endpoints + tables (§4.1) | Perf | Medium |
| 11 | Notification badge + click-through (§4.7, §5.6) | UX | Small |
| 12 | Auth rate limiting + password reset emails (§3.3, §2.3) | Security | Medium |
| 13 | Validate automation JSON with Zod (§3.4) | Security | Small |
| 14 | CI workflow (typecheck/lint/build) (§1.6) | Deploy | Small |
| 15 | Remove unused ai-elements, console.logs, empty stubs, typo renames (§3.6, §4.6, §2.5, §5.8) | Hygiene | Small |
| 16 | `loading.tsx`/`error.tsx`, metadata, a11y polish (§5.2–5.5) | UI | Medium |
| 17 | Trigram/composite indexes, dashboard cache, `Promise.all` (§4.3–4.5) | Perf | Small |
| 18 | Audit logging wired to mutations (§2.4) | Security | Medium |
