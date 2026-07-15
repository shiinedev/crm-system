import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { and, asc, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { ac, roles, ROLE_LABELS, type OrgRole } from "@/lib/permissions";
import { env } from "@/lib/env";
import { redis } from "@/server/cache/redis";
import { sendEmail } from "@/server/email/mailer";
import { resetPasswordEmail, verifyEmailEmail, invitationEmail } from "@/server/email/templates";

// Redis-backed storage for better-auth's rate limiter (narrowed const so
// TypeScript knows redis is non-null inside the callbacks)
const redisClient = redis;
const secondaryStorage = redisClient
    ? {
          get: async (key: string) => {
              const value = await redisClient.get(key);
              if (value === null || value === undefined) return null;
              return typeof value === "string" ? value : JSON.stringify(value);
          },
          set: async (key: string, value: string, ttl?: number) => {
              if (ttl) await redisClient.set(key, value, { ex: ttl });
              else await redisClient.set(key, value);
          },
          delete: async (key: string) => {
              await redisClient.del(key);
          },
      }
    : undefined;

/**
 * Resolve which organization a new session should default to, so users never
 * land on "no active organization" after logging in. Prefers the org from their
 * most recent prior session (remembers their last choice across logins) as long
 * as they're still a member; otherwise falls back to their first organization.
 */
async function resolveDefaultOrganization(userId: string): Promise<string | null> {
    const [prior] = await db
        .select({ orgId: schema.sessions.activeOrganizationId })
        .from(schema.sessions)
        .where(
            and(
                eq(schema.sessions.userId, userId),
                isNotNull(schema.sessions.activeOrganizationId),
            ),
        )
        .orderBy(desc(schema.sessions.updatedAt))
        .limit(1);

    if (prior?.orgId) {
        const [stillMember] = await db
            .select({ id: schema.members.id })
            .from(schema.members)
            .where(
                and(
                    eq(schema.members.userId, userId),
                    eq(schema.members.organizationId, prior.orgId),
                ),
            )
            .limit(1);
        if (stillMember) return prior.orgId;
    }

    const [first] = await db
        .select({ orgId: schema.members.organizationId })
        .from(schema.members)
        .where(eq(schema.members.userId, userId))
        .orderBy(asc(schema.members.createdAt))
        .limit(1);

    return first?.orgId ?? null;
}

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
        requireEmailVerification: true,
        sendResetPassword: async ({ user, url }) => {
            await sendEmail({ to: user.email, ...resetPasswordEmail({ name: user.name, url }) });
        },
    },
    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, token }) => {
            const url = `${env.BETTER_AUTH_URL}/api/auth/verify-email?token=${token}&callbackURL=/verify-email`;
            await sendEmail({ to: user.email, ...verifyEmailEmail({ name: user.name, url }) });
        },
    },
    // Brute-force protection on auth endpoints. Uses Redis when available
    // so limits hold across serverless instances; falls back to in-memory.
    rateLimit: {
        enabled: true,
        window: 60,
        max: 100,
        storage: redis ? "secondary-storage" : "memory",
        customRules: {
            "/sign-in/email": { window: 60, max: 5 },
            "/sign-up/email": { window: 60, max: 5 },
            "/request-password-reset": { window: 60, max: 3 },
            "/reset-password": { window: 60, max: 5 },
        },
    },
    ...(secondaryStorage ? { secondaryStorage } : {}),
    plugins: [
        organization({
            allowUserToCreateOrganization: true,
            creatorRole: "owner",
            ac,
            roles,
            sendInvitationEmail: async (data) => {
                const url = `${env.BETTER_AUTH_URL}/accept-invitation/${data.id}`;
                try {
                    await sendEmail({
                        to: data.email,
                        ...invitationEmail({
                            inviterName: data.inviter.user.name,
                            organizationName: data.organization.name,
                            role: ROLE_LABELS[data.role as OrgRole] ?? data.role,
                            url,
                        }),
                    });
                } catch (err) {
                    // Don't fail the invite just because the email couldn't be sent —
                    // the invitation row already exists and can be resent / shared.
                    console.error(`[invite] failed to email ${data.email}:`, err);
                }
            },
        }),
    ],
    session: {
        // Keep the DB as the source of truth for sessions even though
        // secondaryStorage is configured (Redis acts as rate-limit store).
        storeSessionInDatabase: true,
        cookieCache: {
            enabled: true,
            maxAge: 60 * 5, // 5 minutes
        },
    },
    databaseHooks: {
        session: {
            create: {
                // Auto-select an organization when a session is created (login),
                // so the active org is set from the first request and persists.
                before: async (session) => {
                    const activeOrganizationId = await resolveDefaultOrganization(
                        session.userId,
                    );
                    return { data: { ...session, activeOrganizationId } };
                },
            },
        },
    },
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
