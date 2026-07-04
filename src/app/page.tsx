import Link from "next/link"
import {
  Bot, Building2, TrendingUp, Zap, BarChart3, Search,
  ArrowRight, Sparkles, CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { site } from "@/lib/site"
import { getSession } from "@/utils/get-session"

const FEATURES = [
  {
    icon: Building2,
    title: "Companies & contacts",
    description:
      "Every account, contact and interaction in one organized workspace — with lead scoring and full activity timelines.",
  },
  {
    icon: TrendingUp,
    title: "Visual deal pipelines",
    description:
      "Drag deals through customizable stages on a kanban board. Win/loss tracking and forecast categories built in.",
  },
  {
    icon: Bot,
    title: "AI sales assistant",
    description:
      "Ask questions about your pipeline in plain language. The assistant reads your live CRM data and answers instantly.",
  },
  {
    icon: Zap,
    title: "Workflow automation",
    description:
      "Trigger → condition → action. Notify owners, create tasks and send follow-ups automatically when deals move.",
  },
  {
    icon: BarChart3,
    title: "Revenue analytics",
    description:
      "Pipeline health, revenue forecasts and team performance dashboards — no spreadsheet exports required.",
  },
  {
    icon: Search,
    title: "Instant global search",
    description:
      "One shortcut (⌘K) finds any company, contact, deal or document across your entire workspace.",
  },
] as const

const HIGHLIGHTS = [
  "Multi-tenant with role-based access",
  "AI lead scoring & deal risk analysis",
  "Real-time notifications",
] as const

/** JSON-LD so search engines & AI answer engines understand what this product is. */
function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: site.name,
        description: site.description,
        url: site.url,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@type": "Organization",
        name: site.name,
        url: site.url,
        sameAs: [site.links.github],
      },
    ],
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export default async function LandingPage() {
  // Signed-in visitors get a shortcut to the app instead of marketing CTAs.
  const session = await getSession(false)

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <StructuredData />

      {/* ── Top nav ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <nav
          aria-label="Main"
          className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6"
        >
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <TrendingUp className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
            </span>
            {site.name}
          </Link>
          <div className="flex items-center gap-2">
            {session ? (
              <Button asChild size="sm">
                <Link href="/dashboard">
                  Open dashboard
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">Get started free</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </header>

      <main id="main" className="flex-1">
        {/* ── Hero ──────────────────────────────────────────── */}
        <section
          aria-labelledby="hero-heading"
          className="mx-auto w-full max-w-6xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24"
        >
          <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700">
            <p className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              AI-powered CRM for modern sales teams
            </p>
            <h1
              id="hero-heading"
              className="mx-auto max-w-3xl text-balance font-heading text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
            >
              The CRM that works your pipeline with you
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
              {site.name} brings companies, contacts, deals and documents together —
              then adds AI lead scoring, deal-risk analysis and automation so nothing
              slips through the cracks.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href={session ? "/dashboard" : "/register"}>
                  {session ? "Open dashboard" : "Start for free"}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#features">See what&apos;s inside</Link>
              </Button>
            </div>
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────── */}
        <section
          id="features"
          aria-labelledby="features-heading"
          className="border-t bg-muted/30 py-20 scroll-mt-14"
        >
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 id="features-heading" className="font-heading text-3xl font-bold tracking-tight">
                Everything a sales team needs
              </h2>
              <p className="mt-3 text-muted-foreground">
                Customer relationship management, pipeline tracking, automation and
                analytics — without duct-taping five tools together.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="group rounded-xl border bg-card p-6 transition-shadow motion-safe:transition-all hover:shadow-md motion-safe:hover:-translate-y-0.5"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────── */}
        <section aria-labelledby="cta-heading" className="py-20">
          <div className="mx-auto w-full max-w-3xl px-4 text-center sm:px-6">
            <h2 id="cta-heading" className="font-heading text-3xl font-bold tracking-tight">
              Stop managing spreadsheets. Start closing deals.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Set up your workspace in minutes — invite your team when you&apos;re ready.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link href={session ? "/dashboard" : "/register"}>
                {session ? "Open dashboard" : "Create your free workspace"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <p>
            © {new Date().getFullYear()} {site.name}
          </p>
          <a
            href={site.links.github}
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}
