import type { NextConfig } from "next"

/**
 * Security headers applied to every response.
 * CSP is intentionally minimal (clickjacking + injection surface) rather than a
 * full allowlist — a strict script-src needs nonce wiring through the app before
 * it can ship without breaking Next.js inline scripts. Tracked in docs/tracking/SECURITY.md.
 */
const securityHeaders = [
  // Force HTTPS for two years, including subdomains
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Never MIME-sniff responses
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Legacy clickjacking protection (CSP frame-ancestors is the modern one)
  { key: "X-Frame-Options", value: "DENY" },
  // Don't leak full URLs cross-origin
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // This app never needs these browser capabilities
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
  },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }]
  },
}

export default nextConfig
