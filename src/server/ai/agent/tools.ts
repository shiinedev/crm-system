import "server-only"
import { z } from "zod"
import { tool } from "ai"
import { getCompaniesByOrg, getCompanyById } from "@/db/queries/companies.queries"
import { getContactsByOrg, getContactById } from "@/db/queries/contacts.queries"
import { getDealsByOrg, getDealById, getDealStats } from "@/db/queries/deals.queries"
import { getTasksByOrg } from "@/db/queries/tasks.queries"
import { getRecentActivitiesByOrg } from "@/db/queries/activities.queries"
import { getDashboardSummary } from "@/db/queries/analytics.queries"

export function buildCrmTools(orgId: string) {
  return {
    getDashboardSummary: tool({
      description: "Get key CRM metrics: company count, contact count, deal count, pipeline value, open tasks.",
      inputSchema: z.object({}),
      execute: async () => getDashboardSummary(orgId),
    }),
    listCompanies: tool({
      description: "List all companies in the organization.",
      inputSchema: z.object({}),
      execute: async () => {
        const companies = await getCompaniesByOrg(orgId)
        return companies.map((c) => ({
          id: c.id, name: c.name, industry: c.industry,
          lifecycleStage: c.lifecycleStage, city: c.city,
        }))
      },
    }),
    getCompany: tool({
      description: "Get details for a specific company by ID.",
      inputSchema: z.object({ id: z.string().describe("The company ID") }),
      execute: async ({ id }) => getCompanyById(id, orgId),
    }),
    listContacts: tool({
      description: "List all contacts in the organization.",
      inputSchema: z.object({}),
      execute: async () => {
        const contacts = await getContactsByOrg(orgId)
        return contacts.map((c) => ({
          id: c.id, firstName: c.firstName, lastName: c.lastName,
          email: c.email, title: c.title, leadScore: c.leadScore,
        }))
      },
    }),
    getContact: tool({
      description: "Get details for a specific contact by ID.",
      inputSchema: z.object({ id: z.string().describe("The contact ID") }),
      execute: async ({ id }) => getContactById(id, orgId),
    }),
    listDeals: tool({
      description: "List all deals in the organization.",
      inputSchema: z.object({}),
      execute: async () => {
        const deals = await getDealsByOrg(orgId)
        return deals.map((d) => ({
          id: d.id, title: d.title, value: d.value,
          probability: d.probability, priority: d.priority,
          expectedCloseDate: d.expectedCloseDate,
        }))
      },
    }),
    getDeal: tool({
      description: "Get details for a specific deal by ID.",
      inputSchema: z.object({ id: z.string().describe("The deal ID") }),
      execute: async ({ id }) => getDealById(id, orgId),
    }),
    getDealStats: tool({
      description: "Get aggregate deal stats: total count, total value, average probability.",
      inputSchema: z.object({}),
      execute: async () => getDealStats(orgId),
    }),
    listOpenTasks: tool({
      description: "List all open tasks in the organization.",
      inputSchema: z.object({}),
      execute: async () => {
        const tasks = await getTasksByOrg(orgId)
        return tasks
          .filter((t) => t.status !== "done" && t.status !== "cancelled")
          .map((t) => ({ id: t.id, title: t.title, priority: t.priority, dueDate: t.dueDate, status: t.status }))
      },
    }),
    recentActivity: tool({
      description: "Get recent activity across the organization.",
      inputSchema: z.object({
        limit: z.number().min(1).max(20).optional().describe("Number of activities to return, default 10"),
      }),
      execute: async ({ limit }) => getRecentActivitiesByOrg(orgId, limit ?? 10),
    }),
  }
}
