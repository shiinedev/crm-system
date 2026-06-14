import z from "zod";


export const createDealSchema = z.object({
    title: z.string().min(1, "Title is required"),
    value: z.string().optional(),
    currency: z.string().default("USD"),
    probability: z.number().min(0).max(100).optional(),
    pipelineId: z.string().min(1, "Pipeline is required"),
    stageId: z.string().min(1, "Stage is required"),
    expectedCloseDate: z.string().optional(),
    dealSource: z.string().optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    riskLevel: z.enum(["low", "medium", "high", "critical"]).optional(),
    ownerId: z.string().optional(),
    companyId: z.string().optional(),
    contactId: z.string().optional(),
    competitors: z.array(z.string()).optional(),
    contractLength: z.string().optional(),
    paymentTerms: z.string().optional(),
});

export const updateDealSchema = createDealSchema.partial().extend({
    id: z.string(),
});

export const changeDealStageSchema = z.object({
    id: z.string(),
    stageId: z.string(),
});