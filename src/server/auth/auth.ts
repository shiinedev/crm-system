import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user: schema.users,
            session: schema.sessions,
            account: schema.accounts,
            verification: schema.verifications,
            organization: schema.organizations,
            member: schema.members,
            invitation: schema.invitations,
        },
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
    },
    // socialProviders: {
    //     ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    //         ? {
    //             google: {
    //                 clientId: env.GOOGLE_CLIENT_ID,
    //                 clientSecret: env.GOOGLE_CLIENT_SECRET,
    //             },
    //         }
    //         : {}),
    //     ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
    //         ? {
    //             github: {
    //                 clientId: env.GITHUB_CLIENT_ID,
    //                 clientSecret: env.GITHUB_CLIENT_SECRET,
    //             },
    //         }
    //         : {}),
    // },
    plugins: [
        organization({
            allowUserToCreateOrganization: true,
            creatorRole: "owner",
            memberRoles: ["owner", "admin", "manager", "sales_rep", "support_agent", "viewer"],
        }),
    ],
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 60 * 5, // 5 minutes
        },
    },
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;