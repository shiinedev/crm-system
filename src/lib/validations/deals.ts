import z from "zod";

export const createDealSchema = z.object({
    title: z.string().min(1),
    value: z.string().optional(),
    currency: z.string().default("USD"),
    probability: z.number().min(0).max(100).optional(),
    pipelineId: z.string(),
    stageId: z.string(),
    expectedCloseDate: z.string().optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    ownerId: z.string().optional(),
    companyId: z.string().optional(),
    contactId: z.string().optional(),
    dealSource: z.string().optional(),
});

export const updateDealSchema = createDealSchema.partial();