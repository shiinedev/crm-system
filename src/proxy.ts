import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PUBLIC_PATHS = [
    "/login",
    "/register",
    "/api/auth",
];

function isPublicPath(pathname: string) {
    return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Always allow public paths and static assets
    if (
        isPublicPath(pathname) ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon")
    ) {
        return NextResponse.next();
    }

    // Read session cookie without importing auth (edge-safe)
    const sessionCookie = getSessionCookie(req);

    if (!sessionCookie) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|public/).*)",
    ],
};