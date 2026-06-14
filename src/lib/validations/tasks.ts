import z from "zod";




export const createTaskSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    dueDate: z.iso.datetime().optional(),
    reminderAt: z.iso.datetime().optional(),
    assignedToId: z.string().optional(),
    dealId: z.string().optional(),
    companyId: z.string().optional(),
    contactId: z.string().optional(),
    recurrenceRule: z.string().optional(),
});

export const updateTaskSchema = createTaskSchema
    .extend({
        id: z.string(),
        status: z.enum(["todo", "in_progress", "done", "cancelled"]).optional(),
    })
    .partial()
    .required({ id: true });