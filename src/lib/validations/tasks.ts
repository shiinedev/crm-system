import z from "zod";

export const createTaskSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    dueDate: z.string().datetime().optional(),
    assignedToId: z.string().optional(),
    dealId: z.string().optional(),
    companyId: z.string().optional(),
    contactId: z.string().optional(),
});