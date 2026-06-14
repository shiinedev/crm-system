import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createTRPCContext } from '@/server/trpc/context';
import { appRouter } from '@/server/trpc/root';

const handler = (req: Request) =>
    fetchRequestHandler({
        endpoint: '/api/trpc',
        req,
        router: appRouter,
        createContext: () => createTRPCContext(),
        onError:
            process.env.NODE_ENV === "development"
                ? ({ path, error }) => {
                    console.error(`tRPC error on ${path ?? "<no-path>"}:`, error);
                }
                : undefined,
    });

export { handler as GET, handler as POST };