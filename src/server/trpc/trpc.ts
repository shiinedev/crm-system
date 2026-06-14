import "server-only";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { TRPCContext } from "./context";

const t = initTRPC.context<TRPCContext>().create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
        return {
            ...shape,
            data: {
                ...shape.data,
                zodError:
                    error.cause instanceof ZodError ? error.cause.issues.map((issue) => ({
                        path: issue.path.join("."),
                        message: issue.message,
                    })) : null,
            },
        };
    },
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

// ── Base procedure (no auth required) 
export const publicProcedure = t.procedure;

// ── Requires valid session 
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
    if (!ctx.session || !ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({ ctx: { ...ctx, session: ctx.session, user: ctx.user } });
});

// ── Requires org membership 
export const orgProcedure = protectedProcedure.use(({ ctx, next }) => {
    if (!ctx.orgId || !ctx.orgMember) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "No active organization",
        });
    }
    return next({
        ctx: {
            ...ctx,
            orgId: ctx.orgId,
            orgMember: ctx.orgMember,
        },
    });
});

// ── Requires manager role or above 
export const managerProcedure = orgProcedure.use(({ ctx, next }) => {
    const allowedRoles = ["owner", "admin", "manager"];
    if (!allowedRoles.includes(ctx.orgMember.role)) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "Manager role or above required",
        });
    }
    return next({ ctx });
});

// ── Requires admin role or above 
export const adminProcedure = orgProcedure.use(({ ctx, next }) => {
    const allowedRoles = ["owner", "admin"];
    if (!allowedRoles.includes(ctx.orgMember.role)) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "Admin role or above required",
        });
    }
    return next({ ctx });
});