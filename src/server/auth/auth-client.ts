"use client";

import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { ac, roles } from "@/lib/permissions";
import { env } from "@/lib/env";

export const authClient = createAuthClient({
    baseURL: env.NEXT_PUBLIC_APP_URL,
    plugins: [organizationClient({ ac, roles })],
});

export const {
    signIn,
    signOut,
    signUp,
    useSession,
    organization,
    requestPasswordReset,
    resetPassword,
    sendVerificationEmail,
} = authClient;