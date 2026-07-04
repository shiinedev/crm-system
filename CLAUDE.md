# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

AI-powered multi-tenant CRM SaaS. Stack: Next.js 16 (App Router) · TypeScript · tRPC v11 · better-auth (organization plugin) · Drizzle ORM · Neon Postgres · Tailwind v4 · shadcn/ui · Vercel AI SDK (via OpenRouter) · Inngest · Upstash Redis · Pinecone.

`ARCHITECTURE.md` is the full system-design document (schema, RBAC matrix, roadmap) — treat it as design intent; some parts are not yet implemented. Per `AGENTS.md`: this Next.js version has breaking changes vs. training data — read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js-specific code.

## Commands

Package manager is **bun** (`bun.lock`).

```bash
bun dev              # dev server on port 3001
bun run build        # production build
bun run lint         # eslint
bun run typecheck    # tsc --noEmit
bun run format       # prettier on **/*.{ts,tsx}
bun run db:generate  # drizzle-kit generate (migrations from schema)
bun run db:migrate   # apply migrations
bun run db:push      # push schema directly (dev)
bun run db:studio    # drizzle studio
bun run shadcn <name> # add a shadcn/ui component
```

There is no test framework configured. Verify changes with `bun run typecheck` and `bun run lint`.

## Architecture

### Request/data flow

```
RSC page (src/app) → feature component (src/modules/<feature>/components)
  reads:     tRPC via TanStack Query  → src/server/trpc/routers/*.router.ts
  mutations: next-safe-action actions → src/server/actions/*.actions.ts
             (or tRPC mutations — both exist)
  both call: src/db/queries/*.queries.ts (the ONLY place raw Drizzle queries live)
             → Drizzle → Neon (HTTP driver, src/db/index.ts)
```

- **`src/db/queries/`** — every DB access goes through a named function here. Each function takes `organizationId` as a parameter and filters on it plus `isNull(deletedAt)` (soft deletes everywhere). Follow this pattern; never inline Drizzle queries in routers/actions.
- **`src/server/trpc/`** — `context.ts` builds `{ db, session, user, orgId, orgMember, role }` from the better-auth session (`activeOrganizationId`). `root.ts` assembles `appRouter`. Routers are thin: auth via procedure tier, then delegate to a query function passing `ctx.orgId`.
- **`src/server/actions/`** — next-safe-action mutations, used by module hooks (`useAction` + sonner toast + `router.refresh()`).
- **`src/lib/trpc/`** — `server.tsx` (RSC proxy + `HydrateClient`/`prefetch`), `client.tsx` (provider), `query-client.ts`.
- **`src/modules/<feature>/`** — feature UI: `components/` + `hooks/`. Generic UI in `src/components/ui` (shadcn), app shell in `src/components/layout`.
- **Zod schemas** for inputs live in `src/lib/validations/` and are shared by tRPC routers, actions, and react-hook-form.
- **State**: Zustand stores in `src/stores/` (UI/chrome state only); URL state via nuqs (`src/hooks/use-filters.ts`); server state via TanStack Query.

### Multi-tenancy & authorization (critical)

- `orgId` always comes from the session context — **never from client input**.
- Every tenant table has `organizationId`; every query function must filter by it.
- Procedure tiers in `src/server/trpc/trpc.ts`: `publicProcedure` → `protectedProcedure` (session) → `orgProcedure` (org membership, most common) → `managerProcedure` / `adminProcedure` (role-gated). Mirrored action clients in `src/server/actions/safe-action.ts`: `actionClient` → `authActionClient` → `orgActionClient` → `managerActionClient` / `adminActionClient`.
- Role logic lives in `src/lib/roles.ts` (hierarchy: viewer < support_agent < sales_rep < manager < admin < owner) and must mirror `memberRoles` in `src/server/auth/auth.ts`. Use its named checks (`canWrite`, `canManage`, …) and `visibleNavItems` rather than comparing role strings. Client side: `src/hooks/use-permissions.ts` / `use-role.ts`.

### Auth & routing

- better-auth with drizzle adapter + organization plugin; config in `src/server/auth/auth.ts`, client in `src/server/auth/auth-client.ts`, handler at `src/app/api/auth/[...auth]/route.ts`.
- No `middleware.ts`. Route group `(auth)` is public; `(private)` is gated in its layout via `getSession()` (`src/utils/get-session.ts`), which redirects to `/login`.

### Database

