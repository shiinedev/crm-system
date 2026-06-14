import z from "zod";


export const createPipelineSchema = z.object({
    name: z.string().min(1, "name is required"),
    isDefault: z.boolean().optional(),
    currency: z.string().optional(),
});


export const createStageSchema = z.object({
    pipelineId: z.string(),
    name: z.string().min(1, "Name is required"),
    order: z.number().min(0, "Order must be a positive number"),
    probability: z.number().min(0, "Probability must be a number between 0 and 100").max(100, "Probability must be a number between 0 and 100").optional(),
    color: z.string().optional(),
    isWon: z.boolean().optional(),
    isLost: z.boolean().optional(),
});


export const updatePipelineSchema = z.object({
    id: z.string(),
    data: z.object({
        name: z.string().min(1).optional(),
        isDefault: z.boolean().optional(),
        currency: z.string().optional(),
    }),
})


export const updateStageSchema = z.object({
    id: z.string(),
    data: z.object({
        name: z.string().optional(),
        order: z.number().optional(),
        probability: z.number().min(0, "Probability must be a number between 0 and 100").max(100, "Probability must be a number between 0 and 100").optional(),
        color: z.string().optional(),
    }),
})

