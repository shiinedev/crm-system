# Security Tracking

Zero-trust posture: every request proves identity, org membership, role, **and**
resource ownership at the data layer. Never trust ids coming from the client.

Status: ✅ done · 🔶 partial · ⬜ todo

## Done

| # | Item | Where | Notes |
|---|------|-------|-------|
| S1 | ✅ Security headers on all responses | `next.config.ts` | HSTS, nosniff, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy, minimal CSP (`frame-ancestors 'none'; object-src 'none'; base-uri 'self'`), `poweredByHeader: false` |
| S2 | ✅ Org-scoped pipeline **stages** (IDOR fix) | `src/db/queries/pipelines.queries.ts` | Stages inherit tenancy via their pipeline. `getStageById`, `getStagesByPipeline`, `createPipelineStage`, `updatePipelineStage`, `deletePipelineStage` now all require `organizationId` and join/pre-check `pipelines.organizationId`. Before: any org could read/update/delete any stage by id. |
| S3 | ✅ Cross-org FK validation on deal writes | `deals.router.ts`, `deals.actions.ts` | `create` verifies stage belongs to org AND `stage.pipelineId === input.pipelineId`; `changeStage` verifies stage ownership. |
| S4 | ✅ AI chat route hardening | `src/app/api/ai/chat/route.ts` | 401/403 JSON instead of redirect, body shape validation + 50-message cap, per-user rate limit (20/min), tools scoped to session org. |
| S5 | ✅ Rate limiter utility | `src/server/security/rate-limit.ts` | Fixed-window on Upstash. Fails open without Redis (dev) — production must configure Upstash. |
| S6 | ✅ API-safe session read | `src/utils/get-session.ts` `getApiSession()` | Route handlers must use this (status codes), never the redirecting `getSession()`. |

## Todo (ranked)

| # | Item | Where | Notes |
|---|------|-------|-------|
| S7 | ⬜ Full CSP with nonces | `next.config.ts` | Needs nonce plumbed through app + testing; current CSP only covers frame-ancestors/object/base. |
| S8 | ⬜ Validate `ownerId`/`assignedToId`/`companyId`/`contactId` are members/records of the org | deals/tasks/contacts actions | Same class as S3; currently a foreign user id can be set as owner (notification goes to them). |
| S9 | ⬜ Audit log writes on mutations | all actions | `audit_logs` table exists but nothing writes to it (ARCHITECTURE.md phase 4 step 6). |
| S10 | ⬜ Rate limit auth endpoints | better-auth config | better-auth has built-in `rateLimit` options; enable + tune. |
| S11 | ⬜ Rate limit search + heavy list endpoints | `search.router.ts` | Cached 30s but cache-miss storms still hit 4 parallel ILIKE queries. |
| S12 | ⬜ Inngest webhook signing key check in prod | `api/webhooks/inngest` | `inngest/next` serve() validates when `INNGEST_SIGNING_KEY` is set — ensure it's set in prod env. |
| S13 | ⬜ ILIKE input escaping (`%`/`_` wildcards) | `*.queries.ts` search fns | User query is interpolated into `%q%`; wildcard chars let users widen scans. Low risk, easy fix. |

## Rules for future code (enforced in CLAUDE.md)

1. `orgId` comes from session context only — never from request body/params.
2. Every new query function takes `organizationId` and filters on it (join through parent when the table has no org column — see stages).
3. Route handlers use `getApiSession()` + status codes; RSC pages use `getSession()`.
4. Expensive/abusable endpoints get `rateLimit()` before doing work.
5. Any client-supplied FK (stageId, pipelineId, ownerId…) must be proven to belong to the org before writing.
