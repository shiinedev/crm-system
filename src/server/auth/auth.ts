import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";
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
            memberRoles: ["owner", "admin", "manager", "sales_rep", "support_agent", "viewer"],
            sendInvitationEmail: async (data) => {
                const url = `${env.BETTER_AUTH_URL}/accept-invitation/${data.id}`;
                await sendEmail({
                    to: data.email,
                    ...invitationEmail({
                        inviterName: data.inviter.user.name,
                        organizationName: data.organization.name,
                        role: data.role,
                        url,
                    }),
                });
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
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
