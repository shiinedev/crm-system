import { headers } from "next/headers"
import type { Metadata } from "next"
import { getSession } from "@/utils/get-session"
import { auth } from "@/server/auth/auth"
import { OnboardingForm } from "./onboarding-form"

export const metadata: Metadata = { title: "Create your organization" }

export default async function OnboardingPage() {
  const session = await getSession() // redirects to /login if not authenticated
  const headersList = await headers()

  const orgs = await auth.api.listOrganizations({ headers: headersList }).catch(() => [])
  const hasExistingOrg = Array.isArray(orgs) && orgs.length > 0

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <OnboardingForm userName={session?.user?.name ?? null} hasExistingOrg={hasExistingOrg} />
    </div>
  )
}
