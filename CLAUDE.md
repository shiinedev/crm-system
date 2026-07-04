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
- Redis cache: `src/server/cache/reddis.ts` (note the filename spelling) — `cacheGet`/`cacheSet`/`cacheDel` degrade gracefully to no-ops when Upstash env vars are unset; key builders in `src/server/cache/keys.ts`.

## Conventions

- **Env vars**: add to `src/lib/env.ts` (t3-env) — both the `server`/`client` schema **and** `runtimeEnv`, or it won't be available.
- **File naming**: kebab-case for all files (`use-permissions.ts`, `companies-table.tsx`, `deals.router.ts`). Suffix conventions: `*.router.ts`, `*.actions.ts`, `*.queries.ts`, `*.schema.ts`, `*.store.ts`.
- Server-only modules start with `import "server-only"`; client components with `"use client"`.
- Path alias: `@/*` → `src/*`.
