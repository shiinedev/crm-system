import type { MetadataRoute } from "next"
import { site } from "@/lib/site"

/** Public, indexable URLs only — the app behind auth never goes in here. */
export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: site.url,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 1,
        },
    ]
}
