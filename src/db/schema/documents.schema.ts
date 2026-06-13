import {
    pgTable,
    text,
    timestamp,
    integer,
    index,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { organizations, users } from "./auth.schema";
import { companies } from "./companies.schema";
import { deals } from "./deals.schema";

export const documents = pgTable(
    "documents",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => createId()),
        organizationId: text("organization_id")
            .notNull()
            .references(() => organizations.id, { onDelete: "cascade" }),
        title: text("title").notNull(),
        content: text("content"), // Markdown body
        fileUrl: text("file_url"), // Uploaded file URL
        mimeType: text("mime_type"),
        embeddingId: text("embedding_id"), // Pinecone vector ID
        version: integer("version").default(1),
        uploadedById: text("uploaded_by_id").references(() => users.id, {
            onDelete: "set null",
        }),
        companyId: text("company_id").references(() => companies.id, {
            onDelete: "set null",
        }),
        dealId: text("deal_id").references(() => deals.id, {
            onDelete: "set null",
        }),
        deletedAt: timestamp("deleted_at"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (t) => [
        index("documents_org_idx").on(t.organizationId),
        index("documents_company_idx").on(t.companyId),
        index("documents_deal_idx").on(t.dealId),
    ]
);

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;