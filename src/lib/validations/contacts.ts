import z from "zod";




export const createContactSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional(),
    avatar: z.string().optional(),
    title: z.string().optional(),
    department: z.string().optional(),
    timezone: z.string().optional(),
    preferredLanguage: z.string().optional(),
    linkedinUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
    twitterUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
    companyId: z.string().optional(),
    assignedToId: z.string().optional(),
    status: z.enum(["active", "inactive", "bounced"]).optional(),
    source: z
        .enum(["website", "referral", "cold_outreach", "event", "social_media", "paid_ads", "other"])
        .optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
});

export const updateContactSchema = createContactSchema.extend({
    id: z.string(),
});