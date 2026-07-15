import { createTRPCRouter, protectedProcedure } from "../trpc"

export const roleRouter = createTRPCRouter({
    /**
     * Returns the current user's role in the active org — used by client
     * components (sidebar nav, permission-gated UI).
     *
     * Uses `protectedProcedure` (not `orgProcedure`) so it never throws when
     * there's no active organization; it returns `{ role: null }` instead.
     * A thrown query here is what previously collapsed the sidebar nav to empty.
     */
    mine: protectedProcedure.query(({ ctx }) => {
        return { role: ctx.role ?? null }
    }),
})
