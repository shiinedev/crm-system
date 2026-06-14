import z from "zod";

export const createContactSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    title: z.string().optional(),
    department: z.string().optional(),
    companyId: z.string().optional(),
    assignedToId: z.string().optional(),
    source: z
        .enum(["website", "referral", "cold_outreach", "event", "social_media", "paid_ads", "other"])
        .optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
});

export const updateContactSchema = createContactSchema.partial();