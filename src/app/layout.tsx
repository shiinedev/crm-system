import { Geist, Geist_Mono, Lora } from "next/font/google"

import "../styles/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";
import {NuqsAdapter} from "nuqs/adapters/next"
import { TRPCReactProvider } from "@/lib/trpc/client";
import { Toaster } from "sonner";

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
          {children}
           <Toaster richColors closeButton position="top-right" />
          </ThemeProvider>
        </TRPCReactProvider>
        </NuqsAdapter>
      </body>
    </html>
  )
}
