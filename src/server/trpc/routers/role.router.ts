import { createTRPCRouter, orgProcedure } from "../trpc"

export const roleRouter = createTRPCRouter({
    /** Returns the current user's role in the active org — used by client components. */
    mine: orgProcedure.query(({ ctx }) => {
        return { role: ctx.role }
    }),
})