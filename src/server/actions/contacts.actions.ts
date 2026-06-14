"use server";

import { z } from "zod";
import { orgActionClient, managerActionClient, ActionError } from "./safe-action";
import {
    createContact,
    updateContact,
    softDeleteContact,
} from "@/db/queries/contacts.queries";
import { createNotification } from "@/db/queries/notifications.queries";
import { createContactSchema, updateContactSchema } from "@/lib/validations/contacts";



export const createContactAction = orgActionClient
    .inputSchema(createContactSchema)
    .action(async ({ parsedInput, ctx }) => {
        const contact = await createContact({
            ...parsedInput,
            organizationId: ctx.orgId,
            email: parsedInput.email || null,
            linkedinUrl: parsedInput.linkedinUrl || null,
            twitterUrl: parsedInput.twitterUrl || null,
        });

        // Notify assigned user
        if (parsedInput.assignedToId && parsedInput.assignedToId !== ctx.user.id) {
            await createNotification({
                organizationId: ctx.orgId,
                userId: parsedInput.assignedToId,
                type: "assignment",
                title: "Contact assigned to you",
                body: `${contact.firstName} ${contact.lastName} has been assigned to you.`,
                metadata: JSON.stringify({ contactId: contact.id }),
            });
        }

        return { contact };
    });

export const updateContactAction = orgActionClient
    .inputSchema(updateContactSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { id, ...data } = parsedInput;

        const contact = await updateContact(id, ctx.orgId, {
            ...data,
            email: data.email || null,
            linkedinUrl: data.linkedinUrl || null,
            twitterUrl: data.twitterUrl || null,
        });

        if (!contact) throw new ActionError("Contact not found.");

        // Notify new assignee on reassignment
        if (data.assignedToId && data.assignedToId !== ctx.user.id) {
            await createNotification({
                organizationId: ctx.orgId,
                userId: data.assignedToId,
                type: "assignment",
                title: "Contact assigned to you",
                body: `${contact.firstName} ${contact.lastName} has been assigned to you.`,
                metadata: JSON.stringify({ contactId: contact.id }),
            });
        }

        return { contact };
    });

export const deleteContactAction = managerActionClient
    .schema(z.object({ id: z.string() }))
    .action(async ({ parsedInput, ctx }) => {
        const contact = await softDeleteContact(parsedInput.id, ctx.orgId);
        if (!contact) throw new ActionError("Contact not found.");
        return { contact };
    });