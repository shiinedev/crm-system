import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Lora } from "next/font/google"

import "../styles/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";
import {NuqsAdapter} from "nuqs/adapters/next"
import { TRPCReactProvider } from "@/lib/trpc/client";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — AI-Powered CRM for Sales Teams`,
    // Every page sets its own title; this appends the brand
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: [...site.keywords],
  applicationName: site.name,
  authors: [{ name: site.creator, url: site.links.github }],
  creator: site.creator,
  openGraph: {
    type: "website",
    url: site.url,
    siteName: site.name,
    title: `${site.name} — AI-Powered CRM for Sales Teams`,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — AI-Powered CRM for Sales Teams`,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
}

const lora = Lora({subsets:['latin'],variable:'--font-serif'});

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontSans.variable, fontMono.variable, "font-serif", lora.variable)}
    >
      <body>
        <NuqsAdapter>
          <TRPCReactProvider>
            <ThemeProvider>
                <TooltipProvider>{children}</TooltipProvider>
           <Toaster richColors closeButton position="top-right" />
          </ThemeProvider>
        </TRPCReactProvider>
        </NuqsAdapter>
      </body>
    </html>
  )
}
