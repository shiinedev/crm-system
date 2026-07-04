import type { MetadataRoute } from "next"
import { site } from "@/lib/site"

/**
 * Only the marketing surface is crawlable. The app itself is per-tenant,
 * session-gated data — never index it. AI crawlers are allowed on the
 * public surface (citations help discovery).
 */
export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/api/",
                    "/dashboard",
                    "/companies",
                    "/contacts",
                    "/deals",
                    "/tasks",
                    "/documents",
                    "/analytics",
                    "/automation",
                    "/ai",
                    "/settings",
                    "/login",
                    "/register",
                ],
            },
        ],
        sitemap: `${site.url}/sitemap.xml`,
    }
}
