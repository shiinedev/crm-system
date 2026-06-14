"use server";

import { z } from "zod";
import { orgActionClient, managerActionClient, ActionError } from "./safe-action";
import {
    createCompany,
    updateCompany,
    softDeleteCompany,
} from "@/db/queries/companies.queries";
import { createNotification } from "@/db/queries/notifications.queries";
import { createCompanySchema, updateCompanySchema } from "@/lib/validations/companies";


export const createCompanyAction = orgActionClient
    .inputSchema(createCompanySchema)
    .action(async ({ parsedInput, ctx }) => {
        const company = await createCompany({
            ...parsedInput,
            organizationId: ctx.orgId,
            website: parsedInput.website || null,
            linkedinUrl: parsedInput.linkedinUrl || null,
        });

        // Notify assigned owner if set
        if (parsedInput.assignedOwnerId && parsedInput.assignedOwnerId !== ctx.user.id) {
            await createNotification({
                organizationId: ctx.orgId,
                userId: parsedInput.assignedOwnerId,
                type: "assignment",
                title: "Company assigned to you",
                body: `${company.name} has been assigned to you.`,
                metadata: JSON.stringify({ companyId: company.id }),
            });
        }

        return { company };
    });

export const updateCompanyAction = orgActionClient
    .inputSchema(updateCompanySchema)
    .action(async ({ parsedInput, ctx }) => {
        const { id, ...data } = parsedInput;

        const company = await updateCompany(id, ctx.orgId, {
            ...data,
            website: data.website || null,
            linkedinUrl: data.linkedinUrl || null,
        });

        if (!company) throw new ActionError("Company not found.");

        // Notify new owner on reassignment
        if (data.assignedOwnerId && data.assignedOwnerId !== ctx.user.id) {
            await createNotification({
                organizationId: ctx.orgId,
                userId: data.assignedOwnerId,
                type: "assignment",
                title: "Company assigned to you",
                body: `${company.name} has been assigned to you.`,
                metadata: JSON.stringify({ companyId: company.id }),
            });
        }

        return { company };
    });

export const deleteCompanyAction = managerActionClient
    .inputSchema(z.object({ id: z.string() }))
    .action(async ({ parsedInput, ctx }) => {
        const company = await softDeleteCompany(parsedInput.id, ctx.orgId);
        if (!company) throw new ActionError("Company not found.");
        return { company };
    });