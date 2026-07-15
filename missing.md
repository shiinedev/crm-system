# Architecture Compliance — What's Missing

Audit of the codebase against `ARCHITECTURE.md`. Verdict: **the core is faithfully implemented** — multi-tenant isolation, RBAC scaffolding, the full DB schema, CRM CRUD, pipelines/kanban, activities, tasks, automation engine, analytics charts, notifications, global search, and the AI chat/agent tools all match the design. The gaps below are features that were specced but not built, plus a handful of structural deviations from the blueprint.

Legend: ❌ missing · ⚠️ partial · 🔵 deviation (works, but differs from the doc)

---

## 1. Missing Features (specced, not built)

### 1.1 Integrations — entirely absent ❌
`ARCHITECTURE.md §1.1` lists Gmail, Google Calendar, Slack, Stripe, Zoom (MCP-compatible). **None exist.**
- No `src/app/(private)/settings/integrations/page.tsx`
- No `src/app/api/webhooks/stripe/route.ts` (only the Inngest webhook is present)
- Automation actions reference `notify_slack` in the design (§2.5) but only `notify_user`, `create_task`, `log_activity` are implemented.

### 1.2 Billing ❌
- No `settings/billing/page.tsx`, no Stripe integration, no plan/subscription model. Production checklist (§8) assumes Stripe.

### 1.3 Realtime / presence / collaborative editing ❌
`§1.1` and `§2` promise "Live updates, presence, collaborative editing." There is **no** websocket/Pusher/Ably layer. The deleted `use-realtime-channel.ts` stub was never implemented. All updates are refetch-based (TanStack Query invalidation).

### 1.4 File uploads ❌
- The `documents` table has `fileUrl` / `mimeType`, and `§5` specs `api/uploads/route.ts` + a `FileUpload.tsx` component — **neither exists**. Documents are Markdown notes only; no S3/Blob/UploadThing storage.
- `documents.upload` tRPC endpoint (§4) is absent.

### 1.5 Semantic / RAG search ❌
- `src/server/ai/rag/retrieval.ts` (Pinecone embed + query) exists but is **unreachable dead code** — nothing imports it.
- `documents.semanticSearch` and `search.global`'s "semantic" half (§4, §1.1) are not wired. Global search is fuzzy `ILIKE` only.
- **Consequence:** `PINECONE_API_KEY` is a *required* env var for a feature that never runs. Either wire RAG or drop the dependency + env requirement.

### 1.6 MFA & OAuth ❌
- **MFA** (`§1.1` Auth) — not implemented.
- **OAuth** — the Google/GitHub social providers are commented out in `auth.ts`; the login button was removed. Email/password only.

### 1.7 AI agent background runner ⚠️
- CRM tools (`src/server/ai/agent/tools.ts`) and the streaming chat agent exist ✓.
- But `§5` specs `agent/runner.ts` (agent loop) and `agent/memory.ts` (Upstash-backed memory) plus an `ai.agent` background endpoint (§4) — **not built**. No Inngest-backed background agent runs.

### 1.8 Analytics gaps ⚠️
Implemented: `dashboardSummary`, `revenueByMonth`, `pipelineHealth`, `winLoss`. **Missing** vs `§4`:
- `analytics.teamPerformance` — no per-user/team performance charts (`TeamPerformance.tsx` in §5 not built).
- `analytics.forecast` — no revenue *forecast* (only historical revenue-by-month).
- `FunnelChart.tsx` (§5) not built.

### 1.9 Notification channels ⚠️
- In-app ✓, mentions ✓, reminders ✓ (via the task-due cron).
- **Email notifications** ❌ — the email infra (nodemailer) exists for auth flows, but domain notifications (assignment, deal_update, etc.) are only written to the DB, never emailed. `notification-dispatch.ts` Inngest function (§5) doesn't exist.
- **Realtime** notifications ❌ (see §1.3).

### 1.10 Document versioning ❌
- `documents.version` column exists but is never incremented on edit. No version history UI (§7 Sprint 5).

### 1.11 Task calendar view ❌
- `§5`/`§7` spec a "Kanban + Calendar toggle" (`TaskCalendar.tsx`). Only the kanban board exists.

### 1.12 Audit logs UI ❌
- Audit **writes** are wired into all mutations ✓ (added during hardening), and `audit.queries.ts` has read helpers, but there is **no page** to view the audit trail (§7 Sprint 5).

### 1.13 Other unbuilt CRM endpoints ⚠️
Per `§4`: `contacts.merge`, `contacts/[id]` **detail page** (contacts have a table but no detail route — companies do), `deals.aiAnalyze` as a list action, `ai.summarize` (meeting/activity), `ai.researchCompany` (web-augmented). Note `ai.generateEmail`, `ai.analyzeDeal`, `ai.summarizeCompany`, `ai.scoreLead` **are** implemented.

---

## 2. Non-Functional / Production Gaps

### 2.1 Observability ❌
`§1.2` and `§8` require structured logging + Sentry error tracking. **No Sentry, no structured logger.** Server errors are swallowed into generic messages.

