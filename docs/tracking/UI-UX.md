# UI/UX Tracking

Baseline: WCAG 2.2 AA (see `.claude/skills/accessibility`). Motion must always be
wrapped in `motion-safe:` or covered by the global reduced-motion kill switch.

Status: ✅ done · 🔶 partial · ⬜ todo

## Done

| # | Item | Where | Notes |
|---|------|-------|-------|
| U1 | ✅ Marketing landing page | `src/app/page.tsx` | Replaced template boilerplate: sticky nav, hero (single h1), 6-feature grid, CTA, footer. Server-rendered, CSS-only entrance animations (`motion-safe:animate-in`), session-aware CTAs (signed-in users see "Open dashboard"), JSON-LD structured data. |
| U2 | ✅ Skip-to-content link | `(private)/layout.tsx` | `sr-only focus:not-sr-only` link targeting `#main`; `<main id="main">`. WCAG 2.4.1. |
| U3 | ✅ Icon-button accessible names | sidebar, header, notification bell | `aria-label` on mobile menu, mobile search, account menu, bell (announces unread count); icons `aria-hidden`. WCAG 4.1.2. |
| U4 | ✅ Nav semantics | `sidebar.tsx` | `nav aria-label="Primary"`, `aria-current="page"` on the active link. WCAG 3.2.3. |
| U5 | ✅ Global reduced-motion support | `globals.css` | `prefers-reduced-motion: reduce` kills all animations/transitions. WCAG 2.3.3. |

## Todo (ranked)

| # | Item | Notes |
|---|------|-------|
| U6 | ⬜ Form a11y audit (login, register, entity dialogs) | Verify every input has an associated label, `aria-invalid` + `aria-describedby` on errors, focus first error on submit. |
| U7 | ⬜ Loading/empty states consistency | Skeletons exist per module; verify every list page has skeleton + `<Empty>` state; announce async updates with `aria-live` where needed. |
| U8 | ⬜ Kanban drag-and-drop keyboard alternative | WCAG 2.5.7 — stage changes must be possible without dragging (e.g., "Move to stage" menu on the deal card). |
| U9 | ⬜ Color-contrast sweep | `text-muted-foreground` on `bg-muted` combos and the sidebar active state need a 4.5:1 check in both themes. |
| U10 | ⬜ Page transitions / micro-interactions in app | Subtle `motion-safe` entrance on dashboard cards & dialogs; keep under 200ms, no layout shift. |
| U11 | ⬜ OG/hero illustration | Landing page is text-only; add product screenshot with descriptive alt. |
| U12 | ⬜ Focus not obscured check under sticky header | WCAG 2.4.11 — add `scroll-margin-top` where anchors/focus targets sit under the sticky nav (done for `#features`, audit the app shell). |

## Rules for future code (enforced in CLAUDE.md)

1. Icon-only buttons always get `aria-label`; decorative icons get `aria-hidden="true"`.
2. Animations only via `motion-safe:` utilities (or check `prefers-reduced-motion` in JS).
3. One `h1` per page; heading levels never skip.
4. Interactive targets ≥ 24×24px; keep shadcn focus-visible rings — never `outline: none` without a replacement.
5. New pages: keyboard-walk the whole flow (Tab / Enter / Esc) before calling it done.
