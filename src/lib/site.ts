/**
 * Single source of truth for site identity — used by metadata, JSON-LD,
 * sitemap, manifest and the marketing page. Change the brand here, everywhere follows.
 */
export const site = {
    name: "Shiine CRM",
    shortName: "ShiineCRM",
    /** One-sentence value prop — reused as the default meta description */
    description:
        "AI-powered CRM for sales teams: manage companies, contacts and deals, automate follow-ups, and get AI insights on your pipeline — all in one place.",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001",
    keywords: [
        "CRM",
        "AI CRM",
        "sales CRM",
        "customer relationship management",
        "sales pipeline software",
        "deal tracking",
        "contact management",
        "sales automation",
        "lead scoring",
    ],
    links: {
        github: "https://github.com/shiinedev/crm-system",
    },
    creator: "shiinedev",
} as const
