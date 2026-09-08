import { auth } from "@/lib/auth/server";

/**
 * Protect every admin route. Unauthenticated requests are redirected to /login.
 * The matcher below excludes Next.js internals, static assets, the auth API
 * routes, the public /login page, and the token-gated participant experience
 * under /course/* (access is controlled by the invite token, not auth) so all
 * of those remain reachable without a session.
 */
export default auth.middleware({ loginUrl: "/login" });

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login|api/auth|course|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
