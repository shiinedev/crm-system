import 'server-only'; // <-- ensure this file cannot be imported from the client

import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { cache } from 'react';
import { createTRPCContext } from '@/server/trpc/context';
import { makeQueryClient } from './query-client';
import { appRouter } from '@/server/trpc/root';

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);

export const trpc = createTRPCOptionsProxy({
    ctx: async () =>
        createTRPCContext(),
    router: appRouter,
    queryClient: getQueryClient,
});

// If your router is on a separate server, pass a client instead:
// createTRPCOptionsProxy({
//   client: createTRPCClient({ links: [httpLink({ url: '...' })] }),
//   queryClient: getQueryClient,
// });