# SEO Tracking

Goal: rank for "CRM"-family queries ("AI CRM", "sales CRM", "sales pipeline software")
via the public marketing surface. The app itself is private tenant data and is
deliberately **excluded** from search.

Status: ✅ done · 🔶 partial · ⬜ todo

## Done

| # | Item | Where | Notes |
|---|------|-------|-------|
| SE1 | ✅ Site identity config | `src/lib/site.ts` | Name, description, url, keywords — single source for all SEO surfaces. Brand: **Shiine CRM** (change it there, everything follows). |
| SE2 | ✅ Root metadata | `src/app/layout.tsx` | `metadataBase`, title template (`%s \| Shiine CRM`), description, keywords, OpenGraph, Twitter card, robots, viewport + theme-color. |
| SE3 | ✅ robots.txt | `src/app/robots.ts` | Allow `/`, disallow app + auth + api routes; sitemap pointer; AI crawlers allowed on public surface. |
| SE4 | ✅ sitemap.xml | `src/app/sitemap.ts` | Public URLs only (currently `/`). |
| SE5 | ✅ Web manifest | `src/app/manifest.ts` | PWA install metadata. |
| SE6 | ✅ noindex private + auth areas | `(private)/layout.tsx`, `(auth)/layout.tsx` | Defense in depth on top of robots.txt (robots.txt does not prevent indexing of linked URLs; meta robots does). |
| SE7 | ✅ Landing page: semantic HTML, single h1, keyword-rich copy, JSON-LD (`SoftwareApplication` + `Organization`) | `src/app/page.tsx` | Done as part of the UI/UX landing rebuild — see UI-UX.md U1. |

## Todo (ranked)

| # | Item | Notes |
|---|------|-------|
| SE8 | ⬜ OG image | Add `opengraph-image.tsx` (Next can render it) — link previews currently have no image. |
| SE9 | ⬜ Set `NEXT_PUBLIC_APP_URL` to the real production domain | metadataBase/sitemap/JSON-LD all derive from it; localhost until deployed. |
| SE10 | ⬜ Submit sitemap to Google Search Console after deploy | Also verify rich results for the JSON-LD. |
| SE11 | ⬜ Content pages (/features, /pricing, /blog) | Ranking for "CRM" requires content + backlinks; a single landing page won't do it. Add pages → add to sitemap.ts. |
| SE12 | ⬜ Per-icon PNG set (192/512) for manifest | Only favicon.ico exists today. |

## Rules for future code (enforced in CLAUDE.md)

1. New public page → set `title`/`description` metadata AND add it to `sitemap.ts`.
2. New private route → it must live under `(private)` (inherits noindex) and be added to the disallow list in `robots.ts`.
3. Brand/description changes happen in `src/lib/site.ts`, nowhere else.
