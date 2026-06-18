import { inngest } from "../client"
import { getContactById, updateContact } from "@/db/queries/contacts.queries"
import { getActivitiesByContact } from "@/db/queries/activities.queries"

function calculateLeadScore(params: {
  hasEmail: boolean
  hasPhone: boolean
  activityCount: number
}): number {
  let score = 0
  if (params.hasEmail) score += 20
  if (params.hasPhone) score += 10
  score += Math.min(params.activityCount * 5, 30)
  return Math.min(score, 100)
}

export const leadScorer = inngest.createFunction(
  {
    id: "lead-scorer",
    triggers: [{ event: "crm/contact.created" }],
  },
  async ({ event }: { event: { data: { contactId: string; orgId: string } } }) => {
    const { contactId, orgId } = event.data
    const contact = await getContactById(contactId, orgId)
    if (!contact) return

    const activities = await getActivitiesByContact(contactId, orgId)
    const score = calculateLeadScore({
      hasEmail: !!contact.email,
      hasPhone: !!contact.phone,
      activityCount: activities.length,
    })

    await updateContact(contactId, orgId, { leadScore: score })
  }
)