### 2.2 CSP headers ⚠️
`§8` requires CSP headers. Security headers were added (`X-Frame-Options`, `nosniff`, HSTS, `Referrer-Policy`, `Permissions-Policy`) but **`Content-Security-Policy` itself is not set.**

### 2.3 Per-org AI rate limiting / cost tracking ⚠️
`§8` wants "rate limiting per org on OpenAI calls, cost tracking." The AI chat route has **per-user** rate limiting (added during hardening); there's no per-**org** limit and no token/cost tracking.

### 2.4 Compliance ⚠️
- Soft deletes ✓ (all user data uses `deletedAt`).
- "Audit logs retained 90 days" — no retention/cleanup job.

---

## 3. RBAC Now Fully Enforced ✓ (resolved)

The 6 roles are defined and the `§1.3` matrix is now honored. Roles have a single source of truth in `src/lib/permissions.ts` (Better Auth `ac` + `roles`), mirrored by the fast synchronous helpers in `src/lib/roles.ts`.

| Matrix rule | Reality |
|---|---|
| **viewer** cannot create/edit records | ✓ `create`/`update`/`delete` use `memberProcedure` (tRPC) / `memberActionClient` (actions), which exclude `viewer` |
| **support_agent** cannot view analytics | ✓ the analytics router is entirely `managerProcedure` (manager+) |
| Delete requires manager+ | ✓ core-record deletes use `managerProcedure`; task/activity/document deletes exclude `viewer` (`memberProcedure`) |
| Org settings / invite requires admin+ | ✓ enforced (`adminProcedure` / `adminActionClient`) |
| Run automation requires manager+ | ✓ enforced (`managerActionClient`) |

**Resolution:** added `memberProcedure` (`src/server/trpc/trpc.ts`) and `memberActionClient` (`src/server/actions/safe-action.ts`) that exclude `viewer` for create/edit/delete; gated the analytics router to `managerProcedure`; wired Better Auth's permission engine (`ac`/`roles`) so its built-in member/invitation endpoints respect all six roles and the client can use `checkRolePermission`.

---

## 4. Architectural Deviations (functional, but differ from the doc)

### 4.1 No edge middleware 🔵
`§5`/`§6.2` spec `src/middleware.ts` as an edge auth gate. **It doesn't exist.** Auth is enforced in the `(private)/layout.tsx` RSC via `getSession()` (redirects to `/login`). This works and is arguably simpler, but every protected page pays a session lookup instead of a cheap edge cookie check.

### 4.2 tRPC context has no `redis` 🔵
`§6.1` specs `redis` on the tRPC context. It's absent — Redis is used directly in the cache/rate-limit layer instead. Functionally fine.

### 4.3 Mutations split across tRPC routers **and** server actions 🔵
`§4`'s "Procedure Pattern" says every mutation does: validate → auth → org → permission → logic → **audit write → Inngest emit**. In practice:
- **Server actions** (`companies.actions.ts`, etc.) — these got the audit-log + Inngest-event wiring.
- **tRPC routers** (`companies.create`, etc.) also perform mutations but emit **no audit log and no Inngest event.**

So the same operation exists in two places with different side-effect guarantees. Worth consolidating on one path (the actions) or replicating audit/Inngest into the routers.

### 4.4 No central `withOrg()` helper 🔵
`§2.3`/`§6.4` describe a `withOrg(ctx)` wrapper enforcing org scoping. There's no such helper — each query filters by `organizationId` inline. Equivalent isolation, less centralized.

### 4.5 No Zustand 🔵
`§2.1`/`§5` list Zustand stores (`ui.store`, `command.store`, `ai-chat.store`). Zustand isn't a dependency; those stubs were empty and removed. Client state uses `nuqs` (URL) + local `useState`. Fine for current scope.

### 4.6 Folder-structure differences 🔵
- DB lives at `src/db/` (doc says `src/server/db/`).
- Components are kebab-case (`companies-table.tsx`) vs the doc's PascalCase (`CompanyTable.tsx`).
- No shared `components/data-table/`, `components/forms/`, or `components/shared/` (EmptyState, LoadingSpinner, PriorityBadge, etc.) — these are inlined per-module. The route group is `(private)` not `(app)`.
- JSON columns (`aiInsights`, `metadata`, workflow `trigger`/`conditions`/`actions`) are stored as `text` not `jsonb`. Works, but loses in-DB JSON querying.

---

## 5. Suggested Priority

1. **Enforce RBAC matrix** (§3) — security-relevant, small change.
2. **Decide RAG's fate** (§1.5) — wire it or drop Pinecone + the required env var.
3. **Consolidate mutation path** (§4.3) — so audit/Inngest always fire.
4. **Add CSP + Sentry** (§2.1–2.2) — production hardening.
5. **File uploads** (§1.4) — the documents feature is half-built without it.
6. Then the larger product bets: integrations, billing, realtime, forecast/team analytics, agent runner — each is effectively a new epic.

---

*Not blockers for the current PR — this is a scope-vs-blueprint gap map. The implemented surface is solid and internally consistent; most gaps are unbuilt roadmap items (Sprints 3–5) rather than defects.*
