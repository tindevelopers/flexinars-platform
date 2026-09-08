import { auth } from "@/lib/auth/server";

/**
 * Protect every admin route. Unauthenticated requests are redirected to /login.
 * The matcher below excludes Next.js internals, static assets, the auth API
 * routes, and the public /login page so those remain reachable.
 */
export default auth.middleware({ loginUrl: "/login" });

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login|api/auth|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
