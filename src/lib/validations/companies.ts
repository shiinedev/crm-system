import { z } from "zod";

// export const createCompanySchema = z.object({
//     name: z.string().min(1),
//     slug: z.string().min(1),
//     website: z.url().optional(),
//     industry: z.string().optional(),
//     companySize: z.string().optional(),
//     country: z.string().optional(),
//     city: z.string().optional(),
//     lifecycleStage: z
//         .enum(["lead", "prospect", "opportunity", "customer", "churned"])
//         .optional(),
//     leadSource: z
//         .enum(["website", "referral", "cold_outreach", "event", "social_media", "paid_ads", "other"])
//         .optional(),
//     assignedOwnerId: z.string().optional(),
//     notes: z.string().optional(),
// });

// export const updateCompanySchema = createCompanySchema.partial();

export const createCompanySchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    website: z.string().url("Invalid URL").optional().or(z.literal("")),
    linkedinUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
    industry: z.string().optional(),
    companySize: z.string().optional(),
    annualRevenue: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
    timezone: z.string().optional(),
    lifecycleStage: z
        .enum(["lead", "prospect", "opportunity", "customer", "churned"])
        .optional(),
    leadStatus: z
        .enum(["new", "open", "in_progress", "unqualified", "disqualified"])
        .optional(),
    leadSource: z
        .enum(["website", "referral", "cold_outreach", "event", "social_media", "paid_ads", "other"])
        .optional(),
    assignedOwnerId: z.string().optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
});


export const updateCompanySchema = createCompanySchema.extend({
    id: z.string(),
});