- Schema split per domain in `src/db/schema/*.schema.ts`, re-exported from `schema/index.ts` (better-auth tables in `auth.schema.ts`). IDs are cuid2 text PKs. Migrations output to `src/db/migrations` (`drizzle.config.ts`).
- After editing a schema file: `bun run db:generate` then `db:migrate` (or `db:push` in dev).

### AI, background jobs, cache

- AI client is **OpenRouter** (`src/server/ai/client.ts`, exports `openRouter` + model constants) with the Vercel AI SDK. Streaming chat route: `src/app/api/ai/chat/route.ts`; chat UI uses `src/components/ai-elements`. Agent tools in `src/server/ai/agent/`, Pinecone RAG in `src/server/ai/rag/`.
- Inngest: client + functions in `src/server/inngest/` (automation-runner, lead-scorer, task-reminder), served at `src/app/api/webhooks/inngest/route.ts`.
- Redis cache: `src/server/cache/redis.ts` — `cacheGet`/`cacheSet`/`cacheDel` degrade gracefully to no-ops when Upstash env vars are unset; key builders in `src/server/cache/keys.ts`. Rate limiting: `src/server/security/rate-limit.ts` (fails open without Redis — prod needs Upstash).

## Conventions

- **Env vars**: add to `src/lib/env.ts` (t3-env) — both the `server`/`client` schema **and** `runtimeEnv`, or it won't be available.
- **File naming**: kebab-case for all files (`use-permissions.ts`, `companies-table.tsx`, `deals.router.ts`). Suffix conventions: `*.router.ts`, `*.actions.ts`, `*.queries.ts`, `*.schema.ts`, `*.store.ts`.
- Server-only modules start with `import "server-only"`; client components with `"use client"`.
- Path alias: `@/*` → `src/*`.

## Standing workflow (every task, no need to ask)

Work in this order: **scan → plan → implement → check → commit**. Don't ask for
permission between steps; surface decisions in the commit message and tracking files.

1. **Scan** the files the task touches plus their query/router/action chain.
2. **Plan** briefly (in-message is fine for small tasks).
3. **Implement** following the per-area rules below.
4. **Check** (internal only — never launch a browser unless asked):
   `bun run typecheck` and `bun run lint` must pass with **0 errors** before every commit;
   `bun run build` before pushing a batch of commits.
5. **Commit** per logical unit with a conventional prefix (`security:`, `seo:`, `ui/ux:`, `dx:`, `feat:`, `fix:`, `refactor:`).

### Tracking registers (keep them true)

`docs/tracking/{SECURITY,SEO,UI-UX,DX}.md` are living registers with numbered done/todo
items. When you fix or add something in one of those areas, update the register in the
same commit. When you pick up new work, check the register's todo list first.

### Security rules (zero trust — non-negotiable)

- `orgId` from session context only, never from client input.
- Every new query function takes `organizationId` and filters on it; tables without an
  org column inherit tenancy via a join through their parent (see pipeline stages).
- Any client-supplied FK (stageId, pipelineId, ownerId, …) must be proven to belong to
  the org before writing.
- Route handlers (`src/app/api/**`) use `getApiSession()` and return 401/403/429 JSON —
  never redirect. RSC pages use `getSession()`.
- Expensive/abusable endpoints get `rateLimit()` (`src/server/security/rate-limit.ts`) before doing work.

### UI/UX rules (WCAG 2.2 AA)

- Icon-only buttons get `aria-label`; decorative icons `aria-hidden="true"`.
- Animations only via `motion-safe:` utilities (global reduced-motion kill switch exists in `globals.css`).
- One `h1` per page; heading levels never skip; keep shadcn focus-visible rings.
- Keyboard-walk new flows (Tab/Enter/Esc) before calling them done.

### SEO rules

- Brand/description/keywords live in `src/lib/site.ts` only.
- New public page → set `title`/`description` metadata and add to `src/app/sitemap.ts`.
- New private route → keep it under `(private)` (inherits noindex) and add to the
  disallow list in `src/app/robots.ts`.

### DX rules

- No `any` — type it, infer it, or cast to the library's own parameter type with a comment.
- No hardcoded role arrays — use `hasRole()`/named checks from `src/lib/roles.ts`.
- Shared enums/option lists live in one place (filters: `src/utils/params.ts`).
- Vendored code (`src/components/ai-elements/`) is not edited for style and is excluded from lint.
- Comment only what code can't say: invariants, security reasons, upstream quirks.
