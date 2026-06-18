import { z } from "zod"
import { createTRPCRouter, orgProcedure } from "../trpc"
import { getDealById } from "@/db/queries/deals.queries"
import { getContactById } from "@/db/queries/contacts.queries"
import { getCompanyById } from "@/db/queries/companies.queries"
import { updateContact } from "@/db/queries/contacts.queries"
import { updateDeal } from "@/db/queries/deals.queries"
import { updateCompany } from "@/db/queries/companies.queries"
import { TRPCError } from "@trpc/server"
import { generateAiText } from "@/server/ai/agent/generrate-text"

export const aiRouter = createTRPCRouter({
  generateEmail: orgProcedure
    .input(z.object({
      contactId: z.string(),
      context: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const contact = await getContactById(input.contactId, ctx.orgId)
      if (!contact) throw new TRPCError({ code: "NOT_FOUND" })


      const prompt = `Write a professional, concise sales email to ${contact.firstName} ${contact.lastName}${contact.title ? `, ${contact.title}` : ""}.
${input.context ? `Context: ${input.context}` : ""}
Keep it under 150 words. No subject line — just the body.`;

      const { text } = await generateAiText(prompt)

      return { email: text }
    }),

  analyzeDeal: orgProcedure
    .input(z.object({ dealId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deal = await getDealById(input.dealId, ctx.orgId)
      if (!deal) throw new TRPCError({ code: "NOT_FOUND" })


      const prompt = `Analyze this deal and give a brief risk assessment and next recommended action.

Deal: ${deal.title}
Value: ${deal.value ?? "unknown"}
Probability: ${deal.probability ?? "unknown"}%
Priority: ${deal.priority ?? "unknown"}
Expected close: ${deal.expectedCloseDate ?? "not set"}
Risk level: ${deal.riskLevel ?? "unknown"}

Reply with two short paragraphs: (1) Risk analysis, (2) Recommended next action. Max 80 words total.`;
      const { text } = await generateAiText(prompt)

      // Save result back to deal
      await updateDeal(input.dealId, ctx.orgId, {
        aiRiskAnalysis: text,
        aiNextAction: text.split("\n")[1] ?? text,
      })

      return { analysis: text }
    }),

  summarizeCompany: orgProcedure
    .input(z.object({ companyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const company = await getCompanyById(input.companyId, ctx.orgId)
      if (!company) throw new TRPCError({ code: "NOT_FOUND" })
      const prompt = `Write a brief CRM summary for this company.

Name: ${company.name}
Industry: ${company.industry ?? "unknown"}
Size: ${company.companySize ?? "unknown"}
Stage: ${company.lifecycleStage ?? "unknown"}
Location: ${[company.city, company.country].filter(Boolean).join(", ") || "unknown"}
Notes: ${company.notes ?? "none"}

2-3 sentences max. Focus on sales relevance.`;

      const { text } = await generateAiText(prompt)

      await updateCompany(input.companyId, ctx.orgId, { aiSummary: text })
      return { summary: text }
    }),

  scoreLead: orgProcedure
    .input(z.object({ contactId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const contact = await getContactById(input.contactId, ctx.orgId)
      if (!contact) throw new TRPCError({ code: "NOT_FOUND" })
      const prompt = `Score this lead from 0-100 based on available data. Reply with ONLY a number, nothing else.

Name: ${contact.firstName} ${contact.lastName}
Title: ${contact.title ?? "unknown"}
Email: ${contact.email ? "yes" : "no"}
Phone: ${contact.phone ? "yes" : "no"}
Source: ${contact.source ?? "unknown"}
Status: ${contact.status ?? "unknown"}`;
      const { text } = await generateAiText(prompt)

      const score = Math.min(100, Math.max(0, parseInt(text.trim(), 10) || 0))
      await updateContact(input.contactId, ctx.orgId, { leadScore: score })
      return { score }
    }),
})
